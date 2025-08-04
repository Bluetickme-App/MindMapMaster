import { storage } from "../storage";
import type {
  Agent,
  Message,
  Conversation,
  AgentResponse,
} from "@shared/schema";
import { agentMemoryService } from "./agent-memory-service";
import { agentManager } from "./agent-manager";

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

  // Optimal model routing based on research
  private modelRouting = {
    design_specialist: "claude", // UI/UX Design excellence
    css_specialist: "claude", // CSS mastery
    react_senior: "claude", // Component architecture
    ai_specialist: "openai", // API development
    roadmap_specialist: "openai", // System architecture
    backend_specialist: "openai", // Backend development
    vite_specialist: "gemini", // Build optimization
    devops_specialist: "gemini", // DevOps excellence
  };

  // Core agent response generation with memory integration
  async generateAgentResponse(
    agentId: number,
    userMessage: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    console.log(
      `[Agent ${agentId}] Generating response for message: "${userMessage}"`,
    );

    // Mark agent as busy
    this.agentBusyStatus.set(agentId, true);
    await storage.updateAgentStatus(agentId, "busy");

    // Get agent's memory and project context
    const projectId = context.conversation.projectId;
    const agentMemories = await agentMemoryService.retrieveMemories(
      agentId,
      projectId,
    );
    const projectMemory = projectId
      ? await agentMemoryService.getProjectContext(agentId, projectId)
      : null;

    try {
      // Get agent's knowledge and context
      const agentKnowledge = await storage.getAgentKnowledgeByAgent(agentId);
      const relevantKnowledge = agentKnowledge
        .filter((k) => this.isRelevantToContext(k.content, userMessage))
        .slice(0, 5);

      // Build context-aware prompt with memory
      const contextPrompt = this.buildContextPrompt(
        agent,
        context,
        relevantKnowledge,
        agentMemories,
        projectMemory,
      );

      const aiProvider = agent.aiProvider || "openai";
      console.log(
        `[Agent ${agentId}] Using ${aiProvider} provider for ${agent.name}`,
      );

      const userPrompt = `Context: ${contextPrompt}\n\nUser message: ${userMessage}`;
      const aiResponse = await agentManager.generate(agent, userPrompt);

      console.log(`[Agent ${agentId}] ${aiProvider} response received`);

      let result;
      try {
        // Check if the response is wrapped in code blocks
        let cleanContent = aiResponse.content;
        if (
          cleanContent.startsWith("```json") &&
          cleanContent.endsWith("```")
        ) {
          cleanContent = cleanContent.slice(7, -3).trim();
        } else if (
          cleanContent.startsWith("```") &&
          cleanContent.endsWith("```")
        ) {
          cleanContent = cleanContent.slice(3, -3).trim();
        }

        // Try to parse as JSON first
        result = JSON.parse(cleanContent);
      } catch (e) {
        console.log(
          `[Agent ${agentId}] Failed to parse JSON, using fallback response`,
        );
        // Fallback: create structured response from raw content
        result = {
          content:
            aiResponse.content ||
            `Hi! I'm ${agent.name} and I'm ready to help with your ${agent.specialization} needs. How can I assist you?`,
          messageType: "text",
          metadata: { provider: aiProvider },
          confidence: aiResponse.confidence || 0.7,
          reasoning: `Response from ${agent.name} using ${aiProvider} provider`,
        };
      }

      // Store agent's learning from this interaction
      try {
        await this.updateAgentKnowledge(
          agentId,
          userMessage,
          result.content,
          context,
        );

        // Store conversation memory
        await agentMemoryService.storeMemory(
          agentId,
          "project_context",
          `Conversation about: ${userMessage.slice(0, 50)}...`,
          {
            userMessage,
            agentResponse: result.content,
            context: context.projectContext,
            timestamp: new Date(),
            confidence: result.confidence,
          },
          projectId,
          Math.min(Math.floor(result.confidence * 10), 10),
        );
      } catch (error) {
        console.error(`[Agent ${agentId}] Failed to update knowledge:`, error);
      }

      console.log(`[Agent ${agentId}] Response generated: "${result.content}"`);

      return {
        agentId,
        content:
          result.content ||
          `Hello! I'm ${agent.name}, ready to help with ${agent.specialization}!`,
        messageType: result.messageType || "text",
        metadata: result.metadata || { provider: aiProvider },
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || `Generated response using ${aiProvider}`,
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
        reasoning: "Fallback response due to API error",
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

    const overlap = knowledgeWords.filter((word) =>
      messageWords.includes(word),
    ).length;
    return overlap > 0;
  }

  private buildContextPrompt(
    agent: Agent,
    context: AgentContext,
    knowledge: any[],
    memories?: any[],
    projectMemory?: any,
  ): string {
    const recentMessages = context.recentMessages.slice(-5);
    const conversationHistory = recentMessages
      .map(
        (msg) =>
          `${msg.senderType === "user" ? "User" : "Agent"}: ${msg.content}`,
      )
      .join("\n");

    const knowledgeContext = knowledge.map((k) => k.content).join("\n");

    const memoryContext =
      memories?.map((m) => `${m.memoryType}: ${m.summary}`).join("\n") || "";

    const projectContext = projectMemory
      ? `
Project Memory:
- Recent Activities: ${projectMemory.recentActivities?.map((a: any) => a.summary).join(", ") || "None"}
- Key Decisions: ${projectMemory.keyDecisions?.map((d: any) => d.summary).join(", ") || "None"}
- Collaboration History: ${projectMemory.collaborationHistory?.map((c: any) => c.summary).join(", ") || "None"}
    `.trim()
      : "";

    return `
Project Context: ${context.projectContext || "General development project"}
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

  private async updateAgentKnowledge(
    agentId: number,
    userMessage: string,
    response: string,
    context: AgentContext,
  ): Promise<void> {
    try {
      await storage.createAgentKnowledge({
        agentId,
        content: `User asked: "${userMessage}" - I responded: "${response}"`,
        context: JSON.stringify(context),
        confidence: 0.8,
      });
    } catch (error) {
      console.error(`Failed to update knowledge for agent ${agentId}:`, error);
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
