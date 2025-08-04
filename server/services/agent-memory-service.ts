import { storage } from "../storage";
import type { Agent, Project } from "@shared/schema";
import { nanoid } from "nanoid";

export interface AgentMemoryEntry {
  id: number;
  agentId: number;
  projectId?: number;
  memoryType:
    | "project_context"
    | "user_preference"
    | "code_pattern"
    | "decision_history";
  summary: string;
  details: any;
  importance: number;
  lastAccessed: Date;
  createdAt: Date;
}

export interface CollaborationSession {
  id: number;
  sessionId: string;
  projectId?: number;
  participantAgents: number[];
  objective: string;
  phase: "planning" | "implementation" | "review" | "completed";
  decisions: any[];
  outcomes: any[];
  startTime: Date;
  endTime?: Date;
  status: "active" | "paused" | "completed";
}

export interface AgentCommunication {
  id: number;
  sessionId: string;
  fromAgentId: number;
  toAgentId?: number;
  messageType: "suggestion" | "question" | "decision" | "update";
  content: string;
  context?: any;
  priority: number;
  isProcessed: boolean;
  responseRequired: boolean;
  timestamp: Date;
}

export class AgentMemoryService {
  // Memory Management
  async storeMemory(
    agentId: number,
    memoryType: AgentMemoryEntry["memoryType"],
    summary: string,
    details: any,
    projectId?: number,
    importance: number = 5,
  ): Promise<AgentMemoryEntry> {
    const memory = {
      agentId,
      projectId,
      memoryType,
      summary,
      details,
      importance,
      lastAccessed: new Date(),
      createdAt: new Date(),
    };

    // Store in database - we'll implement this when we have the database storage
    console.log(`[Memory] Storing memory for agent ${agentId}:`, summary);

    // Store in agent memory table using direct database insert
    await storage.createAgentMemory({
      agentId,
      projectId: projectId || null,
      memoryType,
      summary,
      details,
      importance,
    });

    return memory as AgentMemoryEntry;
  }

  async retrieveMemories(
    agentId: number,
    projectId?: number,
    memoryType?: AgentMemoryEntry["memoryType"],
  ): Promise<AgentMemoryEntry[]> {
    // Get relevant memories from knowledge base
    const knowledge = await storage.getAgentKnowledgeByAgent(agentId);

    return knowledge
      .map((k) => ({
        id: k.id,
        agentId: k.agentId,
        projectId,
        memoryType: "project_context" as AgentMemoryEntry["memoryType"],
        summary: k.content,
        details: {},
        importance: Math.floor((k.relevanceScore || 0) / 10),
        lastAccessed: new Date(),
        createdAt: k.createdAt || new Date(),
      }))
      .slice(0, 10);
  }

  async updateMemoryAccess(memoryId: number): Promise<void> {
    // Update last accessed time
    console.log(`[Memory] Updating access time for memory ${memoryId}`);
  }

  // Collaboration Management
  async startCollaboration(
    projectId: number,
    participantAgents: number[],
    objective: string,
  ): Promise<CollaborationSession> {
    const sessionId = nanoid();
    const session: CollaborationSession = {
      id: Date.now(), // temporary ID
      sessionId,
      projectId,
      participantAgents,
      objective,
      phase: "planning",
      decisions: [],
      outcomes: [],
      startTime: new Date(),
      status: "active",
    };

    console.log(
      `[Collaboration] Starting session ${sessionId} with agents:`,
      participantAgents,
    );

    // Store initial memories for all participants
    for (const agentId of participantAgents) {
      await this.storeMemory(
        agentId,
        "project_context",
        `Started collaboration on: ${objective}`,
        {
          sessionId,
          projectId,
          participants: participantAgents,
          phase: "planning",
        },
        projectId,
        8,
      );
    }

    return session;
  }

  async addCollaborationDecision(
    sessionId: string,
    decision: string,
    madeBy: number,
    reasoning: string,
  ): Promise<void> {
    const decisionEntry = {
      decision,
      madeBy,
      reasoning,
      timestamp: new Date(),
    };

    console.log(
      `[Collaboration] Decision added to session ${sessionId}:`,
      decision,
    );

    // Store decision in memory for all participants
    const agent = await storage.getAgent(madeBy);
    if (agent) {
      await this.storeMemory(
        madeBy,
        "decision_history",
        `Made decision: ${decision}`,
        {
          sessionId,
          reasoning,
          timestamp: new Date(),
        },
        undefined,
        7,
      );
    }
  }

