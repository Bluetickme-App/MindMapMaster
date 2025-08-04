import { Express } from "express";
import * as fs from "fs";
import * as path from "path";

interface ProjectConfig {
  id: string;
  name: string;
  type: "html" | "react" | "node" | "python" | "php";
  entryPoint: string;
  assets: string[];
  port?: number;
}

export class DevUrlConstructor {
  private projects: Map<string, ProjectConfig> = new Map();
  private app: Express;

  constructor(app: Express) {
    this.app = app;

    // Discover and register all existing projects
    this.discoverProjects();

    // Setup routes for all discovered projects
    if (this.projects.size > 0) {
      this.setupProjectRoutes();
    }

    console.log(`📦 Discovered ${this.projects.size} projects for dev URLs`);
  }

  // Register a project with its configuration
  registerProject(config: ProjectConfig): string {
    this.projects.set(config.id, config);

    // Setup routes for the new project
    this.setupProjectRoutes(config);

    // Return the dev URL for this project
    return `http://localhost:5000/dev/${config.id}`;
  }

  // Setup routes for all projects
  private setupProjectRoutes(specificProject?: ProjectConfig) {
    const projectsToSetup = specificProject
      ? [specificProject]
      : Array.from(this.projects.values());

    projectsToSetup.forEach((project) => {
      const projectPath = path.join(process.cwd(), "projects", project.id);

      // Main project route - serve index.html or main entry point
      this.app.get(`/dev/${project.id}`, (req, res) => {
        console.log(
          `📁 Serving main route for ${project.id}: ${project.entryPoint}`,
        );
        this.serveProjectFile(project, project.entryPoint, res);
      });

      // Asset routes for the project - handle all file requests
      this.app.get(`/dev/${project.id}/*`, (req, res) => {
        const requestedFile = (req.params as any)[0] as string;
        console.log(`📄 Serving asset for ${project.id}: ${requestedFile}`);
        this.serveProjectFile(project, requestedFile, res);
      });

      // API routes for the project (if it has backend)
      if (
        project.type === "node" ||
        project.type === "python" ||
        project.type === "php"
      ) {
        this.app.all(`/api/dev/${project.id}/*`, (req, res) => {
          // Proxy to project's backend if running
          res.json({
            message: `API endpoint for ${project.name}`,
            path: req.path,
          });
        });
      }
    });
  }

