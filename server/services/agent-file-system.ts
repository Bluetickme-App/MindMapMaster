import { fileSystemService } from './file-system';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export class AgentFileSystemService {
  private tools: AgentTool[] = [];

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    this.tools = [
      {
        name: 'create_file',
        description: 'Create a new file with content',
        parameters: {
          path: { type: 'string', required: true },
          content: { type: 'string', required: true }
        },
        execute: async (params) => {
          try {
            await fileSystemService.writeFile(1, params.path, params.content);
            return { success: true, message: `File created: ${params.path}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'read_file',
        description: 'Read content from a file',
        parameters: {
          path: { type: 'string', required: true }
        },
        execute: async (params) => {
          try {
            const content = await fileSystemService.readFile(1, params.path);
            return { success: true, content };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        parameters: {
          path: { type: 'string', required: false, default: '.' }
        },
        execute: async (params) => {
          try {
            const files = await fileSystemService.listFiles(1, params.path || '.');
            return { success: true, files };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: {
          path: { type: 'string', required: true }
        },
        execute: async (params) => {
          try {
            await fileSystemService.deleteFile(1, params.path);
            return { success: true, message: `File deleted: ${params.path}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: {
          path: { type: 'string', required: true }
        },
        execute: async (params) => {
          try {
            await fileSystemService.createDirectory(1, params.path);
            return { success: true, message: `Directory created: ${params.path}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'search_files',
        description: 'Search for files containing specific text',
        parameters: {
          query: { type: 'string', required: true },
          maxResults: { type: 'number', required: false, default: 10 }
        },
        execute: async (params) => {
          try {
            const results = await fileSystemService.searchFiles(1, params.query, params.maxResults);
            return { success: true, results };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'get_workspace_structure',
        description: 'Get the structure of the workspace',
        parameters: {
          depth: { type: 'number', required: false, default: 2 }
        },
        execute: async (params) => {
          try {
            const structure = await fileSystemService.getWorkspaceStructure(1, params.depth);
            return { success: true, structure };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      }
    ];
  }

  // Get all available tools
  getAvailableTools(): AgentTool[] {
    return this.tools;
  }

  // Get specific tool by name
  getTool(name: string): AgentTool | undefined {
    return this.tools.find(tool => tool.name === name);
  }

  // Execute a tool with parameters
  async executeTool(toolName: string, parameters: any): Promise<any> {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validate parameters
    const requiredParams = Object.entries(tool.parameters)
      .filter(([_, config]: [string, any]) => config.required)
      .map(([name, _]) => name);

    for (const param of requiredParams) {
      if (!(param in parameters)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    return await tool.execute(parameters);
  }

  // Get workspace structure for agent context
  async getWorkspaceStructure(depth: number = 2): Promise<any> {
    try {
      return await fileSystemService.getWorkspaceStructure(1, depth);
    } catch (error) {
      console.error('Error getting workspace structure:', error);
      return {};
    }
  }

  // Search for files containing specific content
  async searchFiles(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      return await fileSystemService.searchFiles(1, query, maxResults);
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  // Create a new file with content
  async createFile(path: string, content: string): Promise<boolean> {
    try {
      await fileSystemService.writeFile(1, path, content);
      return true;
    } catch (error) {
      console.error('Error creating file:', error);
      return false;
    }
  }

  // Read file content
  async readFile(path: string): Promise<string | null> {
    try {
      return await fileSystemService.readFile(1, path);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  // List files in directory
  async listFiles(path: string = '.'): Promise<any[]> {
    try {
      return await fileSystemService.listFiles(1, path);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  // Delete a file
  async deleteFile(path: string): Promise<boolean> {
    try {
      await fileSystemService.deleteFile(1, path);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Create a directory
  async createDirectory(path: string): Promise<boolean> {
    try {
      await fileSystemService.createDirectory(1, path);
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }

  // Get file statistics
  async getFileStats(path: string): Promise<any> {
    try {
      return await fileSystemService.getFileStats(1, path);
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  }

  // Check if file exists
  async fileExists(path: string): Promise<boolean> {
    try {
      const stats = await fileSystemService.getFileStats(1, path);
      return !!stats;
    } catch (error) {
      return false;
    }
  }

  // Get file content with metadata
  async getFileWithMetadata(path: string): Promise<any> {
    try {
      const [content, stats] = await Promise.all([
        fileSystemService.readFile(1, path),
        fileSystemService.getFileStats(1, path)
      ]);
      
      return {
        path,
        content,
        stats,
        exists: true
      };
    } catch (error) {
      return {
        path,
        content: null,
        stats: null,
        exists: false,
        error: error.message
      };
    }
  }
}

export const agentFileSystem = new AgentFileSystemService();