import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Agent, AgentContext } from "@shared/schema";

// Initialize all AI SDKs
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key" 
});

// Mock Gemini for now to prevent crash - will be replaced with proper implementation
const gemini = {
  getGenerativeModel: () => ({
    generateContent: async (prompt: string) => ({
      response: {
        text: () => `Mock Gemini response for: ${prompt}`
      }
    })
  })
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "default_key"
});

export interface AgentJobAssignment {
  agentId: number;
  jobType: 'architecture' | 'ui_design' | 'backend' | 'frontend' | 'devops' | 'testing' | 'optimization';
  aiProvider: 'openai' | 'claude' | 'gemini';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedCost: number;
}

export class MultiAISDKIntegration {
  
  // Optimal job assignment based on AI provider strengths
  private jobRouting = {
    // OpenAI GPT-4o excels at:
    'architecture': 'openai',     // System design and planning
    'backend': 'openai',          // API development and databases
    'integration': 'openai',      // Third-party service integration
    'debugging': 'openai',        // Error analysis and fixes
    
    // Claude Sonnet excels at:
    'ui_design': 'claude',        // UI/UX design and components
    'frontend': 'claude',         // React/Vue/Angular development
    'content': 'claude',          // Documentation and content
    'code_review': 'claude',      // Code quality and best practices
    
    // Gemini Pro excels at:
    'devops': 'gemini',          // CI/CD and infrastructure
    'optimization': 'gemini',     // Performance optimization
    'testing': 'gemini',         // Test automation and QA
    'deployment': 'gemini'        // Build and deployment strategies
  };

  // Cost estimation per provider (per 1000 tokens)
  private providerCosts = {
    'openai': { input: 0.005, output: 0.015 },      // GPT-4o pricing
    'claude': { input: 0.008, output: 0.024 },      // Claude Sonnet pricing  
    'gemini': { input: 0.001, output: 0.002 }       // Gemini Pro pricing
  };

  /**
   * Assign jobs to optimal AI providers based on task type and agent specialization
   */
  async assignJobsToAgents(
    agents: Agent[], 
    projectDescription: string, 
    complexity: 'simple' | 'moderate' | 'complex'
  ): Promise<AgentJobAssignment[]> {
    const assignments: AgentJobAssignment[] = [];
    
    // Analyze project requirements to determine job types needed
    const requiredJobs = await this.analyzeProjectRequirements(projectDescription);
    
    for (const agent of agents) {
      // Determine best job type for this agent
      const jobType = this.mapAgentToJobType(agent.specialization);
      
      // Get optimal AI provider for this job type
      const aiProvider = this.jobRouting[jobType] || agent.aiProvider || 'openai';
      
      // Estimate cost based on complexity and provider
      const estimatedCost = this.estimateJobCost(jobType, complexity, aiProvider);
      
      assignments.push({
        agentId: agent.id,
        jobType,
        aiProvider,
        complexity,
        estimatedCost
      });
    }
    
    return assignments;
  }

  /**
   * Execute a job using the appropriate AI SDK
   */
  async executeJob(assignment: AgentJobAssignment, prompt: string, context: AgentContext): Promise<{
    content: string;
    metadata: any;
    cost: number;
  }> {
    console.log(`Executing ${assignment.jobType} job using ${assignment.aiProvider} for agent ${assignment.agentId}`);
    
    switch (assignment.aiProvider) {
      case 'openai':
        return await this.executeOpenAIJob(assignment, prompt, context);
      
      case 'claude':
        return await this.executeClaudeJob(assignment, prompt, context);
      
      case 'gemini':
        return await this.executeGeminiJob(assignment, prompt, context);
      
      default:
        throw new Error(`Unknown AI provider: ${assignment.aiProvider}`);
    }
  }

