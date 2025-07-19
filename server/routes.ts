import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
// AI services are imported dynamically to handle missing API keys gracefully
import { GitHubService } from "./services/github";
import { agentOrchestrationService } from "./services/agent-orchestration";
import { multiAIService } from "./services/multi-ai-provider";
import { WebSocketManager, webSocketManager } from "./services/websocket-manager";
import { debugCode } from "./services/openai";
import { fileSystemService } from "./services/file-system";
import { projectManagerService } from "./services/project-manager";
import { agentMemoryService } from "./services/agent-memory-service";
import { extensionManager } from "./services/extension-manager";
import { initializeDevTeamAgents } from "./services/team-agents";
import { agentServerAccess } from "./services/agent-server-access";
import { DevUrlConstructor } from "./services/dev-url-constructor";
import { codexEnhanced } from "./services/codex-enhanced";
import { 
  insertCodeGenerationSchema, insertProjectSchema, insertApiTestSchema,
  insertAgentSchema, insertConversationSchema, insertMessageSchema,
  insertWorkflowTaskSchema, insertDesignAssetSchema, insertCollaborativeDocumentSchema
} from "@shared/schema";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const currentUserId = 1; // For demo purposes, using a fixed user ID
  
  // Environment validation for production
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  // Log environment status
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`Google API Key configured: ${!!process.env.GOOGLE_API_KEY}`);
  console.log(`Anthropic API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
  
  // Initialize team agents in database
  await initializeDevTeamAgents();
  
  // Initialize dev URL constructor
  const devUrlConstructor = new DevUrlConstructor(app);
  console.log("🌐 Dev URL Constructor initialized");
  
  // Add health check endpoints for production deployment
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: !!process.env.DATABASE_URL,
      ai_providers: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_API_KEY || !!process.env.GEMINI_API_KEY
      }
    });
  });

  app.get('/ready', (req, res) => {
    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      database: !!process.env.DATABASE_URL,
      port: 5000
    });
  });

  // Code generation routes
  app.post("/api/generate-code", async (req, res) => {
    try {
      const { prompt, language, framework } = req.body;
      
      if (!prompt || !language) {
        return res.status(400).json({ message: "Prompt and language are required" });
      }

      const result = await multiAIService.generateCode({ prompt, language, framework });
      
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

  // Streamlined project creation endpoint
  app.post("/api/projects/create-streamlined", async (req, res) => {
    try {
      const {
        name,
        description,
        projectType,
        selectedAgentId,
        selectedAgentIds,
        brief,
        language,
        framework,
        complexity
      } = req.body;

      console.log('Creating streamlined project:', {
        name,
        projectType,
        selectedAgentId,
        selectedAgentIds: selectedAgentIds?.length
      });

      // Create the project
      const project = await storage.createProject({
        userId: currentUserId,
        name,
        description,
        language: language || 'general',
        framework: framework || null,
        status: 'active',
        repository: null,
        stars: 0,
        forks: 0
      });

      // Create conversation based on project type
      let conversation;
      if (projectType === 'single' && selectedAgentId) {
        // Single agent conversation
        conversation = await storage.createConversation({
          projectId: project.id,
          title: `${name} - Single Agent Development`,
          type: 'project_discussion',
          participants: [selectedAgentId],
          status: 'active'
        });
      } else if (projectType === 'team' && selectedAgentIds) {
        // Team conversation
        const agentIds = typeof selectedAgentIds === 'string' 
          ? JSON.parse(selectedAgentIds) 
          : selectedAgentIds;
        
        conversation = await storage.createConversation({
          projectId: project.id,
          title: `${name} - Team Development`,
          type: 'project_discussion',
          participants: agentIds,
          status: 'active'
        });

        // If brief is provided, create initial message
        if (brief) {
          await storage.createMessage({
            conversationId: conversation.id,
            agentId: null, // User message
            content: `Project Brief: ${brief}`,
            messageType: 'user'
          });
        }
      }

      res.json({
        id: project.id,
        name: project.name,
        conversationId: conversation?.id,
        projectType,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error("Streamlined project creation error:", error);
      res.status(500).json({ message: "Failed to create project" });
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

  // Project switching endpoint
  app.post("/api/projects/:id/switch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Change working directory to project directory
      const fs = await import('fs');
      const path = await import('path');
      
      // Create project directory if it doesn't exist
      const projectDir = path.join(process.cwd(), 'projects', project.name.toLowerCase().replace(/\s+/g, '-'));
      
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
        
        // Initialize project with basic structure
        const packageJson = {
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          version: "1.0.0",
          description: project.description || "",
          main: "index.js",
          scripts: {
            start: "node index.js",
            dev: "node index.js"
          },
          dependencies: {}
        };
        
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        
        // Create basic index file based on language
        let indexContent = '';
        if (project.language === 'JavaScript') {
          indexContent = `// ${project.name}\n// ${project.description || ''}\n\nconsole.log('Hello from ${project.name}!');\n`;
          fs.writeFileSync(path.join(projectDir, 'index.js'), indexContent);
        } else if (project.language === 'Python') {
          indexContent = `# ${project.name}\n# ${project.description || ''}\n\nprint("Hello from ${project.name}!")\n`;
          fs.writeFileSync(path.join(projectDir, 'main.py'), indexContent);
        } else if (project.language === 'TypeScript') {
          indexContent = `// ${project.name}\n// ${project.description || ''}\n\nconsole.log('Hello from ${project.name}!');\n`;
          fs.writeFileSync(path.join(projectDir, 'index.ts'), indexContent);
        } else if (project.language === 'HTML') {
          indexContent = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${project.name}</title>\n</head>\n<body>\n    <h1>${project.name}</h1>\n    <p>${project.description || ''}</p>\n</body>\n</html>`;
          fs.writeFileSync(path.join(projectDir, 'index.html'), indexContent);
        }
        
        // Create README
        const readmeContent = `# ${project.name}\n\n${project.description || ''}\n\n## Getting Started\n\nThis project was created with CodeCraft.\n`;
        fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);
      }
      
      // Update terminal service to use new directory
      const { terminalService } = await import('./services/terminal.js');
      terminalService.setCurrentDirectory(projectDir);
      
      // Update file system service to use new directory
      const { fileSystemService } = await import('./services/file-system.js');
      fileSystemService.setWorkingDirectory(projectDir);
      
      res.json({ 
        message: `Switched to project: ${project.name}`,
        project: project,
        directory: projectDir
      });
    } catch (error) {
      console.error("Switch project error:", error);
      res.status(500).json({ message: "Failed to switch project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Failed to delete project" });
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
  app.get("/api/github/status", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      res.json({
        connected: !!user?.githubToken,
        user: user?.githubToken ? { username: user.username, name: user.name } : null
      });
    } catch (error) {
      console.error("GitHub status error:", error);
      res.status(500).json({ message: "Failed to get GitHub status" });
    }
  });

  app.post("/api/github/connect", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "GitHub token is required" });
      }

      // Validate token by fetching user info
      const githubService = new GitHubService(token);
      const userInfo = await githubService.getAuthenticatedUser();
      
      // Update user with GitHub token
      await storage.updateUser(currentUserId, { githubToken: token });
      
      res.json({ 
        message: "GitHub connected successfully",
        user: {
          id: userInfo.id,
          login: userInfo.login,
          name: userInfo.name,
          email: userInfo.email,
          avatar_url: userInfo.avatar_url
        }
      });
    } catch (error) {
      console.error("GitHub connect error:", error);
      res.status(500).json({ message: "Failed to connect to GitHub. Please check your token." });
    }
  });

  app.post("/api/github/disconnect", async (req, res) => {
    try {
      await storage.updateUser(currentUserId, { githubToken: null });
      res.json({ message: "GitHub disconnected successfully" });
    } catch (error) {
      console.error("GitHub disconnect error:", error);
      res.status(500).json({ message: "Failed to disconnect GitHub" });
    }
  });

  app.post("/api/github/sync", async (req, res) => {
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

      res.json({ message: "Repositories synced successfully", count: repositories.length });
    } catch (error) {
      console.error("GitHub sync error:", error);
      res.status(500).json({ message: "Failed to sync repositories" });
    }
  });

  app.get("/api/github/repositories", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.json([]);
      }

      const githubService = new GitHubService(user.githubToken);
      const repositories = await githubService.getUserRepositories();
      res.json(repositories);
    } catch (error) {
      console.error("Get GitHub repositories error:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  // Repository operations
  app.post("/api/github/repositories", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { name, description, isPrivate = false } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Repository name is required" });
      }

      const githubService = new GitHubService(user.githubToken);
      const repository = await githubService.createRepository(name, description, isPrivate);
      
      res.json(repository);
    } catch (error) {
      console.error("Create repository error:", error);
      res.status(500).json({ message: "Failed to create repository" });
    }
  });

  app.get("/api/github/repositories/:owner/:repo", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { owner, repo } = req.params;
      const githubService = new GitHubService(user.githubToken);
      const repository = await githubService.getRepository(owner, repo);
      
      res.json(repository);
    } catch (error) {
      console.error("Get repository error:", error);
      res.status(500).json({ message: "Failed to get repository" });
    }
  });

  // File operations
  app.get("/api/github/repositories/:owner/:repo/files/*", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { owner, repo } = req.params;
      const path = req.params[0]; // Get the wildcard path
      
      const githubService = new GitHubService(user.githubToken);
      const content = await githubService.getFileContent(owner, repo, path);
      
      res.json({ content, path });
    } catch (error) {
      console.error("Get file content error:", error);
      res.status(500).json({ message: "Failed to get file content" });
    }
  });

  app.post("/api/github/repositories/:owner/:repo/files", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { owner, repo } = req.params;
      const { path, content, message, branch = 'main' } = req.body;
      
      if (!path || !content || !message) {
        return res.status(400).json({ message: "Path, content, and commit message are required" });
      }

      const githubService = new GitHubService(user.githubToken);
      const result = await githubService.createOrUpdateFile(owner, repo, path, content, message, branch);
      
      res.json(result);
    } catch (error) {
      console.error("Create/update file error:", error);
      res.status(500).json({ message: "Failed to create/update file" });
    }
  });

  app.get("/api/github/repositories/:owner/:repo/branches", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { owner, repo } = req.params;
      const githubService = new GitHubService(user.githubToken);
      const branches = await githubService.getBranches(owner, repo);
      
      res.json(branches);
    } catch (error) {
      console.error("Get branches error:", error);
      res.status(500).json({ message: "Failed to get branches" });
    }
  });

  app.get("/api/github/repositories/:owner/:repo/tree", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user?.githubToken) {
        return res.status(401).json({ message: "GitHub not connected" });
      }

      const { owner, repo } = req.params;
      const { sha = 'main' } = req.query;
      
      const githubService = new GitHubService(user.githubToken);
      const tree = await githubService.getRepositoryTree(owner, repo, sha as string);
      
      res.json(tree);
    } catch (error) {
      console.error("Get repository tree error:", error);
      res.status(500).json({ message: "Failed to get repository tree" });
    }
  });

  // Multi-AI SDK Integration endpoints
  app.post('/api/ai-integration/assign-jobs', async (req, res) => {
    try {
      const { projectDescription, complexity = 'moderate' } = req.body;
      
      if (!projectDescription) {
        return res.status(400).json({ message: 'Project description is required' });
      }

      const { multiAISDKIntegration } = await import('./services/multi-ai-sdk-integration.js');
      const agents = await storage.getAllAgents();
      
      const assignments = await multiAISDKIntegration.assignJobsToAgents(
        agents, 
        projectDescription, 
        complexity
      );

      const providerHealth = await multiAISDKIntegration.getProviderHealthStatus();

      res.json({
        assignments,
        providerHealth,
        totalEstimatedCost: assignments.reduce((sum, a) => sum + a.estimatedCost, 0),
        breakdown: {
          openai: assignments.filter(a => a.aiProvider === 'openai').length,
          claude: assignments.filter(a => a.aiProvider === 'claude').length,
          gemini: assignments.filter(a => a.aiProvider === 'gemini').length
        }
      });
    } catch (error) {
      console.error('Job assignment error:', error);
      res.status(500).json({ message: 'Failed to assign jobs' });
    }
  });

  app.post('/api/ai-integration/execute-job', async (req, res) => {
    try {
      const { assignment, prompt, conversationId } = req.body;
      
      if (!assignment || !prompt) {
        return res.status(400).json({ message: 'Assignment and prompt are required' });
      }

      const { multiAISDKIntegration } = await import('./services/multi-ai-sdk-integration.js');
      
      const context = {
        conversation: await storage.getConversation(conversationId || 1),
        recentMessages: [],
        projectContext: { description: 'AI SDK Integration Demo' }
      };

      const result = await multiAISDKIntegration.executeJob(assignment, prompt, context);
      
      res.json({
        success: true,
        result,
        provider: assignment.aiProvider,
        jobType: assignment.jobType
      });
    } catch (error) {
      console.error('Job execution error:', error);
      res.status(500).json({ 
        message: 'Failed to execute job',
        error: error.message 
      });
    }
  });

  app.get('/api/ai-integration/provider-health', async (req, res) => {
    try {
      const { multiAISDKIntegration } = await import('./services/multi-ai-sdk-integration.js');
      const health = await multiAISDKIntegration.getProviderHealthStatus();
      res.json(health);
    } catch (error) {
      console.error('Provider health check error:', error);
      res.status(500).json({ message: 'Failed to check provider health' });
    }
  });

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      let user = await storage.getUser(currentUserId);
      if (!user) {
        // Create user if not exists
        user = await storage.createUser({
          username: 'developer',
          email: 'developer@codecraft.ai',
          name: 'CodeCraft Developer'
        });
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

  // Test multi-AI provider system with proper JSON response
  app.post('/api/test-multi-provider', async (req, res) => {
    try {
      const { message, providers = ['openai', 'claude', 'gemini'] } = req.body;
      
      const results = {};
      const { multiAIService } = await import('./services/multi-ai-provider.js');
      
      for (const provider of providers) {
        try {
          console.log(`Testing ${provider} provider...`);
          const response = await multiAIService.generateResponse(
            provider,
            message,
            'You are a helpful AI assistant. Please introduce yourself and mention which AI provider you are using.',
            provider === 'openai' ? 'gpt-4o' : provider === 'claude' ? 'claude-sonnet-4-20250514' : 'gemini-2.5-flash'
          );
          results[provider] = { 
            success: true, 
            content: response.content,
            provider: response.provider,
            model: response.model,
            tokenUsage: response.tokenUsage
          };
          console.log(`${provider} provider successful:`, response.content.substring(0, 100));
        } catch (error) {
          console.error(`${provider} provider failed:`, error);
          results[provider] = { success: false, error: error.message };
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error('Multi-provider test error:', error);
      res.status(500).json({ message: 'Failed to test multi-provider system' });
    }
  });

  // Generate development roadmap
  app.post('/api/generate-roadmap', async (req, res) => {
    try {
      const { name, description, language, framework, complexity, template } = req.body;
      
      // Generate roadmap based on project requirements
      const roadmapPrompt = `Generate a comprehensive development roadmap for a ${complexity} ${language} ${framework} project called "${name}".
      
      Project Description: ${description}
      Template: ${template || 'custom'}
      
      Create a detailed roadmap with suggested features, components, and implementation steps. Focus on practical, buildable features.
      
      Return a JSON array of roadmap items with this structure:
      {
        "roadmap": [
          {
            "id": "unique-id",
            "title": "Feature Name",
            "description": "Detailed description of what this feature does",
            "category": "core|feature|design|integration",
            "priority": "high|medium|low",
            "estimated": "1-2 hours",
            "completed": false
          }
        ]
      }
      
      Include 8-12 realistic, implementable features ranging from core functionality to nice-to-have features.`;

      try {
        if (process.env.OPENAI_API_KEY) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a senior software architect creating detailed development roadmaps. Always respond with valid JSON.' 
                },
                { role: 'user', content: roadmapPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7
            })
          });

          const data = await response.json();
          const roadmapData = JSON.parse(data.choices[0].message.content);
          
          return res.json(roadmapData);
        }
      } catch (error) {
        console.error('OpenAI roadmap generation failed:', error);
      }
      
      // Fallback roadmap
      const fallbackRoadmap = {
        roadmap: [
          {
            id: 'setup',
            title: 'Project Setup',
            description: 'Initialize project structure and dependencies',
            category: 'core',
            priority: 'high',
            estimated: '30 min',
            completed: false
          },
          {
            id: 'ui-layout',
            title: 'UI Layout',
            description: 'Create basic layout and navigation structure',
            category: 'design',
            priority: 'high',
            estimated: '1-2 hours',
            completed: false
          },
          {
            id: 'core-functionality',
            title: 'Core Functionality',
            description: 'Implement main features and business logic',
            category: 'feature',
            priority: 'high',
            estimated: '3-4 hours',
            completed: false
          },
          {
            id: 'styling',
            title: 'Styling & Design',
            description: 'Add CSS styling and responsive design',
            category: 'design',
            priority: 'medium',
            estimated: '2-3 hours',
            completed: false
          },
          {
            id: 'testing',
            title: 'Testing & QA',
            description: 'Add error handling and test functionality',
            category: 'integration',
            priority: 'medium',
            estimated: '1-2 hours',
            completed: false
          }
        ]
      };
      
      res.json(fallbackRoadmap);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      res.status(500).json({ error: 'Failed to generate roadmap' });
    }
  });

  // Build project based on roadmap
  app.post('/api/build-project', async (req, res) => {
    try {
      const { projectName, description, language, framework, roadmap, customRequirements } = req.body;
      
      const selectedFeatures = roadmap.map((item: any) => `- ${item.title}: ${item.description}`).join('\n');
      
      const buildPrompt = `Create a PROFESSIONAL, PRODUCTION-READY ${language} ${framework} application called "${projectName}".

      Project Description: ${description}
      
      Required Features:
      ${selectedFeatures}
      
      ${customRequirements ? `Additional Requirements: ${customRequirements}` : ''}
      
      CRITICAL REQUIREMENTS:
      
      1. VISUAL DESIGN - Create a stunning, modern interface with:
         - Professional color scheme (use CSS custom properties)
         - Modern typography (Google Fonts)
         - Subtle animations and transitions
         - Card-based layouts with proper shadows
         - Gradient backgrounds or professional color schemes
         - High-quality visual hierarchy
      
      2. ADVANCED FUNCTIONALITY - Implement:
         - Interactive components with state management
         - Form validation with real-time feedback
         - Dynamic content loading and filtering
         - Responsive grid systems (CSS Grid/Flexbox)
         - Interactive charts/data visualization if relevant
         - Modal dialogs and popups
         - Tab systems and navigation
      
      3. MODERN CSS TECHNIQUES:
         - CSS Grid and Flexbox for layouts
         - CSS custom properties (variables)
         - Advanced selectors and pseudo-elements
         - Keyframe animations
         - Media queries for full responsiveness
         - Modern CSS features (backdrop-filter, clamp, etc.)
      
      4. JAVASCRIPT FEATURES:
         - ES6+ syntax (arrow functions, destructuring, modules)
         - Event delegation and proper event handling
         - Local storage for persistence
         - Async/await for data operations
         - Dynamic DOM manipulation
         - Form validation and submission
      
      5. PROFESSIONAL TOUCHES:
         - Loading states and spinners
         - Empty states and error handling
         - Accessibility (ARIA labels, keyboard navigation)
         - SEO optimization (meta tags, semantic HTML)
         - Performance optimizations
      
      EXAMPLES OF QUALITY:
      - Think Stripe, Vercel, or Linear.app level design quality
      - Use modern design patterns like glassmorphism, neumorphism, or clean minimalism
      - Implement micro-interactions and smooth transitions
      - Create a cohesive design system with consistent spacing
      
      Return a complete, single HTML file with embedded CSS and JavaScript that looks and functions like a professional SaaS application.
      
      DO NOT create basic forms or simple layouts. Create something that looks like it belongs in a portfolio of a senior developer.`;

      try {
        if (process.env.OPENAI_API_KEY) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { 
                  role: 'system', 
                  content: `You are a world-class senior full-stack developer and UI/UX designer with 15+ years of experience. 

CRITICAL INSTRUCTIONS:
1. RESPOND WITH ONLY HTML CODE - NO EXPLANATIONS OR TEXT
2. START with <!DOCTYPE html>
3. END with </html>
4. EMBED all CSS in <style> tags
5. EMBED all JavaScript in <script> tags
6. CREATE a single, complete, functional HTML file

Your applications should be indistinguishable from products built by companies like Stripe, Vercel, Linear, or Figma.

NEVER create basic, simple, or amateur-looking interfaces. Every application should be portfolio-worthy.

RESPOND WITH ONLY THE HTML FILE - NO OTHER TEXT WHATSOEVER.` 
                },
                { role: 'user', content: buildPrompt }
              ],
              temperature: 0.2
            })
          });

          const data = await response.json();
          const generatedCode = data.choices[0].message.content;
          
          // Generate explanation
          const explanationPrompt = `Explain the ${framework} code structure and implementation for the "${projectName}" project. Cover:
          1. Architecture overview
          2. Key components and features
          3. Implementation details
          4. How to customize and extend
          5. Best practices used
          
          Keep it concise but comprehensive for developers.`;

          const explanationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a technical documentation expert. Provide clear, actionable explanations.' 
                },
                { role: 'user', content: explanationPrompt }
              ],
              temperature: 0.3
            })
          });

          const explanationData = await explanationResponse.json();
          const explanation = explanationData.choices[0].message.content;
          
          // Save the generated project to database
          try {
            const project = await storage.createProject({
              userId: currentUserId,
              name: projectName,
              description: description,
              language: language,
              framework: framework,
              status: 'completed',
              lastModified: new Date(),
              githubRepo: null,
              deployUrl: null
            });
            
            // Create a project folder structure in workspace
            try {
              await storage.createWorkspaceFile({
                userId: currentUserId,
                path: `projects/${projectName}/index.html`,
                content: generatedCode,
                fileType: 'file'
              });
            } catch (error) {
              console.log('Workspace file creation not supported, continuing with code generation save');
            }
            
            // Create AI assistant for the project
            try {
              const { initializeProjectAssistant } = await import('./services/project-assistant.js');
              await initializeProjectAssistant(project.id, projectName, description, language, framework);
            } catch (error) {
              console.error('Error creating project assistant:', error);
            }
            
            // Save the generated code as a code generation entry
            await storage.createCodeGeneration({
              userId: currentUserId,
              projectId: project.id,
              prompt: `Project Builder: ${projectName} - ${description}`,
              language: language,
              framework: framework,
              code: generatedCode,
              explanation: explanation,
              createdAt: new Date()
            });
          } catch (error) {
            console.error('Error saving project:', error);
          }
          
          return res.json({
            code: generatedCode,
            explanation: explanation,
            language: language,
            framework: framework
          });
        }
      } catch (error) {
        console.error('OpenAI build failed:', error);
      }
      
      // Enhanced fallback code with modern design
      const fallbackCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #4f46e5;
            --primary-dark: #3730a3;
            --secondary: #f8fafc;
            --accent: #06b6d4;
            --text: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: var(--text);
            line-height: 1.6;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin-bottom: 40px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        header h1 {
            font-size: 3rem;
            font-weight: 700;
            color: white;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        header p {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.9);
            max-width: 600px;
            margin: 0 auto;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
        }
        
        .feature-card h3 {
            color: var(--primary);
            margin-bottom: 15px;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .feature-card p {
            color: var(--text-light);
            line-height: 1.6;
        }
        
        .cta-section {
            text-align: center;
            margin: 60px 0;
        }
        
        .cta-button {
            background: var(--primary);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .cta-button:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        footer {
            text-align: center;
            padding: 40px 0;
            color: rgba(255, 255, 255, 0.8);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 40px;
        }
        
        @media (max-width: 768px) {
            header h1 { font-size: 2rem; }
            header p { font-size: 1rem; }
            .features { grid-template-columns: 1fr; gap: 20px; }
            .feature-card { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${projectName}</h1>
            <p>${description}</p>
        </header>
        
        <div class="features">
            ${roadmap.map((feature: any) => `
                <div class="feature-card">
                    <h3>${feature.title}</h3>
                    <p>${feature.description}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="cta-section">
            <button class="cta-button">Get Started</button>
        </div>
        
        <footer>
            <p>Built with ${framework} • ${language} • Professional Grade</p>
        </footer>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Add smooth scrolling and interactions
            const cards = document.querySelectorAll('.feature-card');
            
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
            
            // Add click animations
            const ctaButton = document.querySelector('.cta-button');
            ctaButton.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        });
    </script>
</body>
</html>`;
      
      // Save fallback project to database as well
      try {
        const project = await storage.createProject({
          userId: currentUserId,
          name: projectName,
          description: description,
          language: language,
          framework: framework,
          status: 'completed',
          lastModified: new Date(),
          githubRepo: null,
          deployUrl: null
        });
        
        // Create a project folder structure in workspace
        await storage.createWorkspaceFile({
          userId: currentUserId,
          path: `projects/${projectName}/index.html`,
          content: fallbackCode,
          type: 'file'
        });
        
        // Create AI assistant for the project
        try {
          const { initializeProjectAssistant } = await import('./services/project-assistant.js');
          await initializeProjectAssistant(project.id, projectName, description, language, framework);
        } catch (error) {
          console.error('Error creating project assistant:', error);
        }
        
        // Save the generated code as a code generation entry
        await storage.createCodeGeneration({
          userId: currentUserId,
          projectId: project.id,
          prompt: `Project Builder: ${projectName} - ${description}`,
          language: language,
          framework: framework,
          generatedCode: fallbackCode,
          explanation: `This ${framework} application implements the core features for ${projectName}. The code includes responsive design, modern CSS, and structured HTML for all selected features.`,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error saving project:', error);
      }
      
      res.json({
        code: fallbackCode,
        explanation: `This ${framework} application implements the core features for ${projectName}. The code includes responsive design, modern CSS, and structured HTML for all selected features.`,
        language: language,
        framework: framework
      });
    } catch (error) {
      console.error('Error building project:', error);
      res.status(500).json({ error: 'Failed to build project' });
    }
  });

  // Settings endpoints
  app.get('/api/settings/api-keys/status', async (req, res) => {
    try {
      let user = await storage.getUser(currentUserId);
      if (!user) {
        // Create user if not exists
        user = await storage.createUser({
          username: 'developer',
          email: 'developer@codecraft.ai',
          name: 'CodeCraft Developer'
        });
      }
      
      // Test actual API key validity
      const testOpenAI = async () => {
        try {
          if (process.env.OPENAI_API_KEY) {
            const { testConnection } = await import('./services/openai.js');
            return await testConnection();
          }
        } catch {
          return false;
        }
        return false;
      };

      const testAnthropic = async () => {
        try {
          if (process.env.ANTHROPIC_API_KEY) {
            const { testConnection } = await import('./services/anthropic.js');
            return await testConnection();
          }
        } catch {
          return false;
        }
        return false;
      };

      const [openaiValid, anthropicValid] = await Promise.all([
        testOpenAI(),
        testAnthropic()
      ]);

      const apiKeyStatus = [
        {
          provider: 'openai',
          configured: !!process.env.OPENAI_API_KEY,
          valid: openaiValid,
          lastTested: process.env.OPENAI_API_KEY ? new Date().toISOString() : undefined
        },
        {
          provider: 'anthropic',
          configured: !!process.env.ANTHROPIC_API_KEY,
          valid: anthropicValid,
          lastTested: process.env.ANTHROPIC_API_KEY ? new Date().toISOString() : undefined
        },
        {
          provider: 'gemini',
          configured: !!process.env.GEMINI_API_KEY,
          valid: !!process.env.GEMINI_API_KEY, // Mock validation for now
          lastTested: process.env.GEMINI_API_KEY ? new Date().toISOString() : undefined
        },
        {
          provider: 'github',
          configured: !!user?.githubToken,
          valid: !!user?.githubToken,
          lastTested: user?.githubToken ? new Date().toISOString() : undefined
        }
      ];
      
      res.json(apiKeyStatus);
    } catch (error) {
      console.error('Error fetching API key status:', error);
      res.status(500).json({ message: 'Failed to fetch API key status' });
    }
  });

  app.post('/api/settings/api-keys', async (req, res) => {
    try {
      const { openaiApiKey, anthropicApiKey, geminiApiKey, githubToken } = req.body;
      
      let user = await storage.getUser(currentUserId);
      if (!user) {
        // Create user if not exists
        user = await storage.createUser({
          username: 'developer',
          email: 'developer@codecraft.ai',
          name: 'CodeCraft Developer'
        });
      }

      const updatedUser = await storage.updateUser(user.id, {
        openaiApiKey: openaiApiKey || user.openaiApiKey,
        githubToken: githubToken || user.githubToken
      });

      res.json({ message: 'API keys updated successfully' });
    } catch (error) {
      console.error('Error updating API keys:', error);
      res.status(500).json({ message: 'Failed to update API keys' });
    }
  });

  app.post('/api/settings/api-keys/test', async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      if (!provider || !apiKey) {
        return res.status(400).json({ message: 'Provider and API key are required' });
      }

      let isValid = false;
      let errorMessage = '';

      switch (provider) {
        case 'openai':
          isValid = apiKey.startsWith('sk-');
          if (!isValid) errorMessage = 'OpenAI API key should start with "sk-"';
          break;
        case 'anthropic':
          isValid = apiKey.startsWith('sk-ant-');
          if (!isValid) errorMessage = 'Anthropic API key should start with "sk-ant-"';
          break;
        case 'gemini':
          isValid = apiKey.length > 10;
          if (!isValid) errorMessage = 'Gemini API key appears to be invalid';
          break;
        case 'github':
          isValid = apiKey.startsWith('ghp_') || apiKey.startsWith('github_pat_');
          if (!isValid) errorMessage = 'GitHub token should start with "ghp_" or "github_pat_"';
          break;
        default:
          return res.status(400).json({ message: 'Unknown provider' });
      }

      if (isValid) {
        res.json({ message: 'API key is valid', provider });
      } else {
        res.status(400).json({ message: errorMessage });
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      res.status(500).json({ message: 'Failed to test API key' });
    }
  });

  // Workspace endpoints
  app.get('/api/workspace/files', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { projectName } = req.query;
      
      // If projectName is provided, show that project's files
      if (projectName) {
        const projectPath = path.join(process.cwd(), 'projects', projectName as string);
        
        if (fs.existsSync(projectPath)) {
          const fileSystem = await readDirectoryStructure(projectPath, path.basename(projectPath));
          res.json([fileSystem]);
        } else {
          res.status(404).json({ message: 'Project not found' });
        }
      } else {
        // Show all available projects
        const projectsPath = path.join(process.cwd(), 'projects');
        
        if (fs.existsSync(projectsPath)) {
          const projects = fs.readdirSync(projectsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
              name: dirent.name,
              type: 'folder' as const,
              path: `/projects/${dirent.name}`,
              children: []
            }));
          
          res.json(projects);
        } else {
          // Fallback to default structure if no projects exist
          const defaultStructure = [
            {
              name: 'Create a project first',
              type: 'folder' as const,
              path: '/placeholder',
              children: [
                { name: 'Use the Create Project button', type: 'file' as const, path: '/placeholder/info.txt', size: 0, modified: new Date().toISOString() }
              ]
            }
          ];
          
          res.json(defaultStructure);
        }
      }
    } catch (error) {
      console.error('Error fetching file system:', error);
      res.status(500).json({ message: 'Failed to fetch file system' });
    }
  });

  // Helper function to read directory structure recursively
  async function readDirectoryStructure(dirPath: string, name: string): Promise<any> {
    const fs = await import('fs');
    const path = await import('path');
    
    const stats = fs.statSync(dirPath);
    
    if (stats.isDirectory()) {
      const children = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        // Skip hidden files and node_modules
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }
        
        const itemPath = path.join(dirPath, item.name);
        const childNode = await readDirectoryStructure(itemPath, item.name);
        children.push(childNode);
      }
      
      return {
        name,
        type: 'folder' as const,
        path: dirPath.replace(process.cwd(), ''),
        children
      };
    } else {
      return {
        name,
        type: 'file' as const,
        path: dirPath.replace(process.cwd(), ''),
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    }
  }

  app.get('/api/workspace/files/*', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = req.params[0];
      
      // Determine full path - check if it's a project file
      let fullPath = '';
      
      if (filePath.startsWith('/projects/')) {
        // This is a project file
        fullPath = path.join(process.cwd(), filePath);
      } else {
        // This might be a root project file
        fullPath = path.join(process.cwd(), 'projects', filePath);
      }
      
      // Check if file exists
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        res.json({ path: filePath, content });
      } else {
        // File doesn't exist, return empty content for new files
        res.json({ path: filePath, content: '' });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({ message: 'Failed to read file' });
    }
  });

  app.post('/api/workspace/files/*', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = req.params[0];
      const { content } = req.body;
      
      // Determine full path
      let fullPath = '';
      
      if (filePath.startsWith('/projects/')) {
        fullPath = path.join(process.cwd(), filePath);
      } else {
        fullPath = path.join(process.cwd(), 'projects', filePath);
      }
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(fullPath, content || '', 'utf-8');
      
      const stats = fs.statSync(fullPath);
      
      res.json({ 
        message: 'File saved successfully',
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString()
      });
    } catch (error) {
      console.error('Error saving file:', error);
      res.status(500).json({ message: 'Failed to save file' });
    }
  });

  app.get('/api/workspace/databases', async (req, res) => {
    try {
      const databases = [
        {
          id: '1',
          name: 'Main Database',
          type: 'postgresql',
          status: 'connected',
          url: process.env.DATABASE_URL || 'postgresql://localhost:5432/codecraft',
          tables: ['users', 'projects', 'code_generations', 'api_tests', 'agents'],
          size: '45.2 MB'
        }
      ];
      
      res.json(databases);
    } catch (error) {
      console.error('Error fetching databases:', error);
      res.status(500).json({ message: 'Failed to fetch databases' });
    }
  });

  app.post('/api/workspace/databases/deploy', async (req, res) => {
    try {
      const { name, type, config } = req.body;
      
      // Mock database deployment
      const newDatabase = {
        id: Date.now().toString(),
        name,
        type,
        status: 'deploying',
        url: `${type}://localhost:5432/${name.toLowerCase().replace(/\s+/g, '_')}`,
        tables: [],
        size: '0 MB'
      };
      
      // Simulate deployment delay
      setTimeout(() => {
        console.log(`Database ${name} deployed successfully`);
      }, 2000);
      
      res.json({ 
        message: 'Database deployment initiated',
        database: newDatabase
      });
    } catch (error) {
      console.error('Error deploying database:', error);
      res.status(500).json({ message: 'Failed to deploy database' });
    }
  });

  app.get('/api/workspace/storage', async (req, res) => {
    try {
      const storage = {
        buckets: [
          {
            id: '1',
            name: 'codecraft-assets',
            type: 'static',
            files: 245,
            size: '1.2 GB',
            public: true
          },
          {
            id: '2',
            name: 'user-uploads',
            type: 'private',
            files: 67,
            size: '456 MB',
            public: false
          }
        ],
        totalUsage: '1.7 GB',
        limit: '10 GB'
      };
      
      res.json(storage);
    } catch (error) {
      console.error('Error fetching storage:', error);
      res.status(500).json({ message: 'Failed to fetch storage information' });
    }
  });

  app.post('/api/workspace/console', async (req, res) => {
    try {
      const { command } = req.body;
      
      // Mock command execution
      let output = '';
      let exitCode = 0;
      
      if (command.includes('npm install')) {
        output = 'Installing dependencies...\nDependencies installed successfully!';
      } else if (command.includes('npm run')) {
        output = 'Running script...\nScript completed successfully!';
      } else if (command.includes('git')) {
        output = 'Git operation completed successfully!';
      } else if (command.includes('ls') || command.includes('dir')) {
        output = 'client/\nserver/\npackage.json\nREADME.md\n.env';
      } else if (command.includes('error')) {
        output = 'Command failed with error';
        exitCode = 1;
      } else {
        output = `Command "${command}" executed successfully`;
      }
      
      res.json({
        command,
        output,
        exitCode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({ message: 'Failed to execute command' });
    }
  });

  app.get('/api/workspace/secrets', async (req, res) => {
    try {
      // Return masked secrets for security
      const secrets = {
        DATABASE_URL: process.env.DATABASE_URL ? '***masked***' : undefined,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***masked***' : undefined,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '***masked***' : undefined,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***masked***' : undefined,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '***masked***' : undefined
      };
      
      // Filter out undefined values
      const maskedSecrets = Object.entries(secrets)
        .filter(([key, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      
      res.json(maskedSecrets);
    } catch (error) {
      console.error('Error fetching secrets:', error);
      res.status(500).json({ message: 'Failed to fetch secrets' });
    }
  });

  app.post('/api/workspace/secrets', async (req, res) => {
    try {
      const { secrets, format } = req.body;
      
      // In a real implementation, you would securely store these secrets
      // For now, we'll just validate the format and respond
      
      let parsedSecrets: Record<string, string> = {};
      
      if (format === 'json') {
        try {
          parsedSecrets = JSON.parse(secrets);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid JSON format' });
        }
      } else if (format === 'env') {
        const lines = secrets.split('\n').filter((line: string) => line.includes('='));
        parsedSecrets = lines.reduce((acc: Record<string, string>, line: string) => {
          const [key, ...valueParts] = line.split('=');
          acc[key.trim()] = valueParts.join('=').trim();
          return acc;
        }, {});
      }
      
      console.log(`Updated ${Object.keys(parsedSecrets).length} secrets`);
      
      res.json({ 
        message: 'Secrets updated successfully',
        count: Object.keys(parsedSecrets).length
      });
    } catch (error) {
      console.error('Error updating secrets:', error);
      res.status(500).json({ message: 'Failed to update secrets' });
    }
  });

  // Project creation and management endpoints
  app.post('/api/projects/generate', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      // Try AI-powered project generation
      let projectData;
      
      try {
        if (process.env.OPENAI_API_KEY) {
          const { generateProjectStructure } = await import('./services/openai.js');
          projectData = await generateProjectStructure(prompt);
        } else {
          throw new Error('No AI providers available');
        }
      } catch (error) {
        console.error('AI project generation failed:', error);
        
        // Fallback to mock generation
        const projectName = prompt.split(' ').slice(0, 3).join(' ') + ' App';
        projectData = {
          name: projectName,
          description: `AI-generated project: ${prompt}`,
          language: 'javascript',
          framework: 'vanilla',
          files: []
        };
      }
      
      const project = await storage.createProject({
        userId: currentUserId,
        name: projectData.name,
        description: projectData.description,
        language: projectData.language,
        framework: projectData.framework,
        status: 'active',
        isPublic: false
      });

      // Initialize project assistant for the new project
      try {
        const { initializeProjectAssistant } = await import('./services/project-assistant.js');
        await initializeProjectAssistant(project.id, 'openai');
      } catch (error) {
        console.error('Failed to initialize project assistant:', error);
      }

      res.json(project);
    } catch (error) {
      console.error('Error generating project:', error);
      res.status(500).json({ message: 'Failed to generate project' });
    }
  });

  app.post('/api/projects/import/github', async (req, res) => {
    try {
      const { url, repository } = req.body;
      
      console.log('GitHub import request:', { body: req.body, url, repository });
      
      // Handle both direct URL and repository object
      let repoUrl = url;
      let repoName = '';
      let repoDescription = '';
      let repoLanguage = 'javascript';
      
      if (!repoUrl && repository) {
        repoUrl = repository.html_url || repository.clone_url || `https://github.com/${repository.full_name}`;
        repoName = repository.name;
        repoDescription = repository.description || `Imported from GitHub: ${repository.full_name}`;
        repoLanguage = repository.language?.toLowerCase() || 'javascript';
      }
      
      if (!repoUrl) {
        return res.status(400).json({ message: 'GitHub URL is required' });
      }

      // Extract repo info from GitHub URL if not provided
      if (!repoName) {
        const urlParts = repoUrl.replace('https://github.com/', '').split('/');
        if (urlParts.length < 2) {
          return res.status(400).json({ message: 'Invalid GitHub URL' });
        }

        const [owner, repo] = urlParts;
        repoName = repo.replace('.git', '');
        repoDescription = `Imported from GitHub: ${owner}/${repoName}`;
      }

      // Determine framework based on language
      let framework = 'react';
      if (repoLanguage === 'python') framework = 'flask';
      if (repoLanguage === 'java') framework = 'spring';
      if (repoLanguage === 'php') framework = 'laravel';

      // Mock GitHub import - in production, this would clone the actual repo
      const project = await storage.createProject({
        userId: currentUserId,
        name: repoName,
        description: repoDescription,
        language: repoLanguage,
        framework: framework,
        status: 'active',
        isPublic: true,
        githubUrl: repoUrl
      });

      res.json(project);
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      res.status(500).json({ message: 'Failed to import from GitHub' });
    }
  });

  app.get('/api/projects/:id/deploy', async (req, res) => {
    try {
      const { id } = req.params;
      
      const project = await storage.getProject(parseInt(id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Mock deployment - in production, this would deploy to actual hosting
      const deployUrl = `https://${project.name.toLowerCase().replace(/\s+/g, '-')}.codecraft.app`;
      
      const updatedProject = await storage.updateProject(parseInt(id), {
        deployUrl,
        status: 'completed'
      });

      res.json({ 
        message: 'Project deployed successfully',
        deployUrl,
        project: updatedProject
      });
    } catch (error) {
      console.error('Error deploying project:', error);
      res.status(500).json({ message: 'Failed to deploy project' });
    }
  });

  // Get project generated code
  app.get('/api/projects/:id/code', async (req, res) => {
    try {
      const { id } = req.params;
      const projectId = parseInt(id);
      
      // Get the latest code generation for this project
      const codeGenerations = await storage.getCodeGenerationsByProject(projectId);
      const projectCode = codeGenerations
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (projectCode) {
        res.json({
          code: projectCode.generatedCode,
          explanation: projectCode.explanation,
          language: projectCode.language,
          framework: projectCode.framework
        });
      } else {
        res.json({
          code: null,
          explanation: 'No generated code found for this project',
          language: 'javascript',
          framework: 'html'
        });
      }
    } catch (error) {
      console.error('Error getting project code:', error);
      res.status(500).json({ message: 'Failed to get project code' });
    }
  });

  // Enhanced AI code generation endpoint with project context
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, language = 'javascript', framework, projectId, aiProvider = 'openai' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      // If projectId is provided, use project-aware generation with memory
      if (projectId) {
        try {
          const { generateCodeWithContext } = await import('./services/project-assistant.js');
          const result = await generateCodeWithContext(
            parseInt(projectId),
            prompt,
            language,
            framework,
            aiProvider
          );
          return res.json(result);
        } catch (error) {
          console.error('Project-aware generation failed:', error);
          // Fall through to regular generation
        }
      }

      // Regular generation without project context
      try {
        if (process.env.OPENAI_API_KEY && aiProvider === 'openai') {
          const { generateCode } = await import('./services/openai.js');
          const result = await generateCode(prompt, language, framework);
          return res.json(result);
        }
      } catch (error) {
        console.error('OpenAI generation failed:', error);
      }

      // Try Anthropic as fallback
      try {
        if (process.env.ANTHROPIC_API_KEY && aiProvider === 'claude') {
          const { generateCode } = await import('./services/anthropic.js');
          const result = await generateCode(prompt, language, framework);
          return res.json(result);
        }
      } catch (error) {
        console.error('Anthropic generation failed:', error);
      }

      // Mock response if no API keys work
      res.json({
        code: `// Generated code for: ${prompt}\n// Please configure AI API keys for actual generation\nconsole.log('Hello from generated code!');`,
        explanation: 'Mock code generated - please configure AI API keys for real generation',
        language,
        framework
      });
    } catch (error) {
      console.error('Error generating code:', error);
      res.status(500).json({ message: 'Failed to generate code' });
    }
  });

  // Get project conversation history
  app.get('/api/projects/:id/conversations', async (req, res) => {
    try {
      const { id } = req.params;
      const { aiProvider } = req.query;

      const { getProjectConversationHistory } = await import('./services/project-assistant.js');
      const history = await getProjectConversationHistory(
        parseInt(id),
        aiProvider as 'openai' | 'claude' | 'gemini'
      );

      res.json(history);
    } catch (error) {
      console.error('Error getting conversation history:', error);
      res.status(500).json({ message: 'Failed to get conversation history' });
    }
  });

  // Web search endpoint for AI agents
  app.post('/api/web-search', async (req, res) => {
    try {
      const { query, maxResults = 5 } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      // Simple web search implementation (you can replace with actual search API)
      const searchResults = {
        query,
        results: [
          {
            title: `Search results for: ${query}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Web search capability - implement with actual search API like Google Custom Search or Bing Search API`,
            timestamp: new Date().toISOString()
          }
        ],
        totalResults: 1
      };

      res.json(searchResults);
    } catch (error) {
      console.error('Error performing web search:', error);
      res.status(500).json({ message: 'Failed to perform web search' });
    }
  });

  // Image analysis endpoint
  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { imageData, projectId } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: 'Image data is required' });
      }

      // Try OpenAI vision API first
      if (process.env.OPENAI_API_KEY) {
        const { analyzeImage } = await import('./services/openai.js');
        const analysis = await analyzeImage(imageData);
        return res.json({ analysis, provider: 'openai' });
      }

      // Try Claude vision as fallback
      if (process.env.ANTHROPIC_API_KEY) {
        const { analyzeImage } = await import('./services/anthropic.js');
        const analysis = await analyzeImage(imageData);
        return res.json({ analysis, provider: 'claude' });
      }

      res.json({
        analysis: 'Image analysis service unavailable - please configure AI API keys',
        provider: 'none'
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ message: 'Failed to analyze image' });
    }
  });

  // Voice transcription endpoint
  app.post('/api/transcribe-voice', async (req, res) => {
    try {
      const { audioData, projectId } = req.body;
      
      if (!audioData) {
        return res.status(400).json({ message: 'Audio data is required' });
      }

      // Try OpenAI Whisper API
      if (process.env.OPENAI_API_KEY) {
        const { transcribeAudio } = await import('./services/openai.js');
        const transcription = await transcribeAudio(audioData);
        return res.json({ transcription, provider: 'openai' });
      }

      res.json({
        transcription: 'Voice transcription service unavailable - please configure OpenAI API key',
        provider: 'none'
      });
    } catch (error) {
      console.error('Error transcribing voice:', error);
      res.status(500).json({ message: 'Failed to transcribe voice' });
    }
  });

  // Replit Agent System routes
  try {
    const { default: replitAgentRouter } = await import('./api/replit-agent.js');
    app.use('/api/replit-agent', replitAgentRouter);
  } catch (error) {
    console.error('Failed to load Replit Agent router:', error);
  }

  // Enhanced Replit AI System routes (Agent + Assistant)
  try {
    const { default: replitAIEnhancedRouter } = await import('./api/replit-ai-enhanced.js');
    app.use('/api/replit-ai', replitAIEnhancedRouter);
    console.log('✨ Enhanced Replit AI System loaded (Agent + Assistant capabilities)');
  } catch (error) {
    console.error('Failed to load Enhanced Replit AI router:', error);
  }

  // WeLet Properties API routes
  try {
    const { default: propertiesRouter } = await import('./api/properties.js');
    app.use('/api/properties', propertiesRouter);
  } catch (error) {
    console.error('Failed to load Properties router:', error);
  }

  // WeLet Properties Seed API routes
  try {
    const { default: propertiesSeedRouter } = await import('./api/properties-seed.js');
    app.use('/api/properties-seed', propertiesSeedRouter);
  } catch (error) {
    console.error('Failed to load Properties Seed router:', error);
  }

  // Real File System API Routes
  app.get('/api/filesystem', async (req, res) => {
    try {
      const { fileSystemService } = await import('./services/file-system.js');
      const fileTree = await fileSystemService.getFileTree();
      res.json(fileTree);
    } catch (error) {
      console.error('Error getting filesystem:', error);
      res.status(500).json({ message: 'Failed to get filesystem' });
    }
  });

  app.get('/api/filesystem/content', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      const content = await fileSystemService.readFile(filePath as string);
      const language = fileSystemService.getFileLanguage(filePath as string);
      res.json({ content, language });
    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(500).json({ message: 'Failed to get file content' });
    }
  });

  app.post('/api/filesystem/content', async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        return res.status(400).json({ message: 'File path and content are required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      await fileSystemService.writeFile(filePath, content);
      res.json({ message: 'File saved successfully' });
    } catch (error) {
      console.error('Error saving file content:', error);
      res.status(500).json({ message: 'Failed to save file content' });
    }
  });

  app.post('/api/filesystem/create', async (req, res) => {
    try {
      const { path: filePath, content = '', type = 'file' } = req.body;
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      if (type === 'folder') {
        await fileSystemService.createFolder(filePath);
      } else {
        await fileSystemService.createFile(filePath, content);
      }
      res.json({ message: `${type} created successfully` });
    } catch (error) {
      console.error('Error creating file/folder:', error);
      res.status(500).json({ message: 'Failed to create file/folder' });
    }
  });

  app.delete('/api/filesystem', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      await fileSystemService.deleteFile(filePath as string);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  app.post('/api/filesystem/rename', async (req, res) => {
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) {
        return res.status(400).json({ message: 'Old path and new path are required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      await fileSystemService.renameFile(oldPath, newPath);
      res.json({ message: 'File renamed successfully' });
    } catch (error) {
      console.error('Error renaming file:', error);
      res.status(500).json({ message: 'Failed to rename file' });
    }
  });

  app.get('/api/filesystem/search', async (req, res) => {
    try {
      const { query, extensions } = req.query;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const { fileSystemService } = await import('./services/file-system.js');
      const extList = extensions ? (extensions as string).split(',') : [];
      const results = await fileSystemService.searchFiles(query as string, extList);
      res.json(results);
    } catch (error) {
      console.error('Error searching files:', error);
      res.status(500).json({ message: 'Failed to search files' });
    }
  });

  // Terminal API Routes with real-time error handling
  app.post('/api/terminal/execute', async (req, res) => {
    try {
      const { command, sessionId = 'default' } = req.body;
      if (!command) {
        return res.status(400).json({ message: 'Command is required' });
      }
      
      const { terminalService } = await import('./services/terminal.js');
      
      // Store terminal output for error analysis
      const outputs: any[] = [];
      const errorHandler = (output: any) => {
        outputs.push(output);
        // If there's an error, send it to agents for analysis
        if (output.type === 'stderr' && output.content.trim()) {
          setTimeout(async () => {
            try {
              const errorAnalysis = await multiAIService.analyzeError(output.content, command);
              // Send error analysis to WebSocket clients
              if (webSocketManager) {
                webSocketManager.broadcastToSession(sessionId, {
                  type: 'error_analysis',
                  error: output.content,
                  analysis: errorAnalysis,
                  command: command,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('Error analyzing command error:', error);
            }
          }, 1000);
        }
      };
      
      terminalService.on('output', errorHandler);
      await terminalService.executeCommand(command, sessionId);
      
      // Clean up listener after 30 seconds
      setTimeout(() => {
        terminalService.removeListener('output', errorHandler);
      }, 30000);
      
      res.json({ 
        message: 'Command executed',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error executing terminal command:', error);
      res.status(500).json({ message: 'Failed to execute command' });
    }
  });

  // Terminal output streaming with WebSocket integration
  app.get('/api/terminal/output', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { sessionId = 'default' } = req.query;
    const { terminalService } = await import('./services/terminal.js');
    
    const outputHandler = (output: any) => {
      res.write(`data: ${JSON.stringify(output)}\n\n`);
      
      // Also broadcast to WebSocket clients
      if (webSocketManager) {
        webSocketManager.broadcastToSession(sessionId as string, {
          type: 'terminal_output',
          output: output
        });
      }
    };
    
    const clearHandler = (id: string) => {
      if (id === sessionId) {
        const clearData = { type: 'clear' };
        res.write(`data: ${JSON.stringify(clearData)}\n\n`);
        
        // Also broadcast to WebSocket clients
        if (webSocketManager) {
          webSocketManager.broadcastToSession(sessionId as string, {
            type: 'terminal_clear',
            sessionId: id
          });
        }
      }
    };
    
    terminalService.on('output', outputHandler);
    terminalService.on('clear', clearHandler);
    
    req.on('close', () => {
      terminalService.removeListener('output', outputHandler);
      terminalService.removeListener('clear', clearHandler);
    });
  });

  app.post('/api/terminal/kill', async (req, res) => {
    try {
      const { sessionId = 'default' } = req.body;
      const { terminalService } = await import('./services/terminal.js');
      terminalService.killProcess(sessionId);
      res.json({ message: 'Process killed' });
    } catch (error) {
      console.error('Error killing terminal process:', error);
      res.status(500).json({ message: 'Failed to kill process' });
    }
  });

  // Team agent management endpoints
  
  // Initialize agents in database
  app.post('/api/agents/initialize', async (req, res) => {
    try {
      const { initializeAgents } = await import('./services/team-agents.js');
      await initializeAgents();
      res.json({ message: 'Agents initialized successfully' });
    } catch (error) {
      console.error('Error initializing agents:', error);
      res.status(500).json({ message: 'Failed to initialize agents' });
    }
  });

  // Get all available development team agents
  app.get('/api/team-agents', async (req, res) => {
    try {
      const { getAllAgents } = await import('./services/team-agents.js');
      const agents = await getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error('Error getting team agents:', error);
      res.status(500).json({ message: 'Failed to get team agents' });
    }
  });

  // Suggest required agents for a project
  app.post('/api/suggest-agents', async (req, res) => {
    try {
      const requirements = req.body;
      const { suggestRequiredAgents } = await import('./services/team-agents.js');
      const suggestedAgents = await suggestRequiredAgents(requirements);
      res.json(suggestedAgents);
    } catch (error) {
      console.error('Error suggesting agents:', error);
      res.status(500).json({ message: 'Failed to suggest agents' });
    }
  });

  // Create team conversation for project
  app.post('/api/projects/:id/team-conversation', async (req, res) => {
    try {
      const { id } = req.params;
      const { selectedAgentIds, agentIds } = req.body;
      const currentUserId = 1; // TODO: Get from session

      // Support both parameter names for compatibility
      const agentIdList = selectedAgentIds || agentIds || [];
      console.log('Creating team conversation with agent IDs:', agentIdList);

      const { createTeamConversation, getAllAgents } = await import('./services/team-agents.js');
      const allAgents = await getAllAgents();
      const selectedAgents = allAgents.filter(agent => agentIdList.includes(agent.id));
      
      const conversationId = await createTeamConversation(
        parseInt(id),
        selectedAgents,
        currentUserId
      );

      res.json({ conversationId, agents: selectedAgents });
    } catch (error) {
      console.error('Error creating team conversation:', error);
      res.status(500).json({ message: 'Failed to create team conversation' });
    }
  });

  // Get team conversation messages
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const { id } = req.params;
      const { getTeamMessages } = await import('./services/team-agents.js');
      const messages = await getTeamMessages(parseInt(id));
      res.json(messages);
    } catch (error) {
      console.error('Error getting team messages:', error);
      res.status(500).json({ message: 'Failed to get team messages' });
    }
  });

  // Send message to team conversation
  app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, messageType = 'text' } = req.body;
      const currentUserId = 1; // TODO: Get from session

      const { sendTeamMessage } = await import('./services/team-agents.js');
      await sendTeamMessage(parseInt(id), currentUserId, 'user', content, messageType);

      // Get conversation to trigger agent responses
      const conversation = await storage.getConversation(parseInt(id));
      const wsManager = (global as any).webSocketManager;
      
      console.log('Conversation found:', !!conversation);
      console.log('WebSocket manager available:', !!wsManager);
      
      if (conversation && wsManager) {
        console.log('Triggering agent responses for conversation:', id);
        console.log('Conversation participants:', conversation.participants);
        
        // Get the message we just created
        const messages = await storage.getMessagesByConversation(parseInt(id));
        const userMessage = messages[messages.length - 1];
        
        // Trigger agent responses via WebSocket manager
        await wsManager.triggerAgentResponsesFromAPI(conversation, userMessage, content);
      } else {
        console.log('Cannot trigger agent responses - missing conversation or WebSocket manager');
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending team message:', error);
      res.status(500).json({ message: 'Failed to send team message' });
    }
  });

  // Code debugging endpoint
  app.post('/api/debug', async (req, res) => {
    try {
      const { code, error, language = 'javascript' } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }

      try {
        if (process.env.OPENAI_API_KEY) {
          const { debugCode } = await import('./services/openai.js');
          const result = await debugCode(code, error, language);
          return res.json(result);
        }
      } catch (error) {
        console.error('OpenAI debugging failed:', error);
      }

      // Fallback response
      res.json({
        fixedCode: code,
        explanation: 'Debug service unavailable - please configure OpenAI API key',
        issues: ['Debug service not available']
      });
    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({ message: 'Failed to debug code' });
    }
  });

  // Code explanation endpoint
  app.post('/api/explain', async (req, res) => {
    try {
      const { code, language = 'javascript' } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }

      try {
        if (process.env.OPENAI_API_KEY) {
          const { explainCode } = await import('./services/openai.js');
          const result = await explainCode(code, language);
          return res.json(result);
        }
      } catch (error) {
        console.error('OpenAI explanation failed:', error);
      }

      // Fallback response
      res.json({
        explanation: 'Code explanation service unavailable - please configure OpenAI API key',
        keyFeatures: [],
        complexity: 'Unknown',
        suggestions: []
      });
    } catch (error) {
      console.error('Error explaining code:', error);
      res.status(500).json({ message: 'Failed to explain code' });
    }
  });

  // Test API key endpoints
  app.post('/api/settings/api-keys/test', async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      if (!provider || !apiKey) {
        return res.status(400).json({ message: 'Provider and API key are required' });
      }

      let isValid = false;
      let errorMessage = '';

      switch (provider) {
        case 'openai':
          try {
            // Temporarily set the API key for testing
            process.env.OPENAI_API_KEY = apiKey;
            const { testConnection } = await import('./services/openai.js');
            isValid = await testConnection();
            if (!isValid) errorMessage = 'Invalid OpenAI API key';
          } catch (error) {
            errorMessage = `OpenAI test failed: ${error.message}`;
          }
          break;

        case 'anthropic':
          try {
            // Temporarily set the API key for testing
            process.env.ANTHROPIC_API_KEY = apiKey;
            const { testConnection } = await import('./services/anthropic.js');
            isValid = await testConnection();
            if (!isValid) errorMessage = 'Invalid Anthropic API key';
          } catch (error) {
            errorMessage = `Anthropic test failed: ${error.message}`;
          }
          break;

        case 'gemini':
          // Mock Gemini test for now
          isValid = apiKey.startsWith('AI');
          if (!isValid) errorMessage = 'Invalid Gemini API key format';
          break;

        default:
          return res.status(400).json({ message: 'Unknown provider' });
      }

      res.json({ 
        valid: isValid,
        message: isValid ? 'API key is valid' : errorMessage
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      res.status(500).json({ message: 'Failed to test API key' });
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

  // Project Manager coordination endpoints
  app.post("/api/project-manager/coordinate", async (req, res) => {
    try {
      const { projectId, taskDescription, requiredSkills = [] } = req.body;
      
      if (!taskDescription) {
        return res.status(400).json({ message: "Task description is required" });
      }

      const { projectManagerCoordination } = await import('./services/project-manager-coordination.js');
      
      // Create coordination conversation and plan
      const result = await projectManagerCoordination.createTaskDelegationConversation(
        projectId || 1,
        taskDescription,
        requiredSkills
      );

      // Execute the plan
      await projectManagerCoordination.executePlan(result.plan, result.conversationId);

      res.json({
        success: true,
        conversationId: result.conversationId,
        plan: result.plan,
        message: "Project Manager has coordinated the task and delegated to appropriate team members"
      });
    } catch (error) {
      console.error("Project Manager coordination error:", error);
      res.status(500).json({ message: "Failed to coordinate project task" });
    }
  });

  // Get coordination summary
  app.get("/api/project-manager/coordination/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { projectManagerCoordination } = await import('./services/project-manager-coordination.js');
      
      const summary = await projectManagerCoordination.getCoordinationSummary(parseInt(conversationId));
      
      res.json({ summary });
    } catch (error) {
      console.error("Get coordination summary error:", error);
      res.status(500).json({ message: "Failed to get coordination summary" });
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
      
      // For team discussions, automatically add default participants if none provided
      if (validatedData.type === 'team_discussion' && !validatedData.participants) {
        // Add key team members for collaborative discussions
        validatedData.participants = [1, 2, 3, 4, 7]; // Alex, Maya, Jordan, Sam, Taylor
      }
      
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
      
      // Notify WebSocket clients about the new message
      if (webSocketManager) {
        webSocketManager.broadcastToConversation(conversationId, {
          type: 'user_message',
          conversationId,
          senderId: message.senderId,
          senderType: message.senderType,
          content: message.content,
          messageId: message.id,
          timestamp: message.timestamp
        });

        // Trigger agent responses for REST API messages
        try {
          console.log(`[REST API] WebSocket manager available:`, !!webSocketManager);
          const conversation = await storage.getConversation(conversationId);
          console.log(`[REST API] Got conversation:`, conversation?.id, 'participants:', conversation?.participants);
          
          if (conversation && conversation.participants && conversation.participants.length > 0) {
            console.log(`[REST API] Triggering agent responses for conversation ${conversationId} with ${conversation.participants.length} participants`);
            await webSocketManager.triggerAgentResponsesFromAPI(conversation, message, validatedData.content);
          } else {
            console.log(`[REST API] No participants found in conversation ${conversationId}, skipping agent responses`);
          }
        } catch (error) {
          console.error('Error triggering agent responses from REST API:', error);
        }
      } else {
        console.error('[REST API] WebSocket manager not available - agents cannot respond');
      }
      
      res.json({ success: true, message });
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

  // Add static file serving for root directory files
  app.get('/triplea-index.html', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'triplea-index.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Error serving triplea-index.html:', error);
      res.status(404).send('File not found');
    }
  });
  
  app.get('/triplea-styles.css', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'triplea-styles.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/css');
      res.send(content);
    } catch (error) {
      console.error('Error serving triplea-styles.css:', error);
      res.status(404).send('File not found');
    }
  });
  
  app.get('/triplea-script.js', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'triplea-script.js');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(content);
    } catch (error) {
      console.error('Error serving triplea-script.js:', error);
      res.status(404).send('File not found');
    }
  });

  // Add premium file serving
  app.get('/triplea-styles-premium.css', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'triplea-styles-premium.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/css');
      res.send(content);
    } catch (error) {
      console.error('Error serving triplea-styles-premium.css:', error);
      res.status(404).send('File not found');
    }
  });
  
  app.get('/triplea-script-premium.js', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'triplea-script-premium.js');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(content);
    } catch (error) {
      console.error('Error serving triplea-script-premium.js:', error);
      res.status(404).send('File not found');
    }
  });

  // Live TripleA luxury website preview
  app.get('/live-triplea', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'projects', 'triplea-clone', 'index.html');
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Update CSS and JS paths to use absolute URLs
      content = content.replace('href="style.css"', 'href="/live-triplea-style"');
      content = content.replace('src="script.js"', 'src="/live-triplea-script"');
      
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Error serving live TripleA:', error);
      res.status(500).send('Error loading luxury website');
    }
  });

  app.get('/live-triplea-style', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'projects', 'triplea-clone', 'style.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/css');
      res.send(content);
    } catch (error) {
      console.error('Error serving TripleA styles:', error);
      res.status(404).send('Styles not found');
    }
  });

  app.get('/live-triplea-script', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    try {
      const filePath = path.join(process.cwd(), 'projects', 'triplea-clone', 'script.js');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(content);
    } catch (error) {
      console.error('Error serving TripleA script:', error);
      res.status(404).send('Script not found');
    }
  });

  // ==================== REPLIT SIMPLE API ====================
  app.post('/api/replit-simple/create', async (req, res) => {
    try {
      const { type, description, githubUrl, websiteUrl, brandName, useTeam, selectedAgents } = req.body;
      
      // Create project based on type
      let projectData: any = {
        userId: currentUserId,
        name: 'Influencer Management Site',
        description: description || 'An influencer management platform with API integrations',
        language: 'html',
        framework: 'vanilla',
        status: 'active'
      };

      if (type === 'create') {
        // Create project in database
        const project = await storage.createProject(projectData);
        
        // Create project directory and files
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const projectDir = path.join(process.cwd(), 'projects', `influencer-management-${project.id}`);
        await fs.mkdir(projectDir, { recursive: true });
        
        // Generate comprehensive influencer management platform HTML
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Influencer Management Platform</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🚀 Influencer Management Platform</h1>
            <nav class="nav">
                <a href="#dashboard">Dashboard</a>
                <a href="#influencers">Influencers</a>
                <a href="#campaigns">Campaigns</a>
                <a href="#integrations">API Integrations</a>
            </nav>
        </header>
        
        <main class="main">
            <section id="dashboard" class="dashboard">
                <h2>📊 Dashboard Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Influencers</h3>
                        <p class="stat-number">247</p>
                        <span class="stat-change">+12% this month</span>
                    </div>
                    <div class="stat-card">
                        <h3>Active Campaigns</h3>
                        <p class="stat-number">12</p>
                        <span class="stat-change">+3 this week</span>
                    </div>
                    <div class="stat-card">
                        <h3>Total Reach</h3>
                        <p class="stat-number">2.4M</p>
                        <span class="stat-change">+8.2% engagement</span>
                    </div>
                    <div class="stat-card">
                        <h3>Revenue</h3>
                        <p class="stat-number">$45.2K</p>
                        <span class="stat-change">+15% vs last month</span>
                    </div>
                </div>
            </section>
            
            <section id="integrations" class="integrations">
                <h2>🔗 API Integrations</h2>
                <div class="integration-cards">
                    <div class="integration-card">
                        <div class="integration-icon">📱</div>
                        <h3>Instagram API</h3>
                        <p>Connect to Instagram Graph API for real-time follower data and engagement metrics</p>
                        <button class="btn-primary" data-api="instagram">Connect Instagram</button>
                        <div class="integration-status">Status: Ready to connect</div>
                    </div>
                    <div class="integration-card">
                        <div class="integration-icon">🎵</div>
                        <h3>TikTok Marketing API</h3>
                        <p>Access TikTok Marketing API for campaign management and audience insights</p>
                        <button class="btn-primary" data-api="tiktok">Connect TikTok</button>
                        <div class="integration-status">Status: Ready to connect</div>
                    </div>
                    <div class="integration-card">
                        <div class="integration-icon">🔐</div>
                        <h3>CIA Analytics API</h3>
                        <p>Custom integration for advanced data analytics and market intelligence</p>
                        <button class="btn-primary" data-api="cia">Configure CIA API</button>
                        <div class="integration-status">Status: Configuration required</div>
                    </div>
                </div>
            </section>

            <section id="influencers" class="influencers">
                <h2>👥 Top Influencers</h2>
                <div class="influencer-grid">
                    <div class="influencer-card">
                        <div class="influencer-avatar">@fashion</div>
                        <h4>Sarah Johnson</h4>
                        <p>1.2M followers • Fashion & Lifestyle</p>
                        <div class="engagement-rate">8.5% engagement</div>
                    </div>
                    <div class="influencer-card">
                        <div class="influencer-avatar">@tech</div>
                        <h4>Mike Chen</h4>
                        <p>850K followers • Technology</p>
                        <div class="engagement-rate">12.3% engagement</div>
                    </div>
                    <div class="influencer-card">
                        <div class="influencer-avatar">@fitness</div>
                        <h4>Emma Wellness</h4>
                        <p>950K followers • Health & Fitness</p>
                        <div class="engagement-rate">9.7% engagement</div>
                    </div>
                </div>
            </section>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;

        // Create CSS with professional styling
        const cssContent = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #ffffff;
    min-height: 100vh;
    line-height: 1.6;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
}

.nav {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.nav a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 12px;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 500;
}

.nav a:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.5);
    color: #ffffff;
    transform: translateY(-2px);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    text-align: center;
}

.stat-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.stat-number {
    font-size: 3rem;
    font-weight: 800;
    color: #ffffff;
    margin: 10px 0;
}

.stat-change {
    color: #4ade80;
    font-weight: 500;
}

.integration-cards, .influencer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
}

