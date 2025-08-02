import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { apiRequest } from '@/lib/queryClient';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  Search, 
  Play, 
  Terminal, 
  Settings, 
  Code,
  Eye,
  Globe,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  Send,
  Bot,
  Moon,
  Sun,
  Upload,
  Mic,
  Image,
  RotateCcw,
  GitBranch,
  Link,
  History,
  Package2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';

interface FileSystemNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: string;
  children?: FileSystemNode[];
}

interface TerminalOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'exit';
  content: string;
  timestamp: string;
  exitCode?: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  userId: number;
  githubUrl?: string;
  category?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export default function ReplitWorkspace() {
  const [location, setLocation] = useLocation();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);
  const [openFiles, setOpenFiles] = useState<FileSystemNode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [fileContent, setFileContent] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [terminalCommand, setTerminalCommand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const queryClient = useQueryClient();

  // Extract project ID from URL parameters  
  const projectId = new URLSearchParams(window.location.search).get('project');

  // Load project data
  const projectQuery = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      return response.json();
    },
    enabled: !!projectId
  });

  // Load file system for current project
  const fileSystemQuery = useQuery({
    queryKey: ['/api/files', projectId],
    queryFn: async () => {
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to load file system');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Load AI agents
  const agentsQuery = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      return response.json();
    }
  });

  // Load file content
  const loadFileContent = useMutation({
    mutationFn: async (filePath: string) => {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) throw new Error('Failed to load file content');
      return response.text();
    },
    onSuccess: (content) => {
      setFileContent(content);
    },
    onError: (error) => {
      toast({
        title: "Error Loading File",
        description: "Failed to load file content",
        variant: "destructive"
      });
    }
  });

  // Save file content
  const saveFile = useMutation({
    mutationFn: async ({ path, content }: { path: string, content: string }) => {
      const response = await apiRequest(`/api/files/content`, 'POST', {
        path,
        content
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "File Saved",
        description: "Your changes have been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/files`] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save file changes",
        variant: "destructive"
      });
    }
  });

  // Initialize workspace
  useEffect(() => {
    if (projectQuery.data) {
      setCurrentProject(projectQuery.data);
      // Set preview URL for the project
      setPreviewUrl(`/dev/${projectQuery.data.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }, [projectQuery.data]);

  useEffect(() => {
    if (fileSystemQuery.data) {
      setFileTree(fileSystemQuery.data);
      setIsLoading(false);
    }
  }, [fileSystemQuery.data]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileSystemNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      loadFileContent.mutate(file.path);
      
      // Add to open files if not already open
      if (!openFiles.find(f => f.path === file.path)) {
        setOpenFiles(prev => [...prev, file]);
      }
      
      setActiveTab('editor');
    }
  }, [openFiles, loadFileContent]);

  // Handle file save
  const handleSave = useCallback(() => {
    if (selectedFile && fileContent) {
      saveFile.mutate({
        path: selectedFile.path,
        content: fileContent
      });
    }
  }, [selectedFile, fileContent, saveFile]);

  // Handle folder toggle
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  }, []);

  // Render file tree
  const renderFileTree = useCallback((nodes: FileSystemNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-slate-700 ${
            selectedFile?.path === node.path ? 'bg-slate-600' : ''
          }`}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              handleFileSelect(node);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {expandedFolders.has(node.path) ? (
                <FolderOpen className="h-4 w-4 text-blue-400" />
              ) : (
                <Folder className="h-4 w-4 text-blue-400" />
              )}
            </>
          ) : (
            <>
              <div className="w-3" />
              <File className="h-4 w-4 text-gray-300" />
            </>
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  }, [expandedFolders, selectedFile, toggleFolder, handleFileSelect]);

  // Handle terminal command
  const handleTerminalCommand = useCallback((command: string) => {
    const output: TerminalOutput = {
      id: Date.now().toString(),
      type: 'stdout',
      content: `> ${command}\nCommand executed (simulation mode)`,
      timestamp: new Date().toISOString()
    };
    setTerminalOutput(prev => [...prev, output]);
    setTerminalCommand('');
  }, []);

  if (!projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Project Selected</h1>
          <p className="text-gray-400 mb-6">Please select a project to open in the workspace</p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || projectQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="text-sm">
            <span className="text-gray-400">Project:</span>{' '}
            <span className="font-medium">{currentProject?.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!selectedFile || saveFile.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <PanelGroup direction="horizontal">
          {/* File Explorer */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full border-r border-slate-800">
              <div className="p-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Files</h3>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    className="pl-7 h-7 text-xs bg-slate-800 border-slate-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {renderFileTree(fileTree)}
                </div>
              </ScrollArea>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-slate-700" />

          {/* Editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Open Files Tabs */}
              {openFiles.length > 0 && (
                <div className="flex border-b border-slate-800 bg-slate-900">
                  {openFiles.map((file) => (
                    <div
                      key={file.path}
                      className={`flex items-center gap-2 px-3 py-2 border-r border-slate-800 cursor-pointer ${
                        selectedFile?.path === file.path ? 'bg-slate-800' : 'hover:bg-slate-700'
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <File className="h-3 w-3" />
                      <span className="text-xs">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFiles(prev => prev.filter(f => f.path !== file.path));
                          if (selectedFile?.path === file.path) {
                            setSelectedFile(null);
                            setFileContent('');
                          }
                        }}
                        className="hover:bg-slate-600 rounded p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Editor Content */}
              <div className="flex-1">
                {selectedFile ? (
                  <Editor
                    height="100%"
                    defaultLanguage={selectedFile.name.endsWith('.tsx') || selectedFile.name.endsWith('.ts') ? 'typescript' : 
                                   selectedFile.name.endsWith('.js') || selectedFile.name.endsWith('.jsx') ? 'javascript' :
                                   selectedFile.name.endsWith('.css') ? 'css' :
                                   selectedFile.name.endsWith('.html') ? 'html' :
                                   selectedFile.name.endsWith('.json') ? 'json' : 'text'}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on'
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to start editing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-slate-700" />

          {/* Right Panel */}
          <Panel defaultSize={30} minSize={20}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="terminal">Terminal</TabsTrigger>
                <TabsTrigger value="browser">Browser</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 m-0">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Live Preview</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 bg-white">
                    {previewUrl ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="Preview"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 m-0">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm">Terminal</span>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    <div className="font-mono text-xs space-y-1">
                      {terminalOutput.map((output) => (
                        <div key={output.id} className={
                          output.type === 'stderr' ? 'text-red-400' : 
                          output.type === 'exit' ? 'text-yellow-400' : 'text-green-400'
                        }>
                          {output.content}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-slate-800">
                    <div className="flex gap-2">
                      <span className="text-green-400 font-mono text-sm">$</span>
                      <Input
                        placeholder="Enter command..."
                        value={terminalCommand}
                        onChange={(e) => setTerminalCommand(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && terminalCommand.trim()) {
                            handleTerminalCommand(terminalCommand);
                          }
                        }}
                        className="flex-1 h-7 text-xs bg-transparent border-0 p-0 font-mono focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="browser" className="flex-1 m-0">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Browser</span>
                  </div>
                  <div className="flex-1 bg-white">
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Web browser view</p>
                        <p className="text-xs mt-2">Navigate to your app URL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agents" className="flex-1 m-0">
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm">AI Agents</span>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    {agentsQuery.data?.map((agent: any) => (
                      <div key={agent.id} className="p-2 border border-slate-700 rounded mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-4 w-4" />
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <p className="text-xs text-gray-400">{agent.description}</p>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="p-2 border-t border-slate-800">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask agents for help..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 h-7 text-xs"
                      />
                      <Button size="sm" variant="ghost">
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}