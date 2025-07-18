import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface ServerAccessResponse {
  success: boolean;
  output?: string;
  error?: string;
  timestamp: Date;
  command?: string;
}

export class AgentServerAccess {
  private logHistory: Array<{ timestamp: Date; command: string; output: string; error?: string }> = [];

  // NPM Package Management
  async installDependency(packageName: string, isDev: boolean = false): Promise<ServerAccessResponse> {
    try {
      const devFlag = isDev ? '--save-dev' : '--save';
      const command = `npm install ${packageName} ${devFlag}`;
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });

      this.logHistory.push({
        timestamp: new Date(),
        command,
        output: stdout,
        error: stderr
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        timestamp: new Date(),
        command
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        command: `npm install ${packageName}`
      };
    }
  }

  async uninstallDependency(packageName: string): Promise<ServerAccessResponse> {
    try {
      const command = `npm uninstall ${packageName}`;
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });

      this.logHistory.push({
        timestamp: new Date(),
        command,
        output: stdout,
        error: stderr
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        timestamp: new Date(),
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `npm uninstall ${packageName}`
      };
    }
  }

  async updateDependencies(): Promise<ServerAccessResponse> {
    try {
      const command = 'npm update';
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        timeout: 300000 // 5 minute timeout
      });

      this.logHistory.push({
        timestamp: new Date(),
        command,
        output: stdout,
        error: stderr
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        timestamp: new Date(),
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: 'npm update'
      };
    }
  }

  // Server Configuration Management
  async updateServerConfig(configPath: string, configData: any): Promise<ServerAccessResponse> {
    try {
      const fullPath = path.resolve(configPath);
      const configContent = JSON.stringify(configData, null, 2);
      
      await writeFile(fullPath, configContent, 'utf8');

      this.logHistory.push({
        timestamp: new Date(),
        command: `update-config: ${configPath}`,
        output: `Configuration updated successfully: ${configPath}`
      });

      return {
        success: true,
        output: `Configuration updated: ${configPath}`,
        timestamp: new Date(),
        command: `update-config: ${configPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `update-config: ${configPath}`
      };
    }
  }

  async readServerConfig(configPath: string): Promise<ServerAccessResponse> {
    try {
      const fullPath = path.resolve(configPath);
      const content = await readFile(fullPath, 'utf8');

      return {
        success: true,
        output: content,
        timestamp: new Date(),
        command: `read-config: ${configPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `read-config: ${configPath}`
      };
    }
  }

  // Deep Server Debugging
  async executeCommand(command: string, options: { timeout?: number; cwd?: string } = {}): Promise<ServerAccessResponse> {
    try {
      const { timeout = 30000, cwd = process.cwd() } = options;
      const { stdout, stderr } = await execAsync(command, { 
        cwd,
        timeout,
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      this.logHistory.push({
        timestamp: new Date(),
        command,
        output: stdout,
        error: stderr
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        timestamp: new Date(),
        command
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logHistory.push({
        timestamp: new Date(),
        command,
        output: '',
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        command
      };
    }
  }

  async getServerLogs(service: string = 'all', lines: number = 100): Promise<ServerAccessResponse> {
    try {
      let command = '';
      
      switch (service) {
        case 'npm':
          command = 'npm run dev 2>&1 | tail -n ' + lines;
          break;
        case 'process':
          command = 'ps aux | grep node';
          break;
        case 'network':
          command = 'netstat -tulpn | grep :5000';
          break;
        case 'memory':
          command = 'free -h && df -h';
          break;
        case 'all':
        default:
          command = `echo "=== Process Info ===" && ps aux | grep node && echo "=== Network Info ===" && netstat -tulpn | grep :5000 && echo "=== Memory Info ===" && free -h && echo "=== Disk Info ===" && df -h`;
          break;
      }

      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        timeout: 15000
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        timestamp: new Date(),
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `get-logs: ${service}`
      };
    }
  }

  // Environment Management
  async updateEnvironment(envVar: string, value: string): Promise<ServerAccessResponse> {
    try {
      process.env[envVar] = value;
      
      this.logHistory.push({
        timestamp: new Date(),
        command: `set-env: ${envVar}`,
        output: `Environment variable ${envVar} updated`
      });

      return {
        success: true,
        output: `Environment variable ${envVar} updated`,
        timestamp: new Date(),
        command: `set-env: ${envVar}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `set-env: ${envVar}`
      };
    }
  }

  async restartServer(): Promise<ServerAccessResponse> {
    try {
      // In development, we can restart by killing and restarting the process
      const command = 'pkill -f "tsx server/index.ts" && npm run dev';
      
      // Note: This is a fire-and-forget operation
      setTimeout(async () => {
        try {
          await execAsync(command, { cwd: process.cwd() });
        } catch (error) {
          console.error('Server restart error:', error);
        }
      }, 1000);

      return {
        success: true,
        output: 'Server restart initiated',
        timestamp: new Date(),
        command: 'restart-server'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: 'restart-server'
      };
    }
  }

  // File System Operations
  async createConfigFile(filePath: string, content: string): Promise<ServerAccessResponse> {
    try {
      const fullPath = path.resolve(filePath);
      const directory = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await mkdir(directory, { recursive: true });
      await writeFile(fullPath, content, 'utf8');

      this.logHistory.push({
        timestamp: new Date(),
        command: `create-file: ${filePath}`,
        output: `File created: ${filePath}`
      });

      return {
        success: true,
        output: `File created: ${filePath}`,
        timestamp: new Date(),
        command: `create-file: ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        command: `create-file: ${filePath}`
      };
    }
  }

  // Get Command History
  getCommandHistory(limit: number = 50): Array<{ timestamp: Date; command: string; output: string; error?: string }> {
    return this.logHistory.slice(-limit);
  }

  // Clear History
  clearHistory(): void {
    this.logHistory = [];
  }
}

export const agentServerAccess = new AgentServerAccess();