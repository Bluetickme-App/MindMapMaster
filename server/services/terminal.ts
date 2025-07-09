import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface TerminalOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'exit';
  content: string;
  timestamp: string;
  exitCode?: number;
}

export class TerminalService extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private currentDirectory: string = process.cwd();

  constructor() {
    super();
  }

  async executeCommand(command: string, sessionId: string): Promise<void> {
    const output: TerminalOutput = {
      id: sessionId,
      type: 'stdout',
      content: `$ ${command}\n`,
      timestamp: new Date().toISOString(),
    };

    this.emit('output', output);

    try {
      const [cmd, ...args] = command.trim().split(' ');
      
      // Handle built-in commands
      if (cmd === 'cd') {
        await this.handleCdCommand(args[0] || '~', sessionId);
        return;
      }
      
      if (cmd === 'pwd') {
        this.emit('output', {
          id: sessionId,
          type: 'stdout',
          content: `${this.currentDirectory}\n`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (cmd === 'clear') {
        this.emit('clear', sessionId);
        return;
      }

      // Execute command
      const childProcess = spawn(cmd, args, {
        cwd: this.currentDirectory,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(sessionId, childProcess);

      childProcess.stdout?.on('data', (data) => {
        this.emit('output', {
          id: sessionId,
          type: 'stdout',
          content: data.toString(),
          timestamp: new Date().toISOString(),
        });
      });

      childProcess.stderr?.on('data', (data) => {
        this.emit('output', {
          id: sessionId,
          type: 'stderr',
          content: data.toString(),
          timestamp: new Date().toISOString(),
        });
      });

      childProcess.on('exit', (code) => {
        this.emit('output', {
          id: sessionId,
          type: 'exit',
          content: code === 0 ? '' : `Process exited with code ${code}\n`,
          timestamp: new Date().toISOString(),
          exitCode: code || 0,
        });
        this.processes.delete(sessionId);
      });

      childProcess.on('error', (error) => {
        this.emit('output', {
          id: sessionId,
          type: 'stderr',
          content: `Error: ${error.message}\n`,
          timestamp: new Date().toISOString(),
        });
        this.processes.delete(sessionId);
      });

    } catch (error) {
      this.emit('output', {
        id: sessionId,
        type: 'stderr',
        content: `Error: ${error}\n`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleCdCommand(path: string, sessionId: string): Promise<void> {
    try {
      const fs = await import('fs');
      const pathModule = await import('path');
      
      let newPath = path;
      
      if (path === '~') {
        newPath = process.env.HOME || process.cwd();
      } else if (!pathModule.isAbsolute(path)) {
        newPath = pathModule.join(this.currentDirectory, path);
      }
      
      // Check if directory exists
      if (fs.existsSync(newPath) && fs.lstatSync(newPath).isDirectory()) {
        this.currentDirectory = newPath;
        this.emit('output', {
          id: sessionId,
          type: 'stdout',
          content: '',
          timestamp: new Date().toISOString(),
        });
      } else {
        this.emit('output', {
          id: sessionId,
          type: 'stderr',
          content: `cd: ${path}: No such file or directory\n`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.emit('output', {
        id: sessionId,
        type: 'stderr',
        content: `cd: ${error}\n`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  killProcess(sessionId: string): void {
    const process = this.processes.get(sessionId);
    if (process && !process.killed) {
      process.kill('SIGTERM');
      this.processes.delete(sessionId);
    }
  }

  sendInput(sessionId: string, input: string): void {
    const process = this.processes.get(sessionId);
    if (process && process.stdin) {
      process.stdin.write(input);
    }
  }

  getCurrentDirectory(): string {
    return this.currentDirectory;
  }

  setCurrentDirectory(dir: string): void {
    this.currentDirectory = dir;
  }

  getRunningProcesses(): string[] {
    return Array.from(this.processes.keys());
  }
}

export const terminalService = new TerminalService();