import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CodexRequest {
  prompt: string;
  language?: string;
  framework?: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  mode?: "completion" | "explanation" | "debugging" | "refactor" | "optimize";
}

export interface CodexResponse {
  code: string;
  explanation?: string;
  suggestions?: string[];
  language: string;
  confidence: number;
  executionTime: number;
}

export class CodexEnhanced {
  async generateCode(request: CodexRequest): Promise<CodexResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.getSystemPrompt(
        request.mode || "completion",
        request.language,
      );
      const userPrompt = this.formatUserPrompt(request);

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest OpenAI model with superior code capabilities
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.1,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const executionTime = Date.now() - startTime;

      return {
        code: result.code || "",
        explanation: result.explanation,
        suggestions: result.suggestions || [],
        language: request.language || this.detectLanguage(request.prompt),
        confidence: result.confidence || 0.9,
        executionTime,
      };
    } catch (error: any) {
      console.error("Codex Enhanced error:", error);
      throw new Error(`Code generation failed: ${(error as Error).message}`);
    }
  }

  async completeCode(
    partialCode: string,
    language: string,
    context?: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: partialCode,
      language,
      context,
      mode: "completion",
      temperature: 0.2,
    });
  }

  async explainCode(code: string, language: string): Promise<CodexResponse> {
    return this.generateCode({
      prompt: code,
      language,
      mode: "explanation",
      temperature: 0.1,
    });
  }

  async debugCode(
    code: string,
    error: string,
    language: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `Code:\n${code}\n\nError:\n${error}`,
      language,
      mode: "debugging",
      temperature: 0.1,
    });
  }

  async refactorCode(
    code: string,
    language: string,
    requirements?: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `${code}\n\nRefactor requirements: ${requirements || "Improve code quality, readability, and performance"}`,
      language,
      mode: "refactor",
      temperature: 0.2,
    });
  }

  async optimizeCode(
    code: string,
    language: string,
    target?: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `${code}\n\nOptimization target: ${target || "performance and memory usage"}`,
      language,
      mode: "optimize",
      temperature: 0.1,
    });
  }

  private getSystemPrompt(mode: string, language?: string): string {
    const basePrompt = `You are an expert software engineer with deep knowledge of ${language || "multiple programming languages"}.
  You provide accurate, production-ready code with clear explanations.`;

    const modePrompts: Record<string, string> = {
      completion: `${basePrompt}
  Complete the given code following best practices. Respond with JSON containing:
  - "code": the completed code
  - "explanation": brief explanation of what was added
  - "suggestions": array of improvement suggestions
  - "confidence": confidence score (0-1)`,

      explanation: `${basePrompt}
Explain the given code in detail. Respond with JSON containing:
- "code": the original code (unchanged)
- "explanation": detailed explanation of how the code works
- "suggestions": array of potential improvements
- "confidence": confidence score (0-1)`,

      debugging: `${basePrompt}
Debug the given code and fix the error. Respond with JSON containing:
- "code": the fixed code
- "explanation": explanation of what was wrong and how it was fixed
- "suggestions": array of additional improvements
- "confidence": confidence score (0-1)`,

      refactor: `${basePrompt}
Refactor the given code to improve quality, readability, and maintainability. Respond with JSON containing:
- "code": the refactored code
- "explanation": explanation of changes made
- "suggestions": array of additional improvements
- "confidence": confidence score (0-1)`,

      optimize: `${basePrompt}
Optimize the given code for better performance and efficiency. Respond with JSON containing:
- "code": the optimized code
- "explanation": explanation of optimizations made
- "suggestions": array of additional performance tips
- "confidence": confidence score (0-1)`,
    };

    return modePrompts[mode] || modePrompts.completion;
  }

  private formatUserPrompt(request: CodexRequest): string {
    let prompt = request.prompt;

    if (request.context) {
      prompt = `Context: ${request.context}\n\n${prompt}`;
    }

    if (request.language) {
      prompt = `Language: ${request.language}\n${prompt}`;
    }

    if (request.framework) {
      prompt = `Framework: ${request.framework}\n${prompt}`;
    }

    return prompt;
  }

  private detectLanguage(prompt: string): string {
    const patterns: Record<string, RegExp> = {
      javascript: /(?:function|const|let|var|=>|\.js|javascript)/i,
      typescript: /(?:interface|type|\.ts|typescript|as\s+\w+)/i,
      python: /(?:def|import|from|\.py|python|__init__|if __name__)/i,
      java: /(?:public class|private|protected|\.java|import java)/i,
      cpp: /(?:#include|cout|cin|\.cpp|\.h|std::)/i,
      csharp: /(?:using System|public class|\.cs|namespace)/i,
      go: /(?:package|func|import|\.go|golang)/i,
      rust: /(?:fn|let|mut|\.rs|use crate)/i,
      php: /(?:<\?php|\$\w+|\.php|function)/i,
      ruby: /(?:def|end|\.rb|require|class)/i,
      sql: /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)/i,
      html: /(?:<html|<div|<span|\.html)/i,
      css: /(?:\.css|{|}|@media|selector)/i,
    };

    for (const [language, pattern] of Object.entries(patterns)) {
      if (pattern.test(prompt)) {
        return language;
      }
    }

    return "javascript"; // Default fallback
  }

  // Advanced features
  async generateTestCases(
    code: string,
    language: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `Generate comprehensive test cases for this code:\n${code}`,
      language,
      mode: "completion",
      context: "Generate unit tests with edge cases and assertions",
      temperature: 0.3,
    });
  }

  async generateDocumentation(
    code: string,
    language: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `Generate detailed documentation for this code:\n${code}`,
      language,
      mode: "explanation",
      context: "Create comprehensive documentation with examples",
      temperature: 0.2,
    });
  }

  async convertLanguage(
    code: string,
    fromLanguage: string,
    toLanguage: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `Convert this ${fromLanguage} code to ${toLanguage}:\n${code}`,
      language: toLanguage,
      mode: "completion",
      context: `Language conversion from ${fromLanguage} to ${toLanguage}`,
      temperature: 0.2,
    });
  }

  async suggestImprovements(
    code: string,
    language: string,
  ): Promise<CodexResponse> {
    return this.generateCode({
      prompt: `Analyze this code and suggest improvements:\n${code}`,
      language,
      mode: "refactor",
      context: "Code review and improvement suggestions",
      temperature: 0.3,
    });
  }
}

export const codexEnhanced = new CodexEnhanced();
