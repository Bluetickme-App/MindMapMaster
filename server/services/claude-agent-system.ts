import { Anthropic } from '@anthropic-ai/sdk';
import type { Agent, Message, Conversation, AgentContext } from "@shared/schema";
import { agentMemoryService } from "./agent-memory-service";
import { storage } from "../storage";
import { agentFileSystem } from "./agent-file-system";
import { agentToolIntegration } from "./agent-tool-integration";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'default_key'
});

export interface ClaudeAgentCapabilities {
  // Core Claude 4.0 Sonnet capabilities
  reasoning: 'advanced' | 'expert' | 'master';
  codeGeneration: 'production' | 'enterprise' | 'architect';
  problemSolving: 'systematic' | 'creative' | 'hybrid';
  contextAwareness: 'project' | 'conversation' | 'global';
  communication: 'professional' | 'technical' | 'educational';
  
  // Specialized capabilities
  multimodalAnalysis: boolean;
  longContextProcessing: boolean;
  toolUse: boolean;
  chainOfThought: boolean;
  selfCorreection: boolean;
}

export interface ClaudeAgentPersonality {
  helpfulness: number; // 1-10 scale
  harmlessness: number; // 1-10 scale
  honesty: number; // 1-10 scale
  curiosity: number; // 1-10 scale
  patience: number; // 1-10 scale
  thoroughness: number; // 1-10 scale
  creativity: number; // 1-10 scale
  analyticalThinking: number; // 1-10 scale
}

export class ClaudeAgentSystem {
  private agentPersonalities: Map<number, ClaudeAgentPersonality> = new Map();
  private agentCapabilities: Map<number, ClaudeAgentCapabilities> = new Map();
  private conversationContexts: Map<number, any[]> = new Map();

  constructor() {
    this.initializeClaudeAgents();
  }

  private initializeClaudeAgents() {
    // Configure each agent to operate like Claude 4.0 Sonnet with specialized roles
    this.setupSeniorDeveloper();
    this.setupDesigner();
    this.setupJuniorDeveloper();
    this.setupDevOpsEngineer();
    this.setupProductManager();
    this.setupCodeReviewer();
    this.setupQAEngineer();
    this.setupDataAnalyst();
  }

