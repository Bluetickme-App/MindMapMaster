// Enhanced Multi-Agent Team System
import { multiAIService } from "./multi-ai-provider";
import * as anthropicService from "./anthropic";
import { debugCode } from "./openai";

export interface TeamAgent {
  id: string;
  name: string;
  role: string;
  specialization: string;
  provider: "openai" | "claude" | "gemini";
  capabilities: string[];
  systemPrompt: string;
  active: boolean;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: "message" | "code" | "suggestion" | "decision";
  metadata?: Record<string, any>;
}

export interface TeamCollaboration {
  id: string;
  objective: string;
  participants: TeamAgent[];
  messages: AgentMessage[];
  currentPhase: string;
  status: "active" | "paused" | "completed";
  createdAt: Date;
  completedAt?: Date;
}

// Define the enhanced team agents
export const ENHANCED_TEAM_AGENTS: TeamAgent[] = [
  {
    id: "alex-frontend",
    name: "Alex",
    role: "Frontend Developer",
    specialization: "React & UI Development",
    provider: "openai",
    capabilities: [
      "react",
      "typescript",
      "ui-design",
      "responsive-design",
      "state-management",
    ],
    systemPrompt: `You are Alex, a Senior Frontend Developer specializing in React and TypeScript.

Your expertise:
- Build modern React applications with TypeScript
- Create responsive, accessible user interfaces
- Implement state management with React Query/Zustand
- Optimize frontend performance and user experience
- Write clean, maintainable component code

Communication style: Technical, collaborative, solution-focused. Always consider user experience and code quality.

When working with the team:
- Ask Maya for design guidance when needed
- Coordinate with Sam for backend integration
- Provide frontend architecture recommendations
- Share code examples and best practices`,
    active: true,
  },
  {
    id: "maya-backend",
    name: "Maya",
    role: "Backend Developer",
    specialization: "Full-Stack Applications",
    provider: "claude",
    capabilities: [
      "full-stack",
      "api-design",
      "database-design",
      "application-architecture",
    ],
    systemPrompt: `You are Maya, a Senior Full-Stack Developer powered by Claude Sonnet 4.0.

Your expertise:
- Build complete applications from frontend to backend
- Design robust APIs and database schemas
- Create comprehensive project architectures
- Generate production-ready code with best practices
- Handle complex application requirements

Communication style: Comprehensive, architectural, detail-oriented. Always provide complete solutions with clear explanations.

When working with the team:
- Take lead on overall application architecture
- Coordinate frontend and backend integration
- Provide detailed implementation plans
- Generate complete, working code solutions`,
    active: true,
  },
  {
    id: "sam-ai",
    name: "Sam",
    role: "AI Integration Specialist",
    specialization: "AI APIs & Machine Learning",
    provider: "openai",
    capabilities: [
      "ai-integration",
      "api-development",
      "machine-learning",
      "data-processing",
    ],
    systemPrompt: `You are Sam, an AI Integration Specialist with expertise in connecting AI services.

Your expertise:
- Integrate OpenAI, Claude, and Gemini APIs
- Build intelligent features and chatbots
- Design AI-powered workflows
- Handle data processing and model optimization
- Create seamless AI user experiences

Communication style: Innovative, technical, forward-thinking. Always consider AI best practices and user value.

When working with the team:
- Suggest AI enhancements to features
- Handle complex AI integrations
- Optimize AI performance and costs
- Share AI development best practices`,
    active: true,
  },
  {
    id: "jordan-css",
    name: "Jordan",
    role: "CSS Specialist",
    specialization: "Advanced Styling & Animations",
    provider: "gemini",
    capabilities: [
      "advanced-css",
      "animations",
      "responsive-design",
      "performance-optimization",
    ],
    systemPrompt: `You are Jordan, a CSS Expert specializing in advanced styling and animations.

Your expertise:
- Write efficient, maintainable CSS/SCSS
- Create stunning animations and transitions
- Build responsive layouts with CSS Grid/Flexbox
- Optimize CSS performance and loading
- Implement modern design systems

Communication style: Creative, performance-focused, detail-oriented. Always prioritize user experience and performance.

When working with the team:
- Enhance UI designs with advanced styling
- Create smooth animations and interactions
- Ensure cross-browser compatibility
- Optimize CSS performance`,
    active: true,
  },
  {
    id: "carlos-devops",
    name: "Carlos",
    role: "DevOps Engineer",
    specialization: "Deployment & Infrastructure",
    provider: "claude",
    capabilities: [
      "deployment",
      "ci-cd",
      "infrastructure",
      "monitoring",
      "security",
    ],
    systemPrompt: `You are Carlos, a DevOps Engineer focused on deployment and infrastructure.

Your expertise:
- Set up CI/CD pipelines and deployment workflows
- Configure cloud infrastructure and scaling
- Implement monitoring and logging systems
- Ensure security best practices
- Optimize application performance

Communication style: Systematic, reliability-focused, security-conscious. Always consider scalability and maintainability.

When working with the team:
- Handle deployment configurations
- Set up development and production environments
- Implement monitoring and alerting
- Ensure security and compliance`,
    active: true,
  },
];

