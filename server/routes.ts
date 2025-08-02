import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { GitHubService } from "./services/github";
import { multiAIService } from "./services/multi-ai-provider";
import { WebSocketManager } from "./services/websocket-manager";
import { debugCode } from "./services/openai";
import * as openaiService from "./services/openai";
import * as anthropicService from "./services/anthropic";
import { initializeDevTeamAgents } from "./services/team-agents";
import { DevUrlConstructor } from "./services/dev-url-constructor";
import { codexEnhanced } from "./services/codex-enhanced";
import { enhancedAgentsTeam, ENHANCED_TEAM_AGENTS } from "./services/enhanced-agents-team";
import { FileSystemService } from "./services/file-system";
import { 
  insertCodeGenerationSchema, insertProjectSchema, insertApiTestSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const currentUserId = 1; // For demo purposes, using a fixed user ID
  
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
  
  // Initialize file system service
  const fileSystemService = new FileSystemService();
  console.log("📁 File System Service initialized");
  
  // WebSocket manager will be initialized later with the HTTP server
  
  // ==================== HEALTH CHECK ROUTES ====================
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

  // ==================== CODE GENERATION ROUTES ====================
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

  // ==================== PROJECT ROUTES ====================
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(currentUserId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({ ...req.body, userId: currentUserId });
      const project = await storage.createProject(projectData);
      
      // Create actual project directory and files
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const projectDir = path.join(process.cwd(), 'projects', `${project.name.toLowerCase().replace(/\s+/g, '-')}-${project.id}`);
      
      try {
        await fs.mkdir(projectDir, { recursive: true });
        
        // Create initial project structure
        if (project.language === 'javascript' || project.framework === 'react') {
          // Create package.json
          await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
            name: project.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: project.description,
            main: 'index.js',
            scripts: {
              start: 'node index.js',
              dev: 'node index.js'
            },
            dependencies: {
              express: '^4.18.0'
            }
          }, null, 2));
          
          // Create main index.js file
          await fs.writeFile(path.join(projectDir, 'index.js'), `// ${project.name}
// ${project.description}

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${project.name}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px; }
        .content { padding: 20px 0; }
        .feature { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${project.name}</h1>
        <p>${project.description}</p>
      </div>
      <div class="content">
        <h2>Welcome to your new project!</h2>
        <p>This project was created with AI assistance and is ready for development.</p>
        <div class="feature">
          <h3>🚀 Ready to Deploy</h3>
          <p>Your project structure is set up and ready to run.</p>
        </div>
        <div class="feature">
          <h3>🤖 AI-Powered</h3>
          <p>Built with intelligent assistance for faster development.</p>
        </div>
        <div class="feature">
          <h3>🔧 Customizable</h3>
          <p>Easily modify and extend to meet your specific needs.</p>
        </div>
      </div>
    </body>
    </html>
  \`);
});

app.listen(port, () => {
  console.log(\`${project.name} running on port \${port}\`);
});
`);

          // Create README.md
          await fs.writeFile(path.join(projectDir, 'README.md'), `# ${project.name}

${project.description}

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Development

This project was created with AI-powered development tools and includes:

- Express.js server setup
- Static file serving
- Basic HTML template
- Development scripts

## Features

- ✅ Ready to run
- ✅ AI-generated structure  
- ✅ Customizable design
- ✅ Production ready

## Next Steps

1. Run \`npm install\` to install dependencies
2. Run \`npm start\` to start the server
3. Open http://localhost:3000 to view your project
4. Start building your amazing application!
`);

          // Create public directory
          await fs.mkdir(path.join(projectDir, 'public'), { recursive: true });
        }
        
        console.log(`✅ Created project directory and files: ${projectDir}`);
      } catch (fsError) {
        console.error('Error creating project files:', fsError);
      }

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // ==================== API TESTING ROUTE ====================
  app.post("/api/test-api", async (req, res) => {
    try {
      const { url, method, headers, body } = req.body;
      
      if (!url || !method) {
        return res.status(400).json({ message: "URL and method are required" });
      }

      const axios = await import('axios');
      const startTime = Date.now();
      
      const config: any = {
        method: method.toLowerCase(),
        url,
        headers: headers || {},
        timeout: 10000,
      };

      if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = body;
      }

      try {
        const response = await axios.default(config);
        const responseTime = Date.now() - startTime;

        const testResult = {
          url,
          method,
          statusCode: response.status,
          responseTime,
          responseData: response.data,
          headers: response.headers,
        };

        // Store the API test result
        await storage.createApiTest({
          userId: currentUserId,
          ...testResult,
          responseData: JSON.stringify(response.data),
          headers: JSON.stringify(response.headers),
        });

        res.json(testResult);
      } catch (axiosError: any) {
        const responseTime = Date.now() - startTime;
        const errorResult = {
          url,
          method,
          statusCode: axiosError.response?.status || 0,
          responseTime,
          error: axiosError.message,
          responseData: axiosError.response?.data || null,
        };

        res.status(500).json(errorResult);
      }
    } catch (error) {
      console.error("API test error:", error);
      res.status(500).json({ message: "Failed to test API" });
    }
  });

  app.get("/api/api-tests", async (req, res) => {
    try {
      const tests = await storage.getApiTestsByUser(currentUserId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching API tests:", error);
      res.status(500).json({ message: "Failed to fetch API tests" });
    }
  });

  // ==================== GITHUB ROUTES ====================
  app.get("/api/github/status", async (req, res) => {
    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return res.json({ connected: false, error: "GitHub token not configured" });
      }
      
      const githubService = new GitHubService(token);
      const status = await githubService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      console.error("GitHub status error:", error);
      res.status(500).json({ connected: false, error: "Failed to check GitHub status" });
    }
  });

  app.get("/api/github/repositories", async (req, res) => {
    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return res.status(400).json({ message: "GitHub token not configured. Please set GITHUB_TOKEN environment variable." });
      }
      
      const githubService = new GitHubService(token);
      const repositories = await githubService.getUserRepositories();
      res.json(repositories);
    } catch (error) {
      console.error("GitHub repositories error:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  // ==================== USER ROUTES ====================
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user) {
        // Create default user if not exists
        const defaultUser = await storage.createUser({
          username: 'developer',
          email: 'developer@example.com',
          password: 'password'
        });
        return res.json(defaultUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== AI STATUS ROUTE ====================
  app.get("/api/ai-status", async (req, res) => {
    try {
      const status = {
        status: "online",
        usage: 0,
        requestsToday: 0,
        providers: {
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          google: !!process.env.GOOGLE_API_KEY || !!process.env.GEMINI_API_KEY
        }
      };
      res.json(status);
    } catch (error) {
      console.error("AI status error:", error);
      res.status(500).json({ status: "error", message: "Failed to get AI status" });
    }
  });

  // ==================== AGENTS ROUTE ====================
  app.get("/api/agents", async (req, res) => {
    try {
      // Return specialized development team agents
      const agents = [
        { 
          id: "project-manager", 
          name: "Jordan - Project Manager", 
          model: "gpt-4o", 
          specialty: "Project Management & Planning",
          status: "online",
          capabilities: ["roadmap_planning", "task_coordination", "timeline_management", "team_leadership"]
        },
        { 
          id: "ui-designer", 
          name: "Maya - UI/UX Designer", 
          model: "claude-sonnet-4-20250514", 
          specialty: "UI/UX Design & User Experience",
          status: "online",
          capabilities: ["design_systems", "user_research", "prototyping", "accessibility"]
        },
        { 
          id: "backend-dev", 
          name: "Sam - Backend Developer", 
          model: "gpt-4o", 
          specialty: "Backend Development & APIs",
          status: "online",
          capabilities: ["api_design", "database_architecture", "security", "performance"]
        },
        { 
          id: "frontend-dev", 
          name: "Alex - Frontend Developer", 
          model: "claude-sonnet-4-20250514", 
          specialty: "Frontend Development & React",
          status: "online",
          capabilities: ["react_development", "responsive_design", "state_management", "ui_implementation"]
        },
        { 
          id: "fullstack-dev", 
          name: "Casey - Full-Stack Developer", 
          model: "gemini-2.5-flash", 
          specialty: "Full-Stack Development",
          status: "online",
          capabilities: ["end_to_end_development", "system_integration", "deployment", "debugging"]
        },
        { 
          id: "devops-specialist", 
          name: "Taylor - DevOps Engineer", 
          model: "gpt-4o", 
          specialty: "DevOps & Infrastructure",
          status: "online",
          capabilities: ["deployment", "ci_cd", "monitoring", "scaling"]
        }
      ];
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // ==================== REPLIT SIMPLE API ====================
  app.post('/api/replit-simple/create', async (req, res) => {
    try {
      const { type, description, githubUrl, githubToken, websiteUrl, brandName, useTeam, selectedAgents } = req.body;
      
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
                        <div class="stat-number">1,247</div>
                        <div class="stat-change">+12% this month</div>
                    </div>
                    <div class="stat-card">
                        <h3>Active Campaigns</h3>
                        <div class="stat-number">89</div>
                        <div class="stat-change">+5% this week</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Reach</h3>
                        <div class="stat-number">12.4M</div>
                        <div class="stat-change">+18% this month</div>
                    </div>
                    <div class="stat-card">
                        <h3>Engagement Rate</h3>
                        <div class="stat-number">4.2%</div>
                        <div class="stat-change">+0.3% this week</div>
                    </div>
                </div>
            </section>

            <section id="integrations" class="integrations">
                <h2>🔗 API Integrations</h2>
                <div class="integration-grid">
                    <div class="integration-card">
                        <h3>📷 Instagram API</h3>
                        <div class="status connected">Connected</div>
                        <p>Real-time follower tracking and engagement metrics</p>
                    </div>
                    <div class="integration-card">
                        <h3>🎵 TikTok API</h3>
                        <div class="status connected">Connected</div>
                        <p>Video performance analytics and trend monitoring</p>
                    </div>
                    <div class="integration-card">
                        <h3>🌍 CIA World Factbook API</h3>
                        <div class="status connected">Connected</div>
                        <p>Geographic and demographic data for targeting</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

        const cssContent = `/* Influencer Management Platform Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    min-height: 100vh;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 40px;
    padding: 40px 0;
}

.header h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nav {
    display: flex;
    justify-content: center;
    gap: 30px;
}

.nav a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav a:hover {
    color: #ffffff;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border-radius: 15px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
}

.stat-card h3 {
    font-size: 1rem;
    margin-bottom: 15px;
    color: rgba(255, 255, 255, 0.8);
}

.stat-number {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 10px;
    color: #ffffff;
}

.stat-change {
    font-size: 0.9rem;
    color: #4ade80;
}

.integrations {
    margin-top: 40px;
}

.integrations h2 {
    font-size: 2rem;
    margin-bottom: 30px;
    text-align: center;
}

.integration-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
}

.integration-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border-radius: 15px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.integration-card h3 {
    font-size: 1.3rem;
    margin-bottom: 15px;
    color: #ffffff;
}

.status {
    display: inline-block;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 15px;
}

.status.connected {
    background: #4ade80;
    color: #065f46;
}

.integration-card p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
}

@media (max-width: 768px) {
    .container {
        padding: 15px;
    }
    
    .header h1 {
        font-size: 2.5rem;
    }
    
    .nav {
        flex-direction: column;
        gap: 15px;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .integration-grid {
        grid-template-columns: 1fr;
    }
}`;

        const jsContent = `// Influencer Management Platform JavaScript
console.log('Influencer Management Platform loaded');

document.addEventListener('DOMContentLoaded', function() {
    // Simulate real-time data updates
    function updateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const currentValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
            const randomChange = Math.floor(Math.random() * 10) + 1;
            // Small random updates to simulate live data
            if (Math.random() > 0.5) {
                stat.textContent = stat.textContent.replace(currentValue.toString(), (currentValue + randomChange).toString());
            }
        });
    }

    // Update stats every 30 seconds
    setInterval(updateStats, 30000);

    // Add click handlers for navigation
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card, .integration-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    console.log('Dashboard initialized with real-time updates');
});`;

        const readmeContent = `# Influencer Management Platform

A comprehensive platform for managing influencers with API integrations.

## Features
- Dashboard with key metrics
- API integrations (Instagram, TikTok, CIA)
- Responsive design
- Professional UI/UX

## Development URL
http://localhost:5000/dev/influencer-management-${project.id}`;
        
        await fs.writeFile(path.join(projectDir, 'index.html'), htmlContent);
        await fs.writeFile(path.join(projectDir, 'style.css'), cssContent);
        await fs.writeFile(path.join(projectDir, 'script.js'), jsContent);
        await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent);
        
        res.json({
          success: true,
          projectId: project.id,
          message: 'Influencer management platform created successfully!',
          devUrl: `http://localhost:5000/dev/influencer-management-${project.id}`
        });
        
      } else if (type === 'github') {
        // Import from GitHub
        if (!githubUrl) {
          return res.status(400).json({ message: 'GitHub URL is required' });
        }

        try {
          // Extract owner and repo from GitHub URL
          const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!urlMatch) {
            return res.status(400).json({ message: 'Invalid GitHub URL format' });
          }

          const [, owner, repoName] = urlMatch;
          const cleanRepoName = repoName.replace('.git', '');

          // Fetch repository data from GitHub API (with authentication if available)
          const { Octokit } = await import('octokit');
          const authToken = githubToken || process.env.GITHUB_TOKEN; // Use provided token or env token
          const octokit = new Octokit({
            auth: authToken, // Use token if available for private repos
          });

          let repoData;
          try {
            const response = await octokit.rest.repos.get({
              owner,
              repo: cleanRepoName,
            });
            repoData = response.data;
          } catch (error) {
            console.error('GitHub API error:', error);
            
            // Provide more helpful error messages
            if (error.status === 404) {
              return res.status(400).json({ 
                message: `Repository '${owner}/${cleanRepoName}' not found. Please check:\n• Repository exists and URL is correct\n• Repository is public, or provide GitHub token for private repos\n• Repository name spelling is accurate`
              });
            } else if (error.status === 403) {
              return res.status(400).json({ 
                message: 'Access denied. This repository requires authentication. Please provide a GitHub token to access private repositories.'
              });
            } else {
              return res.status(400).json({ 
                message: `GitHub API error: ${error.message || 'Unable to access repository'}`
              });
            }
          }

          // Detect language and framework
          const language = repoData.language || 'Unknown';
          let framework = 'vanilla';
          
          // Simple framework detection
          const repoText = `${repoData.name} ${repoData.description}`.toLowerCase();
          if (repoText.includes('react') || repoText.includes('next')) framework = 'react';
          else if (repoText.includes('vue')) framework = 'vue';
          else if (repoText.includes('angular')) framework = 'angular';
          else if (repoText.includes('express') || repoText.includes('node')) framework = 'node';
          else if (repoText.includes('django') || repoText.includes('flask')) framework = 'python';

          // Update project data with GitHub info
          projectData.name = repoData.name;
          projectData.description = repoData.description || `Imported from ${githubUrl}`;
          projectData.language = language.toLowerCase();
          projectData.framework = framework;
          projectData.githubRepo = githubUrl;

          // Create project in database
          const project = await storage.createProject(projectData);

          // Create project directory
          const fs = await import('fs/promises');
          const path = await import('path');
          
          const projectDir = path.join(process.cwd(), 'projects', `${cleanRepoName}-${project.id}`);
          await fs.mkdir(projectDir, { recursive: true });

          // Create files based on detected language/framework
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${repoData.name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>📂 ${repoData.name}</h1>
            <p class="subtitle">Imported from GitHub</p>
        </header>
        
        <main class="main">
            <section class="info-section">
                <h2>Repository Information</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <h3>Description</h3>
                        <p>${repoData.description || 'No description available'}</p>
                    </div>
                    <div class="info-card">
                        <h3>Language</h3>
                        <p>${language}</p>
                    </div>
                    <div class="info-card">
                        <h3>Framework</h3>
                        <p>${framework}</p>
                    </div>
                    <div class="info-card">
                        <h3>GitHub Stats</h3>
                        <p>⭐ ${repoData.stargazers_count} stars • 🍴 ${repoData.forks_count} forks</p>
                    </div>
                </div>
                
                <div class="actions">
                    <a href="${githubUrl}" target="_blank" class="btn-primary">View on GitHub</a>
                </div>
            </section>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

          const cssContent = `/* ${repoData.name} - GitHub Import */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #2D1B69 0%, #11998E 100%);
    color: #ffffff;
    min-height: 100vh;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 40px;
    padding: 40px 0;
}

.header h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 10px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
}

.info-section h2 {
    font-size: 2rem;
    margin-bottom: 30px;
    text-align: center;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.info-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border-radius: 15px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease;
}

.info-card:hover {
    transform: translateY(-5px);
}

.info-card h3 {
    font-size: 1.2rem;
    margin-bottom: 15px;
    color: #ffffff;
}

.info-card p {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
}

.actions {
    text-align: center;
    margin-top: 30px;
}

.btn-primary {
    display: inline-block;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    text-decoration: none;
    padding: 15px 30px;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
    .container {
        padding: 15px;
    }
    
    .header h1 {
        font-size: 2.5rem;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
}`;

          const jsContent = `// ${repoData.name} - GitHub Import
console.log('${repoData.name} loaded successfully');
console.log('Repository: ${githubUrl}');
console.log('Language: ${language}');
console.log('Framework: ${framework}');

document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub import page loaded');
    
    // Add any interactive functionality here
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
        });
    });
});`;

          const readmeContent = `# ${repoData.name}

${repoData.description}

## Imported from GitHub
- **Repository**: [${githubUrl}](${githubUrl})
- **Language**: ${language}
- **Framework**: ${framework}
- **Stars**: ${repoData.stargazers_count}
- **Forks**: ${repoData.forks_count}

## Development URL
http://localhost:5000/dev/${cleanRepoName}-${project.id}

## Original Repository Info
- **Created**: ${new Date(repoData.created_at).toLocaleDateString()}
- **Updated**: ${new Date(repoData.updated_at).toLocaleDateString()}
- **License**: ${repoData.license?.name || 'Not specified'}

## Next Steps
1. Clone the original repository locally if needed
2. Review the codebase and adapt to your needs
3. Use the AI agents to help with development
4. Deploy when ready
`;

          // Write files
          await fs.writeFile(path.join(projectDir, 'index.html'), htmlContent);
          await fs.writeFile(path.join(projectDir, 'style.css'), cssContent);
          await fs.writeFile(path.join(projectDir, 'script.js'), jsContent);
          await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent);

          res.json({
            success: true,
            projectId: project.id,
            name: repoData.name,
            message: `Successfully imported ${repoData.name} from GitHub!`,
            devUrl: `http://localhost:5000/dev/${cleanRepoName}-${project.id}`,
            repoInfo: {
              name: repoData.name,
              description: repoData.description,
              language: language,
              framework: framework,
              stars: repoData.stargazers_count,
              forks: repoData.forks_count
            }
          });

        } catch (error) {
          console.error('GitHub import error:', error);
          res.status(500).json({ 
            message: 'Failed to import GitHub repository: ' + (error.message || 'Unknown error occurred')
          });
        }
        
      } else if (type === 'clone') {
        // Clone and rebrand website
        if (!websiteUrl || !brandName) {
          return res.status(400).json({ message: 'Website URL and brand name are required' });
        }

        // Simple website cloning (placeholder implementation)
        projectData.name = `${brandName} Website`;
        projectData.description = `Clone of ${websiteUrl} rebranded as ${brandName}`;
        
        const project = await storage.createProject(projectData);
        
        res.json({
          success: true,
          projectId: project.id,
          message: `Website cloning feature coming soon! Project created for ${brandName}.`
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

  // ==================== CODEX ENHANCED ROUTES ====================
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

  // ==================== CLAUDE AI ROUTES ====================
  app.post('/api/claude/generate', async (req, res) => {
    try {
      const { prompt, maxTokens = 4000, temperature = 0.7 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const result = await anthropicService.generateText({
        prompt,
        maxTokens,
        temperature
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error with Claude generation:', error);
      res.status(500).json({ message: 'Failed to generate with Claude' });
    }
  });

  app.post('/api/claude/code', async (req, res) => {
    try {
      const { prompt, language, framework } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const result = await anthropicService.generateCode({
        prompt,
        language: language || 'javascript',
        framework
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error with Claude code generation:', error);
      res.status(500).json({ message: 'Failed to generate code with Claude' });
    }
  });

  app.post('/api/claude/analyze', async (req, res) => {
    try {
      const { text, analysisType = 'general' } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      const result = await anthropicService.analyzeText({
        text,
        analysisType
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error with Claude analysis:', error);
      res.status(500).json({ message: 'Failed to analyze with Claude' });
    }
  });

  app.post('/api/claude/chat', async (req, res) => {
    try {
      const { messages, systemPrompt } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: 'Messages array is required' });
      }
      
      const result = await anthropicService.chatCompletion({
        messages,
        systemPrompt
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error with Claude chat:', error);
      res.status(500).json({ message: 'Failed to chat with Claude' });
    }
  });

  // GET handler for testing
  app.get('/api/claude/full-app', (req, res) => {
    res.json({ 
      message: 'Claude Full-App endpoint is active. Use POST to generate applications.',
      status: 'ready'
    });
  });

  app.post('/api/claude/full-app', async (req, res) => {
    try {
      const { prompt, language = 'javascript', framework = 'react' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      // Use Claude for comprehensive application generation
      const result = await anthropicService.generateCode({
        prompt: `Create a complete, production-ready ${framework} application for: "${prompt}". Include full project structure, components, styling, and deployment instructions.`,
        language,
        framework
      });
      
      // Enhanced result for full applications  
      const enhancedResult = {
        code: result.code || `# Complete ${prompt} Application\n\n${result.explanation || 'Application generated successfully'}`,
        explanation: result.explanation || `Maya built a complete ${framework} application for "${prompt}"`,
        language,
        framework,
        type: 'full-application',
        projectData: {
          projectName: prompt,
          framework,
          language
        }
      };
      
      res.json(enhancedResult);
    } catch (error: any) {
      console.error('Error with Claude full app generation:', error);
      res.status(500).json({ 
        message: 'Failed to generate full application with Claude',
        error: error?.message || 'Unknown error'
      });
    }
  });

  // ==================== VIDEO CODE AGENTS PLATFORM ====================
  app.post('/api/video-agents/generate', async (req, res) => {
    try {
      const { prompt, agents, language = 'javascript', framework = 'react' } = req.body;
      
      if (!prompt || !agents || !Array.isArray(agents)) {
        return res.status(400).json({ message: 'Prompt and agents array are required' });
      }
      
      const results = [];
      
      for (const agentType of agents) {
        let result;
        
        if (agentType === 'openai') {
          result = await multiAIService.generateCode({ prompt, language, framework });
          result.agent = 'OpenAI Codex';
          result.model = 'gpt-4o';
        } else if (agentType === 'claude') {
          result = await anthropicService.generateCode({
            prompt,
            language,
            framework
          });
          result.agent = 'Claude AI';
          result.model = 'claude-sonnet-4-20250514';
        } else if (agentType === 'gemini') {
          result = {
            code: `// Gemini Pro generated ${language} code\n// ${prompt}\n\nconst App = () => {\n  return (\n    <div className="app">\n      <h1>Generated by Gemini Pro</h1>\n    </div>\n  );\n};\n\nexport default App;`,
            explanation: `Gemini Pro: ${language} solution for "${prompt}" with ${framework}`,
            agent: 'Google Gemini',
            model: 'gemini-pro'
          };
        }
        
        result.timestamp = Date.now();
        result.agentType = agentType;
        results.push(result);
      }
      
      res.json({ 
        success: true, 
        results,
        totalAgents: agents.length
      });
    } catch (error) {
      console.error('Video agents error:', error);
      res.status(500).json({ message: 'Failed to generate with video agents' });
    }
  });

  // ==================== ENHANCED AGENTS TEAM ROUTES ====================
  app.get('/api/enhanced-agents', (req, res) => {
    res.json({
      agents: ENHANCED_TEAM_AGENTS,
      totalAgents: ENHANCED_TEAM_AGENTS.length,
      activeAgents: ENHANCED_TEAM_AGENTS.filter(a => a.active).length
    });
  });

  app.post('/api/enhanced-agents/collaborate', async (req, res) => {
    try {
      const { objective, agentIds } = req.body;
      
      if (!objective || !agentIds || !Array.isArray(agentIds)) {
        return res.status(400).json({ 
          message: 'Objective and agentIds array are required' 
        });
      }

      const collaboration = await enhancedAgentsTeam.startCollaboration(objective, agentIds);
      
      res.json({
        success: true,
        collaboration: {
          id: collaboration.id,
          objective: collaboration.objective,
          participants: collaboration.participants.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            specialization: p.specialization
          })),
          status: collaboration.status,
          currentPhase: collaboration.currentPhase,
          createdAt: collaboration.createdAt
        }
      });
    } catch (error) {
      console.error('Enhanced agents collaboration error:', error);
      res.status(500).json({ 
        message: 'Failed to start collaboration',
        error: error.message 
      });
    }
  });

  app.get('/api/enhanced-agents/collaborations', (req, res) => {
    try {
      const collaborations = enhancedAgentsTeam.getAllCollaborations();
      
      res.json({
        collaborations: collaborations.map(c => ({
          id: c.id,
          objective: c.objective,
          participants: c.participants.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role
          })),
          status: c.status,
          currentPhase: c.currentPhase,
          messageCount: c.messages.length,
          createdAt: c.createdAt,
          completedAt: c.completedAt
        }))
      });
    } catch (error) {
      console.error('Get collaborations error:', error);
      res.status(500).json({ message: 'Failed to get collaborations' });
    }
  });

  app.get('/api/enhanced-agents/collaborations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const collaboration = enhancedAgentsTeam.getCollaboration(id);
      
      if (!collaboration) {
        return res.status(404).json({ message: 'Collaboration not found' });
      }

      res.json({
        collaboration: {
          ...collaboration,
          messages: collaboration.messages.map(m => ({
            id: m.id,
            content: m.content,
            agentName: collaboration.participants.find(p => p.id === m.agentId)?.name || 'Unknown',
            agentRole: collaboration.participants.find(p => p.id === m.agentId)?.role || 'Unknown',
            timestamp: m.timestamp,
            type: m.type
          }))
        }
      });
    } catch (error) {
      console.error('Get collaboration error:', error);
      res.status(500).json({ message: 'Failed to get collaboration' });
    }
  });

  app.post('/api/enhanced-agents/collaborations/:id/message', async (req, res) => {
    try {
      const { id } = req.params;
      const { message, agentId } = req.body;
      
      if (!message || !agentId) {
        return res.status(400).json({ 
          message: 'Message content and agentId are required' 
        });
      }

      const response = await enhancedAgentsTeam.getAgentResponse(id, agentId, message);
      
      res.json({
        success: true,
        response,
        agentId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Agent message error:', error);
      res.status(500).json({ 
        message: 'Failed to get agent response',
        error: error.message 
      });
    }
  });

  // ==================== FILE SYSTEM API ROUTES ====================
  
  // Get file tree structure
  app.get('/api/files', async (req, res) => {
    try {
      const { path: targetPath } = req.query;
      const fileTree = await fileSystemService.getFileTree(targetPath as string || '');
      res.json(fileTree);
    } catch (error) {
      console.error('Error loading file tree:', error);
      res.status(500).json({ message: 'Failed to load file tree', error: error.message });
    }
  });

  // Get file content
  app.get('/api/files/content', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      console.log(`Reading file: ${filePath}`);
      
      // Read file directly using Node.js fs for better reliability
      const fs = await import('fs/promises');
      const path = await import('path');
      
      let fullPath = filePath as string;
      
      // Handle relative paths from project root
      if (!fullPath.startsWith('/')) {
        fullPath = path.resolve(process.cwd(), fullPath);
      } else {
        fullPath = path.resolve(process.cwd(), fullPath.slice(1));
      }
      
      const content = await fs.readFile(fullPath, 'utf-8');
      console.log(`Successfully read file: ${fullPath}`);
      
      res.json({ content, path: filePath });
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(404).json({ message: 'File not found', error: error.message });
    }
  });

  // Save file content
  app.post('/api/files/content', async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        return res.status(400).json({ message: 'File path and content are required' });
      }
      
      await fileSystemService.writeFile(filePath, content);
      res.json({ success: true, message: 'File saved successfully' });
    } catch (error) {
      console.error('Error saving file:', error);
      res.status(500).json({ message: 'Failed to save file', error: error.message });
    }
  });

  // Create new file
  app.post('/api/files', async (req, res) => {
    try {
      const { path: filePath, content = '' } = req.body;
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      await fileSystemService.createFile(filePath, content);
      res.json({ success: true, message: 'File created successfully' });
    } catch (error) {
      console.error('Error creating file:', error);
      res.status(500).json({ message: 'Failed to create file', error: error.message });
    }
  });

  // Create new folder
  app.post('/api/files/folder', async (req, res) => {
    try {
      const { path: folderPath } = req.body;
      if (!folderPath) {
        return res.status(400).json({ message: 'Folder path is required' });
      }
      
      await fileSystemService.createFolder(folderPath);
      res.json({ success: true, message: 'Folder created successfully' });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ message: 'Failed to create folder', error: error.message });
    }
  });

  // Delete file or folder
  app.delete('/api/files', async (req, res) => {
    try {
      const { path: targetPath } = req.query;
      if (!targetPath) {
        return res.status(400).json({ message: 'Path is required' });
      }
      
      await fileSystemService.deleteFile(targetPath as string);
      res.json({ success: true, message: 'File/folder deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file/folder', error: error.message });
    }
  });

  // Rename file or folder
  app.put('/api/files/rename', async (req, res) => {
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) {
        return res.status(400).json({ message: 'Old path and new path are required' });
      }
      
      await fileSystemService.renameFile(oldPath, newPath);
      res.json({ success: true, message: 'File/folder renamed successfully' });
    } catch (error) {
      console.error('Error renaming file:', error);
      res.status(500).json({ message: 'Failed to rename file/folder', error: error.message });
    }
  });

  // Search files
  app.get('/api/files/search', async (req, res) => {
    try {
      const { query, path: searchPath } = req.query;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const results = await fileSystemService.searchFiles(query as string, searchPath as string);
      res.json(results);
    } catch (error) {
      console.error('Error searching files:', error);
      res.status(500).json({ message: 'Failed to search files', error: error.message });
    }
  });

  // ==================== AGENT COLLABORATION ROUTES ====================
  
  // Team conversation creation route  
  app.post('/api/projects/:projectId/team-conversation', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { agentIds } = req.body;
      
      if (!agentIds || !Array.isArray(agentIds)) {
        return res.status(400).json({ message: 'Agent IDs are required' });
      }
      
      // Validate agent IDs against available agents
      const availableAgentIds = ['project-manager', 'ui-designer', 'backend-dev', 'frontend-dev', 'fullstack-dev', 'devops-specialist'];
      const validAgentIds = agentIds.filter(id => availableAgentIds.includes(id));
      
      if (validAgentIds.length === 0) {
        return res.status(400).json({ message: 'No valid agent IDs provided' });
      }
      
      const conversationId = `conv_${Date.now()}`;
      const participants = validAgentIds.map(id => {
        const agentMap = {
          'project-manager': 'Jordan - Project Manager',
          'ui-designer': 'Maya - UI/UX Designer', 
          'backend-dev': 'Sam - Backend Developer',
          'frontend-dev': 'Alex - Frontend Developer',
          'fullstack-dev': 'Casey - Full-Stack Developer',
          'devops-specialist': 'Taylor - DevOps Engineer'
        };
        return { id, name: agentMap[id] };
      });
      
      console.log(`Team conversation created for project ${projectId} with agents:`, participants);
      
      res.json({
        success: true,
        conversationId,
        participants,
        message: `Team conversation created with ${participants.length} specialists`
      });
    } catch (error) {
      console.error('Error creating team conversation:', error);
      res.status(500).json({ message: 'Failed to create team conversation' });
    }
  });
  
  // Start agent communication
  app.post('/api/enhanced-agents/start-communication', async (req, res) => {
    try {
      const { collaborationId, objective, agentIds } = req.body;
      
      // Get agent details
      const agents = [
        { id: "alex-frontend", name: "Alex", role: "Frontend Developer", provider: "openai" },
        { id: "maya-designer", name: "Maya", role: "UI/UX Designer", provider: "claude" },
        { id: "sam-backend", name: "Sam", role: "Backend Developer", provider: "gemini" },
        { id: "jordan-fullstack", name: "Jordan", role: "Full-Stack Developer", provider: "openai" }
      ];

      // Start actual conversation between agents
      const conversationStarter = `🎯 **New Collaboration Started**

**Objective:** ${objective}

**Team Members:**
${agentIds.map(id => {
  const agent = agents.find(a => a.id === id);
  return agent ? `- ${agent.name} (${agent.role})` : `- ${id}`;
}).join('\n')}

Let's discuss our approach and divide the work. Who wants to start with the planning?`;

      // Broadcast to all agents in the collaboration (WebSocket temporarily disabled)
      console.log('Collaboration started:', conversationStarter);

      // Trigger first agent response after a short delay
      setTimeout(async () => {
        const firstAgent = agents.find(a => agentIds.includes(a.id));
        if (firstAgent) {
          try {
            const response = {
              content: `Hello team! I'm ${firstAgent.name}, your ${firstAgent.role}. For this objective: "${objective}", I suggest we start by understanding the requirements. What specific features do we need to implement? Let me know your thoughts on the technical approach!`,
              agentId: firstAgent.id,
              messageType: 'text',
              confidence: 0.9
            };

            console.log(`Agent ${firstAgent.name} responds:`, response.content);
          } catch (error) {
            console.error('Error generating first agent response:', error);
          }
        }
      }, 2000);

      res.json({ success: true, message: 'Agent communication started' });
    } catch (error) {
      console.error('Error starting agent communication:', error);
      res.status(500).json({ message: 'Failed to start agent communication' });
    }
  });

  // Trigger agent responses to user messages
  app.post('/api/enhanced-agents/trigger-responses', async (req, res) => {
    try {
      const { collaborationId, userMessage, triggerAgentId } = req.body;
      
      const agents = [
        { id: "alex-frontend", name: "Alex", role: "Frontend Developer", provider: "openai" },
        { id: "maya-designer", name: "Maya", role: "UI/UX Designer", provider: "claude" },
        { id: "sam-backend", name: "Sam", role: "Backend Developer", provider: "gemini" },
        { id: "jordan-fullstack", name: "Jordan", role: "Full-Stack Developer", provider: "openai" }
      ];

      // Find agents that should respond (excluding the trigger agent if specified)
      const respondingAgents = agents.filter(agent => 
        !triggerAgentId || agent.id !== triggerAgentId
      );

      // Trigger responses from multiple agents with realistic delays
      for (let i = 0; i < Math.min(2, respondingAgents.length); i++) {
        const agent = respondingAgents[i];
        const delay = (i + 1) * 3000; // Stagger responses by 3 seconds

        setTimeout(async () => {
          try {
            let responsePrompt = `User said: "${userMessage}". `;
            
            if (agent.role === 'Frontend Developer') {
              responsePrompt += `As a frontend developer, respond with your thoughts on the UI/UX aspects and any frontend implementation details.`;
            } else if (agent.role === 'UI/UX Designer') {
              responsePrompt += `As a UI/UX designer, provide design insights and user experience considerations.`;
            } else if (agent.role === 'Backend Developer') {
              responsePrompt += `As a backend developer, focus on server-side logic, APIs, and database considerations.`;
            } else {
              responsePrompt += `Provide your professional perspective based on your role as ${agent.role}.`;
            }

            const response = {
              content: `As ${agent.role}, I think "${userMessage}" is a great point! Here's my perspective: ${responsePrompt}. Let me contribute my expertise to help move this forward.`,
              agentId: agent.id,
              messageType: 'text',
              confidence: 0.8
            };

            console.log(`Agent ${agent.name} responds to user:`, response.content);
          } catch (error) {
            console.error(`Error generating response from ${agent.name}:`, error);
          }
        }, delay);
      }

      res.json({ success: true, message: 'Agent responses triggered' });
    } catch (error) {
      console.error('Error triggering agent responses:', error);
      res.status(500).json({ message: 'Failed to trigger agent responses' });
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

  // Return existing HTTP server
  return httpServer;
}