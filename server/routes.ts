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
      // Mock file system structure - in production, this would read from actual filesystem
      const fileSystem = [
        {
          name: 'client',
          type: 'folder',
          path: '/client',
          children: [
            {
              name: 'src',
              type: 'folder',
              path: '/client/src',
              children: [
                { name: 'App.tsx', type: 'file', path: '/client/src/App.tsx', size: 2340, modified: new Date().toISOString() },
                { name: 'main.tsx', type: 'file', path: '/client/src/main.tsx', size: 890, modified: new Date().toISOString() },
                { name: 'index.css', type: 'file', path: '/client/src/index.css', size: 1250, modified: new Date().toISOString() }
              ]
            },
            { name: 'package.json', type: 'file', path: '/client/package.json', size: 1450, modified: new Date().toISOString() }
          ]
        },
        {
          name: 'server',
          type: 'folder',
          path: '/server',
          children: [
            { name: 'index.ts', type: 'file', path: '/server/index.ts', size: 3200, modified: new Date().toISOString() },
            { name: 'routes.ts', type: 'file', path: '/server/routes.ts', size: 8900, modified: new Date().toISOString() },
            { name: 'storage.ts', type: 'file', path: '/server/storage.ts', size: 5600, modified: new Date().toISOString() }
          ]
        },
        { name: 'package.json', type: 'file', path: '/package.json', size: 2100, modified: new Date().toISOString() },
        { name: 'README.md', type: 'file', path: '/README.md', size: 890, modified: new Date().toISOString() },
        { name: '.env', type: 'file', path: '/.env', size: 340, modified: new Date().toISOString() }
      ];
      
      res.json(fileSystem);
    } catch (error) {
      console.error('Error fetching file system:', error);
      res.status(500).json({ message: 'Failed to fetch file system' });
    }
  });

  app.get('/api/workspace/files/*', async (req, res) => {
    try {
      const filePath = req.params[0];
      
      // Mock file content - in production, this would read from actual files
      let content = '';
      
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        content = `// ${filePath}\nimport React from 'react';\n\nfunction Component() {\n  return (\n    <div>\n      <h1>Hello from ${filePath}</h1>\n    </div>\n  );\n}\n\nexport default Component;`;
      } else if (filePath.endsWith('.json')) {
        content = JSON.stringify({
          name: "codecraft",
          version: "1.0.0",
          description: "AI Development Assistant Platform"
        }, null, 2);
      } else if (filePath.endsWith('.md')) {
        content = `# ${filePath}\n\nThis is a documentation file for the CodeCraft platform.\n\n## Features\n\n- AI-powered development\n- Multi-agent collaboration\n- Real-time workspace\n`;
      } else if (filePath.endsWith('.env')) {
        content = `# Environment Variables\nDATABASE_URL=postgresql://localhost:5432/codecraft\nOPENAI_API_KEY=your_openai_key_here\nANTHROPIC_API_KEY=your_anthropic_key_here\nGEMINI_API_KEY=your_gemini_key_here\n`;
      } else {
        content = `// File: ${filePath}\n// Content would be loaded from the actual file system`;
      }
      
      res.json({ path: filePath, content });
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({ message: 'Failed to read file' });
    }
  });

  app.post('/api/workspace/files/*', async (req, res) => {
    try {
      const filePath = req.params[0];
      const { content } = req.body;
      
      // Mock file saving - in production, this would write to actual files
      console.log(`Saving file ${filePath} with ${content.length} characters`);
      
      res.json({ 
        message: 'File saved successfully',
        path: filePath,
        size: content.length,
        modified: new Date().toISOString()
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
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: 'GitHub URL is required' });
      }

      // Extract repo info from GitHub URL
      const urlParts = url.replace('https://github.com/', '').split('/');
      if (urlParts.length < 2) {
        return res.status(400).json({ message: 'Invalid GitHub URL' });
      }

      const [owner, repo] = urlParts;
      const repoName = repo.replace('.git', '');

      // Mock GitHub import - in production, this would clone the actual repo
      const project = await storage.createProject({
        userId: currentUserId,
        name: repoName,
        description: `Imported from GitHub: ${owner}/${repoName}`,
        language: 'javascript', // Would be detected from repo
        framework: 'react', // Would be detected from repo
        status: 'active',
        isPublic: true,
        githubUrl: url
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

  const httpServer = createServer(app);
  
  // Initialize WebSocket manager for real-time collaboration
  const wsManager = new WebSocketManager(httpServer);
  (global as any).webSocketManager = wsManager;
  
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
  
  // File System API Routes
  app.get('/api/files', async (req, res) => {
    try {
      const { path: dirPath = '', projectId } = req.query;
      
      // If projectId is provided, load project-specific files
      if (projectId) {
        const project = await storage.getProject(parseInt(projectId as string));
        if (project) {
          // Try to get project code from code generation
          const codeGenerations = await storage.getCodeGenerationsByProject(project.id);
          
          let fileTree = [];
          
          // Add generated code files
          if (codeGenerations.length > 0) {
            const latestCode = codeGenerations[0]; // Get most recent
            fileTree.push({
              name: `${project.name.toLowerCase()}.html`,
              type: 'file',
              path: `${project.name.toLowerCase()}.html`,
              size: latestCode.code?.length || 0,
              modified: latestCode.createdAt
            });
          }
          
          // Add default project structure files
          if (codeGenerations.length > 0) {
            fileTree.push(
              {
                name: 'style.css',
                type: 'file',
                path: 'style.css',
                size: 0,
                modified: new Date().toISOString()
              },
              {
                name: 'script.js',
                type: 'file',
                path: 'script.js',
                size: 0,
                modified: new Date().toISOString()
              },
              {
                name: 'README.md',
                type: 'file',
                path: 'README.md',
                size: 0,
                modified: new Date().toISOString()
              }
            );
          }
          
          // If no project files, show project structure
          if (fileTree.length === 0) {
            fileTree = [
              {
                name: 'src',
                type: 'folder',
                path: 'src',
                children: [
                  { name: 'index.html', type: 'file', path: 'src/index.html' },
                  { name: 'style.css', type: 'file', path: 'src/style.css' },
                  { name: 'script.js', type: 'file', path: 'src/script.js' }
                ]
              },
              { name: 'README.md', type: 'file', path: 'README.md' }
            ];
          }
          
          return res.json(fileTree);
        }
      }
      
      // Default behavior - load actual filesystem
      const fileTree = await fileSystemService.getFileTree(dirPath as string);
      res.json(fileTree);
    } catch (error) {
      console.error('Error fetching file tree:', error);
      res.status(500).json({ message: 'Failed to fetch file tree' });
    }
  });

  app.get('/api/files/content', async (req, res) => {
    try {
      const { path: filePath, projectId } = req.query;
      
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      // If projectId is provided, load project-specific content
      if (projectId) {
        const project = await storage.getProject(parseInt(projectId as string));
        if (project) {
          // Check if it's a generated HTML file
          if (filePath.endsWith('.html') && filePath.includes(project.name.toLowerCase())) {
            const codeGenerations = await storage.getCodeGenerationsByProject(project.id);
            if (codeGenerations.length > 0) {
              const latestCode = codeGenerations[0];
              const language = fileSystemService.getLanguageFromFileName(filePath);
              return res.json({
                content: latestCode.code || '',
                language,
                path: filePath
              });
            }
          }
          
          // Return template content for project files
          const extension = filePath.split('.').pop();
          let templateContent = '';
          
          switch (extension) {
            case 'html':
              templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to ${project.name}</h1>
        <p>This is a ${project.language} project built with ${project.framework}.</p>
        <div class="description">
            <p>${project.description || 'Start building your project here!'}</p>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
              break;
            case 'css':
              templateContent = `/* ${project.name} - Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    text-align: center;
}

h1 {
    color: #333;
    margin-bottom: 20px;
    font-size: 2.5em;
}

p {
    color: #666;
    font-size: 1.2em;
    line-height: 1.6;
}

.description {
    margin-top: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}`;
              break;
            case 'js':
              templateContent = `// ${project.name} - JavaScript
console.log('Welcome to ${project.name}!');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('${project.name} is ready!');
    
    // Add your JavaScript code here
    const container = document.querySelector('.container');
    if (container) {
        container.addEventListener('click', function() {
            console.log('Container clicked!');
        });
    }
    
    // Example: Add dynamic content
    setTimeout(() => {
        const description = document.querySelector('.description');
        if (description) {
            description.innerHTML += '<p><strong>Status:</strong> Application loaded successfully!</p>';
        }
    }, 1000);
});

// Add your custom functions here
function initializeApp() {
    // Your initialization code
}

// Call initialization
initializeApp();`;
              break;
            case 'md':
              templateContent = `# ${project.name}

## Overview
${project.description || 'This is a modern web application built with cutting-edge technologies.'}

## Technology Stack
- **Language**: ${project.language || 'JavaScript'}
- **Framework**: ${project.framework || 'Vanilla JS'}
- **Status**: ${project.status || 'Active'}

## Features
- 🚀 Fast and responsive design
- 💻 Modern development workflow
- 🎨 Beautiful user interface
- 🔧 Easy to customize and extend

## Getting Started
1. Open the project files in the editor
2. Edit the HTML, CSS, and JavaScript files
3. Use the live preview to see changes in real-time
4. Deploy when ready!

## Project Structure
\`\`\`
${project.name.toLowerCase()}/
├── src/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
\`\`\`

## Development Notes
- Use the Monaco editor for advanced code editing
- The AI assistant can help with debugging and explaining code
- Live preview updates automatically when you save files

---
Created with ❤️ using CodeCraft Platform
`;
              break;
            default:
              templateContent = `// ${project.name} - ${filePath}
// Project: ${project.name}
// Language: ${project.language}
// Framework: ${project.framework}

// Add your ${extension} code here
console.log('File: ${filePath}');
`;
          }
          
          const language = fileSystemService.getLanguageFromFileName(filePath);
          return res.json({
            content: templateContent,
            language,
            path: filePath
          });
        }
      }
      
      // Default behavior - load from filesystem
      const content = await fileSystemService.readFile(filePath);
      const language = fileSystemService.getLanguageFromFileName(filePath);
      
      res.json({
        content,
        language,
        path: filePath
      });
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({ message: 'Failed to read file' });
    }
  });

  app.post('/api/files/save', async (req, res) => {
    try {
      const { path: filePath, content, projectId } = req.body;
      
      if (!filePath || content === undefined) {
        return res.status(400).json({ message: 'File path and content are required' });
      }
      
      // If projectId is provided, save as workspace file
      if (projectId) {
        try {
          // Save to workspace files system (for project-specific files)
          const workspaceFile = {
            projectId: parseInt(projectId),
            fileName: filePath.split('/').pop() || filePath,
            filePath: filePath,
            fileType: 'file',
            content: content,
            lastModified: new Date().toISOString()
          };
          
          // For now, save to filesystem as backup
          await fileSystemService.writeFile(filePath, content);
          
          res.json({ message: 'Project file saved successfully' });
        } catch (error) {
          console.error('Error saving project file:', error);
          // Fallback to regular file save
          await fileSystemService.writeFile(filePath, content);
          res.json({ message: 'File saved successfully' });
        }
      } else {
        // Regular file save
        await fileSystemService.writeFile(filePath, content);
        res.json({ message: 'File saved successfully' });
      }
    } catch (error) {
      console.error('Error saving file:', error);
      res.status(500).json({ message: 'Failed to save file' });
    }
  });

  app.post('/api/files/format', async (req, res) => {
    try {
      const { content, language, provider = 'openai' } = req.body;
      
      if (!content || !language) {
        return res.status(400).json({ message: 'Content and language are required' });
      }
      
      const result = await fileSystemService.formatCodeWithAI(content, language, provider);
      res.json(result);
    } catch (error) {
      console.error('Error formatting code:', error);
      res.status(500).json({ message: 'Failed to format code with AI' });
    }
  });

  app.post('/api/files/debug', async (req, res) => {
    try {
      const { content, language, error: errorMsg } = req.body;
      
      if (!content || !language) {
        return res.status(400).json({ message: 'Content and language are required' });
      }
      
      const result = await fileSystemService.debugCodeWithAI(content, language, errorMsg);
      res.json(result);
    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({ message: 'Failed to debug code with AI' });
    }
  });

  app.post('/api/files/explain', async (req, res) => {
    try {
      const { content, language } = req.body;
      
      if (!content || !language) {
        return res.status(400).json({ message: 'Content and language are required' });
      }
      
      const result = await fileSystemService.explainCodeWithAI(content, language);
      res.json(result);
    } catch (error) {
      console.error('Error explaining code:', error);
      res.status(500).json({ message: 'Failed to explain code with AI' });
    }
  });

  console.log('🚀 Multi-Agent Collaboration System is ready!');
  console.log('📡 WebSocket server initialized for real-time communication');
  console.log('🤖 Access collaboration dashboard at /collaboration');
  console.log('🏠 WeLet AI Agent ready for tenant support');
  console.log('📁 File System API ready for real-time code editing');
  
  return httpServer;
}
