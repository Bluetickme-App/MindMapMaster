// Universal project assistant that works with all AI providers
import { db } from "../db";
import { projects, projectConversations } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AssistantResponse {
  code: string;
  explanation: string;
  language: string;
  framework?: string;
}

// Create or get project assistant configuration
export async function initializeProjectAssistant(
  projectId: number,
  aiProvider: 'openai' | 'claude' | 'gemini' = 'openai'
): Promise<{ assistantId?: string; threadId?: string }> {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    
    if (!project) {
      throw new Error('Project not found');
    }

    // For OpenAI, create actual assistant
    if (aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      if (!project.assistantId || !project.threadId) {
        const { createProjectAssistant } = await import('./openai.js');
        const { assistantId, threadId } = await createProjectAssistant(
          project.name,
          project.language,
          project.framework
        );

        // Update project with assistant IDs
        await db.update(projects)
          .set({ assistantId, threadId })
          .where(eq(projects.id, projectId));

        return { assistantId, threadId };
      }
      return { assistantId: project.assistantId, threadId: project.threadId };
    }

    // For Claude and Gemini, we'll use database-based memory
    return {};
  } catch (error) {
    console.error('Error initializing project assistant:', error);
    throw new Error('Failed to initialize project assistant');
  }
}

// Get conversation history for context
export async function getProjectContext(
  projectId: number,
  aiProvider: 'openai' | 'claude' | 'gemini',
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const conversations = await db
      .select()
      .from(projectConversations)
      .where(eq(projectConversations.projectId, projectId))
      .orderBy(desc(projectConversations.createdAt))
      .limit(limit);

    return conversations
      .reverse() // Get chronological order
      .map(conv => ({
        role: conv.role as 'user' | 'assistant',
        content: conv.content,
        timestamp: conv.createdAt?.toISOString() || new Date().toISOString()
      }));
  } catch (error) {
    console.error('Error getting project context:', error);
    return [];
  }
}

// Store conversation message
export async function storeConversationMessage(
  projectId: number,
  role: 'user' | 'assistant',
  content: string,
  aiProvider: 'openai' | 'claude' | 'gemini',
  metadata?: any
): Promise<void> {
  try {
    await db.insert(projectConversations).values({
      projectId,
      role,
      content,
      aiProvider,
      metadata
    });
  } catch (error) {
    console.error('Error storing conversation message:', error);
  }
}

// Generate code with project context (works with all AI providers)
export async function generateCodeWithContext(
  projectId: number,
  prompt: string,
  language: string,
  framework?: string,
  aiProvider: 'openai' | 'claude' | 'gemini' = 'openai'
): Promise<AssistantResponse> {
  try {
    // Get project info
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) {
      throw new Error('Project not found');
    }

    // Store user message
    await storeConversationMessage(projectId, 'user', prompt, aiProvider);

    // Get recent context
    const context = await getProjectContext(projectId, aiProvider, 5);
    
    let result: AssistantResponse;

    if (aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      // Initialize assistant if needed
      const { assistantId, threadId } = await initializeProjectAssistant(projectId, 'openai');
      
      if (assistantId && threadId) {
        // Use OpenAI Assistant with persistent memory
        const { generateCodeWithAssistant } = await import('./openai.js');
        result = await generateCodeWithAssistant(assistantId, threadId, prompt, language, framework);
      } else {
        // Fallback to regular OpenAI with context
        result = await generateWithContextualPrompt('openai', prompt, language, framework, context, project);
      }
    } else if (aiProvider === 'claude' && process.env.ANTHROPIC_API_KEY) {
      result = await generateWithContextualPrompt('claude', prompt, language, framework, context, project);
    } else if (aiProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      result = await generateWithContextualPrompt('gemini', prompt, language, framework, context, project);
    } else {
      throw new Error(`AI provider ${aiProvider} not available`);
    }

    // Store assistant response
    await storeConversationMessage(
      projectId, 
      'assistant', 
      `Generated code: ${result.explanation}`, 
      aiProvider,
      { code: result.code, language: result.language, framework: result.framework }
    );

    return result;
  } catch (error) {
    console.error('Error generating code with context:', error);
    throw new Error('Failed to generate code with context');
  }
}

// Generate code with contextual prompt for non-OpenAI providers
async function generateWithContextualPrompt(
  provider: 'openai' | 'claude' | 'gemini',
  prompt: string,
  language: string,
  framework: string | undefined,
  context: ConversationMessage[],
  project: any
): Promise<AssistantResponse> {
  const contextualPrompt = `Project: ${project.name}
Description: ${project.description}
Language: ${language}
Framework: ${framework || 'vanilla'}

Previous conversation context:
${context.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Current request: ${prompt}

Based on the project context and previous conversations, generate code that:
1. Integrates well with previously generated code
2. Maintains consistency with the project's architecture
3. Follows the established patterns and conventions
4. Is production-ready and well-documented

Please provide your response in JSON format with:
- code: Complete, functional code
- explanation: How this integrates with the existing project
- language: Programming language used
- framework: Framework used (if any)`;

  if (provider === 'openai') {
    const { generateCode } = await import('./openai.js');
    return await generateCode(contextualPrompt, language, framework);
  } else if (provider === 'claude') {
    const { generateCode } = await import('./anthropic.js');
    return await generateCode(contextualPrompt, language, framework);
  } else {
    // For Gemini, we'd implement similar function
    throw new Error('Gemini provider not yet implemented');
  }
}

// Get project conversation history for display
export async function getProjectConversationHistory(
  projectId: number,
  aiProvider?: 'openai' | 'claude' | 'gemini'
): Promise<ConversationMessage[]> {
  try {
    let query = db
      .select()
      .from(projectConversations)
      .where(eq(projectConversations.projectId, projectId));

    if (aiProvider) {
      query = query.where(eq(projectConversations.aiProvider, aiProvider));
    }

    const conversations = await query.orderBy(projectConversations.createdAt);

    return conversations.map(conv => ({
      role: conv.role as 'user' | 'assistant',
      content: conv.content,
      timestamp: conv.createdAt?.toISOString() || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}