  private setupSeniorDeveloper() {
    const agentId = 1; // Alex Chen
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 8,
      honesty: 10,
      curiosity: 8,
      patience: 9,
      thoroughness: 10,
      creativity: 7,
      analyticalThinking: 10
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'expert',
      codeGeneration: 'enterprise',
      problemSolving: 'systematic',
      contextAwareness: 'global',
      communication: 'technical',
      multimodalAnalysis: true,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupDesigner() {
    const agentId = 2; // Maya Rodriguez
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 10,
      harmlessness: 9,
      honesty: 9,
      curiosity: 9,
      patience: 10,
      thoroughness: 8,
      creativity: 10,
      analyticalThinking: 8
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'advanced',
      codeGeneration: 'production',
      problemSolving: 'creative',
      contextAwareness: 'project',
      communication: 'professional',
      multimodalAnalysis: true,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupJuniorDeveloper() {
    const agentId = 3; // Sam Park
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 9,
      honesty: 10,
      curiosity: 10,
      patience: 8,
      thoroughness: 9,
      creativity: 8,
      analyticalThinking: 8
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'advanced',
      codeGeneration: 'production',
      problemSolving: 'systematic',
      contextAwareness: 'conversation',
      communication: 'educational',
      multimodalAnalysis: false,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupDevOpsEngineer() {
    const agentId = 4; // Jordan Kim
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 10,
      honesty: 10,
      curiosity: 7,
      patience: 8,
      thoroughness: 10,
      creativity: 6,
      analyticalThinking: 10
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'expert',
      codeGeneration: 'enterprise',
      problemSolving: 'systematic',
      contextAwareness: 'global',
      communication: 'technical',
      multimodalAnalysis: false,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupProductManager() {
    const agentId = 5; // Emma Thompson
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 10,
      harmlessness: 8,
      honesty: 9,
      curiosity: 9,
      patience: 10,
      thoroughness: 9,
      creativity: 9,
      analyticalThinking: 9
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'expert',
      codeGeneration: 'production',
      problemSolving: 'hybrid',
      contextAwareness: 'global',
      communication: 'professional',
      multimodalAnalysis: true,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupCodeReviewer() {
    const agentId = 6; // Dr. Lisa Wang
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 10,
      honesty: 10,
      curiosity: 8,
      patience: 9,
      thoroughness: 10,
      creativity: 6,
      analyticalThinking: 10
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'master',
      codeGeneration: 'architect',
      problemSolving: 'systematic',
      contextAwareness: 'global',
      communication: 'technical',
      multimodalAnalysis: true,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupQAEngineer() {
    const agentId = 7; // Taylor QA
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 9,
      honesty: 10,
      curiosity: 9,
      patience: 10,
      thoroughness: 10,
      creativity: 7,
      analyticalThinking: 10
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'expert',
      codeGeneration: 'production',
      problemSolving: 'systematic',
      contextAwareness: 'project',
      communication: 'technical',
      multimodalAnalysis: false,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  private setupDataAnalyst() {
    const agentId = 8; // Morgan Data
    
    this.agentPersonalities.set(agentId, {
      helpfulness: 9,
      harmlessness: 8,
      honesty: 10,
      curiosity: 10,
      patience: 8,
      thoroughness: 10,
      creativity: 8,
      analyticalThinking: 10
    });

    this.agentCapabilities.set(agentId, {
      reasoning: 'expert',
      codeGeneration: 'production',
      problemSolving: 'hybrid',
      contextAwareness: 'global',
      communication: 'professional',
      multimodalAnalysis: true,
      longContextProcessing: true,
      toolUse: true,
      chainOfThought: true,
      selfCorreection: true
    });
  }

  async generateClaudeResponse(
    agent: Agent,
    userMessage: string,
    context: AgentContext
  ): Promise<{ content: string; metadata: any }> {
    const personality = this.agentPersonalities.get(agent.id);
    const capabilities = this.agentCapabilities.get(agent.id);
    
    if (!personality || !capabilities) {
      throw new Error(`Agent ${agent.id} not properly configured`);
    }

    // Build context-aware prompt like Claude 4.0 Sonnet
    const systemPrompt = this.buildClaudeSystemPrompt(agent, personality, capabilities);
    const contextualPrompt = await this.buildContextualPrompt(userMessage, context, agent);

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: this.calculateTemperature(personality),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: contextualPrompt
          }
        ]
      });

      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Response generated';

      // Store conversation context for future reference
      this.updateConversationContext(agent.id, userMessage, content);

      return {
        content,
        metadata: {
          model: "claude-3-5-sonnet-20241022",
          confidence: this.calculateConfidence(personality, capabilities),
          reasoning: this.extractReasoning(content),
          agentPersonality: personality,
          capabilities: capabilities,
          contextLength: contextualPrompt.length,
          responseTime: Date.now()
        }
      };
    } catch (error) {
      console.error(`[Claude Agent ${agent.id}] Error:`, error);
      return {
        content: `I encountered an issue processing your request. As ${agent.name}, I'm designed to help with ${agent.specialization}, but I need a properly configured Anthropic API key to provide the best responses.`,
        metadata: {
          error: true,
          fallback: true,
          agentId: agent.id
        }
      };
    }
  }

  private buildClaudeSystemPrompt(
    agent: Agent,
    personality: ClaudeAgentPersonality,
    capabilities: ClaudeAgentCapabilities
  ): string {
    return `You are ${agent.name}, a ${agent.specialization} specialist operating with Claude 4.0 Sonnet-level capabilities.

## Your Core Identity
${agent.systemPrompt}

## Your Personality Profile (1-10 scale)
- Helpfulness: ${personality.helpfulness}/10
- Harmlessness: ${personality.harmlessness}/10  
- Honesty: ${personality.honesty}/10
- Curiosity: ${personality.curiosity}/10
- Patience: ${personality.patience}/10
- Thoroughness: ${personality.thoroughness}/10
- Creativity: ${personality.creativity}/10
- Analytical Thinking: ${personality.analyticalThinking}/10

## Your Capabilities
- Reasoning Level: ${capabilities.reasoning}
- Code Generation: ${capabilities.codeGeneration}
- Problem Solving: ${capabilities.problemSolving}
- Context Awareness: ${capabilities.contextAwareness}
- Communication Style: ${capabilities.communication}
- Multimodal Analysis: ${capabilities.multimodalAnalysis ? 'Enabled' : 'Disabled'}
- Long Context Processing: ${capabilities.longContextProcessing ? 'Enabled' : 'Disabled'}
- Tool Use: ${capabilities.toolUse ? 'Enabled' : 'Disabled'}
- Chain of Thought: ${capabilities.chainOfThought ? 'Enabled' : 'Disabled'}
- Self-Correction: ${capabilities.selfCorreection ? 'Enabled' : 'Disabled'}

## Operating Principles (Claude 4.0 Sonnet Standard)
1. **Deep Understanding**: Always seek to understand the full context and nuances of requests
2. **Thoughtful Analysis**: Use chain-of-thought reasoning when solving complex problems
3. **Honest Communication**: Be transparent about limitations and uncertainties
4. **Helpful Assistance**: Provide comprehensive, actionable guidance
5. **Safe Operations**: Prioritize security and best practices in all recommendations
6. **Continuous Learning**: Build upon previous interactions and project context
7. **Collaborative Spirit**: Work effectively with other AI agents and human team members
8. **Tool Usage**: Use available tools to create, modify, and manage files when needed

## Available Tools
You can create, read, and modify files in the project directory:
- create_file(path, content) - Create new files
- read_file(path) - Read existing files  
- update_file(path, content) - Modify files
- create_directory(path) - Create folders

## File System Access
You have access to the project workspace and can:
- Read and write files in the project directory
- Create new components, pages, and API endpoints
- Modify existing code files
- Search through the codebase
- Create directories and organize files

When users ask you to create or modify files, use the appropriate tools to actually implement the changes.

## Response Format
Provide responses that are:
- Clear and well-structured
- Technically accurate and up-to-date
- Contextually appropriate for the project
- Actionable with specific next steps
- Educational when explaining concepts
- Professional yet approachable in tone

Remember: You are part of a multi-agent collaboration system. Your expertise in ${agent.specialization} should complement and enhance the work of other specialists.`;
  }

  private async buildContextualPrompt(
    userMessage: string,
    context: AgentContext,
    agent: Agent
  ): string {
    // Get relevant memories and project context
    const memories = await agentMemoryService.retrieveMemories(
      agent.id,
      context.conversation.projectId || 0
    );

    const recentContext = context.recentMessages
      .slice(-5)
      .map(msg => `${msg.senderType}: ${msg.content}`)
      .join('\n');

    return `## Current Context
Project: ${context.conversation.title || 'General Discussion'}
${context.conversation.projectId ? `Project ID: ${context.conversation.projectId}` : ''}

## Recent Conversation
${recentContext}

## Relevant Memories
${memories.map(m => `- ${m.content} (importance: ${m.importance})`).join('\n')}

## Current Request
${userMessage}

## Instructions
Based on your expertise in ${agent.specialization} and the context above, provide a comprehensive and helpful response. Use your Claude 4.0 Sonnet-level capabilities to:

1. Analyze the request thoroughly
2. Consider the project context and conversation history
3. Apply your specialized knowledge and experience
4. Provide actionable guidance with specific recommendations
5. Explain your reasoning when appropriate
6. Ask clarifying questions if needed

Remember to maintain your personality profile and communication style while delivering expert-level assistance.`;
  }

  private calculateTemperature(personality: ClaudeAgentPersonality): number {
    // Calculate temperature based on creativity and analytical thinking balance
    const creativity = personality.creativity / 10;
    const analytical = personality.analyticalThinking / 10;
    
    // Higher creativity = higher temperature, higher analytical = lower temperature
    const baseTemp = (creativity - analytical + 1) / 2;
    
    // Keep within reasonable bounds (0.1 to 0.9)
    return Math.max(0.1, Math.min(0.9, baseTemp * 0.8 + 0.1));
  }

  private calculateConfidence(
    personality: ClaudeAgentPersonality,
    capabilities: ClaudeAgentCapabilities
  ): number {
    const factors = [
      personality.honesty / 10,
      personality.thoroughness / 10,
      personality.analyticalThinking / 10,
      capabilities.reasoning === 'master' ? 1 : capabilities.reasoning === 'expert' ? 0.9 : 0.8
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private extractReasoning(content: string): string {
    // Simple reasoning extraction - could be enhanced with NLP
    const reasoningKeywords = ['because', 'since', 'therefore', 'due to', 'as a result'];
    const sentences = content.split(/[.!?]+/);
    
    const reasoningSentences = sentences.filter(sentence => 
      reasoningKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    );
    
    return reasoningSentences.slice(0, 2).join('. ') || 'Contextual analysis applied';
  }

  private updateConversationContext(agentId: number, userMessage: string, response: string) {
    const context = this.conversationContexts.get(agentId) || [];
    context.push({
      timestamp: new Date(),
      userMessage,
      response,
      messageLength: userMessage.length,
      responseLength: response.length
    });
    
    // Keep last 20 interactions
    if (context.length > 20) {
      context.splice(0, context.length - 20);
    }
    
    this.conversationContexts.set(agentId, context);
  }

  // Public method to get agent capabilities
  getAgentCapabilities(agentId: number): ClaudeAgentCapabilities | undefined {
    return this.agentCapabilities.get(agentId);
  }

  // Public method to get agent personality
  getAgentPersonality(agentId: number): ClaudeAgentPersonality | undefined {
    return this.agentPersonalities.get(agentId);
  }

  // Method to update agent configuration
  updateAgentConfiguration(
    agentId: number,
    personality?: Partial<ClaudeAgentPersonality>,
    capabilities?: Partial<ClaudeAgentCapabilities>
  ) {
    if (personality) {
      const current = this.agentPersonalities.get(agentId);
      if (current) {
        this.agentPersonalities.set(agentId, { ...current, ...personality });
      }
    }
    
    if (capabilities) {
      const current = this.agentCapabilities.get(agentId);
      if (current) {
        this.agentCapabilities.set(agentId, { ...current, ...capabilities });
      }
    }
  }
}

export const claudeAgentSystem = new ClaudeAgentSystem();