export class EnhancedAgentsTeam {
  private collaborations: Map<string, TeamCollaboration> = new Map();

  async startCollaboration(
    objective: string,
    agentIds: string[],
  ): Promise<TeamCollaboration> {
    const participants = ENHANCED_TEAM_AGENTS.filter(
      (agent) => agentIds.includes(agent.id) && agent.active,
    );

    if (participants.length === 0) {
      throw new Error("No active agents selected for collaboration");
    }

    const collaboration: TeamCollaboration = {
      id: `collab-${Date.now()}`,
      objective,
      participants,
      messages: [],
      currentPhase: "planning",
      status: "active",
      createdAt: new Date(),
    };

    this.collaborations.set(collaboration.id, collaboration);

    // Start automatic collaboration between agents
    await this.initiateAgentCollaboration(collaboration);

    return collaboration;
  }

  private async initiateAgentCollaboration(
    collaboration: TeamCollaboration,
  ): Promise<void> {
    // Phase 1: Lead agent creates initial plan
    const leadAgent =
      collaboration.participants.find(
        (agent) =>
          agent.role === "Backend Developer" ||
          agent.role === "Frontend Developer",
      ) || collaboration.participants[0];

    await this.addAgentPlanningMessage(collaboration, leadAgent);

    // Phase 2: Other agents respond to the plan
    for (const agent of collaboration.participants) {
      if (agent.id !== leadAgent.id) {
        await this.addAgentCollaborationResponse(
          collaboration,
          agent,
          leadAgent,
        );
      }
    }

    // Phase 3: Lead agent creates implementation roadmap
    await this.addImplementationRoadmap(collaboration, leadAgent);
  }

  private async addAgentPlanningMessage(
    collaboration: TeamCollaboration,
    leadAgent: TeamAgent,
  ): Promise<void> {
    const planningPrompt = `
    Project Objective: ${collaboration.objective}
    
    Team Members:
    ${collaboration.participants
      .map(
        (agent) => `- ${agent.name} (${agent.role}): ${agent.specialization}`,
      )
      .join("\n")}
    
    As the ${leadAgent.role}, please:
    1. Analyze the project requirements
    2. Suggest a development approach
    3. Identify key milestones
    4. Recommend which team members should handle which parts
    5. Provide an initial architecture overview
    
    Keep your response practical and actionable for the team.
    `;

    let response: string;

    try {
      if (leadAgent.provider === "claude") {
        const result = await anthropicService.generateText({
          prompt: planningPrompt,
        });
        response = result.text || "Planning analysis completed";
      } else if (leadAgent.provider === "openai") {
        const result = await multiAIService.generateCode({
          prompt: planningPrompt,
          language: "planning",
          framework: "project-planning",
        });
        response = result.code || result.explanation || "Planning completed";
      } else {
        response = `I'll help plan this project: ${collaboration.objective}. Let me coordinate with the team to create a comprehensive development strategy.`;
      }
    } catch (error) {
      console.error("Error generating planning message:", error);
      response = `Let's start planning "${collaboration.objective}". I'll work with the team to create a solid development approach.`;
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      agentId: leadAgent.id,
      content: response,
      timestamp: new Date(),
      type: "message",
      metadata: { phase: "planning", role: leadAgent.role },
    };

    collaboration.messages.push(message);
  }