  /**
   * Execute job using OpenAI SDK (best for architecture, backend, debugging)
   */
  private async executeOpenAIJob(assignment: AgentJobAssignment, prompt: string, context: AgentContext) {
    try {
      const systemPrompt = this.buildSystemPrompt(assignment.jobType, assignment.complexity);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: assignment.jobType === 'architecture' ? 0.3 : 0.7,
        max_tokens: assignment.complexity === 'complex' ? 4000 : 2000
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost('openai', tokensUsed);

      return {
        content,
        metadata: {
          provider: 'openai',
          model: 'gpt-4o',
          tokensUsed,
          jobType: assignment.jobType,
          completion_tokens: response.usage?.completion_tokens || 0
        },
        cost
      };
    } catch (error) {
      console.error('OpenAI job execution error:', error);
      throw error;
    }
  }

  /**
   * Execute job using Claude SDK (best for UI design, frontend, code review)
   */
  private async executeClaudeJob(assignment: AgentJobAssignment, prompt: string, context: AgentContext) {
    try {
      const systemPrompt = this.buildSystemPrompt(assignment.jobType, assignment.complexity);
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: assignment.complexity === 'complex' ? 4000 : 2000,
        temperature: assignment.jobType === 'ui_design' ? 0.8 : 0.6,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const cost = this.calculateCost('claude', tokensUsed);

      return {
        content,
        metadata: {
          provider: 'claude',
          model: 'claude-3-5-sonnet',
          tokensUsed,
          jobType: assignment.jobType,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        },
        cost
      };
    } catch (error) {
      console.error('Claude job execution error:', error);
      throw error;
    }
  }

  /**
   * Execute job using Gemini SDK (best for DevOps, optimization, testing)
   */
  private async executeGeminiJob(assignment: AgentJobAssignment, prompt: string, context: AgentContext) {
    try {
      const systemPrompt = this.buildSystemPrompt(assignment.jobType, assignment.complexity);
      const model = gemini.getGenerativeModel();
      
      const response = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

      const content = response.response.text() || '';
      const tokensUsed = 500; // Estimated for mock
      const cost = this.calculateCost('gemini', tokensUsed);

      return {
        content,
        metadata: {
          provider: 'gemini',
          model: 'gemini-mock',
          tokensUsed,
          jobType: assignment.jobType,
          estimated: true
        },
        cost
      };
    } catch (error) {
      console.error('Gemini job execution error:', error);
      throw error;
    }
  }

  /**
   * Build job-specific system prompts
   */
  private buildSystemPrompt(jobType: string, complexity: string): string {
    const basePrompts = {
      'architecture': `You are a senior system architect. Design scalable, maintainable software architecture. Focus on:
- System design patterns and best practices
- Database schema and API design
- Service architecture and microservices
- Security and performance considerations`,

      'ui_design': `You are a UI/UX designer and frontend specialist. Create beautiful, accessible interfaces. Focus on:
- Modern design patterns and component architecture
- Responsive design and accessibility
- User experience optimization
- CSS and styling best practices`,

      'backend': `You are a backend developer expert. Build robust server-side solutions. Focus on:
- API development and database integration
- Authentication and authorization
- Performance optimization and caching
- Error handling and logging`,

      'devops': `You are a DevOps engineer. Optimize deployment and infrastructure. Focus on:
- CI/CD pipeline setup and automation
- Infrastructure as code
- Monitoring and observability
- Performance optimization and scaling`,

      'testing': `You are a QA engineer and testing specialist. Ensure code quality and reliability. Focus on:
- Test automation strategies
- Unit, integration, and e2e testing
- Performance and security testing
- Quality assurance best practices`,

      'optimization': `You are a performance optimization expert. Improve system efficiency. Focus on:
- Code optimization and refactoring
- Database query optimization
- Caching strategies and CDN setup
- Bundle optimization and lazy loading`
    };

    const complexityModifier = complexity === 'complex' 
      ? '\n\nThis is a complex project requiring advanced patterns and enterprise-level solutions.'
      : complexity === 'moderate'
      ? '\n\nThis is a moderate complexity project requiring solid engineering practices.'
      : '\n\nThis is a simple project requiring clean, straightforward solutions.';

    return (basePrompts[jobType] || basePrompts['architecture']) + complexityModifier;
  }