  async endCollaboration(sessionId: string, outcomes: string[]): Promise<void> {
    console.log(
      `[Collaboration] Ending session ${sessionId} with outcomes:`,
      outcomes,
    );

    // We would update the database here
    // For now, just log the completion
  }

  // Agent Communication
  async sendAgentMessage(
    sessionId: string,
    fromAgentId: number,
    toAgentId: number | undefined,
    messageType: AgentCommunication["messageType"],
    content: string,
    context?: any,
    priority: number = 5,
    responseRequired: boolean = false,
  ): Promise<AgentCommunication> {
    const communication: AgentCommunication = {
      id: Date.now(),
      sessionId,
      fromAgentId,
      toAgentId,
      messageType,
      content,
      context,
      priority,
      isProcessed: false,
      responseRequired,
      timestamp: new Date(),
    };

    console.log(
      `[Communication] Agent ${fromAgentId} → ${toAgentId || "ALL"}: ${content}`,
    );

    // Store communication in memory
    await this.storeMemory(
      fromAgentId,
      "project_context",
      `Sent ${messageType}: ${content}`,
      {
        sessionId,
        toAgentId,
        messageType,
        timestamp: new Date(),
      },
      undefined,
      priority,
    );

    return communication;
  }

  async getAgentCommunications(
    sessionId: string,
    agentId?: number,
  ): Promise<AgentCommunication[]> {
    console.log(
      `[Communication] Getting communications for session ${sessionId}`,
    );

    // Return empty array for now - would query database in real implementation
    return [];
  }

  async markCommunicationProcessed(communicationId: number): Promise<void> {
    console.log(
      `[Communication] Marking communication ${communicationId} as processed`,
    );
  }

  // Context and Pattern Recognition
  async recognizePatterns(
    agentId: number,
    projectId?: number,
  ): Promise<string[]> {
    const memories = await this.retrieveMemories(
      agentId,
      projectId,
      "code_pattern",
    );

    return memories.map((m) => m.summary);
  }

  async getProjectContext(agentId: number, projectId: number): Promise<any> {
    const memories = await this.retrieveMemories(
      agentId,
      projectId,
      "project_context",
    );

    return {
      recentActivities: memories.slice(0, 5),
      keyDecisions: memories.filter((m) => m.summary.includes("decision")),
      collaborationHistory: memories.filter((m) =>
        m.summary.includes("collaboration"),
      ),
    };
  }

  // Cross-Agent Learning
  async shareKnowledge(
    fromAgentId: number,
    toAgentId: number,
    knowledge: string,
    context?: any,
  ): Promise<void> {
    console.log(
      `[Knowledge] Sharing from agent ${fromAgentId} to ${toAgentId}: ${knowledge}`,
    );

    // Store shared knowledge in receiving agent's memory
    await this.storeMemory(
      toAgentId,
      "code_pattern",
      `Learned from Agent ${fromAgentId}: ${knowledge}`,
      {
        source: fromAgentId,
        originalContext: context,
        timestamp: new Date(),
      },
      undefined,
      6,
    );
  }

  // Project-Specific Memory
  async buildProjectMemory(projectId: number): Promise<any> {
    const project = await storage.getProject(projectId);
    if (!project) return {};

    return {
      projectInfo: {
        name: project.name,
        language: project.language,
        framework: project.framework,
        status: project.status,
      },
      agents: await this.getProjectAgents(projectId),
      recentActivities: await this.getRecentProjectActivities(projectId),
      keyDecisions: await this.getProjectDecisions(projectId),
    };
  }

  private async getProjectAgents(projectId: number): Promise<Agent[]> {
    // Get agents who have worked on this project
    const agents = await storage.getAllAgents();
    return agents.filter((a: Agent) => a.status === "active");
  }

  private async getRecentProjectActivities(projectId: number): Promise<any[]> {
    // Get recent activities for this project
    return [];
  }

  private async getProjectDecisions(projectId: number): Promise<any[]> {
    // Get key decisions made for this project
    return [];
  }
}

export const agentMemoryService = new AgentMemoryService();
