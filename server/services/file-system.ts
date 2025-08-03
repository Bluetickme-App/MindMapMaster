import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

export interface FileSystemNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: string;
  children?: FileSystemNode[];
}

export class FileSystemService {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    // Default to workspace-demo directory for clean demo files
    const workspaceDemoPath = path.join(process.cwd(), 'workspace-demo');
    this.projectRoot = fs.existsSync(workspaceDemoPath) ? workspaceDemoPath : projectRoot;
  }

  setWorkingDirectory(newRoot: string): void {
    this.projectRoot = newRoot;
  }

  getCurrentDirectory(): string {
    return this.projectRoot;
  }

  async getFileTree(targetPath: string = ''): Promise<FileSystemNode[]> {
    const fullPath = path.join(this.projectRoot, targetPath);
    
    try {
      const items = await readdir(fullPath);
      const nodes: FileSystemNode[] = [];

      for (const item of items) {
        // Skip hidden files and node_modules
        if (item.startsWith('.') || item === 'node_modules') {
          continue;
        }

        const itemPath = path.join(fullPath, item);
        const relativePath = path.relative(this.projectRoot, itemPath);
        const stats = await stat(itemPath);

        const node: FileSystemNode = {
          name: item,
          type: stats.isDirectory() ? 'folder' : 'file',
          path: '/' + relativePath.replace(/\\/g, '/'),
          size: stats.isFile() ? stats.size : undefined,
          modified: stats.mtime.toISOString(),
        };

        if (stats.isDirectory()) {
          // Recursively get children for folders
          node.children = await this.getFileTree(relativePath);
        }

        nodes.push(node);
      }

      return nodes.sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  async readFile(filePath: string): Promise<string> {
    // Remove leading slash if present
    const cleanPath = filePath.replace(/^\/+/, '');
    const fullPath = path.join(this.projectRoot, cleanPath);
    
    try {
      const content = await readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      // If file doesn't exist, return appropriate content based on file type
      const extension = path.extname(cleanPath);
      if (extension === '.html') {
        return '<!DOCTYPE html>\n<html>\n<head>\n    <title>TripleA Luxury</title>\n</head>\n<body>\n    <h1>TripleA Luxury Fashion</h1>\n</body>\n</html>';
      } else if (extension === '.css') {
        return '/* TripleA Luxury Styles */\nbody { font-family: Arial, sans-serif; }';
      } else if (extension === '.js') {
        return '// TripleA Luxury JavaScript\nconsole.log("TripleA Luxury Website");';
      }
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, filePath);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      await mkdir(dir, { recursive: true });
      
      await writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async createFile(filePath: string, content: string = ''): Promise<void> {
    return this.writeFile(filePath, content);
  }

  async createFolder(folderPath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, folderPath);
    
    try {
      await mkdir(fullPath, { recursive: true });
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, filePath);
    
    try {
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        await rmdir(fullPath, { recursive: true });
      } else {
        await unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete: ${filePath}`);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const fullOldPath = path.join(this.projectRoot, oldPath);
    const fullNewPath = path.join(this.projectRoot, newPath);
    
    try {
      await fs.promises.rename(fullOldPath, fullNewPath);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw new Error(`Failed to rename: ${oldPath} to ${newPath}`);
    }
  }

  async searchFiles(query: string, extensions: string[] = []): Promise<FileSystemNode[]> {
    const results: FileSystemNode[] = [];
    
    const searchRecursive = async (dirPath: string) => {
      const items = await this.getFileTree(dirPath);
      
      for (const item of items) {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        const matchesExtension = extensions.length === 0 || 
          extensions.some(ext => item.name.endsWith(ext));
        
        if (matchesQuery && matchesExtension) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          await searchRecursive(item.path);
        }
      }
    };
    
    await searchRecursive('');
    return results;
  }

  getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  getFileLanguage(filePath: string): string {
    const ext = this.getFileExtension(filePath);
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bash': 'shell',
      '.php': 'php',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.dart': 'dart',
      '.vue': 'vue',
      '.svelte': 'svelte',
    };
    
    return languageMap[ext] || 'plaintext';
  }
}

export const fileSystemService = new FileSystemService();