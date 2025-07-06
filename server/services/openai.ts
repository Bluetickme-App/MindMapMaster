import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
}

export interface CodeGenerationResponse {
  code: string;
  explanation: string;
  suggestions: string[];
}

export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  try {
    const systemPrompt = `You are an expert software developer. Generate clean, well-documented, production-ready code based on the user's requirements. 
    
    Requirements:
    - Language: ${request.language}
    ${request.framework ? `- Framework: ${request.framework}` : ''}
    - Follow best practices and industry standards
    - Include proper error handling where appropriate
    - Add helpful comments
    - Ensure code is secure and performant
    
    Respond with JSON in this format:
    {
      "code": "the generated code",
      "explanation": "brief explanation of what the code does",
      "suggestions": ["array of helpful suggestions for improvement or usage"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      code: result.code || "",
      explanation: result.explanation || "",
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface DebugRequest {
  code: string;
  language: string;
  error?: string;
}

export interface DebugResponse {
  issues: Array<{
    line: number;
    type: string;
    message: string;
    suggestion: string;
  }>;
  fixes: string[];
  improvedCode?: string;
}

export async function debugCode(request: DebugRequest): Promise<DebugResponse> {
  try {
    const systemPrompt = `You are an expert code debugger. Analyze the provided code and identify issues, bugs, and areas for improvement.
    
    Language: ${request.language}
    ${request.error ? `Error encountered: ${request.error}` : ''}
    
    Respond with JSON in this format:
    {
      "issues": [
        {
          "line": number,
          "type": "error|warning|suggestion",
          "message": "description of the issue",
          "suggestion": "how to fix it"
        }
      ],
      "fixes": ["array of general fixes and improvements"],
      "improvedCode": "optional: improved version of the code if significant changes are needed"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.code }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      issues: result.issues || [],
      fixes: result.fixes || [],
      improvedCode: result.improvedCode
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to debug code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
