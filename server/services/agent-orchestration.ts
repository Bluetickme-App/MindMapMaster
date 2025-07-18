import OpenAI from "openai";
import { storage } from "../storage";
import type { Agent, Message, Conversation, AgentResponse } from "@shared/schema";
import { agentMemoryService } from "./agent-memory-service";
import { claudeAgentSystem } from "./claude-agent-system";
import { replitAgentSystem } from "./replit-agent-system";
import { agentToolIntegration } from "./agent-tool-integration";
import { agentServerAccess } from "./agent-server-access";
import { agentToolIntegrationEnhanced } from "./agent-tool-integration-enhanced";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key" 
});

export interface AgentContext {
  conversation: Conversation;
  recentMessages: Message[];
  projectContext?: any;
  userPreferences?: any;
}

export interface CollaborationSession {
  id: number;
  projectId: number;
  participants: Agent[];
  objective: string;
  currentPhase: string;
  decisions: Array<{
    decision: string;
    madeBy: number;
    reasoning: string;
    timestamp: Date;
  }>;
  outcomes: string[];
}

export class AgentOrchestrationService {
  private activeCollaborations: Map<number, CollaborationSession> = new Map();
  private agentBusyStatus: Map<number, boolean> = new Map();
  private agentAssistants: Map<number, { assistantId: string; threadId: string }> = new Map();
  
  // Optimal model routing based on research
  private modelRouting = {
    'design_specialist': 'claude',      // UI/UX Design excellence
    'css_specialist': 'claude',         // CSS mastery
    'react_senior': 'claude',           // Component architecture
    'ai_specialist': 'openai',          // API development
    'roadmap_specialist': 'openai',     // System architecture
    'backend_specialist': 'openai',     // Backend development
    'vite_specialist': 'gemini',        // Build optimization
    'devops_specialist': 'gemini'       // DevOps excellence
  };

