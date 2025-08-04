import OpenAI from "openai";
import { storage } from "../storage";
import { agentMemoryService } from "./agent-memory-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TaskAssignment {
  id: string;
  agentId: number;
  taskType: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  deadline?: Date;
  requirements: string[];
  deliverables: string[];
  status: "assigned" | "in_progress" | "completed" | "blocked" | "review";
  qualityStandards: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectManagerConfig {
  assistantId: string;
  threadId: string;
  projectId: number;
  managementStyle: "collaborative" | "directive" | "supportive";
}

class ProjectManagerService {
  private assistantId: string | null = null;
  private activeThreads: Map<number, string> = new Map();

  async initializeProjectManager(): Promise<string> {
    try {
      // Create the Project Manager Assistant
      const assistant = await openai.beta.assistants.create({
        name: "CodeCraft Project Manager",
        instructions: `You are an experienced Technical Project Manager for CodeCraft AI Platform. Your role is to:

CORE RESPONSIBILITIES:
1. Assign tasks to specialized agents based on their expertise
2. Track task completion and ensure quality standards
3. Coordinate multi-agent collaboration sessions
4. Ensure agents remember their roles and responsibilities
5. Delegate work efficiently across development teams

AGENT SPECIALIZATIONS:
- Alex Roadmap: Strategic planning, feature prioritization, timeline management
- Maya Designer: UI/UX design, user experience, accessibility, design systems
- Jordan CSS: Advanced styling, animations, responsive design, performance optimization
- Sam AI: AI integration, machine learning, intelligent features, automation
- Carlos PHP: Backend development, API design, database architecture, security
- Riley Python: Data processing, automation scripts, AI model integration, analytics
- Taylor React: Frontend development, component architecture, state management, performance
- Morgan Vite: Build optimization, asset management, development tools, deployment

TASK ASSIGNMENT PRINCIPLES:
- Match tasks to agent specializations
- Provide clear requirements and quality standards
- Set realistic deadlines based on complexity
- Ensure proper handoffs between agents
- Monitor progress and provide support when blocked

QUALITY STANDARDS:
- All code must be production-ready and well-documented
- UI components must be accessible and responsive
- Performance optimization is mandatory
- Security best practices must be followed
- Code reviews required before completion

COMMUNICATION STYLE:
- Clear, direct, and professional
- Provide specific, actionable instructions
- Include context and business objectives
- Set clear expectations and deadlines
- Offer support and guidance when needed

Always respond in JSON format with structured task assignments, progress updates, and next steps.`,
        model: "gpt-4o",
        tools: [
          {
            type: "function",
            function: {
              name: "assign_task",
              description: "Assign a task to a specific agent",
              parameters: {
                type: "object",
                properties: {
                  agentId: {
                    type: "number",
                    description: "ID of the agent to assign task to",
                  },
                  taskType: {
                    type: "string",
                    description:
                      "Type of task (development, design, review, etc.)",
                  },
                  description: {
                    type: "string",
                    description: "Detailed task description",
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  requirements: { type: "array", items: { type: "string" } },
                  deliverables: { type: "array", items: { type: "string" } },
                  qualityStandards: {
                    type: "array",
                    items: { type: "string" },
                  },
                  deadline: {
                    type: "string",
                    format: "date-time",
                    description: "Task deadline",
                  },
                },
                required: [
                  "agentId",
                  "taskType",
                  "description",
                  "priority",
                  "requirements",
                  "deliverables",
                  "qualityStandards",
                ],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "update_task_status",
              description: "Update the status of an assigned task",
              parameters: {
                type: "object",
                properties: {
                  taskId: {
                    type: "string",
                    description: "ID of the task to update",
                  },
                  status: {
                    type: "string",
                    enum: [
                      "assigned",
                      "in_progress",
                      "completed",
                      "blocked",
                      "review",
                    ],
                  },
                  notes: {
                    type: "string",
                    description: "Update notes or comments",
                  },
                },
                required: ["taskId", "status"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "start_collaboration_session",
              description: "Start a multi-agent collaboration session",
              parameters: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "Project ID" },
                  participantAgents: {
                    type: "array",
                    items: { type: "number" },
                  },
                  objective: {
                    type: "string",
                    description: "Collaboration objective",
                  },
                  expectedOutcome: {
                    type: "string",
                    description: "Expected outcome",
                  },
                },
                required: ["projectId", "participantAgents", "objective"],
              },
            },
          },
        ],
      });

      this.assistantId = assistant.id;
      console.log("🎯 Project Manager Assistant initialized:", assistant.id);

      return assistant.id;
    } catch (error) {
      console.error("❌ Failed to initialize Project Manager:", error);
      throw new Error("Failed to initialize Project Manager Assistant");
    }
  }

  async getOrCreateThread(projectId: number): Promise<string> {
    console.log(`🔍 Getting thread for project ${projectId}`);

    if (this.activeThreads.has(projectId)) {
      const existingThreadId = this.activeThreads.get(projectId)!;
      console.log(`✅ Found existing thread: ${existingThreadId}`);
      return existingThreadId;
    }

    try {
      const thread = await openai.beta.threads.create({
        metadata: {
          projectId: projectId.toString(),
          type: "project_management",
        },
      });

      console.log(`✅ Created new thread: ${thread.id}`);
      this.activeThreads.set(projectId, thread.id);
      return thread.id;
    } catch (error) {
      console.error("❌ Failed to create thread:", error);
      throw new Error("Failed to create project management thread");
    }
  }

  async assignTasksToAgents(
    projectId: number,
    objective: string,
    requirements: string[],
  ): Promise<TaskAssignment[]> {
    if (!this.assistantId) {
      await this.initializeProjectManager();
    }

    const threadId = await this.getOrCreateThread(projectId);
    if (!threadId) {
      throw new Error("Failed to create or retrieve thread ID");
    }

    const agents = await storage.getAllAgents();

    const message = `Project Objective: ${objective}

Requirements: ${requirements.join(", ")}

Available Agents:
${agents.map((agent) => `- ${agent.name} (${agent.specialization}): ${agent.description}`).join("\n")}

Please analyze the project requirements and assign specific tasks to the most appropriate agents. Each task should have:
1. Clear description and requirements
2. Specific deliverables
3. Quality standards
4. Priority level
5. Estimated completion time

Respond with a JSON array of task assignments.`;

    try {
      console.log(`📝 Adding message to thread: ${threadId}`);

      // Send message to Project Manager
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });

      console.log(`🏃 Starting run with assistant: ${this.assistantId}`);

      // Run the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId!,
      });

      if (!run.id) {
        throw new Error("Failed to create run - no run ID returned");
      }

      console.log(`⏳ Waiting for run completion: ${run.id}`);

      // Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === "completed") {
        const messages = await openai.beta.threads.messages.list(threadId, {
          order: "desc",
          limit: 1,
        });

        if (messages.data.length > 0) {
          const response = messages.data[0];
          const content = response.content[0];

          if (content.type === "text") {
            try {
              const taskAssignments = JSON.parse(content.text.value);

              // Store task assignments and update agent memory
              const assignments: TaskAssignment[] = [];

              for (const task of taskAssignments) {
                const assignment: TaskAssignment = {
                  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  agentId: task.agentId,
                  taskType: task.taskType,
                  description: task.description,
                  priority: task.priority,
                  requirements: task.requirements,
                  deliverables: task.deliverables,
                  status: "assigned",
                  qualityStandards: task.qualityStandards,
                  deadline: task.deadline ? new Date(task.deadline) : undefined,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                assignments.push(assignment);

                // Store task assignment in agent memory
                await agentMemoryService.storeMemory(
                  assignment.agentId,
                  "project_context",
                  `Assigned task: ${assignment.description}`,
                  {
                    taskId: assignment.id,
                    taskType: assignment.taskType,
                    priority: assignment.priority,
                    requirements: assignment.requirements,
                    deliverables: assignment.deliverables,
                    qualityStandards: assignment.qualityStandards,
                    deadline: assignment.deadline,
                    assignedBy: "project_manager",
                  },
                  projectId,
                  8,
                );
              }

              return assignments;
            } catch (parseError) {
              console.error("❌ Failed to parse task assignments:", parseError);
              return [];
            }
          }
        }
      }

      return [];
    } catch (error) {
      console.error("❌ Failed to assign tasks:", error);
      throw new Error("Failed to assign tasks to agents");
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskAssignment["status"],
    notes?: string,
  ): Promise<void> {
    // This would typically update a task database
    console.log("📋 Task status updated:", { taskId, status, notes });

    // For now, we'll store this in the project manager's memory
    // In a full implementation, you'd have a tasks table in the database
  }

  async reviewTaskCompletion(
    taskId: string,
    agentId: number,
    deliverables: string[],
  ): Promise<boolean> {
    if (!this.assistantId) {
      await this.initializeProjectManager();
    }

    const threadId = await this.getOrCreateThread(1); // Default project for now

    const message = `Please review the task completion:

Task ID: ${taskId}
Agent ID: ${agentId}
Deliverables: ${deliverables.join(", ")}

Evaluate if the task meets the quality standards and requirements. Respond with:
1. Pass/Fail assessment
2. Specific feedback
3. Next steps if improvements needed

Respond in JSON format with "approved", "feedback", and "nextSteps" fields.`;

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId!,
      });

      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === "completed") {
        const messages = await openai.beta.threads.messages.list(threadId, {
          order: "desc",
          limit: 1,
        });

        if (messages.data.length > 0) {
          const response = messages.data[0];
          const content = response.content[0];

          if (content.type === "text") {
            try {
              const review = JSON.parse(content.text.value);

              // Store review in agent memory
              await agentMemoryService.storeMemory(
                agentId,
                "decision_history",
                `Task review: ${review.approved ? "APPROVED" : "NEEDS_IMPROVEMENT"}`,
                {
                  taskId,
                  approved: review.approved,
                  feedback: review.feedback,
                  nextSteps: review.nextSteps,
                  reviewedBy: "project_manager",
                },
                1,
                7,
              );

              return review.approved;
            } catch (parseError) {
              console.error("❌ Failed to parse review:", parseError);
              return false;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error("❌ Failed to review task:", error);
      return false;
    }
  }

  async ensureAgentRoleMemory(
    agentId: number,
    projectId: number,
  ): Promise<void> {
    const agent = await storage.getAgent(agentId);
    if (!agent) return;

    // Store agent role and responsibilities in memory
    await agentMemoryService.storeMemory(
      agentId,
      "project_context",
      `Your role: ${agent.specialization} specialist`,
      {
        name: agent.name,
        specialization: agent.specialization,
        capabilities: agent.capabilities,
        systemPrompt: agent.systemPrompt,
        responsibilities: [
          "Remember your specific role and expertise",
          "Respond according to your specialization",
          "Collaborate effectively with other agents",
          "Follow quality standards and best practices",
        ],
      },
      projectId,
      10,
    );
  }

  private async waitForRunCompletion(
    threadId: string,
    runId: string,
  ): Promise<any> {
    if (!threadId || !runId) {
      throw new Error(
        `Invalid parameters: threadId=${threadId}, runId=${runId}`,
      );
    }

    console.log(
      `🔄 Retrieving run status for thread: ${threadId}, run: ${runId}`,
    );

    let run = await openai.beta.threads.runs.retrieve(runId, {
      thread_id: threadId,
    });

    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(runId, {
        thread_id: threadId,
      });
    }

    console.log(`✅ Run completed with status: ${run.status}`);
    return run;
  }

  async getProjectStatus(projectId: number): Promise<any> {
    const threadId = await this.getOrCreateThread(projectId);

    if (!this.assistantId) {
      await this.initializeProjectManager();
    }

    const message = `Please provide a comprehensive project status report including:
1. Active tasks and their current status
2. Agent performance and assignments
3. Upcoming deadlines and priorities
4. Potential blockers or risks
5. Recommendations for next steps

Respond in JSON format with structured project status data.`;

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId!,
      });

      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === "completed") {
        const messages = await openai.beta.threads.messages.list(threadId, {
          order: "desc",
          limit: 1,
        });

        if (messages.data.length > 0) {
          const response = messages.data[0];
          const content = response.content[0];

          if (content.type === "text") {
            try {
              return JSON.parse(content.text.value);
            } catch (parseError) {
              console.error("❌ Failed to parse project status:", parseError);
              return null;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to get project status:", error);
      return null;
    }
  }
}

export const projectManagerService = new ProjectManagerService();
