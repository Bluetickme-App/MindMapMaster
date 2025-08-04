import express from "express";
import { replitAIEnhanced } from "../services/replit-ai-enhanced";
import { storage } from "../storage";
import { multiAIService } from "../services/multi-ai-provider";
import { agentOrchestrationService } from "../services/agent-orchestration";

const router = express.Router();

// Create app from natural language description (Agent)
router.post("/agent/create-app", async (req, res) => {
  try {
    const { description, userId = 1, enhancement = "ai" } = req.body;

    if (!description) {
      return res.status(400).json({ message: "App description is required" });
    }

    console.log(
      "[Replit AI Agent] Creating app from description:",
      description,
    );

    const result = await replitAIEnhanced.createAppFromDescription(
      description,
      userId,
    );

    res.json({
      success: true,
      project: result.project,
      checkpoint: result.checkpoint,
      effort: result.effort,
      cost: result.cost,
      message:
        "App created successfully! Check the project workspace to see your new application.",
    });
  } catch (error) {
    console.error("Error creating app with Agent:", error);
    res.status(500).json({
      message: "Failed to create app",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Assistant endpoints
router.post("/assistant/explain", async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res
        .status(400)
        .json({ message: "Code and language are required" });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: "explain",
      mode: "basic", // Free explanation
    });

    res.json({
      success: true,
      explanation: result.result.explanation,
      concepts: result.result.concepts,
      cost: 0, // Basic mode is free
    });
  } catch (error) {
    console.error("Error explaining code:", error);
    res.status(500).json({ message: "Failed to explain code" });
  }
});

router.post("/assistant/fix", async (req, res) => {
  try {
    const { code, language, mode = "basic" } = req.body;

    if (!code || !language) {
      return res
        .status(400)
        .json({ message: "Code and language are required" });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: "fix",
      mode,
    });

    res.json({
      success: true,
      result: result.result,
      mode,
      cost: result.cost,
    });
  } catch (error) {
    console.error("Error fixing code:", error);
    res.status(500).json({ message: "Failed to fix code" });
  }
});

router.post("/assistant/add-feature", async (req, res) => {
  try {
    const { code, language, featureDescription, mode = "basic" } = req.body;

    if (!code || !language || !featureDescription) {
      return res
        .status(400)
        .json({
          message: "Code, language, and feature description are required",
        });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: "add-feature",
      mode,
      context: { featureDescription },
    });

    res.json({
      success: true,
      result: result.result,
      mode,
      cost: result.cost,
    });
  } catch (error) {
    console.error("Error adding feature:", error);
    res.status(500).json({ message: "Failed to add feature" });
  }
});

// Usage statistics
router.get("/usage-stats/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await replitAIEnhanced.getUsageStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({ message: "Failed to get usage statistics" });
  }
});

// Get AI capabilities
router.get("/capabilities", async (req, res) => {
  res.json({
    agent: {
      features: [
        "Natural language to complete app",
        "Complex feature building",
        "Effort-based pricing",
        "Dynamic intelligence (Extended thinking & High power)",
        "Automatic checkpoints for rollback",
      ],
      pricing: {
        simple: "$0.10 - $0.20",
        moderate: "$0.30 - $0.70",
        complex: "$1.00 - $4.00",
      },
    },
    assistant: {
      basic: {
        features: [
          "Code explanation",
          "Bug identification",
          "Feature suggestions",
        ],
        cost: "Free",
      },
      advanced: {
        features: [
          "Automatic bug fixes",
          "Feature implementation",
          "Code refactoring",
        ],
        cost: "$0.05 per edit",
      },
    },
  });
});

// Roadmap generation endpoint
router.post("/roadmap/generate", async (req, res) => {
  try {
    const { description, projectId } = req.body;

    if (!description) {
      return res
        .status(400)
        .json({ message: "Project description is required" });
    }

    console.log("[Replit AI] Generating roadmap for:", description);

    // Generate roadmap with suggested agents
    const roadmapPrompt = `
    Create a detailed development roadmap for: "${description}"
    
    Generate 5-8 actionable steps that cover:
    1. Project setup and architecture
    2. UI/UX design and layout
    3. Core functionality implementation
    4. Database and API integration
    5. Testing and optimization
    6. Deployment preparation
    
    For each step, suggest which type of specialist should work on it from:
    - Developer (frontend/backend)
    - Designer (UI/UX)
    - Database specialist
    - DevOps engineer
    - QA/Testing specialist
    - AI/ML specialist
    
    Return as JSON array with this structure:
    [{
      "id": "unique-id",
      "title": "Step Title",
      "description": "Detailed description of what needs to be done",
      "suggestedAgents": ["developer", "designer"], // agent types
      "estimatedTime": "2-3 hours",
      "status": "pending",
      "progress": 0
    }]`;

    const response = await multiAIService.generateResponseWithFallback(
      roadmapPrompt,
      "You are an expert project manager creating actionable development roadmaps.",
      "openai",
    );

    // Clean the response content to handle markdown code blocks
    const cleanContent = response.content.replace(/```(?:json)?/g, "").trim();

    const roadmap = JSON.parse(cleanContent);

    res.json({
      success: true,
      roadmap,
      projectId,
    });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({
      message: "Failed to generate roadmap",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Execute roadmap with agents
router.post("/roadmap/execute", async (req, res) => {
  try {
    const { projectId, roadmap, assignedAgents } = req.body;

    console.log(
      "[Replit AI] Starting roadmap execution for project:",
      projectId,
    );

    const participantIds = Array.from(
      new Set(
        Object.values(assignedAgents)
          .flat()
          .map((agent: any) => agent.id),
      ),
    );

    // Create conversation for the project
    const conversation = await storage.createConversation({
      projectId,
      title: "Roadmap Execution",
      type: "project_discussion",
      participants: participantIds,
      createdBy: 0,
    });

    // Create agent session
    const session = await storage.createAgentSession({
      projectId,
      conversationId: conversation.id,
      participants: participantIds,
      sessionType: "roadmap-execution",
    });

    // Send roadmap steps to assigned agents
    for (const step of roadmap as any[]) {
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: 0,
        senderType: "system",
        content: `Step: ${step.title}\n${step.description}`,
        messageType: "system",
      });

      const agents = assignedAgents[step.id] || [];
      for (const agent of agents) {
        const context = {
          conversation,
          recentMessages: await storage.getMessagesByConversation(
            conversation.id,
          ),
          projectContext: { projectId },
        };

        const response = await agentOrchestrationService.generateAgentResponse(
          agent.id,
          `Please start working on: ${step.title} - ${step.description}`,
          context,
        );

        await storage.createMessage({
          conversationId: conversation.id,
          senderId: agent.id,
          senderType: "agent",
          content: response.content,
          messageType: response.messageType,
          metadata: response.metadata,
        });
      }
    }

    res.json({
      success: true,
      sessionId: session.id,
      conversationId: conversation.id,
      message: "Roadmap execution started",
    });
  } catch (error) {
    console.error("Error executing roadmap:", error);
    res.status(500).json({
      message: "Failed to start execution",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
