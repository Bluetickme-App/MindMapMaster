import { nanoid } from "nanoid";
import type { Project } from "@shared/schema";
import { storage } from "../storage";
import { agentMemoryService } from "./agent-memory-service";
import { multiAIService } from "./multi-ai-provider";
export interface ReplitAICapabilities {
  agent: {
    naturalLanguageToApp: boolean;
    complexFeatureBuilding: boolean;
    effortBasedPricing: boolean;
    dynamicIntelligence: {
      extendedThinking: boolean;
      highPower: boolean;
    };
    checkpoints: boolean;
  };
  assistant: {
    codeExplanation: boolean;
    quickFixes: boolean;
    featureAddition: boolean;
    basicMode: boolean;
    advancedMode: boolean;
  };
}

export interface AITask {
  id: string;
  type: "agent" | "assistant";
  mode?: "basic" | "advanced";
  complexity: "simple" | "moderate" | "complex";
  description: string;
  context: Record<string, unknown>;
  estimatedEffort: number; // 1-10 scale
  actualEffort?: number;
  cost?: number;
  checkpoint?: string;
}

export interface AppCreationResult {
  project: Project;
  code: Record<string, unknown>;
  checkpoint?: string;
  effort: number;
  cost?: number;
}

export interface AssistantRequest {
  code: string;
  language: string;
  action: "explain" | "fix" | "add-feature";
  mode: "basic" | "advanced";
  context?: Record<string, unknown>;
}

export interface AssistantResponse {
  result: string | Record<string, unknown>;
  mode: "basic" | "advanced";
  cost: number;
}

export interface UsageStats {
  totalTasks: number;
  agentTasks: number;
  assistantTasks: number;
  totalCost: number;
  averageEffort: number;
  complexityBreakdown: {
    simple: number;
    moderate: number;
    complex: number;
  };
}

export class ReplitAIEnhancedSystem {
  private capabilities: ReplitAICapabilities = {
    agent: {
      naturalLanguageToApp: true,
      complexFeatureBuilding: true,
      effortBasedPricing: true,
      dynamicIntelligence: {
        extendedThinking: true,
        highPower: true,
      },
      checkpoints: true,
    },
    assistant: {
      codeExplanation: true,
      quickFixes: true,
      featureAddition: true,
      basicMode: true,
      advancedMode: true,
    },
  };

  private activeTasks: Map<string, AITask> = new Map();
  private taskHistory: AITask[] = [];
  private effortTracking: Map<string, number> = new Map();