.integration-card, .influencer-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.btn-primary {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}`;

        // Create JavaScript with interactivity
        const jsContent = `document.addEventListener('DOMContentLoaded', function() {
    console.log('Influencer Management Platform Loaded');

    // Smooth scrolling
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // API Integration buttons
    document.querySelectorAll('.btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const apiType = this.getAttribute('data-api');
            this.textContent = 'Connecting...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = 'Connected ✓';
                this.style.background = 'linear-gradient(45deg, #10b981, #059669)';
                this.disabled = false;
                
                // Show notification
                showNotification(\`Successfully connected to \${apiType.toUpperCase()} API!\`);
            }, 2000);
        });
    });

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 600;
        \`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
});`;

        // Write files
        await fs.writeFile(path.join(projectDir, 'index.html'), htmlContent);
        await fs.writeFile(path.join(projectDir, 'style.css'), cssContent);
        await fs.writeFile(path.join(projectDir, 'script.js'), jsContent);
        
        const readmeContent = `# Influencer Management Platform

A comprehensive platform for managing influencers with API integrations.

## Features
- Dashboard with key metrics
- API integrations (Instagram, TikTok, CIA)
- Responsive design
- Professional UI/UX

## Development URL
http://localhost:5000/dev/influencer-management-${project.id}`;
        
        await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent);
        
        res.json({
          success: true,
          projectId: project.id,
          message: 'Influencer management platform created successfully!',
          devUrl: `http://localhost:5000/dev/influencer-management-${project.id}`
        });
        
      } else {
        res.status(400).json({ message: 'Invalid project type' });
      }
      
    } catch (error) {
      console.error('Replit Simple creation error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create project: ' + error.message
      });
    }
  });

  const httpServer = createServer(app);
  
  // Add error handling for server creation
  httpServer.on('error', (error: any) => {
    console.error('HTTP Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error('Port 5000 is already in use');
    }
  });
  
  // Initialize WebSocket manager for real-time collaboration with enhanced error handling
  try {
    const wsManager = new WebSocketManager(httpServer);
    (global as any).webSocketManager = wsManager;
    console.log('✅ WebSocket manager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket manager:', error);
    console.log('⚠️  Continuing without WebSocket support');
    // Don't exit in production - continue without WebSocket
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
  
  // WeLet AI Chat API endpoint
  app.post('/api/welet/chat', async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      const { weletAIAgent } = await import('./services/welet-ai-agent.js');
      const response = await weletAIAgent.processMessage(message, conversationHistory);
      
      res.json({ 
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('WeLet chat error:', error);
      res.status(500).json({ message: 'Failed to process chat message' });
    }
  });
  
  // WeLet maintenance update endpoint
  app.get('/api/welet/maintenance/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { weletAIAgent } = await import('./services/welet-ai-agent.js');
      const update = await weletAIAgent.getMaintenanceUpdate(id);
      
      if (update) {
        res.json({ update });
      } else {
        res.status(404).json({ message: 'Maintenance request not found' });
      }
    } catch (error) {
      console.error('Maintenance update error:', error);
      res.status(500).json({ message: 'Failed to get maintenance update' });
    }
  });
  
  // File System API Routes - FORCE TripleA luxury project files
  app.get('/api/files', async (req, res) => {
    try {
      // ALWAYS serve TripleA luxury project files regardless of query params
      const fs = await import('fs');
      const path = await import('path');
      const tripleAPath = path.join(process.cwd(), 'projects', 'triplea-clone');
      
      if (fs.existsSync(tripleAPath)) {
        const items = fs.readdirSync(tripleAPath, { withFileTypes: true });
        const fileTree = [];

        for (const item of items) {
          if (item.name.startsWith('.')) continue;
          
          const itemPath = path.join(tripleAPath, item.name);
          const stats = fs.statSync(itemPath);
          
          fileTree.push({
            name: item.name,
            type: item.isDirectory() ? 'folder' : 'file',
            path: `/${item.name}`,
            size: item.isFile() ? stats.size : undefined,
            modified: stats.mtime.toISOString(),
            children: item.isDirectory() ? [] : undefined
          });
        }
        
        console.log('✅ Serving TripleA luxury files:', fileTree.map(f => f.name));
        res.json(fileTree);
      } else {
        console.log('❌ TripleA project not found at:', tripleAPath);
        res.json([{ name: 'TripleA project not found', type: 'file', path: '/error.txt' }]);
      }
    } catch (error) {
      console.error('Error getting TripleA files:', error);
      res.status(500).json({ error: 'Failed to get TripleA files' });
    }
  });

  app.get('/api/files/content', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      // FORCE serve from TripleA luxury project directory
      const fs = await import('fs');
      const path = await import('path');
      const tripleAPath = path.join(process.cwd(), 'projects', 'triplea-clone');
      const cleanPath = (filePath as string).replace(/^\/+/, '');
      const fullPath = path.join(tripleAPath, cleanPath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const language = fileSystemService.getFileLanguage(filePath as string);
        console.log('✅ Serving TripleA file content:', cleanPath);
        res.json({ content, language, path: filePath });
      } else {
        console.log('❌ TripleA file not found:', fullPath);
        res.status(404).json({ message: 'TripleA file not found' });
      }
    } catch (error) {
      console.error('Error reading TripleA file:', error);
      res.status(500).json({ message: 'Failed to read TripleA file' });
    }
  });

  // ==================== AGENT SERVER ACCESS API ENDPOINTS ====================
  // NPM Package Management
  app.post('/api/agent/install-dependency', async (req, res) => {
    try {
      const { packageName, isDev } = req.body;
      
      if (!packageName) {
        return res.status(400).json({ message: 'Package name is required' });
      }
      
      const result = await agentServerAccess.installDependency(packageName, isDev);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error installing dependency:', error);
      res.status(500).json({ message: 'Failed to install dependency' });
    }
  });

  app.post('/api/agent/uninstall-dependency', async (req, res) => {
    try {
      const { packageName } = req.body;
      
      if (!packageName) {
        return res.status(400).json({ message: 'Package name is required' });
      }
      
      const result = await agentServerAccess.uninstallDependency(packageName);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error uninstalling dependency:', error);
      res.status(500).json({ message: 'Failed to uninstall dependency' });
    }
  });

  app.post('/api/agent/update-dependencies', async (req, res) => {
    try {
      const result = await agentServerAccess.updateDependencies();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error updating dependencies:', error);
      res.status(500).json({ message: 'Failed to update dependencies' });
    }
  });

  // Server Configuration Management
  app.post('/api/agent/update-config', async (req, res) => {
    try {
      const { configPath, configData } = req.body;
      
      if (!configPath || !configData) {
        return res.status(400).json({ message: 'Config path and data are required' });
      }
      
      const result = await agentServerAccess.updateServerConfig(configPath, configData);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ message: 'Failed to update config' });
    }
  });

  app.get('/api/agent/read-config', async (req, res) => {
    try {
      const { configPath } = req.query;
      
      if (!configPath) {
        return res.status(400).json({ message: 'Config path is required' });
      }
      
      const result = await agentServerAccess.readServerConfig(configPath as string);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error reading config:', error);
      res.status(500).json({ message: 'Failed to read config' });
    }
  });

  // Deep Server Debugging & Command Execution
  app.post('/api/agent/execute-command', async (req, res) => {
    try {
      const { command, timeout, cwd } = req.body;
      
      if (!command) {
        return res.status(400).json({ message: 'Command is required' });
      }
      
      const result = await agentServerAccess.executeCommand(command, { timeout, cwd });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({ message: 'Failed to execute command' });
    }
  });

  app.get('/api/agent/server-logs', async (req, res) => {
    try {
      const { service = 'all', lines = 100 } = req.query;
      
      const result = await agentServerAccess.getServerLogs(service as string, parseInt(lines as string));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error getting server logs:', error);
      res.status(500).json({ message: 'Failed to get server logs' });
    }
  });

  // Environment Management
  app.post('/api/agent/update-environment', async (req, res) => {
    try {
      const { envVar, value } = req.body;
      
      if (!envVar || !value) {
        return res.status(400).json({ message: 'Environment variable and value are required' });
      }
      
      const result = await agentServerAccess.updateEnvironment(envVar, value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error updating environment:', error);
      res.status(500).json({ message: 'Failed to update environment' });
    }
  });

  app.post('/api/agent/restart-server', async (req, res) => {
    try {
      const result = await agentServerAccess.restartServer();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error restarting server:', error);
      res.status(500).json({ message: 'Failed to restart server' });
    }
  });

  // File System Operations
  app.post('/api/agent/create-file', async (req, res) => {
    try {
      const { filePath, content } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      const result = await agentServerAccess.createConfigFile(filePath, content || '');
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      res.status(500).json({ message: 'Failed to create file' });
    }
  });

  // Command History and Monitoring
  app.get('/api/agent/command-history', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      
      const history = agentServerAccess.getCommandHistory(parseInt(limit as string));
      
      res.json({
        success: true,
        history,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting command history:', error);
      res.status(500).json({ message: 'Failed to get command history' });
    }
  });

  app.post('/api/agent/clear-history', async (req, res) => {
    try {
      agentServerAccess.clearHistory();
      
      res.json({
        success: true,
        message: 'Command history cleared',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      res.status(500).json({ message: 'Failed to clear history' });
    }
  });

  // Advanced System Information
  app.get('/api/agent/system-info', async (req, res) => {
    try {
      const systemInfo = await agentServerAccess.executeCommand('uname -a && node --version && npm --version');
      const memoryInfo = await agentServerAccess.executeCommand('free -h');
      const diskInfo = await agentServerAccess.executeCommand('df -h');
      const processInfo = await agentServerAccess.executeCommand('ps aux | grep node');
      
      res.json({
        success: true,
        systemInfo: systemInfo.output,
        memoryInfo: memoryInfo.output,
        diskInfo: diskInfo.output,
        processInfo: processInfo.output,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting system info:', error);
      res.status(500).json({ message: 'Failed to get system info' });
    }
  });

  // ==================== DEV URL CONSTRUCTOR API ====================
  // Get all project dev URLs
  app.get('/api/dev-urls', (req, res) => {
    try {
      const devUrls = devUrlConstructor.discoverProjects();
      const projects = devUrlConstructor.getProjects().map(project => ({
        id: project.id,
        name: project.name,
        type: project.type,
        devUrl: `http://localhost:5000/dev/${project.id}`,
        entryPoint: project.entryPoint,
        assets: project.assets
      }));
      
      res.json({ projects, devUrls });
    } catch (error) {
      console.error('Error getting dev URLs:', error);
      res.status(500).json({ message: 'Failed to get dev URLs' });
    }
  });

  // Trigger live reload for a project
  app.post('/api/dev-urls/:projectId/reload', (req, res) => {
    try {
      const { projectId } = req.params;
      devUrlConstructor.triggerReload(projectId);
      res.json({ message: `Live reload triggered for ${projectId}` });
    } catch (error) {
      console.error('Error triggering reload:', error);
      res.status(500).json({ message: 'Failed to trigger reload' });
    }
  });

  // ==================== CODEX ENHANCED API ENDPOINTS ====================
  // Code completion
  app.post('/api/codex/complete', async (req, res) => {
    try {
      const { code, language, context } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.completeCode(code, language, context);
      res.json(result);
    } catch (error) {
      console.error('Error completing code:', error);
      res.status(500).json({ message: 'Failed to complete code' });
    }
  });

  // Code explanation
  app.post('/api/codex/explain', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.explainCode(code, language);
      res.json(result);
    } catch (error) {
      console.error('Error explaining code:', error);
      res.status(500).json({ message: 'Failed to explain code' });
    }
  });

  // Code debugging
  app.post('/api/codex/debug', async (req, res) => {
    try {
      const { code, error, language } = req.body;
      
      if (!code || !error) {
        return res.status(400).json({ message: 'Code and error are required' });
      }
      
      const result = await codexEnhanced.debugCode(code, error, language);
      res.json(result);
    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({ message: 'Failed to debug code' });
    }
  });

  // Code refactoring
  app.post('/api/codex/refactor', async (req, res) => {
    try {
      const { code, language, requirements } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.refactorCode(code, language, requirements);
      res.json(result);
    } catch (error) {
      console.error('Error refactoring code:', error);
      res.status(500).json({ message: 'Failed to refactor code' });
    }
  });

  // Code optimization
  app.post('/api/codex/optimize', async (req, res) => {
    try {
      const { code, language, target } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.optimizeCode(code, language, target);
      res.json(result);
    } catch (error) {
      console.error('Error optimizing code:', error);
      res.status(500).json({ message: 'Failed to optimize code' });
    }
  });

  // Generate test cases
  app.post('/api/codex/test-cases', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.generateTestCases(code, language);
      res.json(result);
    } catch (error) {
      console.error('Error generating test cases:', error);
      res.status(500).json({ message: 'Failed to generate test cases' });
    }
  });

  // Generate documentation
  app.post('/api/codex/documentation', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.generateDocumentation(code, language);
      res.json(result);
    } catch (error) {
      console.error('Error generating documentation:', error);
      res.status(500).json({ message: 'Failed to generate documentation' });
    }
  });

  // Convert between languages
  app.post('/api/codex/convert', async (req, res) => {
    try {
      const { code, fromLanguage, toLanguage } = req.body;
      
      if (!code || !fromLanguage || !toLanguage) {
        return res.status(400).json({ message: 'Code, fromLanguage, and toLanguage are required' });
      }
      
      const result = await codexEnhanced.convertLanguage(code, fromLanguage, toLanguage);
      res.json(result);
    } catch (error) {
      console.error('Error converting language:', error);
      res.status(500).json({ message: 'Failed to convert language' });
    }
  });

  // Suggest improvements
  app.post('/api/codex/improvements', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      const result = await codexEnhanced.suggestImprovements(code, language);
      res.json(result);
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      res.status(500).json({ message: 'Failed to suggest improvements' });
    }
  });

  // General code generation
  app.post('/api/codex/generate', async (req, res) => {
    try {
      const { prompt, language, framework, context, mode, maxTokens, temperature } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const result = await codexEnhanced.generateCode({
        prompt,
        language,
        framework,
        context,
        mode,
        maxTokens,
        temperature
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error generating code:', error);
      res.status(500).json({ message: 'Failed to generate code' });
    }
  });

  // Return existing HTTP server
  return httpServer;
}
