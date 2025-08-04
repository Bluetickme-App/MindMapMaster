import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Agent } from "@shared/schema";

export class AgentManager {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "default_key",
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "default_key",
    });
  }

  private buildSystemPrompt(agent: Agent): string {
    return `You are ${agent.name}, a ${agent.specialization} specialist. ${agent.systemPrompt}\n\nRESPOND IN JSON FORMAT:\n{\n  "content": "your helpful response here",\n  "messageType": "text",\n  "metadata": {},\n  "confidence": 0.8,\n  "reasoning": "why you provided this response"\n}`;
  }

  async generate(agent: Agent, prompt: string): Promise<{ content: string }> {
    const systemPrompt = this.buildSystemPrompt(agent);

    try {
      if (agent.aiProvider === "claude") {
        const response = await this.anthropic.messages.create({
          model: agent.aiModel || "claude-3-5-sonnet-20241022",
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        });

        const content =
          response.content[0]?.type === "text" ? response.content[0].text : "";
        return { content };
      }

      const response = await this.openai.chat.completions.create({
        model: agent.aiModel || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content ?? "";
      return { content };
    } catch (error) {
      console.error(
        `[AgentManager] Provider error for agent ${agent.id}:`,
        error,
      );
      return {
        content: JSON.stringify({
          content: `Hello! I'm ${agent.name}, a ${agent.specialization} specialist ready to assist.`,
          messageType: "text",
          metadata: { error: true },
          confidence: 0.5,
          reasoning: "Fallback response due to provider error",
        }),
      };
    }
  }
}

export const agentManager = new AgentManager();