  // Enhanced Agent: Complete app generation from natural language
  async createAppFromDescription(
    description: string,
    userId: number,
  ): Promise<AppCreationResult> {
    const taskId = this.generateTaskId();
    const task: AITask = {
      id: taskId,
      type: "agent",
      complexity: this.assessComplexity(description),
      description,
      context: { userId },
      estimatedEffort: this.estimateEffort(description),
    };

    this.activeTasks.set(taskId, task);

    try {
      // Step 1: Analyse requirements using multiple AI providers
      const requirements = await this.analyseRequirements(description);

      // Step 2: Generate architecture and plan
      const architecture = await this.generateArchitecture(requirements);

      // Step 3: Create project structure
      const project = await this.createProjectStructure(architecture, userId);

      // Step 4: Generate code with checkpoints
      const generatedCode = await this.generateCompleteApp(
        project,
        architecture,
        taskId,
      );

      // Step 5: Set up environment and dependencies
      await this.setupEnvironment(project);

      // Calculate actual effort and cost
      task.actualEffort = this.calculateActualEffort(taskId);
      task.cost = this.calculateCost(task);
      task.checkpoint = await this.createCheckpoint(project, generatedCode);

      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);

      return {
        project,
        code: generatedCode,
        checkpoint: task.checkpoint,
        effort: task.actualEffort,
        cost: task.cost,
      };
    } catch (error) {
      this.activeTasks.delete(taskId);
      throw error;
    }
  }

  // Enhanced Assistant: Context-aware code assistance
  async assistWithCode(request: AssistantRequest): Promise<AssistantResponse> {
    const taskId = this.generateTaskId();
    const task: AITask = {
      id: taskId,
      type: "assistant",
      mode: request.mode,
      complexity: "simple",
      description: `${request.action} for ${request.language} code`,
      context: request.context ?? {},
      estimatedEffort: request.mode === "basic" ? 0 : 1,
    };

    this.activeTasks.set(taskId, task);

    try {
      let result: string | Record<string, unknown>;

      switch (request.action) {
        case "explain":
          result = await this.explainCode(request.code, request.language);
          break;
        case "fix":
          if (request.mode === "basic") {
            result = await this.suggestFixes(request.code, request.language);
          } else {
            result = await this.applyFixes(request.code, request.language);
            task.cost = 0.05; // $0.05 per advanced edit
          }
          break;
        case "add-feature":
          if (request.mode === "basic") {
            result = await this.suggestFeature(request.code, request.language);
          } else {
            result = await this.implementFeature(
              request.code,
              request.language,
              request.context ?? {},
            );
            task.cost = 0.05; // $0.05 per advanced edit
          }
          break;
      }

      task.actualEffort = this.calculateActualEffort(taskId);
      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);

      return {
        result,
        mode: request.mode,
        cost: task.cost || 0,
      };
    } catch (error) {
      this.activeTasks.delete(taskId);
      throw error;
    }
  }

  // Intelligent complexity assessment
  private assessComplexity(
    description: string,
  ): "simple" | "moderate" | "complex" {
    const complexityIndicators = {
      simple: ["basic", "simple", "landing page", "static", "display"],
      moderate: ["crud", "api", "database", "authentication", "responsive"],
      complex: [
        "real-time",
        "ai",
        "machine learning",
        "payment",
        "integration",
        "multi-user",
        "websocket",
      ],
    };

    const lowerDesc = description.toLowerCase();

    for (const [level, keywords] of Object.entries(complexityIndicators)) {
      if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
        return level as "simple" | "moderate" | "complex";
      }
    }

    return "moderate";
  }

  // Effort estimation (1-10 scale)
  private estimateEffort(description: string): number {
    const complexity = this.assessComplexity(description);
    const baseEffort = {
      simple: 2,
      moderate: 5,
      complex: 8,
    };

    // Adjust based on description length and specificity
    const wordCount = description.split(" ").length;
    const adjustment = Math.min(wordCount / 50, 2); // Max 2 points adjustment

    return Math.min(baseEffort[complexity] + adjustment, 10);
  }

  // Multi-provider requirement analysis
  private async analyseRequirements(
    description: string,
  ): Promise<Record<string, unknown>> {
    const prompts = {
      openai: `Analyse this app requirement and extract key features, tech stack, and architecture:
"${description}"

Respond with JSON:
{
  "features": ["list of main features"],
  "techStack": {"frontend": "...", "backend": "...", "database": "..."},
  "architecture": "description of recommended architecture",
  "integrations": ["required third-party services"],
  "complexity": "simple|moderate|complex"
}`,
      claude: `As a product architect, analyse this app idea and provide detailed requirements:
"${description}"

Focus on user experience, design patterns, and scalability.`,
      gemini: `Analyse technical requirements and performance considerations for:
"${description}"

Include optimization strategies and deployment recommendations.`,
    };

    const analyses = await Promise.all([
      multiAIService.generateResponseWithFallback(prompts.openai, "", "openai"),
      multiAIService.generateResponseWithFallback(prompts.claude, "", "claude"),
      multiAIService.generateResponseWithFallback(prompts.gemini, "", "gemini"),
    ]);

    // Merge insights from all providers
    return this.mergeAnalyses(analyses);
  }

  // Architecture generation with best practices
  private async generateArchitecture(
    requirements: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const architecturePrompt = `
Based on these requirements:
${JSON.stringify(requirements, null, 2)}

Generate a complete application architecture including:
1. Project structure
2. Component hierarchy
3. API endpoints
4. Database schema
5. Security considerations
6. Performance optimizations

Use modern best practices and production-ready patterns.
`;

    const response = await multiAIService.generateResponseWithFallback(
      architecturePrompt,
      "You are an expert software architect.",
      "openai",
    );

    return JSON.parse(response.content) as Record<string, unknown>;
  }

  // Create project with proper structure
  private async createProjectStructure(
    architecture: Record<string, any>,
    userId: number,
  ): Promise<Project> {
    const project = await storage.createProject({
      userId,
      name: architecture.projectName || "AI Generated App",
      description: architecture.description,
      language: architecture.techStack.language || "typescript",
      framework: architecture.techStack.frontend || "react",
      status: "active",
    });

    // Initialise project files structure
    await this.initialiseProjectFiles(project.id, architecture);

    return project;
  }

  // Generate complete application code
  private async generateCompleteApp(
    project: Project,
    architecture: Record<string, any>,
    taskId: string,
  ): Promise<Record<string, unknown>> {
    const codeGeneration: {
      frontend: unknown[];
      backend: unknown[];
      config: unknown[];
      tests: unknown[];
    } = {
      frontend: [],
      backend: [],
      config: [],
      tests: [],
    };

    // Track effort for each component
    this.effortTracking.set(taskId, 0);

    // Generate frontend components
    for (const component of architecture.components || []) {
      const code = await this.generateComponent(
        component,
        architecture.techStack,
      );
      codeGeneration.frontend.push(code);
      this.incrementEffort(taskId, 0.5);
    }

    // Generate backend API
    if (architecture.api) {
      const apiCode = await this.generateAPI(
        architecture.api,
        architecture.techStack,
      );
      codeGeneration.backend.push(apiCode);
      this.incrementEffort(taskId, 1);
    }

    // Generate configuration files
    const configs = await this.generateConfigs(architecture);
    codeGeneration.config = configs;
    this.incrementEffort(taskId, 0.3);

    // Store generated code
    await storage.createCodeGeneration({
      userId: project.userId,
      projectId: project.id,
      prompt: JSON.stringify(architecture),
      language: architecture.techStack.language,
      framework: architecture.techStack.frontend,
      generatedCode: JSON.stringify(codeGeneration),
    });

    return codeGeneration;
  }

  // Component generation with modern patterns
  private async generateComponent(
    component: Record<string, any>,
    techStack: Record<string, any>,
  ): Promise<Record<string, unknown>> {
    const componentPrompt = `
Generate a ${techStack.frontend} component:
Name: ${component.name}
Type: ${component.type}
Props: ${JSON.stringify(component.props)}
Features: ${component.features?.join(", ")}

Use TypeScript, modern hooks, and best practices.
Include proper error handling and accessibility.
`;

    const response = await multiAIService.generateResponseWithFallback(
      componentPrompt,
      "You are an expert frontend developer.",
      "claude", // Claude excels at UI/UX code
    );

    return {
      name: component.name,
      code: response.content,
      type: component.type,
    } as Record<string, unknown>;
  }

  // API generation with proper patterns
  private async generateAPI(
    apiSpec: Record<string, any>,
    techStack: Record<string, any>,
  ): Promise<Record<string, unknown>> {
    const apiPrompt = `
Generate a RESTful API with these endpoints:
${JSON.stringify(apiSpec.endpoints, null, 2)}

Tech stack: ${techStack.backend}
Database: ${techStack.database}

Include:
- Proper error handling
- Input validation
- Authentication middleware
- Database queries
- TypeScript types
`;

    const response = await multiAIService.generateResponseWithFallback(
      apiPrompt,
      "You are an expert backend developer.",
      "openai", // OpenAI excels at API design
    );

    return {
      endpoints: apiSpec.endpoints,
      code: response.content,
    } as Record<string, unknown>;
  }

  // Configuration file generation
  private async generateConfigs(
    architecture: Record<string, any>,
  ): Promise<Array<Record<string, unknown>>> {
    const configs: Array<Record<string, unknown>> = [];

    // Package.json
    configs.push({
      name: "package.json",
      content: JSON.stringify(
        {
          name: architecture.projectName.toLowerCase().replace(/\s+/g, "-"),
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: architecture.dependencies || {},
          devDependencies: architecture.devDependencies || {},
        },
        null,
        2,
      ),
    });

    // TypeScript config
    if (architecture.techStack.language === "typescript") {
      configs.push({
        name: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              module: "ESNext",
              strict: true,
              jsx: "react-jsx",
              moduleResolution: "node",
              resolveJsonModule: true,
              esModuleInterop: true,
              skipLibCheck: true,
            },
          },
          null,
          2,
        ),
      });
    }

    return configs;
  }

  // Environment setup
  private async setupEnvironment(project: Project): Promise<void> {
    // This would integrate with actual package managers and build tools
    console.log(`Setting up environment for project ${project.id}`);

    // Create necessary directories
    // Install dependencies
    // Set up build scripts
    // Configure development server
  }

  // Code explanation (free in basic mode)
  private async explainCode(
    code: string,
    language: string,
  ): Promise<Record<string, unknown>> {
    const prompt = `
Explain this ${language} code in simple terms:
\`\`\`${language}
${code}
\`\`\`

Provide:
1. What the code does
2. How it works
3. Key concepts used
4. Potential improvements
`;

    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      "You are a helpful coding teacher.",
      "openai",
    );

    return {
      explanation: response.content,
      language,
      concepts: this.extractConcepts(response.content),
    } as Record<string, unknown>;
  }

  // Suggest fixes (basic mode)
  private async suggestFixes(
    code: string,
    language: string,
  ): Promise<Record<string, unknown>> {
    const prompt = `
Analyse this ${language} code for issues:
\`\`\`${language}
${code}
\`\`\`

Suggest fixes for any bugs, performance issues, or best practice violations.
`;

    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      "You are an expert code reviewer.",
      "openai",
    );

    return {
      suggestions: response.content,
      severity: "info",
    } as Record<string, unknown>;
  }

  // Apply fixes (advanced mode - costs $0.05)
  private async applyFixes(
    code: string,
    language: string,
  ): Promise<Record<string, unknown>> {
    const prompt = `
Fix all issues in this ${language} code:
\`\`\`${language}
${code}
\`\`\`

Return the corrected code with comments explaining the fixes.
`;

    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      "You are an expert developer who writes clean, bug-free code.",
      "claude", // Claude excels at code quality
    );

    return {
      originalCode: code,
      fixedCode: response.content,
      changes: this.diffCode(code, response.content),
    } as Record<string, unknown>;
  }

  // Suggest feature (basic mode)
  private async suggestFeature(
    code: string,
    language: string,
  ): Promise<Record<string, unknown>> {
    const prompt = `
Suggest a useful feature to add to this ${language} code:
\`\`\`${language}
${code}
\`\`\`

Describe what the feature would do and how to implement it.
`;

    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      "You are a creative developer.",
      "claude",
    );

    return {
      suggestion: response.content,
      complexity: "moderate",
    } as Record<string, unknown>;
  }

  // Implement feature (advanced mode - costs $0.05)
  private async implementFeature(
    code: string,
    language: string,
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const prompt = `
Add this feature to the ${language} code:
${context.featureDescription}

Current code:
\`\`\`${language}
${code}
\`\`\`

Implement the feature completely with proper integration.
`;

    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      "You are an expert developer who implements features perfectly.",
      "openai",
    );

    return {
      originalCode: code,
      updatedCode: response.content,
      featureAdded: context.featureDescription,
    } as Record<string, unknown>;
  }

  // Checkpoint creation for rollback
  private async createCheckpoint(
    project: Project,
    code: Record<string, unknown>,
  ): Promise<string> {
    const checkpointId = `checkpoint-${Date.now()}`;

    // Store checkpoint data
    await agentMemoryService.storeMemory(
      0,
      "project_context",
      `Project ${project.id} checkpoint ${checkpointId}`,
      {
        checkpointId,
        code: JSON.stringify(code),
        timestamp: new Date(),
        projectState: project,
      },
      project.id,
    );

    return checkpointId;
  }

  // Effort tracking
  private incrementEffort(taskId: string, amount: number): void {
    const current = this.effortTracking.get(taskId) || 0;
    this.effortTracking.set(taskId, current + amount);
  }

  private calculateActualEffort(taskId: string): number {
    return this.effortTracking.get(taskId) || 0;
  }

  // Cost calculation based on effort
  private calculateCost(task: AITask): number {
    if (task.type === "assistant" && task.mode === "basic") {
      return 0; // Basic assistant mode is free
    }

    if (task.type === "assistant" && task.mode === "advanced") {
      return 0.05; // Fixed price for advanced assistant
    }

    // Agent pricing based on effort
    const effortCost = {
      simple: 0.1, // $0.10 for simple tasks
      moderate: 0.5, // $0.50 for moderate tasks
      complex: 2.0, // $2.00 for complex tasks
    };

    const baseCost = effortCost[task.complexity];
    const effortMultiplier = task.actualEffort || task.estimatedEffort;

    return baseCost * (effortMultiplier / 5); // Normalized to 5 as average
  }

  // Merge analyses from multiple AI providers
  private mergeAnalyses(
    analyses: Array<Record<string, any>>,
  ): Record<string, unknown> {
    // Intelligent merging of insights from different providers
    const merged = {
      features: new Set<string>(),
      techStack: {} as Record<string, unknown>,
      architecture: "",
      integrations: new Set<string>(),
      complexity: "moderate",
    };

    analyses.forEach((analysis) => {
      try {
        const parsed =
          typeof analysis.content === "string"
            ? JSON.parse(analysis.content)
            : analysis.content;

        if (parsed.features) {
          parsed.features.forEach((f: string) => merged.features.add(f));
        }

        if (parsed.techStack) {
          Object.assign(merged.techStack, parsed.techStack);
        }

        if (parsed.integrations) {
          parsed.integrations.forEach((i: string) =>
            merged.integrations.add(i),
          );
        }
      } catch (e) {
        // Handle non-JSON responses
        console.log("Non-JSON analysis response:", analysis);
      }
    });

    return {
      features: Array.from(merged.features),
      techStack: merged.techStack,
      architecture: merged.architecture,
      integrations: Array.from(merged.integrations),
      complexity: merged.complexity,
    };
  }

  // Extract concepts from explanation
  private extractConcepts(explanation: string): string[] {
    const concepts: string[] = [];
    const conceptPatterns = [
      /uses?\s+(\w+)/gi,
      /implements?\s+(\w+)/gi,
      /pattern:\s*(\w+)/gi,
      /concept:\s*(\w+)/gi,
    ];

    conceptPatterns.forEach((pattern) => {
      const matches = Array.from(explanation.matchAll(pattern));
      for (const match of matches) {
        concepts.push(match[1]);
      }
    });

    return Array.from(new Set(concepts));
  }

  // Code diff for showing changes
  private diffCode(
    original: string,
    updated: string,
  ): Array<{
    line: number;
    original: string;
    updated: string;
    type: "added" | "removed" | "modified";
  }> {
    const originalLines = original.split("\n");
    const updatedLines = updated.split("\n");
    const changes: Array<{
      line: number;
      original: string;
      updated: string;
      type: "added" | "removed" | "modified";
    }> = [];

    // Simple line-by-line diff
    const maxLines = Math.max(originalLines.length, updatedLines.length);

    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== updatedLines[i]) {
        changes.push({
          line: i + 1,
          original: originalLines[i] || "",
          updated: updatedLines[i] || "",
          type: !originalLines[i]
            ? "added"
            : !updatedLines[i]
              ? "removed"
              : "modified",
        });
      }
    }

    return changes;
  }

  // Initialise project files
  private async initialiseProjectFiles(
    projectId: number,
    architecture: Record<string, unknown>,
  ): Promise<void> {
    // Create initial file structure based on architecture
    const files = [
      { path: "src/index.tsx", type: "file" },
      { path: "src/App.tsx", type: "file" },
      { path: "src/components/", type: "folder" },
      { path: "src/styles/", type: "folder" },
      { path: "public/", type: "folder" },
      { path: "README.md", type: "file" },
    ];

    // Store file structure metadata
    for (const file of files) {
      await agentMemoryService.storeMemory(
        0,
        "project_context",
        `Initial file: ${file.path}`,
        {
          path: file.path,
          fileType: file.type,
          created: new Date(),
        },
        projectId,
      );
    }
  }

  // Generate unique task ID
  private generateTaskId(): string {
    return nanoid();
  }

  // Get usage statistics
  async getUsageStats(userId: number): Promise<UsageStats> {
    const userTasks = this.taskHistory.filter(
      (task) => task.context?.userId === userId,
    );

    const stats: UsageStats = {
      totalTasks: userTasks.length,
      agentTasks: userTasks.filter((t) => t.type === "agent").length,
      assistantTasks: userTasks.filter((t) => t.type === "assistant").length,
      totalCost: userTasks.reduce((sum, task) => sum + (task.cost || 0), 0),
      averageEffort:
        userTasks.reduce((sum, task) => sum + (task.actualEffort || 0), 0) /
        userTasks.length,
      complexityBreakdown: {
        simple: userTasks.filter((t) => t.complexity === "simple").length,
        moderate: userTasks.filter((t) => t.complexity === "moderate").length,
        complex: userTasks.filter((t) => t.complexity === "complex").length,
      },
    };

    return stats;
  }
}

// Export singleton instance
export const replitAIEnhanced = new ReplitAIEnhancedSystem();
