import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateCode, debugCode } from "./services/openai";
import { GitHubService } from "./services/github";
import { insertCodeGenerationSchema, insertProjectSchema, insertApiTestSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
