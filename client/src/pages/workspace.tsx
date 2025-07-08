import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Terminal, 
  Eye, 
  Play, 
  Database, 
  HardDrive, 
  Copy, 
  Download, 
  Upload, 
  Settings, 
  Monitor, 
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  Code,
  FileText,
  Image as ImageIcon,
  Package,
  ArrowLeft,
  Users,
  Bot,
  MessageSquare
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
  status: 'connected' | 'disconnected' | 'error';
  url?: string;
}

interface ConsoleMessage {
  id: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  timestamp: string;
}

export default function WorkspacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const consoleRef = useRef<HTMLDivElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    {
      id: '1',
      type: 'info',
      message: 'CodeCraft Workspace initialized successfully',
      timestamp: new Date().toISOString()
    }
  ]);
  const [previewUrl, setPreviewUrl] = useState('http://localhost:5000');
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [secretsFormat, setSecretsFormat] = useState<'json' | 'env'>('json');
  const [fileContent, setFileContent] = useState<string>('');
  const [showTeamAgents, setShowTeamAgents] = useState(false);

  // Fetch file system from backend
  const { data: fileSystem = [], refetch: refetchFiles } = useQuery<FileNode[]>({
    queryKey: ['/api/workspace/files'],
  });

  // Fetch databases from backend
  const { data: databases = [], refetch: refetchDatabases } = useQuery<DatabaseConnection[]>({
    queryKey: ['/api/workspace/databases'],
  });

  // Fetch secrets from backend
  const { data: backendSecrets = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/workspace/secrets'],
  });

  // Execute console command mutation
  const executeCommand = useMutation({
    mutationFn: async (command: string) => {
      return await apiRequest('/api/workspace/console', {
        method: 'POST',
        body: JSON.stringify({ command }),
      });
    },
    onSuccess: (data) => {
      addConsoleMessage(data.exitCode === 0 ? 'success' : 'error', data.output);
    },
    onError: (error: any) => {
      addConsoleMessage('error', `Command failed: ${error.message}`);
    },
  });

  // Save file mutation
  const saveFile = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      const response = await fetch(`/api/workspace/files${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "File saved",
        description: "File has been saved successfully",
      });
      refetchFiles();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save file: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update secrets mutation
  const updateSecrets = useMutation({
    mutationFn: async (data: { secrets: string; format: 'json' | 'env' }) => {
      return await apiRequest('/api/workspace/secrets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Secrets updated",
        description: `Updated ${data.count} secrets successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update secrets: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addConsoleMessage = (type: ConsoleMessage['type'], message: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    setConsoleMessages(prev => [...prev, newMessage]);
    
    // Auto-scroll console
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleConsoleCommand = () => {
    if (!consoleInput.trim()) return;
    
    addConsoleMessage('info', `$ ${consoleInput}`);
    executeCommand.mutate(consoleInput);
    setConsoleInput('');
  };

  const handleFileSelect = async (node: FileNode) => {
    setSelectedFile(node);
    
    if (node.type === 'file') {
      try {
        const response = await fetch(`/api/workspace/files${node.path}`);
        const data = await response.json();
        setFileContent(data.content);
      } catch (error) {
        console.error('Failed to load file:', error);
        setFileContent('// Failed to load file content');
      }
    }
  };

  const handleSaveFile = () => {
    if (selectedFile && selectedFile.type === 'file') {
      saveFile.mutate({ path: selectedFile.path, content: fileContent });
    }
  };

  const handleUpdateSecrets = () => {
    let secretsString = '';
    if (secretsFormat === 'json') {
      secretsString = JSON.stringify(secrets, null, 2);
    } else {
      secretsString = Object.entries(secrets)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }
    
    updateSecrets.mutate({ secrets: secretsString, format: secretsFormat });
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return <Folder className="w-4 h-4" />;
    }
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'css':
      case 'scss':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'json':
        return <Package className="w-4 h-4 text-yellow-500" />;
      case 'md':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <ImageIcon className="w-4 h-4 text-pink-500" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center space-x-2 px-2 py-1 hover:bg-accent cursor-pointer rounded ${
            selectedFile?.path === node.path ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => handleFileSelect(node)}
        >
          {getFileIcon(node)}
          <span className="text-sm">{node.name}</span>
          {node.size && (
            <span className="text-xs text-muted-foreground ml-auto">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        {node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const copySecretsToClipboard = () => {
    const allSecrets = { ...backendSecrets, ...secrets };
    let content = '';
    if (secretsFormat === 'json') {
      content = JSON.stringify(allSecrets, null, 2);
    } else {
      content = Object.entries(allSecrets)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }
    
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: `Secrets copied in ${secretsFormat.toUpperCase()} format`,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">CodeCraft Workspace</h1>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Running
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTeamAgents(!showTeamAgents)}
            >
              <Users className="w-4 h-4 mr-2" />
              Team Agents
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Card className="h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Folder className="w-4 h-4 mr-2" />
                  Explorer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <div className="p-2">
                    {renderFileTree(fileSystem)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor/Preview Area */}
          <ResizablePanel defaultSize={50}>
            <Tabs defaultValue="preview" className="h-full">
              <div className="border-b px-4 py-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="preview">
                    <Eye className="w-4 h-4 mr-2" />
                    Live Preview
                  </TabsTrigger>
                  <TabsTrigger value="editor">
                    <Code className="w-4 h-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="database">
                    <Database className="w-4 h-4 mr-2" />
                    Database
                  </TabsTrigger>
                  <TabsTrigger value="agents">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Agents
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="h-[calc(100%-60px)] m-0">
                <div className="h-full flex flex-col">
                  <div className="border-b px-4 py-2 bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        placeholder="Enter preview URL"
                        className="flex-1"
                      />
                      <Button size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm">
                        <Globe className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <iframe
                    src={previewUrl}
                    className="flex-1 w-full border-0"
                    title="Live Preview"
                  />
                </div>
              </TabsContent>

              <TabsContent value="editor" className="h-[calc(100%-60px)] m-0">
                <div className="h-full p-4">
                  {selectedFile ? (
                    <div className="h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                        <Badge variant="outline">{selectedFile.path}</Badge>
                      </div>
                      <Textarea
                        placeholder="File content will be loaded here..."
                        className="h-[calc(100%-100px)] font-mono text-sm"
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          onClick={handleSaveFile}
                          disabled={saveFile.isPending}
                          size="sm"
                        >
                          {saveFile.isPending ? 'Saving...' : 'Save File'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select a file from the explorer to edit</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="database" className="h-[calc(100%-60px)] m-0">
                <div className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Database Connections</h3>
                      <Button size="sm">
                        <Database className="w-4 h-4 mr-2" />
                        Add Connection
                      </Button>
                    </div>
                    
                    {databases.map((db) => (
                      <Card key={db.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{db.name}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {db.type} • {db.status}
                              </p>
                            </div>
                            <Badge 
                              variant={db.status === 'connected' ? 'default' : 'destructive'}
                            >
                              {db.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* AI Agents Tab */}
              <TabsContent value="agents" className="h-[calc(100%-60px)] m-0">
                <div className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Development Team Agents</h3>
                      <Button 
                        onClick={() => setLocation('/team-agents')}
                        size="sm"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Team
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6 text-blue-500" />
                            <div>
                              <h4 className="font-medium text-sm">Alex Roadmap</h4>
                              <p className="text-xs text-muted-foreground">Project Planning</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6 text-purple-500" />
                            <div>
                              <h4 className="font-medium text-sm">Maya Designer</h4>
                              <p className="text-xs text-muted-foreground">UI/UX Design</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6 text-green-500" />
                            <div>
                              <h4 className="font-medium text-sm">Taylor React</h4>
                              <p className="text-xs text-muted-foreground">Frontend Development</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6 text-orange-500" />
                            <div>
                              <h4 className="font-medium text-sm">Sam AI</h4>
                              <p className="text-xs text-muted-foreground">AI Integration</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert>
                      <Bot className="w-4 h-4" />
                      <AlertDescription>
                        Click "Manage Team" to configure your development team agents and create collaborative conversations.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Console and Secrets Panel */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <Tabs defaultValue="console" className="h-full">
              <div className="border-b px-4 py-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="console">
                    <Terminal className="w-4 h-4 mr-2" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="secrets">
                    <Lock className="w-4 h-4 mr-2" />
                    Secrets
                  </TabsTrigger>
                  <TabsTrigger value="storage">
                    <HardDrive className="w-4 h-4 mr-2" />
                    Storage
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="console" className="h-[calc(100%-60px)] m-0">
                <div className="h-full flex flex-col">
                  <ScrollArea className="flex-1 p-4" ref={consoleRef}>
                    <div className="space-y-2 font-mono text-sm">
                      {consoleMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start space-x-2 ${
                            msg.type === 'error' ? 'text-red-500' :
                            msg.type === 'warning' ? 'text-yellow-500' :
                            msg.type === 'success' ? 'text-green-500' :
                            'text-foreground'
                          }`}
                        >
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                          <span>{msg.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={consoleInput}
                        onChange={(e) => setConsoleInput(e.target.value)}
                        placeholder="Enter command..."
                        onKeyPress={(e) => e.key === 'Enter' && handleConsoleCommand()}
                        className="font-mono"
                      />
                      <Button onClick={handleConsoleCommand} size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="secrets" className="h-[calc(100%-60px)] m-0">
                <div className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Environment Secrets</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSecretsFormat(secretsFormat === 'json' ? 'env' : 'json')}
                        >
                          {secretsFormat.toUpperCase()}
                        </Button>
                        <Button onClick={copySecretsToClipboard} size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder={`Add your secrets in ${secretsFormat.toUpperCase()} format...`}
                      className="h-[calc(100%-140px)] font-mono text-sm"
                      value={secretsFormat === 'json' 
                        ? JSON.stringify({ ...backendSecrets, ...secrets }, null, 2)
                        : Object.entries({ ...backendSecrets, ...secrets }).map(([k, v]) => `${k}=${v}`).join('\n')
                      }
                      onChange={(e) => {
                        try {
                          if (secretsFormat === 'json') {
                            setSecrets(JSON.parse(e.target.value || '{}'));
                          } else {
                            const parsed = e.target.value
                              .split('\n')
                              .filter(line => line.includes('='))
                              .reduce((acc, line) => {
                                const [key, ...valueParts] = line.split('=');
                                acc[key.trim()] = valueParts.join('=').trim();
                                return acc;
                              }, {} as Record<string, string>);
                            setSecrets(parsed);
                          }
                        } catch (error) {
                          // Invalid format, ignore
                        }
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        onClick={handleUpdateSecrets}
                        disabled={updateSecrets.isPending}
                        size="sm"
                      >
                        {updateSecrets.isPending ? 'Updating...' : 'Update Secrets'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="storage" className="h-[calc(100%-60px)] m-0">
                <div className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Object Storage</h3>
                      <Button size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">No storage configured</p>
                          <Button variant="outline" className="mt-2">
                            Configure Storage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}