  // Serve individual project files
  private serveProjectFile(project: ProjectConfig, filePath: string, res: any) {
    try {
      const projectPath = path.join(process.cwd(), "projects", project.id);
      const fullPath = path.join(projectPath, filePath);

      console.log(`🔍 Attempting to serve: ${fullPath}`);
      console.log(`📂 Project path: ${projectPath}`);
      console.log(`📋 Project exists: ${fs.existsSync(projectPath)}`);

      // Security check - ensure file is within project directory
      if (!fullPath.startsWith(projectPath)) {
        console.log(`❌ Security check failed for ${fullPath}`);
        return res.status(403).send("Access denied");
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${fullPath}`);
        // List directory contents for debugging
        if (fs.existsSync(projectPath)) {
          const files = fs.readdirSync(projectPath);
          console.log(`📁 Available files in ${project.id}:`, files);
        }
        return res
          .status(404)
          .send(`File not found: ${filePath} in project ${project.id}`);
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const mimeType = this.getMimeType(filePath);

      console.log(
        `✅ Successfully serving ${filePath} with MIME type ${mimeType}`,
      );

      res.setHeader("Content-Type", mimeType);

      // For HTML files, inject live reload script and fix relative paths
      if (mimeType === "text/html") {
        const injectedContent = this.injectLiveReload(content, project.id);
        const fixedContent = this.fixRelativePaths(injectedContent, project.id);
        res.send(fixedContent);
      } else {
        res.send(content);
      }
    } catch (error: any) {
      console.error(`❌ Error serving ${project.id}/${filePath}:`, error);
      res.status(500).send(`Server error: ${(error as Error).message}`);
    }
  }

  // Get MIME type for file extension
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".ttf": "font/ttf",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    };

    return mimeTypes[ext] || "text/plain";
  }

  // Inject live reload script for development
  private injectLiveReload(htmlContent: string, projectId: string): string {
    const liveReloadScript = `
    <script>
      // Live reload for ${projectId}
      (function() {
        try {
          const ws = new WebSocket('ws://localhost:5000/ws');
          ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'reload' && data.projectId === '${projectId}') {
              location.reload();
            }
          };
        } catch (e) {
          console.log('Live reload websocket not available');
        }
      })();
    </script>
    `;

    if (htmlContent.includes("</body>")) {
      return htmlContent.replace("</body>", liveReloadScript + "</body>");
    } else {
      return htmlContent + liveReloadScript;
    }
  }

  // Fix relative paths in HTML to work with dev URL structure
  private fixRelativePaths(htmlContent: string, projectId: string): string {
    // Fix relative CSS links
    htmlContent = htmlContent.replace(
      /href="(?!http|\/\/|\/dev\/)([^"]+\.css)"/g,
      `href="/dev/${projectId}/$1"`,
    );

    // Fix relative JS links
    htmlContent = htmlContent.replace(
      /src="(?!http|\/\/|\/dev\/)([^"]+\.js)"/g,
      `src="/dev/${projectId}/$1"`,
    );

    // Fix relative image sources
    htmlContent = htmlContent.replace(
      /src="(?!http|\/\/|\/dev\/)([^"]+\.(png|jpg|jpeg|gif|svg))"/g,
      `src="/dev/${projectId}/$1"`,
    );

    return htmlContent;
  }

  // Auto-discover projects and register them
  discoverProjects(): string[] {
    const projectsDir = path.join(process.cwd(), "projects");
    const devUrls: string[] = [];

    if (!fs.existsSync(projectsDir)) {
      return devUrls;
    }

    const projectDirs = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    projectDirs.forEach((projectDir) => {
      const projectPath = path.join(projectsDir, projectDir);
      const config = this.detectProjectType(projectDir, projectPath);

      if (config) {
        const devUrl = this.registerProject(config);
        devUrls.push(devUrl);
        console.log(`📦 Registered project: ${config.name} at ${devUrl}`);
      }
    });

    return devUrls;
  }

  // Detect project type and create config
  private detectProjectType(
    projectId: string,
    projectPath: string,
  ): ProjectConfig | null {
    const files = fs.readdirSync(projectPath);

    // Check for package.json (Node.js/React)
    if (files.includes("package.json")) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"),
      );
      return {
        id: projectId,
        name: packageJson.name || projectId,
        type: "node",
        entryPoint: "index.html",
        assets: files.filter(
          (f) => f.endsWith(".css") || f.endsWith(".js") || f.endsWith(".html"),
        ),
      };
    }

    // Check for index.html (Static site)
    if (files.includes("index.html")) {
      return {
        id: projectId,
        name: projectId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        type: "html",
        entryPoint: "index.html",
        assets: files.filter(
          (f) => f.endsWith(".css") || f.endsWith(".js") || f.endsWith(".html"),
        ),
      };
    }

    // Check for main.py (Python)
    if (files.includes("main.py") || files.includes("app.py")) {
      return {
        id: projectId,
        name: projectId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        type: "python",
        entryPoint: files.includes("main.py") ? "main.py" : "app.py",
        assets: files.filter((f) => f.endsWith(".py") || f.endsWith(".html")),
      };
    }

    // Check for index.php (PHP)
    if (files.includes("index.php")) {
      return {
        id: projectId,
        name: projectId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        type: "php",
        entryPoint: "index.php",
        assets: files.filter(
          (f) => f.endsWith(".php") || f.endsWith(".css") || f.endsWith(".js"),
        ),
      };
    }

    return null;
  }

  // Get all registered projects
  getProjects(): ProjectConfig[] {
    return Array.from(this.projects.values());
  }

  // Get dev URL for a specific project
  getDevUrl(projectId: string): string | null {
    const project = this.projects.get(projectId);
    return project ? `http://localhost:5000/dev/${projectId}` : null;
  }

  // Trigger live reload for a project
  triggerReload(projectId: string) {
    // This would integrate with the WebSocket system
    console.log(`🔄 Triggering reload for project: ${projectId}`);
  }
}

export const devUrlConstructor = new DevUrlConstructor(null as any); // Will be initialized in routes.ts
