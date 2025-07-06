import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';
import { agentOrchestrationService } from './agent-orchestration';
import { multiAIService } from './multi-ai-provider';
import type { WebSocketMessage, AgentResponse } from '@shared/schema';

export interface ConnectedClient {
  id: string;
  userId: number;
  websocket: WebSocket;
  conversationIds: Set<number>;
  lastActivity: Date;
  isAgent: boolean;
  agentId?: number;
}

export interface TypingStatus {
  userId: number;
  conversationId: number;
  isTyping: boolean;
  timestamp: Date;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private conversations: Map<number, Set<string>> = new Map(); // conversationId -> clientIds
  private typingUsers: Map<string, TypingStatus> = new Map(); // conversationId-userId -> status
  private agentResponseQueue: Map<number, Array<{messageId: number, agentId: number}>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info: any) => {
        // Add authentication here if needed
        return true;
      }
    });

    this.setupWebSocketServer();
    this.startPeriodicTasks();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection established');
      
      // Generate unique client ID
      const clientId = this.generateClientId();
      
      // Extract user info from query params or headers
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const userId = parseInt(url.searchParams.get('userId') || '1');
      const isAgent = url.searchParams.get('isAgent') === 'true';
      const agentId = url.searchParams.get('agentId') ? parseInt(url.searchParams.get('agentId')!) : undefined;

      const client: ConnectedClient = {
        id: clientId,
        userId,
        websocket: ws,
        conversationIds: new Set(),
        lastActivity: new Date(),
        isAgent,
        agentId
      };

      this.clients.set(clientId, client);

      // Set up message handlers
      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.handleDisconnection(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(clientId);
      });

      // Send connection confirmation
      this.sendToClient(clientId, {
        type: 'system_notification',
        conversationId: 0,
        senderId: 0,
        senderType: 'user',
        content: 'Connected to CodeCraft collaboration system',
        timestamp: new Date()
      });

      // Auto-join user to their active conversations
      this.autoJoinUserConversations(client);
    });
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'user_message':
          await this.handleUserMessage(client, message);
          break;
        case 'agent_message':
          await this.handleAgentMessage(client, message);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(client, message);
          break;
        case 'join_conversation':
          await this.handleJoinConversation(client, message.conversationId);
          break;
        case 'leave_conversation':
          this.handleLeaveConversation(client, message.conversationId);
          break;
        case 'agent_status_update':
          await this.handleAgentStatusUpdate(client, message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  private async handleUserMessage(client: ConnectedClient, message: WebSocketMessage): Promise<void> {
    if (!message.content || !message.conversationId) return;

    try {
      // Store the message in database
      const storedMessage = await storage.createMessage({
        conversationId: message.conversationId,
        senderId: client.userId,
        senderType: 'user',
        content: message.content,
        messageType: 'text',
        metadata: message.metadata || null
      });

      // Broadcast to all conversation participants
      this.broadcastToConversation(message.conversationId, {
        ...message,
        timestamp: storedMessage.timestamp!
      });

      // Get conversation details for agent context
      const conversation = await storage.getConversation(message.conversationId);
      if (!conversation) return;

      // Trigger agent responses based on conversation participants
      await this.triggerAgentResponses(conversation, storedMessage, message.content);

    } catch (error) {
      console.error('Error handling user message:', error);
      this.sendError(client.id, 'Failed to process message');
    }
  }

  private async handleAgentMessage(client: ConnectedClient, message: WebSocketMessage): Promise<void> {
    if (!client.isAgent || !client.agentId) return;

    try {
      // Store the agent message
      const storedMessage = await storage.createMessage({
        conversationId: message.conversationId,
        senderId: client.agentId,
        senderType: 'agent',
        content: message.content!,
        messageType: message.metadata?.messageType || 'text',
        metadata: message.metadata || null
      });

      // Broadcast to conversation participants
      this.broadcastToConversation(message.conversationId, {
        ...message,
        timestamp: storedMessage.timestamp!
      });

    } catch (error) {
      console.error('Error handling agent message:', error);
    }
  }

  private async triggerAgentResponses(conversation: any, userMessage: any, content: string): Promise<void> {
    if (!conversation.participants) return;

    // Get agents in the conversation
    const agentIds = conversation.participants.filter((id: number) => id > 1000); // Assuming agent IDs > 1000
    
    for (const agentId of agentIds) {
      // Check if agent should respond (not every message needs all agents to respond)
      if (await this.shouldAgentRespond(agentId, content, conversation)) {
        this.queueAgentResponse(conversation.id, userMessage.id, agentId);
      }
    }

    // Process agent response queue
    this.processAgentResponseQueue(conversation.id);
  }

  private async shouldAgentRespond(agentId: number, content: string, conversation: any): Promise<boolean> {
    const agent = await storage.getAgent(agentId);
    if (!agent) return false;

    // Simple heuristic: respond if mentioned by name or type, or if it's a question
    const mentionedByName = content.toLowerCase().includes(agent.name.toLowerCase());
    const mentionedByRole = content.toLowerCase().includes(agent.type.replace('_', ' '));
    const isQuestion = content.includes('?');
    const isCodeRelated = content.toLowerCase().includes('code') || content.toLowerCase().includes('implement');
    const isDesignRelated = content.toLowerCase().includes('design') || content.toLowerCase().includes('ui');
    const isDeploymentRelated = content.toLowerCase().includes('deploy') || content.toLowerCase().includes('infrastructure');

    // Agent-specific response logic
    switch (agent.type) {
      case 'senior_developer':
        return mentionedByName || mentionedByRole || isCodeRelated || isQuestion;
      case 'designer':
        return mentionedByName || mentionedByRole || isDesignRelated;
      case 'devops':
        return mentionedByName || mentionedByRole || isDeploymentRelated;
      case 'junior_developer':
        return mentionedByName || (isCodeRelated && Math.random() > 0.7); // 30% chance for junior dev
      case 'product_manager':
        return mentionedByName || mentionedByRole || content.toLowerCase().includes('requirement');
      case 'code_reviewer':
        return mentionedByName || content.toLowerCase().includes('review');
      default:
        return mentionedByName || mentionedByRole;
    }
  }

  private queueAgentResponse(conversationId: number, messageId: number, agentId: number): void {
    if (!this.agentResponseQueue.has(conversationId)) {
      this.agentResponseQueue.set(conversationId, []);
    }
    this.agentResponseQueue.get(conversationId)!.push({ messageId, agentId });
  }

  private async processAgentResponseQueue(conversationId: number): Promise<void> {
    const queue = this.agentResponseQueue.get(conversationId);
    if (!queue || queue.length === 0) return;

    // Process one agent response at a time to avoid overwhelming
    const { messageId, agentId } = queue.shift()!;
    
    try {
      // Get conversation context
      const conversation = await storage.getConversation(conversationId);
      const recentMessages = await storage.getMessagesByConversation(conversationId);
      const userMessage = recentMessages.find(m => m.id === messageId);
      
      if (!conversation || !userMessage) return;

      // Send typing indicator
      this.broadcastToConversation(conversationId, {
        type: 'typing_indicator',
        conversationId,
        senderId: agentId,
        senderType: 'agent',
        content: 'typing',
        timestamp: new Date()
      });

      // Generate agent response
      const response = await agentOrchestrationService.generateAgentResponse(
        agentId,
        userMessage.content,
        {
          conversation,
          recentMessages: recentMessages.slice(-10),
        }
      );

      // Store and broadcast agent response
      const storedMessage = await storage.createMessage({
        conversationId,
        senderId: agentId,
        senderType: 'agent',
        content: response.content,
        messageType: response.messageType,
        metadata: response.metadata
      });

      this.broadcastToConversation(conversationId, {
        type: 'agent_message',
        conversationId,
        senderId: agentId,
        senderType: 'agent',
        content: response.content,
        metadata: response.metadata,
        timestamp: storedMessage.timestamp!
      });

      // Continue processing queue with delay to prevent spam
      setTimeout(() => {
        this.processAgentResponseQueue(conversationId);
      }, 2000);

    } catch (error) {
      console.error('Error processing agent response:', error);
      // Continue processing other queued responses
      setTimeout(() => {
        this.processAgentResponseQueue(conversationId);
      }, 1000);
    }
  }

  private handleTypingIndicator(client: ConnectedClient, message: WebSocketMessage): void {
    const key = `${message.conversationId}-${client.userId}`;
    
    if (message.content === 'typing') {
      this.typingUsers.set(key, {
        userId: client.userId,
        conversationId: message.conversationId,
        isTyping: true,
        timestamp: new Date()
      });
    } else {
      this.typingUsers.delete(key);
    }

    // Broadcast typing status to conversation participants
    this.broadcastToConversation(message.conversationId, message, client.id);
  }

  private async handleJoinConversation(client: ConnectedClient, conversationId: number): Promise<void> {
    client.conversationIds.add(conversationId);
    
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, new Set());
    }
    this.conversations.get(conversationId)!.add(client.id);

    // Send recent conversation history
    try {
      const messages = await storage.getMessagesByConversation(conversationId);
      const recentMessages = messages.slice(-50); // Last 50 messages
      
      this.sendToClient(client.id, {
        type: 'system_notification',
        conversationId,
        senderId: 0,
        senderType: 'user',
        content: JSON.stringify({ 
          type: 'conversation_history', 
          messages: recentMessages 
        }),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }

  private handleLeaveConversation(client: ConnectedClient, conversationId: number): void {
    client.conversationIds.delete(conversationId);
    this.conversations.get(conversationId)?.delete(client.id);
    
    if (this.conversations.get(conversationId)?.size === 0) {
      this.conversations.delete(conversationId);
    }
  }

  private async handleAgentStatusUpdate(client: ConnectedClient, message: WebSocketMessage): Promise<void> {
    if (!client.isAgent || !client.agentId) return;

    try {
      await storage.updateAgentStatus(client.agentId, message.content || 'active');
      
      // Broadcast status update to all connected clients
      this.broadcastToAll({
        type: 'agent_status_update',
        conversationId: 0,
        senderId: client.agentId,
        senderType: 'agent',
        content: message.content,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  }

  private async autoJoinUserConversations(client: ConnectedClient): Promise<void> {
    try {
      // Get user's active conversations
      const conversations = await storage.getConversationsByParticipant(client.userId);
      
      for (const conversation of conversations) {
        if (conversation.status === 'active') {
          await this.handleJoinConversation(client, conversation.id);
        }
      }
    } catch (error) {
      console.error('Error auto-joining conversations:', error);
    }
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all conversations
    client.conversationIds.forEach(convId => {
      this.conversations.get(convId)?.delete(clientId);
      if (this.conversations.get(convId)?.size === 0) {
        this.conversations.delete(convId);
      }
    });

    // Remove typing indicators
    this.typingUsers.forEach((status, key) => {
      if (status.userId === client.userId) {
        this.typingUsers.delete(key);
      }
    });

    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  }

  private broadcastToConversation(conversationId: number, message: WebSocketMessage, excludeClientId?: string): void {
    const clientIds = this.conversations.get(conversationId);
    if (!clientIds) return;

    clientIds.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  private broadcastToAll(message: WebSocketMessage, excludeClientId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.websocket.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    });
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message to client:', error);
      this.handleDisconnection(clientId);
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendToClient(clientId, {
      type: 'system_notification',
      conversationId: 0,
      senderId: 0,
      senderType: 'user',
      content: JSON.stringify({ type: 'error', message: error }),
      timestamp: new Date()
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicTasks(): void {
    // Clean up inactive typing indicators every 10 seconds
    setInterval(() => {
      const now = new Date();
      this.typingUsers.forEach((status, key) => {
        if (now.getTime() - status.timestamp.getTime() > 10000) { // 10 seconds
          this.typingUsers.delete(key);
        }
      });
    }, 10000);

    // Clean up inactive clients every 5 minutes
    setInterval(() => {
      const now = new Date();
      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastActivity.getTime() > 300000) { // 5 minutes
          if (client.websocket.readyState !== WebSocket.OPEN) {
            this.handleDisconnection(clientId);
          }
        }
      });
    }, 300000);
  }

  // Public methods for external use
  public async sendSystemNotification(conversationId: number, content: string): Promise<void> {
    this.broadcastToConversation(conversationId, {
      type: 'system_notification',
      conversationId,
      senderId: 0,
      senderType: 'user',
      content,
      timestamp: new Date()
    });
  }

  public async startCollaborativeSession(projectId: number, objective: string): Promise<void> {
    // Create a new conversation for the collaboration
    const conversation = await storage.createConversation({
      projectId,
      title: `Collaborative Session: ${objective}`,
      type: 'project_discussion',
      participants: [1], // Start with user, agents will be added
      createdBy: 1
    });

    // Start agent collaboration
    const collaboration = await agentOrchestrationService.startCollaborationSession(
      projectId,
      objective,
      ['system_architecture', 'ui_design', 'code_implementation']
    );

    // Add participating agents to conversation
    for (const agent of collaboration.participants) {
      await storage.addParticipantToConversation(conversation.id, agent.id);
    }

    // Notify all clients about the new collaborative session
    this.broadcastToAll({
      type: 'system_notification',
      conversationId: conversation.id,
      senderId: 0,
      senderType: 'user',
      content: JSON.stringify({
        type: 'collaborative_session_started',
        conversationId: conversation.id,
        projectId,
        objective,
        participants: collaboration.participants
      }),
      timestamp: new Date()
    });
  }

  public getConnectionStats(): {
    totalConnections: number;
    activeConversations: number;
    typingUsers: number;
  } {
    return {
      totalConnections: this.clients.size,
      activeConversations: this.conversations.size,
      typingUsers: this.typingUsers.size
    };
  }
}

export let webSocketManager: WebSocketManager;