  // Generate OpenAI Assistant API response
  async generateOpenAIAssistantResponse(
    agent: Agent, 
    userMessage: string, 
    context: AgentContext
  ): Promise<{ content: string }> {
    try {
      // Get or create assistant and thread for this agent
      let assistantInfo = this.agentAssistants.get(agent.id);
      
      if (!assistantInfo) {
        // Create new assistant for this agent
        const assistant = await openai.beta.assistants.create({
          name: agent.name,
          instructions: `You are ${agent.name}, a ${agent.specialization} specialist. ${agent.systemPrompt}

CURRENT DATE: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

CURRENT TIME: ${new Date().toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit',
  timeZoneName: 'short'
})}

Your expertise includes:
${agent.capabilities?.join(', ') || 'General software development'}

You are part of a multi-agent collaboration system. Provide helpful, expert responses in your area of specialization.

IMPORTANT: Always be aware of the current date and time. Reference it when relevant to your responses.

Always respond in JSON format:
{
  "content": "your helpful response here",
  "messageType": "text",
  "metadata": {},
  "confidence": 0.8,
  "reasoning": "why you provided this response"
}`,
          model: "gpt-4o", // the newest OpenAI model
          tools: [{ type: "code_interpreter" }]
        });

        // Create thread for this agent
        const thread = await openai.beta.threads.create();
        
        assistantInfo = {
          assistantId: assistant.id,
          threadId: thread.id
        };
        
        this.agentAssistants.set(agent.id, assistantInfo);
        console.log(`[Agent ${agent.id}] Created new OpenAI Assistant: ${assistant.id}`);
      }

      // Add user message to thread with current context
      await openai.beta.threads.messages.create(assistantInfo.threadId, {
        role: "user",
        content: `[${new Date().toISOString()}] ${userMessage}
        
Context: ${JSON.stringify(context, null, 2)}
Current Project: ${context.projectContext?.name || 'Not specified'}
Recent conversation: ${context.recentMessages?.slice(-3).map(m => `${m.senderType}: ${m.content}`).join('\n') || 'No recent messages'}`
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(assistantInfo.threadId, {
        assistant_id: assistantInfo.assistantId
      });

      // Wait for completion (fixed parameter order)
      let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: assistantInfo.threadId });
      
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: assistantInfo.threadId });
      }

      if (runStatus.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(assistantInfo.threadId);
        const lastMessage = messages.data[0];
        
        if (lastMessage && lastMessage.role === 'assistant') {
          const content = lastMessage.content[0];
          if (content.type === 'text') {
            return { content: content.text.value };
          }
        }
      }

      throw new Error(`Assistant run failed with status: ${runStatus.status}`);

    } catch (error) {
      console.error(`[Agent ${agent.id}] OpenAI Assistant API error:`, error);
      // Fallback to simple response
      return {
        content: JSON.stringify({
          content: `Hello! I'm ${agent.name}, a ${agent.specialization} specialist. I'm here to help you with your project. What would you like to work on?`,
          messageType: "text",
          metadata: { error: true },
          confidence: 0.5,
          reasoning: "Fallback response due to Assistant API error"
        })
      };
    }
  }

  // Core agent response generation with memory integration
  async generateAgentResponse(
    agentId: number, 
    userMessage: string, 
    context: AgentContext
  ): Promise<AgentResponse> {
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    console.log(`[Agent ${agentId}] Generating response for message: "${userMessage}"`);

    // Mark agent as busy
    this.agentBusyStatus.set(agentId, true);
    await storage.updateAgentStatus(agentId, "busy");

    // Get agent's memory and project context
    const projectId = context.conversation.projectId;
    const agentMemories = await agentMemoryService.retrieveMemories(agentId, projectId);
    const projectMemory = projectId ? await agentMemoryService.getProjectContext(agentId, projectId) : null;

    try {
      // Get agent's knowledge and context
      const agentKnowledge = await storage.getAgentKnowledgeByAgent(agentId);
      const relevantKnowledge = agentKnowledge
        .filter(k => this.isRelevantToContext(k.content, userMessage))
        .slice(0, 5);

      // Build context-aware prompt with memory
      const contextPrompt = this.buildContextPrompt(agent, context, relevantKnowledge, agentMemories, projectMemory);
      
      const aiProvider = agent.aiProvider || 'openai';
      console.log(`[Agent ${agentId}] Using ${aiProvider} provider for ${agent.name}`);
      
      let aiResponse;
      
      if (aiProvider === 'openai') {
        // Use OpenAI Assistant API for OpenAI agents
        aiResponse = await this.generateOpenAIAssistantResponse(agent, userMessage, context);
      } else if (aiProvider === 'claude') {
        // Use Claude 4.0 Sonnet-level capabilities
        const claudeResponse = await claudeAgentSystem.generateClaudeResponse(agent, userMessage, context);
        aiResponse = {
          content: JSON.stringify({
            content: claudeResponse.content,
            messageType: "text",
            metadata: claudeResponse.metadata,
            confidence: claudeResponse.metadata?.confidence || 0.8,
            reasoning: claudeResponse.metadata?.reasoning || "Claude 4.0 Sonnet analysis"
          })
        };
      } else {
        // Use multi-AI provider system for other providers
        const { multiAIService } = await import('./multi-ai-provider.js');
        
        const systemPrompt = `You are ${agent.name}, a ${agent.specialization} specialist. ${agent.systemPrompt}

RESPOND IN JSON FORMAT:
{
  "content": "your helpful response here",
  "messageType": "text",
  "metadata": {},
  "confidence": 0.8,
  "reasoning": "why you provided this response"
}`;

        const userPrompt = `Context: ${contextPrompt}\n\nUser message: ${userMessage}`;

        aiResponse = await multiAIService.generateResponse(
          aiProvider,
          userPrompt,
          systemPrompt,
          aiProvider === 'claude' ? 'claude-sonnet-4-20250514' : 'gemini-2.5-flash'
        );
      }

      console.log(`[Agent ${agentId}] ${aiProvider} response received`);

      let result;
      try {
        // Check if the response is wrapped in code blocks
        let cleanContent = aiResponse.content;
        if (cleanContent.startsWith('```json') && cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(7, -3).trim();
        } else if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(3, -3).trim();
        }
        
        // Try to parse as JSON first
        result = JSON.parse(cleanContent);
      } catch (e) {
        console.log(`[Agent ${agentId}] Failed to parse JSON, using fallback response`);
        // Fallback: create structured response from raw content
        result = {
          content: aiResponse.content || `Hi! I'm ${agent.name} and I'm ready to help with your ${agent.specialization} needs. How can I assist you?`,
          messageType: "text",
          metadata: { provider: aiProvider },
          confidence: aiResponse.confidence || 0.7,
          reasoning: `Response from ${agent.name} using ${aiProvider} provider`
        };
      }
    
      // Store agent's learning from this interaction
      try {
        await this.updateAgentKnowledge(agentId, userMessage, result.content, context);
        
        // Store conversation memory
        await agentMemoryService.storeMemory(
          agentId,
          'project_context',
          `Conversation about: ${userMessage.slice(0, 50)}...`,
          {
            userMessage,
            agentResponse: result.content,
            context: context.projectContext,
            timestamp: new Date(),
            confidence: result.confidence
          },
          projectId,
          Math.min(Math.floor(result.confidence * 10), 10)
        );
      } catch (error) {
        console.error(`[Agent ${agentId}] Failed to update knowledge:`, error);
      }

      console.log(`[Agent ${agentId}] Response generated: "${result.content}"`);

      return {
        agentId,
        content: result.content || `Hello! I'm ${agent.name}, ready to help with ${agent.specialization}!`,
        messageType: result.messageType || "text",
        metadata: result.metadata || { provider: aiProvider },
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || `Generated response using ${aiProvider}`
      };

    } catch (error) {
      console.error(`[Agent ${agentId}] Error generating response:`, error);
      
      // Provide a fallback response so agents still work
      return {
        agentId,
        content: `Hello! I'm ${agent.name}, a ${agent.specialization} specialist. I'm here to help you with your project. What would you like to work on?`,
        messageType: "text",
        metadata: { error: true },
        confidence: 0.5,
        reasoning: "Fallback response due to API error"
      };
    } finally {
      // Mark agent as available
      this.agentBusyStatus.set(agentId, false);
      await storage.updateAgentStatus(agentId, "active");
    }
  }

  // Helper methods remain the same
  private isRelevantToContext(knowledge: string, userMessage: string): boolean {
    const knowledgeWords = knowledge.toLowerCase().split(/\s+/);
    const messageWords = userMessage.toLowerCase().split(/\s+/);
    
    const overlap = knowledgeWords.filter(word => messageWords.includes(word)).length;
    return overlap > 0;
  }

  private buildContextPrompt(agent: Agent, context: AgentContext, knowledge: any[], memories?: any[], projectMemory?: any): string {
    const recentMessages = context.recentMessages.slice(-5);
    const conversationHistory = recentMessages.map(msg => 
      `${msg.senderType === 'user' ? 'User' : 'Agent'}: ${msg.content}`
    ).join('\n');

    const knowledgeContext = knowledge.map(k => k.content).join('\n');
    
    const memoryContext = memories?.map(m => 
      `${m.memoryType}: ${m.summary}`
    ).join('\n') || '';

    const projectContext = projectMemory ? `
Project Memory:
- Recent Activities: ${projectMemory.recentActivities?.map((a: any) => a.summary).join(', ') || 'None'}
- Key Decisions: ${projectMemory.keyDecisions?.map((d: any) => d.summary).join(', ') || 'None'}
- Collaboration History: ${projectMemory.collaborationHistory?.map((c: any) => c.summary).join(', ') || 'None'}
    `.trim() : '';

    return `
Project Context: ${context.projectContext || 'General development project'}
${projectContext}

Recent Conversation:
${conversationHistory}

Your Knowledge:
${knowledgeContext}

Your Memory:
${memoryContext}

As ${agent.name}, a ${agent.specialization} specialist, provide helpful and accurate responses.
Remember previous interactions and build on past conversations.
    `.trim();
  }

  private async updateAgentKnowledge(agentId: number, userMessage: string, response: string, context: AgentContext): Promise<void> {
    try {
      await storage.createAgentKnowledge({
        agentId,
        content: `User asked: "${userMessage}" - I responded: "${response}"`,
        context: JSON.stringify(context),
        confidence: 0.8
      });
    } catch (error) {
      console.error(`Failed to update knowledge for agent ${agentId}:`, error);
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();