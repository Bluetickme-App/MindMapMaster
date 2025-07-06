import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { generateCode, debugCode } from "./services/openai";
import { GitHubService } from "./services/github";
import { agentOrchestrationService } from "./services/agent-orchestration";
import { multiAIService } from "./services/multi-ai-provider";
import { WebSocketManager, webSocketManager } from "./services/websocket-manager";
import { 
  insertCodeGenerationSchema, insertProjectSchema, insertApiTestSchema,
  insertAgentSchema, insertConversationSchema, insertMessageSchema,
  insertWorkflowTaskSchema, insertDesignAssetSchema, insertCollaborativeDocumentSchema
} from "@shared/schema";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const currentUserId = 1; // For demo purposes, using a fixed user ID

  // Code generation routes
  app.post("/api/generate-code", async (req, res) => {
    try {
      const { prompt, language, framework } = req.body;
      
      if (!prompt || !language) {
        return res.status(400).json({ message: "Prompt and language are required" });
      }

      const result = await generateCode({ prompt, language, framework });
      
      // Store the generation in storage
      await storage.createCodeGeneration({
        userId: currentUserId,
        projectId: null,
        prompt,
        language,
        framework,
        generatedCode: result.code,
      });

      res.json(result);
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate code" });
    }
  });

  app.post("/api/debug-code", async (req, res) => {
    try {
      const { code, language, error } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const result = await debugCode({ code, language, error });
      res.json(result);
    } catch (error) {
      console.error("Code debugging error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to debug code" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(currentUserId);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: currentUserId,
      });
      
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // API testing routes
  app.post("/api/test-api", async (req, res) => {
    try {
      const { method, endpoint, headers, body } = req.body;
      
      if (!method || !endpoint) {
        return res.status(400).json({ message: "Method and endpoint are required" });
      }

      const startTime = Date.now();
      
      let response;
      let statusCode = 0;
      let responseData = "";

      try {
        const axiosConfig: any = {
          method: method.toLowerCase(),
          url: endpoint,
          headers: headers || {},
          timeout: 10000,
        };

        if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
          axiosConfig.data = typeof body === 'string' ? JSON.parse(body) : body;
        }

        response = await axios(axiosConfig);
        statusCode = response.status;
        responseData = JSON.stringify(response.data, null, 2);
      } catch (error: any) {
        if (error.response) {
          statusCode = error.response.status;
          responseData = JSON.stringify(error.response.data, null, 2);
        } else {
          statusCode = 0;
          responseData = JSON.stringify({ error: error.message }, null, 2);
        }
      }

      const responseTime = Date.now() - startTime;

      // Store the API test
      await storage.createApiTest({
        userId: currentUserId,
        name: `${method} ${endpoint}`,
        method,
        endpoint,
        headers,
        body,
        response: responseData,
        statusCode,
        responseTime,
      });

      res.json({
        statusCode,
        response: responseData,
        responseTime,
      });
    } catch (error) {
      console.error("API test error:", error);
      res.status(500).json({ message: "Failed to execute API test" });
    }
  });

  app.get("/api/api-tests", async (req, res) => {
    try {
      const tests = await storage.getApiTestsByUser(currentUserId);
      res.json(tests);
    } catch (error) {
      console.error("Get API tests error:", error);
      res.status(500).json({ message: "Failed to fetch API tests" });
    }
  });

  // GitHub integration routes
  app.post("/api/github/repositories", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(400).json({ message: "GitHub token not configured" });
      }

      const githubService = new GitHubService(user.githubToken);
      const repositories = await githubService.getUserRepositories();

      // Store repositories in our storage
      for (const repo of repositories) {
        await storage.createGithubRepository({
          userId: currentUserId,
          repoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          visibility: repo.private ? "private" : "public",
        });
      }

      res.json(repositories);
    } catch (error) {
      console.error("GitHub repositories error:", error);
      res.status(500).json({ message: "Failed to fetch GitHub repositories" });
    }
  });

  app.get("/api/github/repositories", async (req, res) => {
    try {
      const repositories = await storage.getGithubRepositoriesByUser(currentUserId);
      res.json(repositories);
    } catch (error) {
      console.error("Get GitHub repositories error:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/user", async (req, res) => {
    try {
      const user = await storage.updateUser(currentUserId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // AI status endpoint
  app.get("/api/ai-status", async (req, res) => {
    try {
      const generations = await storage.getCodeGenerationsByUser(currentUserId);
      const apiTests = await storage.getApiTestsByUser(currentUserId);
      
      const totalRequests = generations.length + apiTests.length;
      const avgResponseTime = apiTests.length > 0 
        ? Math.round(apiTests.reduce((sum, test) => sum + (test.responseTime || 0), 0) / apiTests.length)
        : 0;

      res.json({
        status: "online",
        usage: Math.min(100, Math.round((totalRequests / 200) * 100)), // Mock usage percentage
        requestsToday: totalRequests,
        avgResponseTime: avgResponseTime > 0 ? avgResponseTime / 1000 : 1.2, // Convert to seconds
      });
    } catch (error) {
      console.error("AI status error:", error);
      res.status(500).json({ message: "Failed to get AI status" });
    }
  });

  // Multi-Agent System Routes
  
  // Agent management routes
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Get agents error:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Get agent error:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      res.json(agent);
    } catch (error) {
      console.error("Create agent error:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);
      res.json(agent);
    } catch (error) {
      console.error("Update agent error:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.put("/api/agents/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const agent = await storage.updateAgentStatus(id, status);
      res.json(agent);
    } catch (error) {
      console.error("Update agent status error:", error);
      res.status(500).json({ message: "Failed to update agent status" });
    }
  });

  // Conversation management routes
  app.get("/api/conversations", async (req, res) => {
    try {
      const { projectId } = req.query;
      let conversations;
      
      if (projectId) {
        conversations = await storage.getConversationsByProject(parseInt(projectId as string));
      } else {
        conversations = await storage.getConversationsByParticipant(currentUserId);
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        createdBy: currentUserId,
      });
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        senderId: currentUserId,
        senderType: "user",
      });
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Agent collaboration routes
  app.post("/api/collaborations/start", async (req, res) => {
    try {
      const { projectId, objective, requiredCapabilities } = req.body;
      
      const collaboration = await agentOrchestrationService.startCollaborationSession(
        projectId,
        objective,
        requiredCapabilities || []
      );
      
      res.json(collaboration);
    } catch (error) {
      console.error("Start collaboration error:", error);
      res.status(500).json({ message: "Failed to start collaboration" });
    }
  });

  app.get("/api/collaborations/active", async (req, res) => {
    try {
      const collaborations = agentOrchestrationService.getActiveCollaborations();
      res.json(collaborations);
    } catch (error) {
      console.error("Get active collaborations error:", error);
      res.status(500).json({ message: "Failed to fetch active collaborations" });
    }
  });

  app.post("/api/collaborations/:id/decision", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { options, criteria } = req.body;
      
      const decision = await agentOrchestrationService.makeCollaborativeDecision(
        sessionId,
        options,
        criteria
      );
      
      res.json({ decision });
    } catch (error) {
      console.error("Make decision error:", error);
      res.status(500).json({ message: "Failed to make decision" });
    }
  });

  // Multi-AI provider routes
  app.get("/api/ai-providers", async (req, res) => {
    try {
      const providers = multiAIService.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      console.error("Get AI providers error:", error);
      res.status(500).json({ message: "Failed to fetch AI providers" });
    }
  });

  app.post("/api/ai-providers/health-check", async (req, res) => {
    try {
      const health = await multiAIService.healthCheck();
      res.json(health);
    } catch (error) {
      console.error("AI provider health check error:", error);
      res.status(500).json({ message: "Failed to check AI provider health" });
    }
  });

  app.post("/api/ai-providers/generate", async (req, res) => {
    try {
      const { provider, prompt, systemPrompt, model } = req.body;
      
      const response = await multiAIService.generateResponse(
        provider,
        prompt,
        systemPrompt,
        model
      );
      
      res.json(response);
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  app.post("/api/ai-providers/consensus", async (req, res) => {
    try {
      const { prompt, systemPrompt, providers } = req.body;
      
      const consensus = await multiAIService.generateConsensusResponse(
        prompt,
        systemPrompt,
        providers
      );
      
      res.json(consensus);
    } catch (error) {
      console.error("AI consensus error:", error);
      res.status(500).json({ message: "Failed to generate consensus" });
    }
  });

  // Workflow and task management routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { projectId, agentId, status } = req.query;
      let tasks;
      
      if (projectId) {
        tasks = await storage.getWorkflowTasksByProject(parseInt(projectId as string));
      } else if (agentId) {
        tasks = await storage.getWorkflowTasksByAgent(parseInt(agentId as string));
      } else if (status) {
        tasks = await storage.getWorkflowTasksByStatus(status as string);
      } else {
        tasks = await storage.getWorkflowTasksByProject(0); // Return empty for now
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertWorkflowTaskSchema.parse(req.body);
      const task = await storage.createWorkflowTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id/assign", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { agentId } = req.body;
      const task = await storage.assignTask(taskId, agentId);
      res.json(task);
    } catch (error) {
      console.error("Assign task error:", error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });

  app.put("/api/tasks/:id/complete", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { actualHours } = req.body;
      const task = await storage.completeTask(taskId, actualHours);
      res.json(task);
    } catch (error) {
      console.error("Complete task error:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Design asset management routes
  app.get("/api/design-assets", async (req, res) => {
    try {
      const { projectId, assetType } = req.query;
      let assets: any[] = [];
      
      if (projectId) {
        assets = await storage.getDesignAssetsByProject(parseInt(projectId as string));
      } else if (assetType) {
        assets = await storage.getDesignAssetsByType(assetType as string);
      }
      
      res.json(assets);
    } catch (error) {
      console.error("Get design assets error:", error);
      res.status(500).json({ message: "Failed to fetch design assets" });
    }
  });

  app.post("/api/design-assets", async (req, res) => {
    try {
      const validatedData = insertDesignAssetSchema.parse({
        ...req.body,
        createdBy: currentUserId,
      });
      const asset = await storage.createDesignAsset(validatedData);
      res.json(asset);
    } catch (error) {
      console.error("Create design asset error:", error);
      res.status(500).json({ message: "Failed to create design asset" });
    }
  });

  app.put("/api/design-assets/:id/approve", async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.approveDesignAsset(assetId, currentUserId);
      res.json(asset);
    } catch (error) {
      console.error("Approve design asset error:", error);
      res.status(500).json({ message: "Failed to approve design asset" });
    }
  });

  // Collaborative document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { projectId } = req.query;
      let documents: any[] = [];
      
      if (projectId) {
        documents = await storage.getCollaborativeDocumentsByProject(parseInt(projectId as string));
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertCollaborativeDocumentSchema.parse({
        ...req.body,
        lastEditedBy: currentUserId,
      });
      const document = await storage.createCollaborativeDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const updateData = { ...req.body, lastEditedBy: currentUserId };
      const document = await storage.updateCollaborativeDocument(documentId, updateData);
      res.json(document);
    } catch (error) {
      console.error("Update document error:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.put("/api/documents/:id/lock", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.lockDocument(documentId, currentUserId);
      res.json(document);
    } catch (error) {
      console.error("Lock document error:", error);
      res.status(500).json({ message: "Failed to lock document" });
    }
  });

  app.put("/api/documents/:id/unlock", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.unlockDocument(documentId);
      res.json(document);
    } catch (error) {
      console.error("Unlock document error:", error);
      res.status(500).json({ message: "Failed to unlock document" });
    }
  });

  // WebSocket connection stats
  app.get("/api/websocket/stats", async (req, res) => {
    try {
      if (webSocketManager) {
        const stats = webSocketManager.getConnectionStats();
        res.json(stats);
      } else {
        res.json({ totalConnections: 0, activeConversations: 0, typingUsers: 0 });
      }
    } catch (error) {
      console.error("Get WebSocket stats error:", error);
      res.status(500).json({ message: "Failed to fetch WebSocket stats" });
    }
  });

  // Agent knowledge management
  app.get("/api/knowledge", async (req, res) => {
    try {
      const { agentId, projectId, query } = req.query;
      let knowledge: any[] = [];
      
      if (query) {
        knowledge = await storage.searchAgentKnowledge(
          query as string, 
          agentId ? parseInt(agentId as string) : undefined
        );
      } else if (agentId) {
        knowledge = await storage.getAgentKnowledgeByAgent(parseInt(agentId as string));
      } else if (projectId) {
        knowledge = await storage.getAgentKnowledgeByProject(parseInt(projectId as string));
      }
      
      res.json(knowledge);
    } catch (error) {
      console.error("Get knowledge error:", error);
      res.status(500).json({ message: "Failed to fetch knowledge" });
    }
  });

  // Enhanced code generation with multi-AI providers
  app.post("/api/generate-code-advanced", async (req, res) => {
    try {
      const { prompt, language, framework, provider, useConsensus } = req.body;
      
      if (!prompt || !language) {
        return res.status(400).json({ message: "Prompt and language are required" });
      }

      let result;
      
      if (useConsensus) {
        // Use multiple AI providers for consensus
        const consensus = await multiAIService.generateConsensusResponse(
          `Generate ${language} code for: ${prompt}${framework ? ` using ${framework}` : ''}`,
          `You are an expert ${language} developer. Generate clean, well-documented, production-ready code.`
        );
        result = {
          code: consensus.consensus,
          explanation: "Generated using multi-AI consensus",
          suggestions: ["Review the consensus from multiple AI providers", "Test thoroughly before production use"],
          providers: consensus.responses.map(r => r.provider),
          confidence: consensus.confidence
        };
      } else {
        // Use specific provider
        const response = await multiAIService.generateResponseWithFallback(
          `Generate ${language} code for: ${prompt}${framework ? ` using ${framework}` : ''}`,
          `You are an expert ${language} developer. Generate clean, well-documented, production-ready code. 
          Respond with JSON in this format:
          {
            "code": "the generated code",
            "explanation": "brief explanation of what the code does",
            "suggestions": ["array of helpful suggestions for improvement or usage"]
          }`,
          provider || "openai"
        );
        
        try {
          result = JSON.parse(response.content);
          result.provider = response.provider;
          result.confidence = response.confidence;
        } catch {
          result = {
            code: response.content,
            explanation: "Code generated successfully",
            suggestions: ["Review and test the generated code"],
            provider: response.provider,
            confidence: response.confidence
          };
        }
      }
      
      // Store the generation in storage
      await storage.createCodeGeneration({
        userId: currentUserId,
        projectId: null,
        prompt,
        language,
        framework,
        generatedCode: result.code,
      });

      res.json(result);
    } catch (error) {
      console.error("Advanced code generation error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate code" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket manager for real-time collaboration
  const wsManager = new WebSocketManager(httpServer);
  (global as any).webSocketManager = wsManager;
  
  console.log('🚀 Multi-Agent Collaboration System is ready!');
  console.log('📡 WebSocket server initialized for real-time communication');
  console.log('🤖 Access collaboration dashboard at /collaboration');
  
  return httpServer;
}