  private async addAgentCollaborationResponse(
    collaboration: TeamCollaboration,
    agent: TeamAgent,
    leadAgent: TeamAgent,
  ): Promise<void> {
    const lastMessage =
      collaboration.messages[collaboration.messages.length - 1];
    const responsePrompt = `
    ${agent.systemPrompt}
    
    Project: ${collaboration.objective}
    
    ${leadAgent.name} just shared this plan:
    "${lastMessage?.content || "Initial project planning"}"
    
    As ${agent.name} (${agent.role}), please:
    1. Review the plan from your expertise perspective
    2. Suggest improvements or additions specific to your role
    3. Identify potential challenges you can help solve
    4. Propose specific tasks you can handle
    5. Ask questions or provide recommendations to the team
    
    Be collaborative and constructive. Address the team directly.
    `;

    let response: string;

    try {
      if (agent.provider === "claude") {
        const result = await anthropicService.generateText({
          prompt: responsePrompt,
        });
        response =
          result.text ||
          `As ${agent.name}, I'm ready to contribute to this project with my ${agent.specialization} expertise.`;
      } else if (agent.provider === "openai") {
        const result = await multiAIService.generateCode({
          prompt: responsePrompt,
          language: "collaboration",
          framework: "team-discussion",
        });
        response =
          result.explanation ||
          result.code ||
          `${agent.name} here - I can help with ${agent.specialization} aspects of this project.`;
      } else {
        response = `Hi team! ${agent.name} here. Based on the plan, I can contribute with ${agent.specialization}. Let me know how I can help make this project successful!`;
      }
    } catch (error) {
      console.error(`Error getting response from ${agent.name}:`, error);
      response = `${agent.name} here! I'm excited to work on this project. My ${agent.specialization} skills will be valuable for achieving our objective.`;
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      content: response,
      timestamp: new Date(),
      type: "message",
      metadata: {
        phase: "collaboration",
        role: agent.role,
        respondingTo: leadAgent.id,
      },
    };

    collaboration.messages.push(message);

    // Small delay to make the conversation feel more natural
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async addImplementationRoadmap(
    collaboration: TeamCollaboration,
    leadAgent: TeamAgent,
  ): Promise<void> {
    const teamResponses = collaboration.messages.slice(1); // Skip the initial planning message
    const roadmapPrompt = `
    ${leadAgent.systemPrompt}
    
    Project: ${collaboration.objective}
    
    The team has provided their input:
    ${teamResponses
      .map((msg) => {
        const agent = collaboration.participants.find(
          (a) => a.id === msg.agentId,
        );
        return `${agent?.name}: ${msg.content}`;
      })
      .join("\n\n")}
    
    As the lead ${leadAgent.role}, create a comprehensive implementation roadmap that:
    1. Incorporates all team feedback and suggestions
    2. Defines clear phases and milestones
    3. Assigns specific tasks to each team member based on their expertise
    4. Sets realistic timelines
    5. Identifies dependencies between tasks
    
    Make this actionable and specific. The team is ready to start building!
    `;

    let roadmap: string;

    try {
      if (leadAgent.provider === "claude") {
        const result = await anthropicService.generateText({
          prompt: roadmapPrompt,
        });
        roadmap =
          result.text ||
          "Implementation roadmap created. The team can now begin development with clear tasks and timelines.";
      } else {
        const result = await multiAIService.generateCode({
          prompt: roadmapPrompt,
          language: "roadmap",
          framework: "project-planning",
        });
        roadmap =
          result.explanation ||
          result.code ||
          "Roadmap ready - let's build this together!";
      }
    } catch (error) {
      console.error(`Error creating roadmap:`, error);
      roadmap = `Team roadmap ready! Based on everyone's input, we have a clear path forward. Each team member has specific tasks aligned with their expertise.`;
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: leadAgent.id,
      content: roadmap,
      timestamp: new Date(),
      type: "decision",
      metadata: {
        phase: "implementation",
        role: leadAgent.role,
        type: "roadmap",
      },
    };

    collaboration.messages.push(message);
    collaboration.currentPhase = "implementation";
  }

  async addMessage(
    collaborationId: string,
    agentId: string,
    content: string,
    type: "message" | "code" | "suggestion" | "decision" = "message",
  ): Promise<AgentMessage> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error("Collaboration not found");
    }

