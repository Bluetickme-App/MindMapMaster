import { agentFileSystem } from "./agent-file-system";
import { agentToolIntegration } from "./agent-tool-integration";
import { storage } from "../storage";
import { nanoid } from "nanoid";

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tools: ExtensionTool[];
  enabled: boolean;
  installed: boolean;
  downloadUrl?: string;
  githubUrl?: string;
  dependencies?: string[];
  permissions?: string[];
  icon?: string;
  readme?: string;
  changelog?: string;
  downloads?: number;
  rating?: number;
  lastUpdated?: string;
}

export interface ExtensionTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
  category: string;
  icon?: string;
  examples?: any[];
}

export interface ExtensionRepository {
  name: string;
  url: string;
  extensions: Extension[];
  lastSync?: string;
}

export class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private repositories: ExtensionRepository[] = [];
  private installedExtensions: Set<string> = new Set();

  constructor() {
    this.initializeDefaultExtensions();
    this.loadInstalledExtensions();
  }

  // Initialize with all available tool functions
  private initializeDefaultExtensions() {
    // Core File System Tools
    const fileSystemExtension: Extension = {
      id: "core-filesystem",
      name: "Core File System",
      description: "Essential file system operations for development",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Core",
      enabled: true,
      installed: true,
      icon: "📁",
      tools: [
        {
          name: "create_file",
          description: "Create a new file with content",
          category: "File Operations",
          icon: "📄",
          parameters: {
            path: { type: "string", required: true, description: "File path" },
            content: {
              type: "string",
              required: true,
              description: "File content",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("create_file", params),
          examples: [
            {
              path: "src/components/Button.tsx",
              content:
                "export default function Button() { return <button>Click me</button>; }",
            },
          ],
        },
        {
          name: "read_file",
          description: "Read content from a file",
          category: "File Operations",
          icon: "📖",
          parameters: {
            path: {
              type: "string",
              required: true,
              description: "File path to read",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("read_file", params),
          examples: [{ path: "package.json" }],
        },
        {
          name: "list_files",
          description: "List files in a directory",
          category: "File Operations",
          icon: "📋",
          parameters: {
            path: {
              type: "string",
              required: false,
              default: ".",
              description: "Directory path",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("list_files", params),
          examples: [{ path: "src" }],
        },
        {
          name: "delete_file",
          description: "Delete a file",
          category: "File Operations",
          icon: "🗑️",
          parameters: {
            path: {
              type: "string",
              required: true,
              description: "File path to delete",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("delete_file", params),
          examples: [{ path: "temp.txt" }],
        },
        {
          name: "create_directory",
          description: "Create a new directory",
          category: "File Operations",
          icon: "📁",
          parameters: {
            path: {
              type: "string",
              required: true,
              description: "Directory path",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("create_directory", params),
          examples: [{ path: "src/components" }],
        },
        {
          name: "search_files",
          description: "Search for files containing specific text",
          category: "File Operations",
          icon: "🔍",
          parameters: {
            query: {
              type: "string",
              required: true,
              description: "Search query",
            },
            maxResults: {
              type: "number",
              required: false,
              default: 10,
              description: "Maximum results",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool("search_files", params),
          examples: [{ query: "useState", maxResults: 5 }],
        },
        {
          name: "get_workspace_structure",
          description: "Get the structure of the workspace",
          category: "File Operations",
          icon: "🏗️",
          parameters: {
            depth: {
              type: "number",
              required: false,
              default: 2,
              description: "Directory depth",
            },
          },
          execute: async (params) =>
            await agentFileSystem.executeTool(
              "get_workspace_structure",
              params,
            ),
          examples: [{ depth: 3 }],
        },
      ],
    };

    // Code Generation Tools
    const codeGenExtension: Extension = {
      id: "code-generation",
      name: "Code Generation Tools",
      description: "AI-powered code generation and scaffolding",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Development",
      enabled: true,
      installed: true,
      icon: "⚡",
      tools: [
        {
          name: "generate_component",
          description: "Generate React component with TypeScript",
          category: "Code Generation",
          icon: "⚛️",
          parameters: {
            name: {
              type: "string",
              required: true,
              description: "Component name",
            },
            type: {
              type: "string",
              required: false,
              default: "functional",
              description: "Component type",
            },
            props: {
              type: "object",
              required: false,
              description: "Component props",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "generate_component",
              params,
            ),
          examples: [
            {
              name: "Button",
              type: "functional",
              props: { text: "string", onClick: "function" },
            },
          ],
        },
        {
          name: "generate_api_endpoint",
          description: "Generate API endpoint with Express.js",
          category: "Code Generation",
          icon: "🌐",
          parameters: {
            path: {
              type: "string",
              required: true,
              description: "API endpoint path",
            },
            method: {
              type: "string",
              required: false,
              default: "GET",
              description: "HTTP method",
            },
            description: {
              type: "string",
              required: false,
              description: "Endpoint description",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "generate_api_endpoint",
              params,
            ),
          examples: [
            { path: "/api/users", method: "GET", description: "Get all users" },
          ],
        },
        {
          name: "generate_css",
          description: "Generate CSS styles with Tailwind",
          category: "Code Generation",
          icon: "🎨",
          parameters: {
            selector: {
              type: "string",
              required: true,
              description: "CSS selector",
            },
            description: {
              type: "string",
              required: true,
              description: "Style description",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "generate_css",
              params,
            ),
          examples: [
            {
              selector: ".button",
              description: "Modern button with hover effects",
            },
          ],
        },
        {
          name: "analyze_code",
          description: "Analyze code quality and provide suggestions",
          category: "Code Analysis",
          icon: "🔍",
          parameters: {
            code: {
              type: "string",
              required: true,
              description: "Code to analyze",
            },
            language: {
              type: "string",
              required: false,
              default: "typescript",
              description: "Programming language",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "analyze_code",
              params,
            ),
          examples: [
            {
              code: 'function test() { return "hello"; }',
              language: "javascript",
            },
          ],
        },
      ],
    };

    // Build and Deployment Tools
    const buildExtension: Extension = {
      id: "build-deploy",
      name: "Build & Deploy Tools",
      description: "Build, test, and deployment utilities",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "DevOps",
      enabled: true,
      installed: true,
      icon: "🚀",
      tools: [
        {
          name: "run_build",
          description: "Run build process",
          category: "Build",
          icon: "🔨",
          parameters: {
            command: {
              type: "string",
              required: false,
              default: "npm run build",
              description: "Build command",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "run_build",
              params,
            ),
          examples: [{ command: "npm run build" }],
        },
        {
          name: "run_tests",
          description: "Run test suite",
          category: "Testing",
          icon: "🧪",
          parameters: {
            command: {
              type: "string",
              required: false,
              default: "npm test",
              description: "Test command",
            },
            coverage: {
              type: "boolean",
              required: false,
              default: false,
              description: "Include coverage",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "run_tests",
              params,
            ),
          examples: [{ command: "npm test", coverage: true }],
        },
        {
          name: "deploy_app",
          description: "Deploy application to production",
          category: "Deployment",
          icon: "🚀",
          parameters: {
            target: {
              type: "string",
              required: false,
              default: "production",
              description: "Deployment target",
            },
            branch: {
              type: "string",
              required: false,
              default: "main",
              description: "Git branch",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "deploy_app",
              params,
            ),
          examples: [{ target: "production", branch: "main" }],
        },
      ],
    };

    // Database Tools
    const databaseExtension: Extension = {
      id: "database-tools",
      name: "Database Tools",
      description: "Database operations and management",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Database",
      enabled: true,
      installed: true,
      icon: "🗄️",
      tools: [
        {
          name: "query_database",
          description: "Execute database query",
          category: "Database",
          icon: "🔍",
          parameters: {
            query: { type: "string", required: true, description: "SQL query" },
            params: {
              type: "array",
              required: false,
              description: "Query parameters",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "query_database",
              params,
            ),
          examples: [
            { query: "SELECT * FROM users WHERE active = $1", params: [true] },
          ],
        },
        {
          name: "migrate_database",
          description: "Run database migrations",
          category: "Database",
          icon: "🔄",
          parameters: {
            direction: {
              type: "string",
              required: false,
              default: "up",
              description: "Migration direction",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "migrate_database",
              params,
            ),
          examples: [{ direction: "up" }],
        },
      ],
    };

    // Package Management Tools
    const packageExtension: Extension = {
      id: "package-management",
      name: "Package Management",
      description: "NPM and package management utilities",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Development",
      enabled: true,
      installed: true,
      icon: "📦",
      tools: [
        {
          name: "install_package",
          description: "Install NPM package",
          category: "Package Management",
          icon: "📥",
          parameters: {
            package: {
              type: "string",
              required: true,
              description: "Package name",
            },
            dev: {
              type: "boolean",
              required: false,
              default: false,
              description: "Install as dev dependency",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "install_package",
              params,
            ),
          examples: [{ package: "react-router-dom", dev: false }],
        },
        {
          name: "update_package",
          description: "Update NPM package",
          category: "Package Management",
          icon: "🔄",
          parameters: {
            package: {
              type: "string",
              required: true,
              description: "Package name",
            },
            version: {
              type: "string",
              required: false,
              description: "Target version",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "update_package",
              params,
            ),
          examples: [{ package: "react", version: "latest" }],
        },
      ],
    };

    // Git Tools
    const gitExtension: Extension = {
      id: "git-tools",
      name: "Git Tools",
      description: "Git version control operations",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Version Control",
      enabled: true,
      installed: true,
      icon: "🔄",
      tools: [
        {
          name: "git_commit",
          description: "Create git commit",
          category: "Git",
          icon: "💾",
          parameters: {
            message: {
              type: "string",
              required: true,
              description: "Commit message",
            },
            files: {
              type: "array",
              required: false,
              description: "Files to commit",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "git_commit",
              params,
            ),
          examples: [
            {
              message: "feat: add new component",
              files: ["src/components/Button.tsx"],
            },
          ],
        },
        {
          name: "git_push",
          description: "Push git changes",
          category: "Git",
          icon: "🚀",
          parameters: {
            remote: {
              type: "string",
              required: false,
              default: "origin",
              description: "Remote name",
            },
            branch: {
              type: "string",
              required: false,
              default: "main",
              description: "Branch name",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "git_push",
              params,
            ),
          examples: [{ remote: "origin", branch: "main" }],
        },
      ],
    };

    // Environment Tools
    const envExtension: Extension = {
      id: "environment-tools",
      name: "Environment Tools",
      description: "Environment and configuration management",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Configuration",
      enabled: true,
      installed: true,
      icon: "⚙️",
      tools: [
        {
          name: "set_env_var",
          description: "Set environment variable",
          category: "Environment",
          icon: "🔧",
          parameters: {
            name: {
              type: "string",
              required: true,
              description: "Variable name",
            },
            value: {
              type: "string",
              required: true,
              description: "Variable value",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "set_env_var",
              params,
            ),
          examples: [{ name: "NODE_ENV", value: "production" }],
        },
        {
          name: "get_env_var",
          description: "Get environment variable",
          category: "Environment",
          icon: "🔍",
          parameters: {
            name: {
              type: "string",
              required: true,
              description: "Variable name",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "get_env_var",
              params,
            ),
          examples: [{ name: "NODE_ENV" }],
        },
      ],
    };

    // Server Tools
    const serverExtension: Extension = {
      id: "server-tools",
      name: "Server Tools",
      description: "Server management and control",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Server",
      enabled: true,
      installed: true,
      icon: "🖥️",
      tools: [
        {
          name: "start_server",
          description: "Start development server",
          category: "Server",
          icon: "▶️",
          parameters: {
            port: {
              type: "number",
              required: false,
              default: 3000,
              description: "Server port",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "start_server",
              params,
            ),
          examples: [{ port: 3000 }],
        },
        {
          name: "stop_server",
          description: "Stop development server",
          category: "Server",
          icon: "⏹️",
          parameters: {},
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "stop_server",
              params,
            ),
          examples: [{}],
        },
      ],
    };

    // External API Tools
    const apiExtension: Extension = {
      id: "external-api",
      name: "External API Tools",
      description: "External API integration and web search",
      version: "1.0.0",
      author: "CodeCraft Team",
      category: "Integration",
      enabled: true,
      installed: true,
      icon: "🌐",
      tools: [
        {
          name: "call_external_api",
          description: "Call external API",
          category: "API",
          icon: "🔌",
          parameters: {
            url: { type: "string", required: true, description: "API URL" },
            method: {
              type: "string",
              required: false,
              default: "GET",
              description: "HTTP method",
            },
            headers: {
              type: "object",
              required: false,
              description: "Request headers",
            },
            body: {
              type: "object",
              required: false,
              description: "Request body",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "call_external_api",
              params,
            ),
          examples: [
            {
              url: "https://api.github.com/user",
              method: "GET",
              headers: { Authorization: "Bearer token" },
            },
          ],
        },
        {
          name: "search_web",
          description: "Search the web for information",
          category: "Search",
          icon: "🔍",
          parameters: {
            query: {
              type: "string",
              required: true,
              description: "Search query",
            },
            maxResults: {
              type: "number",
              required: false,
              default: 5,
              description: "Maximum results",
            },
          },
          execute: async (params) =>
            await agentToolIntegration.executeToolForAgent(
              1,
              "search_web",
              params,
            ),
          examples: [{ query: "React hooks tutorial", maxResults: 10 }],
        },
      ],
    };

    // Add all extensions to the registry
    [
      fileSystemExtension,
      codeGenExtension,
      buildExtension,
      databaseExtension,
      packageExtension,
      gitExtension,
      envExtension,
      serverExtension,
      apiExtension,
    ].forEach((ext) => {
      this.extensions.set(ext.id, ext);
      this.installedExtensions.add(ext.id);
    });
  }

  // Load installed extensions from storage
  private async loadInstalledExtensions() {
    // Implementation would load from database
    console.log("📦 Loading installed extensions...");
  }

  // Get all extensions
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  // Get installed extensions
  getInstalledExtensions(): Extension[] {
    return Array.from(this.extensions.values()).filter((ext) => ext.installed);
  }

  // Get enabled extensions
  getEnabledExtensions(): Extension[] {
    return Array.from(this.extensions.values()).filter((ext) => ext.enabled);
  }

  // Get extension by ID
  getExtension(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  // Install extension
  async installExtension(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.get(id);
    if (!extension) {
      return { success: false, message: "Extension not found" };
    }

    if (extension.installed) {
      return { success: false, message: "Extension already installed" };
    }

    // Download and install extension
    if (extension.downloadUrl) {
      try {
        // Mock download process
        extension.installed = true;
        extension.enabled = true;
        this.installedExtensions.add(id);

        return {
          success: true,
          message: `Extension ${extension.name} installed successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to install extension: ${(error as Error).message}`,
        };
      }
    }

    return { success: false, message: "No download URL provided" };
  }

  // Uninstall extension
  async uninstallExtension(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const extension = this.extensions.get(id);
    if (!extension) {
      return { success: false, message: "Extension not found" };
    }

    if (!extension.installed) {
      return { success: false, message: "Extension not installed" };
    }

    extension.installed = false;
    extension.enabled = false;
    this.installedExtensions.delete(id);

    return {
      success: true,
      message: `Extension ${extension.name} uninstalled successfully`,
    };
  }

  // Enable/disable extension
  async toggleExtension(
    id: string,
  ): Promise<{ success: boolean; message: string; enabled: boolean }> {
    const extension = this.extensions.get(id);
    if (!extension) {
      return { success: false, message: "Extension not found", enabled: false };
    }

    if (!extension.installed) {
      return {
        success: false,
        message: "Extension not installed",
        enabled: false,
      };
    }

    extension.enabled = !extension.enabled;

    return {
      success: true,
      message: `Extension ${extension.name} ${extension.enabled ? "enabled" : "disabled"}`,
      enabled: extension.enabled,
    };
  }

  // Get all available tools from enabled extensions
  getAllAvailableTools(): ExtensionTool[] {
    const tools: ExtensionTool[] = [];

    for (const extension of Array.from(this.extensions.values())) {
      if (extension.enabled && extension.installed) {
        tools.push(...extension.tools);
      }
    }

    return tools;
  }

  // Execute tool by name
  async executeTool(toolName: string, parameters: any): Promise<any> {
    const tools = this.getAllAvailableTools();
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    return await tool.execute(parameters);
  }

  // Search extensions
  searchExtensions(query: string): Extension[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.extensions.values()).filter(
      (ext) =>
        ext.name.toLowerCase().includes(lowercaseQuery) ||
        ext.description.toLowerCase().includes(lowercaseQuery) ||
        ext.category.toLowerCase().includes(lowercaseQuery),
    );
  }

  // Get extensions by category
  getExtensionsByCategory(category: string): Extension[] {
    return Array.from(this.extensions.values()).filter(
      (ext) => ext.category === category,
    );
  }

  // Get all categories
  getAllCategories(): string[] {
    const categories = new Set<string>();
    for (const extension of Array.from(this.extensions.values())) {
      categories.add(extension.category);
    }
    return Array.from(categories);
  }

  // Add external extension repository
  async addRepository(
    name: string,
    url: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Mock repository sync
      const repo: ExtensionRepository = {
        name,
        url,
        extensions: [],
        lastSync: new Date().toISOString(),
      };

      this.repositories.push(repo);
      return {
        success: true,
        message: `Repository ${name} added successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add repository: ${(error as Error).message}`,
      };
    }
  }

  // Get repository statistics
  getStats(): {
    total: number;
    installed: number;
    enabled: number;
    categories: number;
    repositories: number;
  } {
    return {
      total: this.extensions.size,
      installed: this.installedExtensions.size,
      enabled: this.getEnabledExtensions().length,
      categories: this.getAllCategories().length,
      repositories: this.repositories.length,
    };
  }
}

export const extensionManager = new ExtensionManager();
