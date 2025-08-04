import { storage } from "../storage";
import type { Agent, Message, Conversation } from "@shared/schema";
import { agentOrchestrationService } from "./agent-orchestration";

export interface TaskAssignment {
  agentId: number;
  taskDescription: string;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  dependencies: number[];
}

export interface ProjectPlan {
  projectId: number;
  objective: string;
  phases: Array<{
    name: string;
    tasks: TaskAssignment[];
    timeline: string;
  }>;
  teamComposition: number[];
}

export class ProjectManagerCoordination {
  // Create a private conversation between Project Manager and specific agents
  async createTaskDelegationConversation(
    projectId: number,
    taskDescription: string,
    requiredAgentTypes: string[],
  ): Promise<{ conversationId: number; plan: ProjectPlan }> {
    try {
      // Find Morgan Davis (Project Manager)
      const projectManager = await storage.getAgentByName("Morgan Davis");
      if (!projectManager) {
        throw new Error("Project Manager not found");
      }

      // Find relevant agents based on task requirements
      const allAgents = await storage.getAllAgents();
      const relevantAgents = allAgents.filter(
        (agent) =>
          requiredAgentTypes.includes(agent.type) ||
          requiredAgentTypes.some((type) =>
            agent.specialization?.includes(type),
          ),
      );

      // Create private coordination conversation
      const conversation = await storage.createConversation({
        title: `Task Coordination: ${taskDescription}`,
        type: "task_delegation",
        projectId: projectId,
        participants: [projectManager.id, ...relevantAgents.map((a) => a.id)],
      });

      // Generate project plan through Project Manager
      const plan = await this.generateProjectPlan(
        projectManager,
        taskDescription,
        relevantAgents,
        projectId,
      );

      // Store initial coordination message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: projectManager.id,
        senderType: "agent",
        content: this.formatProjectPlan(plan),
        messageType: "task_delegation",
      });

      return { conversationId: conversation.id, plan };
    } catch (error) {
      console.error("Task delegation error:", error);
      throw error;
    }
  }

  // Project Manager analyzes task and creates structured plan
  private async generateProjectPlan(
    projectManager: Agent,
    taskDescription: string,
    availableAgents: Agent[],
    projectId: number,
  ): Promise<ProjectPlan> {
    const agentCapabilities = availableAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      specialization: agent.specialization,
      capabilities: agent.capabilities,
    }));

    // Use Project Manager to analyze and plan
    const planningPrompt = `As Project Manager, analyze this task and create a structured execution plan:

TASK: ${taskDescription}

AVAILABLE TEAM:
${agentCapabilities
  .map(
    (agent) =>
      `- ${agent.name} (${agent.type}): ${Array.isArray(agent.capabilities) ? agent.capabilities.join(", ") : agent.capabilities}`,
  )
  .join("\n")}

Create a detailed project plan with:
1. Break down the task into specific phases
2. Assign appropriate team members to each task
3. Identify dependencies between tasks
4. Estimate timelines
5. Define deliverables

Respond in this JSON format:
{
  "objective": "clear objective statement",
  "phases": [
    {
      "name": "Phase name",
      "tasks": [
        {
          "agentId": agent_id,
          "taskDescription": "specific task",
          "priority": "high|medium|low",
          "estimatedTime": "time estimate",
          "dependencies": [agent_ids]
        }
      ],
      "timeline": "phase timeline"
    }
  ],
  "teamComposition": [agent_ids]
}`;

    try {
      const response = await agentOrchestrationService.generateAgentResponse(
        projectManager.id,
        planningPrompt,
        {
          conversation: { id: 0 } as Conversation,
          recentMessages: [],
          projectContext: { id: projectId, taskDescription },
        },
      );

      // Parse JSON response
      const planData = JSON.parse(response.content);

      return {
        projectId,
        objective: planData.objective,
        phases: planData.phases,
        teamComposition: planData.teamComposition,
      };
    } catch (error) {
      console.error("Project planning error:", error);
      // Fallback plan
      return {
        projectId,
        objective: taskDescription,
        phases: [
          {
            name: "Implementation",
            tasks: availableAgents.map((agent) => ({
              agentId: agent.id,
              taskDescription: `${agent.type} contributions to: ${taskDescription}`,
              priority: "medium" as const,
              estimatedTime: "2-3 days",
              dependencies: [],
            })),
            timeline: "1 week",
          },
        ],
        teamComposition: availableAgents.map((a) => a.id),
      };
    }
  }

  // Format project plan for display
  private formatProjectPlan(plan: ProjectPlan): string {
    return `📋 **PROJECT COORDINATION PLAN**

**Objective:** ${plan.objective}

**Team Composition:** ${plan.teamComposition.length} specialists assigned

**Execution Phases:**
${plan.phases
  .map(
    (phase, i) =>
      `${i + 1}. **${phase.name}** (${phase.timeline})
${phase.tasks
  .map(
    (task) =>
      `   • Agent ${task.agentId}: ${task.taskDescription} [${task.priority} priority, ${task.estimatedTime}]`,
  )
  .join("\n")}`,
  )
  .join("\n\n")}

**Next Steps:**
1. Team agents will receive their specific task assignments
2. Implementation will begin based on priority and dependencies
3. Progress updates will be provided to user through this coordination channel

Team is ready to execute. Proceeding with task delegation...`;
  }

  // Execute the plan by delegating tasks to individual agents
  async executePlan(
    plan: ProjectPlan,
    coordinationConversationId: number,
  ): Promise<void> {
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        await this.delegateTaskToAgent(
          task.agentId,
          task.taskDescription,
          coordinationConversationId,
          plan.projectId,
        );
      }
    }
  }

  // Delegate specific task to an agent
  private async delegateTaskToAgent(
    agentId: number,
    taskDescription: string,
    coordinationConversationId: number,
    projectId: number,
  ): Promise<void> {
    const agent = await storage.getAgent(agentId);
    if (!agent) return;

    // Create task assignment message
    await storage.createMessage({
      conversationId: coordinationConversationId,
      senderId: 1, // Project Manager system ID
      senderType: "system",
      content: `🎯 **TASK ASSIGNMENT**
      
**Agent:** ${agent.name} (${agent.type})
**Task:** ${taskDescription}
**Project ID:** ${projectId}
**Status:** Assigned

Agent ${agent.name} has been notified and will begin work on this task.`,
      messageType: "task_assignment",
    });

    // Store task in agent's memory
    try {
      const { agentMemoryService } = await import("./agent-memory-service.js");
      await agentMemoryService.storeMemory(
        agentId,
        "project_context",
        `Task Assignment: ${taskDescription}`,
        { priority: "high", task: taskDescription },
        projectId,
        5,
      );
    } catch (error) {
      console.error("Memory storage error:", error);
    }
  }

  // Get coordination conversation for user to see project plan
  async getCoordinationSummary(conversationId: number): Promise<string> {
    const messages = await storage.getMessagesByConversation(conversationId);
    const planMessage = messages.find(
      (m) => m.messageType === "task_delegation",
    );

    if (planMessage) {
      return planMessage.content;
    }

    return "Project coordination in progress...";
  }
}

export const projectManagerCoordination = new ProjectManagerCoordination();
