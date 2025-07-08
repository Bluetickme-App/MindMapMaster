import OpenAI from "openai";
import { storage } from "../storage";
import type { Agent, Message, Conversation, AgentResponse } from "@shared/schema";

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
          
Your expertise includes:
${agent.capabilities?.join(', ') || 'General software development'}

You are part of a multi-agent collaboration system. Provide helpful, expert responses in your area of specialization.

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

      // Add user message to thread
      await openai.beta.threads.messages.create(assistantInfo.threadId, {
        role: "user",
        content: userMessage
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(assistantInfo.threadId, {
        assistant_id: assistantInfo.assistantId
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(assistantInfo.threadId, run.id);
      
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(assistantInfo.threadId, run.id);
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

  // Core agent response generation
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

    try {
      // Get agent's knowledge and context
      const agentKnowledge = await storage.getAgentKnowledgeByAgent(agentId);
      const relevantKnowledge = agentKnowledge
        .filter(k => this.isRelevantToContext(k.content, userMessage))
        .slice(0, 5);

      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(agent, context, relevantKnowledge);
      
      const aiProvider = agent.aiProvider || 'openai';
      console.log(`[Agent ${agentId}] Using ${aiProvider} provider for ${agent.name}`);
      
      let aiResponse;
      
      if (aiProvider === 'openai') {
        // Use OpenAI Assistant API for OpenAI agents
        aiResponse = await this.generateOpenAIAssistantResponse(agent, userMessage, context);
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

  private buildContextPrompt(agent: Agent, context: AgentContext, knowledge: any[]): string {
    const recentMessages = context.recentMessages.slice(-5);
    const conversationHistory = recentMessages.map(msg => 
      `${msg.senderType === 'user' ? 'User' : 'Agent'}: ${msg.content}`
    ).join('\n');

    const knowledgeContext = knowledge.map(k => k.content).join('\n');

    return `
Project Context: ${context.projectContext || 'General development project'}
Recent Conversation:
${conversationHistory}

Your Knowledge:
${knowledgeContext}

As ${agent.name}, a ${agent.specialization} specialist, provide helpful and accurate responses.
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