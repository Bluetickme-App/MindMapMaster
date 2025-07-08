import fs from 'fs/promises';
import path from 'path';
import { generateCode, debugCode, explainCode } from './openai';
import { multiAIService } from './multi-ai-provider';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

export class FileSystemService {
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.rootPath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.join(this.rootPath, filePath);
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async getFileTree(dirPath: string = ''): Promise<FileNode[]> {
    try {
      const fullPath = path.join(this.rootPath, dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const nodes: FileNode[] = [];
      
      for (const entry of entries) {
        // Skip hidden files and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const entryPath = path.join(dirPath, entry.name);
        const fullEntryPath = path.join(fullPath, entry.name);
        
        if (entry.isDirectory()) {
          const children = await this.getFileTree(entryPath);
          nodes.push({
            name: entry.name,
            type: 'folder',
            path: entryPath,
            children
          });
        } else {
          const stats = await fs.stat(fullEntryPath);
          nodes.push({
            name: entry.name,
            type: 'file',
            path: entryPath,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
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

  async formatCodeWithAI(content: string, language: string, provider: 'openai' | 'claude' | 'gemini' = 'openai'): Promise<{
    formattedCode: string;
    suggestions: string[];
    explanation: string;
  }> {
    try {
      const prompt = `Format and improve this ${language} code. Return JSON with:
- formattedCode: The properly formatted and improved code
- suggestions: Array of improvement suggestions
- explanation: Brief explanation of changes made

Code to format:
\`\`\`${language}
${content}
\`\`\``;

      let result;
      
      switch (provider) {
        case 'claude':
          result = await multiAIService.generateResponse('claude', prompt, `You are a code formatting expert. Format and improve ${language} code with best practices.`);
          break;
        case 'gemini':
          result = await multiAIService.generateResponse('gemini', prompt, `You are a code formatting expert. Format and improve ${language} code with best practices.`);
          break;
        default:
          result = await generateCode(prompt, language);
          break;
      }
      
      // Parse the result based on provider type
      if (provider === 'claude' || provider === 'gemini') {
        // Multi-AI provider returns AIResponse object
        try {
          const parsed = JSON.parse(result.content);
          return {
            formattedCode: parsed.formattedCode || parsed.code || content,
            suggestions: parsed.suggestions || [],
            explanation: parsed.explanation || 'Code formatted successfully'
          };
        } catch {
          // If not JSON, treat as formatted code
          return {
            formattedCode: result.content || content,
            suggestions: [],
            explanation: 'Code formatted successfully'
          };
        }
      } else {
        // OpenAI provider returns structured result
        return {
          formattedCode: result.code || content,
          suggestions: result.suggestions || [],
          explanation: result.explanation || 'Code formatted successfully'
        };
      }
    } catch (error) {
      console.error('Error formatting code with AI:', error);
      throw new Error('Failed to format code with AI');
    }
  }

  async debugCodeWithAI(content: string, language: string, error?: string): Promise<{
    fixedCode: string;
    issues: string[];
    explanation: string;
  }> {
    try {
      return await debugCode(content, error, language);
    } catch (error) {
      console.error('Error debugging code with AI:', error);
      throw new Error('Failed to debug code with AI');
    }
  }

  async explainCodeWithAI(content: string, language: string): Promise<{
    explanation: string;
    keyFeatures: string[];
    complexity: string;
    suggestions: string[];
  }> {
    try {
      return await explainCode(content, language);
    } catch (error) {
      console.error('Error explaining code with AI:', error);
      throw new Error('Failed to explain code with AI');
    }
  }

  getLanguageFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'shell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
    };
    return languageMap[extension] || 'plaintext';
  }
}

export const fileSystemService = new FileSystemService();