import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
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
  History
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

export default function ReplitClone() {
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
  const [fileHistory, setFileHistory] = useState<{[key: string]: string[]}>({});
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<{[key: string]: number}>({});
  
  const queryClient = useQueryClient();

  // Fetch AI agents
  const agentsQuery = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      return response.json();
    }
  });

  // Fetch file system tree
  const fileSystemQuery = useQuery({
    queryKey: ['/api/filesystem'],
    queryFn: async () => {
      const response = await fetch('/api/filesystem');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch file content
  const fileContentQuery = useQuery({
    queryKey: ['/api/filesystem/content', selectedFile?.path],
    queryFn: async () => {
      if (!selectedFile) return null;
      const response = await fetch(`/api/filesystem/content?path=${encodeURIComponent(selectedFile.path)}`);
      return response.json();
    },
    enabled: !!selectedFile
  });

  // Save file mutation
  const saveFileMutation = useMutation({
    mutationFn: async (data: { path: string; content: string }) => {
      const response = await fetch('/api/filesystem/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save file');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "File saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/filesystem'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving file", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create file/folder mutation
  const createMutation = useMutation({
    mutationFn: async (data: { path: string; content?: string; type: 'file' | 'folder' }) => {
      const response = await fetch('/api/filesystem/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filesystem'] });
      toast({ title: "Created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete file/folder mutation
  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filesystem'] });
      toast({ title: "Deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Execute terminal command
  const executeCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sessionId: 'replit-clone' })
      });
      if (!response.ok) throw new Error('Failed to execute command');
      return response.json();
    },
    onSuccess: () => {
      // Add command to terminal output
      setTerminalOutput(prev => [...prev, {
        id: Date.now().toString(),
        type: 'stdout',
        content: `$ ${terminalCommand}\n`,
        timestamp: new Date().toISOString()
      }]);
      setTerminalCommand('');
    }
  });

  // Update file content when selected file changes
  useEffect(() => {
    if (fileContentQuery.data) {
      setFileContent(fileContentQuery.data.content);
      
      // Auto-refresh preview for HTML files
      if (selectedFile?.path.endsWith('.html')) {
        setActiveTab('preview');
      }
    }
  }, [fileContentQuery.data, selectedFile]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileSelect = (node: FileSystemNode) => {
    if (node.type === 'file') {
      setSelectedFile(node);
      
      // Add to open files if not already open
      if (!openFiles.find(f => f.path === node.path)) {
        setOpenFiles(prev => [...prev, node]);
      }
    } else {
      toggleFolder(node.path);
    }
  };

  const handleFileSave = () => {
    if (selectedFile) {
      // Save to history for rollback
      const history = fileHistory[selectedFile.path] || [];
      const newHistory = [...history, fileContent];
      setFileHistory(prev => ({
        ...prev,
        [selectedFile.path]: newHistory
      }));
      setCurrentHistoryIndex(prev => ({
        ...prev,
        [selectedFile.path]: newHistory.length - 1
      }));
      
      saveFileMutation.mutate({
        path: selectedFile.path,
        content: fileContent
      });
    }
  };

  const handleRollback = () => {
    if (selectedFile) {
      const history = fileHistory[selectedFile.path] || [];
      const currentIndex = currentHistoryIndex[selectedFile.path] || 0;
      
      if (currentIndex > 0) {
        const previousContent = history[currentIndex - 1];
        setFileContent(previousContent);
        setCurrentHistoryIndex(prev => ({
          ...prev,
          [selectedFile.path]: currentIndex - 1
        }));
        toast({ title: "Rolled back to previous version" });
      }
    }
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      createMutation.mutate({
        path: fileName,
        content: '',
        type: 'file'
      });
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      createMutation.mutate({
        path: folderName,
        type: 'folder'
      });
    }
  };

  const handleRunProject = () => {
    setIsRunning(true);
    
    // Detect project type and run appropriate command
    if (selectedFile?.path.endsWith('.html')) {
      // For HTML files, show direct preview
      setPreviewUrl(`data:text/html;charset=utf-8,${encodeURIComponent(fileContent)}`);
    } else {
      // For full projects, run the development server
      executeCommandMutation.mutate('npm run dev');
      setPreviewUrl('http://localhost:5000');
    }
    
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleTerminalCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommandMutation.mutate(terminalCommand);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return '📄';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '⚙️';
      case 'md':
        return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const renderFileTree = (nodes: FileSystemNode[], level = 0) => {
    if (!nodes) return null;
    
    return nodes.map((node) => (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer ${
            selectedFile?.path === node.path ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFileSelect(node)}
        >
          {node.type === 'folder' ? (
            <>
              {expandedFolders.has(node.path) ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
              {expandedFolders.has(node.path) ? 
                <FolderOpen className="h-4 w-4 text-blue-500" /> : 
                <Folder className="h-4 w-4 text-blue-500" />
              }
            </>
          ) : (
            <>
              <span className="w-4" />
              <span className="text-sm mr-1">{getFileIcon(node.name)}</span>
              <File className="h-3 w-3 text-muted-foreground" />
            </>
          )}
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {node.name}
          </span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-muted-foreground ml-auto">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        
        {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const closeTab = (fileToClose: FileSystemNode) => {
    setOpenFiles(prev => prev.filter(f => f.path !== fileToClose.path));
    if (selectedFile?.path === fileToClose.path) {
      const remaining = openFiles.filter(f => f.path !== fileToClose.path);
      setSelectedFile(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            Replit Clone
          </h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRunProject}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleFileSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleRollback} disabled={!selectedFile}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Rollback
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          >
            {currentTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Explorer */}
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full bg-background border-r border-border">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">Files</h2>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={handleCreateFile}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCreateFolder}>
                      <Folder className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setActiveTab('agents')}
                      title="Ask AI agents about this code"
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto h-full">
                {fileSystemQuery.isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : (
                  <div className="py-2">
                    {fileSystemQuery.data && renderFileTree(fileSystemQuery.data)}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle />

          {/* Editor Area */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-background flex flex-col">
              {/* File Tabs */}
              <div className="flex bg-muted border-b border-border overflow-x-auto">
                {openFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-0 ${
                      selectedFile?.path === file.path
                        ? 'bg-background text-blue-600 font-medium'
                        : 'text-muted-foreground hover:bg-background/50'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    {fileHistory[file.path] && fileHistory[file.path].length > 0 && (
                      <GitBranch className="h-3 w-3 text-orange-500" title="Has history" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(file);
                      }}
                      className="hover:bg-muted-foreground/20 rounded p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1">
                {selectedFile ? (
                  <Editor
                    height="100%"
                    language={fileContentQuery.data?.language || 'plaintext'}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    theme={currentTheme === 'dark' ? 'vs-dark' : 'vs'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Code className="h-12 w-12 mx-auto mb-2" />
                      <p>Select a file to start editing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle />

          {/* Right Panel */}
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full bg-background border-l border-border">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 shrink-0">
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="terminal">
                    <Terminal className="h-4 w-4 mr-1" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="browser">
                    <Globe className="h-4 w-4 mr-1" />
                    Browser
                  </TabsTrigger>
                  <TabsTrigger value="agents">
                    <Users className="h-4 w-4 mr-1" />
                    AI Agents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col">
                    {selectedFile?.path.endsWith('.html') && fileContent ? (
                      <div className="flex-1 flex flex-col">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Live Preview</span>
                            <Button size="sm" onClick={() => setPreviewUrl(`data:text/html;charset=utf-8,${encodeURIComponent(fileContent)}`)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Refresh
                            </Button>
                          </div>
                        </div>
                        <iframe
                          srcDoc={fileContent}
                          className="flex-1 border-none"
                          title="Live Preview"
                          style={{ height: 'calc(100% - 60px)' }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Eye className="h-12 w-12 mx-auto mb-2" />
                          <p>Preview not available</p>
                          <p className="text-sm">Select an HTML file to preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="terminal" className="flex-1 m-0 p-0 flex flex-col">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Terminal</span>
                      <Button size="sm" variant="outline" onClick={() => setTerminalOutput([])}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 bg-black text-green-400 p-4 overflow-y-auto font-mono text-sm">
                    {terminalOutput.length === 0 && (
                      <div className="text-gray-500">
                        Welcome to the integrated terminal. Type commands below.
                      </div>
                    )}
                    {terminalOutput.map((output, index) => (
                      <div key={index} className={`whitespace-pre-wrap ${
                        output.type === 'stderr' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {output.content}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-600 p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-mono">$</span>
                      <Input
                        value={terminalCommand}
                        onChange={(e) => setTerminalCommand(e.target.value)}
                        onKeyDown={handleTerminalCommand}
                        placeholder="Enter command..."
                        className="bg-black text-green-400 border-gray-600 font-mono flex-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="browser" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col">
                    {previewUrl ? (
                      <div className="flex-1 flex flex-col">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span className="text-sm font-medium">Application Running</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => setPreviewUrl('')}>
                                Stop
                              </Button>
                              <Button size="sm" onClick={() => window.open(previewUrl, '_blank')}>
                                Open in New Tab
                              </Button>
                            </div>
                          </div>
                        </div>
                        <iframe
                          src={previewUrl}
                          className="flex-1 border-none"
                          title="Application Preview"
                          style={{ height: 'calc(100% - 60px)' }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 p-4">
                        <div className="text-center max-w-sm">
                          <Globe className="h-12 w-12 mx-auto mb-2" />
                          <p className="mb-4">Run your project to see it here</p>
                          <div className="space-y-3">
                            <Button onClick={handleRunProject} className="w-full">
                              <Play className="h-4 w-4 mr-1" />
                              Run Project
                            </Button>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Or open an existing app:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                onClick={() => setPreviewUrl('/welet-properties')} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                WeLet Properties
                              </Button>
                              <Button 
                                onClick={() => setPreviewUrl('/showcase')} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                Showcase Site
                              </Button>
                              <Button 
                                onClick={() => setPreviewUrl('/workspace')} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                Workspace
                              </Button>
                              <Button 
                                onClick={() => setPreviewUrl('/collaboration')} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                Collaboration
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="agents" className="flex-1 m-0 p-0 flex flex-col">
                  <div className="bg-muted px-4 py-2 border-b border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">🤖 AI Development Team</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {selectedAgents.length} active
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedAgents([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent Selection */}
                  <div className="p-4 border-b border-border">
                    <div className="text-sm font-medium mb-2">Select AI Specialists:</div>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {agentsQuery.data?.map((agent: any) => (
                        <div 
                          key={agent.id} 
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAgents.some(a => a.id === agent.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                              : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            if (selectedAgents.some(a => a.id === agent.id)) {
                              setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
                            } else {
                              setSelectedAgents([...selectedAgents, agent]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">{agent.role}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">{agent.specialization}</div>
                            </div>
                            <div className="text-xs px-2 py-1 bg-muted rounded-full font-medium">
                              {agent.provider}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Bot className="h-12 w-12 mx-auto mb-2" />
                          <p className="font-medium">Select AI agents and start coding together!</p>
                          <p className="text-sm mt-1">
                            Ask questions about your code or request help with development
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg: any, index: number) => (
                          <div key={index} className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                msg.sender_type === 'user' 
                                  ? 'bg-green-500' 
                                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                {msg.sender_type === 'user' ? 
                                  <span className="text-white text-xs font-bold">U</span> : 
                                  <Bot className="h-3 w-3 text-white" />
                                }
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                {msg.sender_type === 'user' ? 'You' : msg.sender_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                              {selectedFile && (
                                <Link className="h-3 w-3 text-blue-500" title={`Context: ${selectedFile.name}`} />
                              )}
                            </div>
                            <div className="ml-8 text-sm bg-muted p-3 rounded-lg">
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Message Input */}
                    <div className="border-t border-border p-3">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="file"
                          accept="image/*,audio/*,.pdf,.txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.md"
                          className="hidden"
                          id="file-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setChatMessage(`📎 Attached: ${file.name}`);
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder={`Ask your AI team about ${selectedFile?.name || 'the code'}...`}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (chatMessage.trim() && selectedAgents.length > 0) {
                                // Add user message
                                setChatMessages([...chatMessages, {
                                  content: chatMessage,
                                  sender_type: 'user',
                                  timestamp: new Date().toISOString()
                                }]);
                                setChatMessage('');
                                
                                // Simulate AI response with file context
                                setTimeout(() => {
                                  const randomAgent = selectedAgents[Math.floor(Math.random() * selectedAgents.length)];
                                  const contextMessage = selectedFile 
                                    ? `Looking at ${selectedFile.name} - I can help you with that! Let me analyze your code and provide suggestions.` 
                                    : `I can help you with that! Let me analyze your code and provide suggestions.`;
                                  setChatMessages(prev => [...prev, {
                                    content: contextMessage,
                                    sender_type: 'agent',
                                    sender_name: randomAgent.name,
                                    timestamp: new Date().toISOString()
                                  }]);
                                }, 1000);
                              }
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            if (chatMessage.trim() && selectedAgents.length > 0) {
                              setChatMessages([...chatMessages, {
                                content: chatMessage,
                                sender_type: 'user',
                                timestamp: new Date().toISOString()
                              }]);
                              setChatMessage('');
                              
                              setTimeout(() => {
                                const randomAgent = selectedAgents[Math.floor(Math.random() * selectedAgents.length)];
                                const contextMessage = selectedFile 
                                  ? `Looking at ${selectedFile.name} - I can help you with that! Let me analyze your code and provide suggestions.` 
                                  : `I can help you with that! Let me analyze your code and provide suggestions.`;
                                setChatMessages(prev => [...prev, {
                                  content: contextMessage,
                                  sender_type: 'agent',
                                  sender_name: randomAgent.name,
                                  timestamp: new Date().toISOString()
                                }]);
                              }, 1000);
                            }
                          }}
                          disabled={!chatMessage.trim() || selectedAgents.length === 0}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedFile && `Context: ${selectedFile.name}`} • {selectedAgents.length} agents selected
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}