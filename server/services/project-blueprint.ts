import { multiAIService } from "./multi-ai-provider";

export interface ProjectBlueprint {
  workflow: string[];
  blueprint: string;
}

export async function generateProjectBlueprint(
  prompt: string,
  provider: string,
): Promise<ProjectBlueprint> {
  const systemPrompt = `You are a senior software architect. Refine the user's idea into a professional development workflow and a detailed project blueprint.`;
  const schema = {
    type: "object",
    properties: {
      workflow: { type: "array", items: { type: "string" } },
      blueprint: { type: "string" },
    },
    required: ["workflow", "blueprint"],
  };

  const result = await multiAIService.generateStructuredResponse(
    provider,
    prompt,
    systemPrompt,
    schema,
  );

  return {
    workflow: result.workflow || [],
    blueprint: result.blueprint || "",
  };
}