  /**
   * Map agent specialization to job type
   */
  private mapAgentToJobType(specialization: string): string {
    const mapping = {
      'roadmap': 'architecture',
      'design': 'ui_design',
      'css': 'ui_design',
      'react': 'frontend',
      'vite': 'optimization',
      'php': 'backend',
      'python': 'backend',
      'ai': 'integration',
      'devops': 'devops'
    };

    return mapping[specialization] || 'architecture';
  }

  /**
   * Analyze project requirements to determine needed job types
   */
  private async analyzeProjectRequirements(description: string): Promise<string[]> {
    const keywords = description.toLowerCase();
    const jobs = [];

    if (keywords.includes('api') || keywords.includes('backend') || keywords.includes('database')) {
      jobs.push('backend');
    }
    if (keywords.includes('ui') || keywords.includes('design') || keywords.includes('frontend')) {
      jobs.push('ui_design', 'frontend');
    }
    if (keywords.includes('deploy') || keywords.includes('infrastructure') || keywords.includes('ci/cd')) {
      jobs.push('devops');
    }
    if (keywords.includes('test') || keywords.includes('quality')) {
      jobs.push('testing');
    }
    if (keywords.includes('performance') || keywords.includes('optimize')) {
      jobs.push('optimization');
    }

    // Always include architecture for comprehensive projects
    if (jobs.length > 2) {
      jobs.unshift('architecture');
    }

    return jobs.length > 0 ? jobs : ['architecture'];
  }

  /**
   * Estimate job cost based on type, complexity, and provider
   */
  private estimateJobCost(jobType: string, complexity: string, provider: string): number {
    const baseTokens = {
      'simple': 1000,
      'moderate': 2500,
      'complex': 5000
    };

    const jobMultiplier = {
      'architecture': 1.5,
      'ui_design': 1.2,
      'backend': 1.3,
      'devops': 1.1,
      'testing': 1.0,
      'optimization': 1.4
    };

    const estimatedTokens = baseTokens[complexity] * (jobMultiplier[jobType] || 1.0);
    const costs = this.providerCosts[provider];
    
    // Estimate 60% input, 40% output tokens
    const inputTokens = estimatedTokens * 0.6;
    const outputTokens = estimatedTokens * 0.4;
    
    return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
  }

  /**
   * Calculate actual cost based on token usage
   */
  private calculateCost(provider: string, totalTokens: number): number {
    const costs = this.providerCosts[provider];
    // Approximate 60% input, 40% output for cost calculation
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    
    return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
  }

  /**
   * Get provider health status
   */
  async getProviderHealthStatus(): Promise<{[key: string]: { available: boolean; latency: number }}>  {
    const results = {};
    
    // Test OpenAI
    try {
      const start = Date.now();
      await openai.models.list();
      results['openai'] = { available: true, latency: Date.now() - start };
    } catch (error) {
      results['openai'] = { available: false, latency: -1 };
    }
    
    // Test Claude (simple ping)
    try {
      const start = Date.now();
      // Claude doesn't have a simple ping endpoint, so we'll assume it's available if API key exists
      results['claude'] = { 
        available: !!process.env.ANTHROPIC_API_KEY, 
        latency: Date.now() - start 
      };
    } catch (error) {
      results['claude'] = { available: false, latency: -1 };
    }
    
    // Test Gemini (real API test)
    try {
      const start = Date.now();
      // Test with real Gemini provider
      const { multiAIService } = await import('./multi-ai-provider.js');
      await multiAIService.generateResponse('gemini', 'Health check', 'Respond with "OK"', 'gemini-2.5-flash');
      results['gemini'] = { 
        available: true, 
        latency: Date.now() - start 
      };
    } catch (error) {
      results['gemini'] = { available: false, latency: -1 };
    }
    
    return results;
  }
}

export const multiAISDKIntegration = new MultiAISDKIntegration();