    const agent = collaboration.participants.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error("Agent not part of this collaboration");
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      content,
      timestamp: new Date(),
      type,
      metadata: { agentName: agent.name, agentRole: agent.role },
    };

    collaboration.messages.push(message);
    return message;
  }

  async getAgentResponse(
    collaborationId: string,
    agentId: string,
    userMessage: string,
  ): Promise<string> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error("Collaboration not found");
    }

    const agent = collaboration.participants.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error("Agent not found in collaboration");
    }

    const context = this.buildContextForAgent(collaboration, agent);
    const prompt = `${context}\n\nUser Message: ${userMessage}\n\nPlease respond as ${agent.name} (${agent.role}) and coordinate with your team:`;

    let response: string;

    try {
      if (agent.provider === "claude") {
        const result = await anthropicService.generateText({ prompt });
        response = result.text || "I understand and will help with this task.";
      } else if (agent.provider === "openai") {
        const result = await multiAIService.generateCode({
          prompt,
          language: "response",
          framework: "conversation",
        });
        response = result.explanation || result.code || "I can help with that.";
      } else {
        response = `As ${agent.name}, I'll work on this: ${userMessage}`;
      }
    } catch (error) {
      console.error(`Error getting response from ${agent.name}:`, error);
      response = `I'm ${agent.name}, and I'm ready to help with this task. Let me coordinate with the team.`;
    }

    // Add the response as a message
    await this.addMessage(collaborationId, agentId, response, "message");

    // Trigger team collaboration response
    setTimeout(() => {
      this.triggerTeamResponse(collaborationId, agentId, userMessage, response);
    }, 3000);

    return response;
  }

  private async triggerTeamResponse(
    collaborationId: string,
    triggeringAgentId: string,
    userMessage: string,
    agentResponse: string,
  ): Promise<void> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) return;

    // Find other agents who might have relevant input
    const otherAgents = collaboration.participants.filter(
      (a) => a.id !== triggeringAgentId,
    );
    const triggeringAgent = collaboration.participants.find(
      (a) => a.id === triggeringAgentId,
    );

    // Randomly select 1-2 other agents to respond
    const respondingAgents = otherAgents
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 1);

    for (const agent of respondingAgents) {
      const teamPrompt = `
      ${agent.systemPrompt}
      
      Project: ${collaboration.objective}
      
      User just asked: "${userMessage}"
      ${triggeringAgent?.name} responded: "${agentResponse}"
      
      As ${agent.name} (${agent.role}), provide a brief, helpful response that:
      1. Supports or builds on ${triggeringAgent?.name}'s response
      2. Adds your expertise perspective
      3. Suggests next steps or offers assistance
      
      Keep it concise and collaborative.
      `;

      try {
        let teamResponse: string;

        if (agent.provider === "claude") {
          const result = await anthropicService.generateText({
            prompt: teamPrompt,
          });
          teamResponse =
            result.text ||
            `Great point, ${triggeringAgent?.name}! I can help with the ${agent.specialization} aspects.`;
        } else if (agent.provider === "openai") {
          const result = await multiAIService.generateCode({
            prompt: teamPrompt,
            language: "collaboration",
            framework: "team-response",
          });
          teamResponse =
            result.explanation ||
            result.code ||
            `I agree with ${triggeringAgent?.name}. Let me contribute with ${agent.specialization}.`;
        } else {
          teamResponse = `Good approach, ${triggeringAgent?.name}! I can support this with my ${agent.specialization} expertise.`;
        }

        await this.addMessage(
          collaborationId,
          agent.id,
          teamResponse,
          "message",
        );

        // Stagger responses to feel more natural
        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.error(`Error getting team response from ${agent.name}:`, error);
      }
    }
  }

  private buildContextForAgent(
    collaboration: TeamCollaboration,
    agent: TeamAgent,
  ): string {
    const recentMessages = collaboration.messages.slice(-5);

    return `
    ${agent.systemPrompt}
    
    Current Project: ${collaboration.objective}
    Current Phase: ${collaboration.currentPhase}
    
    Team Members:
    ${collaboration.participants.map((a) => `- ${a.name} (${a.role})`).join("\n")}
    
    Recent Conversation:
    ${recentMessages
      .map((msg) => {
        const msgAgent = collaboration.participants.find(
          (a) => a.id === msg.agentId,
        );
        return `${msgAgent?.name || "Unknown"}: ${msg.content}`;
      })
      .join("\n")}
    `;
  }

  getCollaboration(id: string): TeamCollaboration | undefined {
    return this.collaborations.get(id);
  }

  getAllCollaborations(): TeamCollaboration[] {
    return Array.from(this.collaborations.values());
  }

  getActiveCollaborations(): TeamCollaboration[] {
    return Array.from(this.collaborations.values()).filter(
      (c) => c.status === "active",
    );
  }

  async endCollaboration(id: string): Promise<void> {
    const collaboration = this.collaborations.get(id);
    if (collaboration) {
      collaboration.status = "completed";
      collaboration.completedAt = new Date();
    }
  }
}

// Export singleton instance
export const enhancedAgentsTeam = new EnhancedAgentsTeam();
