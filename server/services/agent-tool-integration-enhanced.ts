import { agentServerAccess } from './agent-server-access';
import { fileSystemService } from './file-system';
import { terminalService } from './terminal';

export interface AgentToolCall {
  toolName: string;
  parameters: Record<string, any>;
  agentId: string;
  timestamp: Date;
}

export interface AgentToolResponse {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
  timestamp: Date;
}

export class AgentToolIntegrationEnhanced {
  private toolHistory: AgentToolCall[] = [];

  // Enhanced NPM Management Tools
  async installPackage(agentId: string, packageName: string, isDev: boolean = false): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'install_package',
      parameters: { packageName, isDev },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.installDependency(packageName, isDev);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { packageName, isDev, command: result.command },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async uninstallPackage(agentId: string, packageName: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'uninstall_package',
      parameters: { packageName },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.uninstallDependency(packageName);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { packageName, command: result.command },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async updateAllDependencies(agentId: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'update_dependencies',
      parameters: {},
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.updateDependencies();
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Enhanced Server Configuration Tools
  async updateServerConfig(agentId: string, configPath: string, configData: any): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'update_server_config',
      parameters: { configPath, configData },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.updateServerConfig(configPath, configData);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { configPath, configData },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async readServerConfig(agentId: string, configPath: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'read_server_config',
      parameters: { configPath },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.readServerConfig(configPath);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { configPath },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Enhanced Command Execution Tools
  async executeSystemCommand(agentId: string, command: string, options: { timeout?: number; cwd?: string } = {}): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'execute_system_command',
      parameters: { command, options },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.executeCommand(command, options);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { command, options },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Enhanced Server Monitoring Tools
  async getServerLogs(agentId: string, service: string = 'all', lines: number = 100): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'get_server_logs',
      parameters: { service, lines },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.getServerLogs(service, lines);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { service, lines },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async getSystemMetrics(agentId: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'get_system_metrics',
      parameters: {},
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const memoryResult = await agentServerAccess.executeCommand('free -h');
      const diskResult = await agentServerAccess.executeCommand('df -h');
      const processResult = await agentServerAccess.executeCommand('ps aux | grep node');
      const networkResult = await agentServerAccess.executeCommand('netstat -tulpn | grep :5000');
      
      return {
        success: true,
        output: `Memory:\n${memoryResult.output}\n\nDisk:\n${diskResult.output}\n\nProcesses:\n${processResult.output}\n\nNetwork:\n${networkResult.output}`,
        data: {
          memory: memoryResult.output,
          disk: diskResult.output,
          processes: processResult.output,
          network: networkResult.output
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Enhanced Environment Management
  async updateEnvironmentVariable(agentId: string, envVar: string, value: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'update_environment_variable',
      parameters: { envVar, value },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.updateEnvironment(envVar, value);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { envVar, value: '***masked***' },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async restartServer(agentId: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'restart_server',
      parameters: {},
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.restartServer();
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Enhanced File Operations
  async createConfigFile(agentId: string, filePath: string, content: string): Promise<AgentToolResponse> {
    const toolCall: AgentToolCall = {
      toolName: 'create_config_file',
      parameters: { filePath, content },
      agentId,
      timestamp: new Date()
    };
    
    this.toolHistory.push(toolCall);
    
    try {
      const result = await agentServerAccess.createConfigFile(filePath, content);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        data: { filePath, contentLength: content.length },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Tool History Management
  getToolHistory(agentId?: string, limit: number = 50): AgentToolCall[] {
    let history = this.toolHistory;
    
    if (agentId) {
      history = history.filter(call => call.agentId === agentId);
    }
    
    return history.slice(-limit);
  }

  clearToolHistory(agentId?: string): void {
    if (agentId) {
      this.toolHistory = this.toolHistory.filter(call => call.agentId !== agentId);
    } else {
      this.toolHistory = [];
    }
  }

  // Get available tools for agents
  getAvailableTools(): string[] {
    return [
      'install_package',
      'uninstall_package', 
      'update_dependencies',
      'update_server_config',
      'read_server_config',
      'execute_system_command',
      'get_server_logs',
      'get_system_metrics',
      'update_environment_variable',
      'restart_server',
      'create_config_file'
    ];
  }
}

export const agentToolIntegrationEnhanced = new AgentToolIntegrationEnhanced();