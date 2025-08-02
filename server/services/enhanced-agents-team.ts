// Enhanced Multi-Agent Team System
import { multiAIService } from "./multi-ai-provider";
import * as anthropicService from "./anthropic";
import { debugCode } from "./openai";

export interface TeamAgent {
  id: string;
  name: string;
  role: string;
  specialization: string;
  provider: 'openai' | 'claude' | 'gemini';
  capabilities: string[];
  systemPrompt: string;
  active: boolean;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'code' | 'suggestion' | 'decision';
  metadata?: Record<string, any>;
}

export interface TeamCollaboration {
  id: string;
  objective: string;
  participants: TeamAgent[];
  messages: AgentMessage[];
  currentPhase: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

// Define the enhanced team agents
export const ENHANCED_TEAM_AGENTS: TeamAgent[] = [
  {
    id: 'alex-frontend',
    name: 'Alex',
    role: 'Frontend Developer',
    specialization: 'React & UI Development',
    provider: 'openai',
    capabilities: ['react', 'typescript', 'ui-design', 'responsive-design', 'state-management'],
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
    active: true
  },
  {
    id: 'maya-backend',
    name: 'Maya',
    role: 'Backend Developer',
    specialization: 'Full-Stack Applications',
    provider: 'claude',
    capabilities: ['full-stack', 'api-design', 'database-design', 'application-architecture'],
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
    active: true
  },
  {
    id: 'sam-ai',
    name: 'Sam',
    role: 'AI Integration Specialist',
    specialization: 'AI APIs & Machine Learning',
    provider: 'openai',
    capabilities: ['ai-integration', 'api-development', 'machine-learning', 'data-processing'],
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
    active: true
  },
  {
    id: 'jordan-css',
    name: 'Jordan',
    role: 'CSS Specialist',
    specialization: 'Advanced Styling & Animations',
    provider: 'gemini',
    capabilities: ['advanced-css', 'animations', 'responsive-design', 'performance-optimization'],
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
    active: true
  },
  {
    id: 'carlos-devops',
    name: 'Carlos',
    role: 'DevOps Engineer',
    specialization: 'Deployment & Infrastructure',
    provider: 'claude',
    capabilities: ['deployment', 'ci-cd', 'infrastructure', 'monitoring', 'security'],
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
    active: true
  }
];

export class EnhancedAgentsTeam {
  private collaborations: Map<string, TeamCollaboration> = new Map();
  
  async startCollaboration(objective: string, agentIds: string[]): Promise<TeamCollaboration> {
    const participants = ENHANCED_TEAM_AGENTS.filter(agent => 
      agentIds.includes(agent.id) && agent.active
    );
    
    if (participants.length === 0) {
      throw new Error('No active agents selected for collaboration');
    }
    
    const collaboration: TeamCollaboration = {
      id: `collab-${Date.now()}`,
      objective,
      participants,
      messages: [],
      currentPhase: 'planning',
      status: 'active',
      createdAt: new Date()
    };
    
    this.collaborations.set(collaboration.id, collaboration);
    
    // Start with initial planning message
    await this.addInitialPlanningMessage(collaboration);
    
    return collaboration;
  }
  
  private async addInitialPlanningMessage(collaboration: TeamCollaboration): Promise<void> {
    const leadAgent = collaboration.participants.find(agent => 
      agent.role === 'Backend Developer' || agent.role === 'Frontend Developer'
    ) || collaboration.participants[0];
    
    const planningPrompt = `
    Project Objective: ${collaboration.objective}
    
    Team Members:
    ${collaboration.participants.map(agent => 
      `- ${agent.name} (${agent.role}): ${agent.specialization}`
    ).join('\n')}
    
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
      if (leadAgent.provider === 'claude') {
        const result = await anthropicService.generateFullApp(planningPrompt);
        response = result.explanation || 'Planning analysis completed';
      } else if (leadAgent.provider === 'openai') {
        const result = await multiAIService.generateCode({
          prompt: planningPrompt,
          language: 'planning',
          framework: 'project-planning'
        });
        response = result.code || result.explanation || 'Planning completed';
      } else {
        response = `I'll help plan this project: ${collaboration.objective}. Let me coordinate with the team to create a comprehensive development strategy.`;
      }
    } catch (error) {
      console.error('Error generating planning message:', error);
      response = `Let's start planning "${collaboration.objective}". I'll work with the team to create a solid development approach.`;
    }
    
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      agentId: leadAgent.id,
      content: response,
      timestamp: new Date(),
      type: 'message',
      metadata: { phase: 'planning', role: leadAgent.role }
    };
    
    collaboration.messages.push(message);
  }
  
  async addMessage(collaborationId: string, agentId: string, content: string, type: 'message' | 'code' | 'suggestion' | 'decision' = 'message'): Promise<AgentMessage> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }
    
    const agent = collaboration.participants.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not part of this collaboration');
    }
    
    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      content,
      timestamp: new Date(),
      type,
      metadata: { agentName: agent.name, agentRole: agent.role }
    };
    
    collaboration.messages.push(message);
    return message;
  }
  
  async getAgentResponse(collaborationId: string, agentId: string, userMessage: string): Promise<string> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }
    
    const agent = collaboration.participants.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found in collaboration');
    }
    
    const context = this.buildContextForAgent(collaboration, agent);
    const prompt = `${context}\n\nUser Message: ${userMessage}\n\nPlease respond as ${agent.name} (${agent.role}):`;
    
    let response: string;
    
    try {
      if (agent.provider === 'claude') {
        const result = await anthropicService.generateFullApp(prompt);
        response = result.explanation || 'I understand and will help with this task.';
      } else if (agent.provider === 'openai') {
        const result = await multiAIService.generateCode({
          prompt,
          language: 'response',
          framework: 'conversation'
        });
        response = result.explanation || result.code || 'I can help with that.';
      } else {
        response = `As ${agent.name}, I'll work on this: ${userMessage}`;
      }
    } catch (error) {
      console.error(`Error getting response from ${agent.name}:`, error);
      response = `I'm ${agent.name}, and I'm ready to help with this task. Let me coordinate with the team.`;
    }
    
    // Add the response as a message
    await this.addMessage(collaborationId, agentId, response, 'message');
    
    return response;
  }
  
  private buildContextForAgent(collaboration: TeamCollaboration, agent: TeamAgent): string {
    const recentMessages = collaboration.messages.slice(-5);
    
    return `
    ${agent.systemPrompt}
    
    Current Project: ${collaboration.objective}
    Current Phase: ${collaboration.currentPhase}
    
    Team Members:
    ${collaboration.participants.map(a => `- ${a.name} (${a.role})`).join('\n')}
    
    Recent Conversation:
    ${recentMessages.map(msg => {
      const msgAgent = collaboration.participants.find(a => a.id === msg.agentId);
      return `${msgAgent?.name || 'Unknown'}: ${msg.content}`;
    }).join('\n')}
    `;
  }
  
  getCollaboration(id: string): TeamCollaboration | undefined {
    return this.collaborations.get(id);
  }
  
  getAllCollaborations(): TeamCollaboration[] {
    return Array.from(this.collaborations.values());
  }
  
  getActiveCollaborations(): TeamCollaboration[] {
    return Array.from(this.collaborations.values()).filter(c => c.status === 'active');
  }
  
  async endCollaboration(id: string): Promise<void> {
    const collaboration = this.collaborations.get(id);
    if (collaboration) {
      collaboration.status = 'completed';
      collaboration.completedAt = new Date();
    }
  }
}

// Export singleton instance
export const enhancedAgentsTeam = new EnhancedAgentsTeam();