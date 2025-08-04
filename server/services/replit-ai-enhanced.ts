import { multiAIService } from "./multi-ai-provider";
import { agentMemoryService } from "./agent-memory-service";
import { agentToolIntegration } from "./agent-tool-integration";
import { nanoid } from "nanoid";

export interface ReplitAICapabilities {
  agent: {
    naturalLanguageToApp: boolean;
    checkpoints: boolean;
  };
  assistant: {
    codeExplanation: boolean;
    quickFixes: boolean;
    featureAddition: boolean;
  };
}

export interface AITask {
  id: string;
  type: "agent" | "assistant";
  description: string;
  complexity: "simple" | "moderate" | "complex";
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface AppGenerationResult {
  summary: string;
  files: string[];
}

export class ReplitAIEnhancedService {
  private capabilities: ReplitAICapabilities = {
    agent: {
      naturalLanguageToApp: true,
      checkpoints: true,
    },
    assistant: {
      codeExplanation: true,
      quickFixes: true,
      featureAddition: true,
    },
  };

  private activeTasks: Map<string, AITask> = new Map();

  async createAppFromDescription(
    description: string,
    userId: number,
  ): Promise<AppGenerationResult> {
    const taskId = this.startTask("agent", description, "complex");

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" },
            },
            required: ["path", "content"],
          },
        },
      },
      required: ["summary", "files"],
    };

    const plan = await multiAIService.generateStructuredResponse(
      "openai",
      description,
      "You design complete TypeScript Express applications. Reply with JSON.",
      schema,
    );

    for (const file of plan.files as GeneratedFile[]) {
      await agentToolIntegration.executeToolForAgent(userId, "create_file", {
        path: file.path,
        content: file.content,
      });
    }

    await agentMemoryService.storeMemory(
      userId,
      "project_context",
      `Generated application: ${plan.summary}`,
      { description, files: plan.files },
    );

    this.completeTask(taskId);

    return {
      summary: plan.summary as string,
      files: (plan.files as GeneratedFile[]).map((f) => f.path),
    };
  }

  async assistWithCode(request: {
    code: string;
    language: string;
    action: "explain" | "fix" | "add-feature";
    userId: number;
  }): Promise<string> {
    const { code, language, action, userId } = request;
    const taskId = this.startTask("assistant", action, "simple");

    const prompt = this.buildAssistantPrompt(code, language, action);
    const systemPrompt = `You are a senior ${language} engineer providing precise assistance.`;
    const response = await multiAIService.generateResponseWithFallback(
      prompt,
      systemPrompt,
    );

    await agentMemoryService.storeMemory(
      userId,
      "code_pattern",
      `${action} request for ${language}`,
      { code, result: response.content },
    );

    this.completeTask(taskId);
    return response.content;
  }

  private buildAssistantPrompt(
    code: string,
    language: string,
    action: "explain" | "fix" | "add-feature",
  ): string {
    switch (action) {
      case "explain":
        return `Explain the following ${language} code:\n\n${code}`;
      case "fix":
        return `Identify and correct issues in the following ${language} code:\n\n${code}`;
      case "add-feature":
        return `Add the requested feature to the following ${language} code. Provide the full updated snippet:\n\n${code}`;
    }
  }

  private startTask(
    type: "agent" | "assistant",
    description: string,
    complexity: "simple" | "moderate" | "complex",
  ): string {
    const id = nanoid();
    const task: AITask = { id, type, description, complexity };
    this.activeTasks.set(id, task);
    return id;
  }

  private completeTask(taskId: string): void {
    this.activeTasks.delete(taskId);
  }
}

export const replitAIEnhanced = new ReplitAIEnhancedService();
