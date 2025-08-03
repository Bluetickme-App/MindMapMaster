import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Editor from '@monaco-editor/react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Square,
  Folder,
  FolderOpen,
  FileText,
  Code,
  Terminal,
  Globe,
  Settings,
  Users,
  MessageSquare,
  Bot,
  User,
  Send,
  Plus,
  Save,
  Download,
  Upload,
  GitBranch,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
  ChevronDown,
  Home,
  Search,
  Command,
  Share,
  Zap,
  Database,
  Cloud,
  Package,
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Activity
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  size?: number;
  modified?: string;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  specialty: string;
  status: 'online' | 'busy' | 'offline';
  capabilities: string[];
  avatar?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  sender: string;
  content: string;
  timestamp: Date;
  agentInfo?: Agent;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  language?: string;
  framework?: string;
  isRunning?: boolean;
  url?: string;
}

export default function ReplitWorkspaceClone() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [projectUrl, setProjectUrl] = useState<string>('');
  const [terminal, setTerminal] = useState({ output: '', input: '' });
  const [rightPanelTab, setRightPanelTab] = useState('chat');
  
  // Agent and chat state
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Run/Share functionality
  const handleRunProject = async () => {
    if (!selectedProject) return;
    
    try {
      if (isRunning) {
        // Stop the project
        const response = await fetch(`/api/projects/${selectedProject.id}/stop`, {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsRunning(false);
          setTerminal(prev => ({ 
            ...prev, 
            output: prev.output + '\n🛑 Project stopped' 
          }));
          toast({
            title: "Project Stopped",
            description: `${selectedProject.name} has been stopped`,
          });
        }
      } else {
        // Start the project
        const response = await fetch(`/api/projects/${selectedProject.id}/run`, {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsRunning(true);
          setTerminal(prev => ({ 
            ...prev, 
            output: prev.output + '\n🚀 Starting project...\n✅ Server running on ' + projectUrl 
          }));
          toast({
            title: "Project Started",
            description: `${selectedProject.name} is now running`,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling project:', error);
      toast({
        title: "Error",
        description: "Failed to toggle project state",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Data fetching
  const projectsQuery = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      return response.json();
    },
  });

  const agentsQuery = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      return response.json();
    },
  });

  const fileTreeQuery = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      const response = await fetch('/api/files');
      return response.json();
    },
  });

  // Auto-select first project
  useEffect(() => {
    if (projectsQuery.data && projectsQuery.data.length > 0 && !selectedProject) {
      setSelectedProject(projectsQuery.data[0]);
    }
  }, [projectsQuery.data, selectedProject]);

  // Set project URL when project is selected
  useEffect(() => {
    if (selectedProject) {
      // Create a dev URL for the project
      const projectSlug = selectedProject.name.toLowerCase().replace(/\s+/g, '-');
      setProjectUrl(`${window.location.origin}/dev/${projectSlug}`);
    }
  }, [selectedProject]);

  // Load file content
  const loadFileContent = async (file: FileNode) => {
    try {
      const params = new URLSearchParams({ path: file.path });
      if (selectedProject?.id) {
        params.append('projectId', selectedProject.id.toString());
      }
      
      const response = await fetch(`/api/files/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content || '');
        return data.content || '';
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      });
    }
    return '';
  };

  // File operations
  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      
      // Add to tabs if not already open
      if (!openTabs.find(tab => tab.path === file.path)) {
        setOpenTabs([...openTabs, file]);
      }
      setActiveTab(file.path);
      
      // Load content
      await loadFileContent(file);
    }
  };

  const handleTabClose = (filePath: string) => {
    const newTabs = openTabs.filter(tab => tab.path !== filePath);
    setOpenTabs(newTabs);
    
    if (activeTab === filePath) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[newTabs.length - 1];
        setActiveTab(newActiveTab.path);
        setSelectedFile(newActiveTab);
        loadFileContent(newActiveTab);
      } else {
        setActiveTab('');
        setSelectedFile(null);
        setFileContent('');
      }
    }
  };

  const handleTabSwitch = async (filePath: string) => {
    const file = openTabs.find(tab => tab.path === filePath);
    if (file) {
      setActiveTab(filePath);
      setSelectedFile(file);
      await loadFileContent(file);
    }
  };

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

  // File tree renderer
  const renderFileTree = (nodes: FileNode[], level = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div 
          className={`flex items-center py-1 px-2 hover:bg-muted/50 cursor-pointer ${
            selectedFile?.path === node.path ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
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
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              {expandedFolders.has(node.path) ? (
                <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 mr-2 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-1" />
              <FileText className="w-4 h-4 mr-2 text-gray-500" />
            </>
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        
        {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  // Agent operations
  const handleAgentSelect = (agent: Agent, selected: boolean) => {
    if (selected) {
      setSelectedAgents([...selectedAgents, agent]);
    } else {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !conversationId) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      sender: 'You',
      content: chatInput,
      timestamp: new Date(),
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: chatInput }),
      });
      
      if (response.ok) {
        // Refresh messages
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.id.toString(),
          type: msg.senderType === 'agent' ? 'agent' : 'user',
          sender: msg.senderType === 'agent' ? 
            agentsQuery.data?.find((a: Agent) => a.id === msg.senderId)?.name || 'Agent' : 
            'You',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          agentInfo: msg.senderType === 'agent' ? 
            agentsQuery.data?.find((a: Agent) => a.id === msg.senderId) : undefined,
        }));
        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async () => {
    if (selectedAgents.length === 0) {
      toast({
        title: "No agents selected",
        description: "Please select at least one agent to start a conversation",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          agentIds: selectedAgents.map(a => a.id),
        }),
      });
      
      if (response.ok) {
        const conversation = await response.json();
        setConversationId(conversation.id);
        setShowAgentDialog(false);
        toast({
          title: "Team chat created",
          description: `Started conversation with ${selectedAgents.length} agents`,
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'shell',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <div className="h-12 bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">Development Workspace</h1>
            {selectedProject && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{selectedProject.name}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Team Agents
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Project Status Bar */}
      <div className="h-10 bg-muted/30 border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {selectedProject && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Project:</span>
              <span className="text-sm">{selectedProject.name}</span>
              <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                {isRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunProject}
            className={isRunning ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - File Explorer */}
          {!leftPanelCollapsed && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full bg-background border-r">
                  <div className="h-full flex flex-col">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm flex items-center">
                          <Folder className="w-4 h-4 mr-2" />
                          Explorer
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLeftPanelCollapsed(true)}
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1">
                      <div className="p-2">
                        {fileTreeQuery.data && Array.isArray(fileTreeQuery.data) && 
                          renderFileTree(fileTreeQuery.data)}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Center Panel - Code Editor */}
          <ResizablePanel defaultSize={leftPanelCollapsed ? 70 : 50} minSize={30}>
            <div className="h-full bg-background">
              <div className="h-full flex flex-col">
                {/* Tab Bar */}
                <div className="flex items-center bg-muted/30 border-b min-h-[40px]">
                  <div className="flex items-center overflow-x-auto">
                    {openTabs.map((tab) => (
                      <div
                        key={tab.path}
                        className={`flex items-center px-3 py-2 border-r cursor-pointer hover:bg-muted/50 ${
                          activeTab === tab.path ? 'bg-background' : 'bg-muted/30'
                        }`}
                        onClick={() => handleTabSwitch(tab.path)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">{tab.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-5 w-5 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTabClose(tab.path);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Editor Controls */}
                  <div className="ml-auto flex items-center space-x-2 pr-3">
                    <Button variant="ghost" size="sm">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1">
                  {selectedFile ? (
                    <Editor
                      height="100%"
                      language={getLanguageFromExtension(selectedFile.name)}
                      value={fileContent}
                      onChange={(value) => setFileContent(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'off',
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        scrollBeyondLastLine: false,
                        contextmenu: true,
                        quickSuggestions: {
                          other: true,
                          comments: false,
                          strings: false
                        },
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        renderWhitespace: 'selection',
                        smoothScrolling: true,
                        cursorSmoothCaretAnimation: 'on',
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No file selected</h3>
                        <p className="text-sm">Choose a file from the explorer to start editing</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Chat, Console, etc. */}
          {!rightPanelCollapsed && (
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full bg-background border-l">
                <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="chat">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="console">
                        <Terminal className="w-4 h-4 mr-2" />
                        Console
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Globe className="w-4 h-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="system">
                        <Activity className="w-4 h-4 mr-2" />
                        System
                      </TabsTrigger>
                    </TabsList>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRightPanelCollapsed(true)}
                    >
                      <EyeOff className="w-4 h-4" />
                    </Button>
                  </div>

                  <TabsContent value="chat" className="flex-1 m-0">
                    <div className="h-full flex flex-col">
                      {/* Agent Status */}
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm flex items-center">
                            <Bot className="w-4 h-4 mr-2" />
                            AI Team Chat
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {agentsQuery.data?.length || 0} agents
                          </Badge>
                        </div>
                        
                        <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              Select Agents
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Select AI Agents</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                {agentsQuery.data?.map((agent: Agent) => (
                                  <div key={agent.id} className="flex items-center space-x-3 p-3 border rounded">
                                    <Checkbox
                                      checked={selectedAgents.some(a => a.id === agent.id)}
                                      onCheckedChange={(checked) => 
                                        handleAgentSelect(agent, checked as boolean)
                                      }
                                    />
                                    <Avatar className="w-10 h-10">
                                      <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-medium">{agent.name}</p>
                                      <p className="text-sm text-muted-foreground">{agent.specialty}</p>
                                      <div className="flex space-x-1 mt-1">
                                        {agent.capabilities.slice(0, 3).map((cap, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs">
                                            {cap}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                                      {agent.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowAgentDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={createConversation}>
                                Start Conversation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Chat Messages */}
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-4">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>Select AI agents and start chatting!</p>
                            </div>
                          ) : (
                            chatMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-lg ${
                                    message.type === 'user'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <div className="flex items-center mb-1">
                                    {message.type === 'agent' ? (
                                      <Bot className="w-4 h-4 mr-2" />
                                    ) : (
                                      <User className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="font-medium text-sm">{message.sender}</span>
                                    <span className="text-xs opacity-60 ml-auto">
                                      {message.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>

                      {/* Chat Input */}
                      <div className="p-3 border-t">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Chat with your AI team..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                sendMessage();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button onClick={sendMessage} size="sm">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="console" className="flex-1 m-0">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-auto">
                        <div>Welcome to Replit Console</div>
                        <div>Project: {selectedProject?.name}</div>
                        <div className="mt-2">
                          {isRunning ? (
                            <div className="text-green-400">✓ Application is running</div>
                          ) : (
                            <div className="text-yellow-400">⏸ Application stopped</div>
                          )}
                        </div>
                        {terminal.output && (
                          <div className="mt-2 whitespace-pre-wrap">{terminal.output}</div>
                        )}
                      </div>
                      <div className="p-2 border-t">
                        <Input
                          placeholder="$ Enter command..."
                          value={terminal.input}
                          onChange={(e) => setTerminal({ ...terminal, input: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="flex-1 m-0">
                    <div className="h-full flex flex-col">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Live Preview</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
                              {isRunning ? "Running" : "Stopped"}
                            </Badge>
                            {isRunning && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(projectUrl, '_blank')}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Open
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        {isRunning ? (
                          <iframe
                            src={projectUrl}
                            className="w-full h-full border-0"
                            title="Project Preview"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <h3 className="text-lg font-medium mb-2">Preview Not Available</h3>
                              <p className="text-sm mb-4">Start your project to see the live preview</p>
                              <Button onClick={handleRunProject} className="mx-auto">
                                <Play className="w-4 h-4 mr-2" />
                                Run Project
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="system" className="flex-1 m-0">
                    <div className="h-full p-4">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center">
                              <Cpu className="w-4 h-4 mr-2" />
                              System Resources
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>CPU Usage:</span>
                              <span>12%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Memory:</span>
                              <span>256MB / 512MB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Storage:</span>
                              <span>1.2GB / 5GB</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Dependencies
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground">
                              Package.json detected - 45 dependencies
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>

        {/* Collapsed Panel Toggles */}
        {leftPanelCollapsed && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(false)}
              className="rotate-90"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}

        {rightPanelCollapsed && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelCollapsed(false)}
              className="rotate-90"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project URL</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={projectUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(projectUrl)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share this URL to give others access to your project
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Embed Code</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={`<iframe src="${projectUrl}" width="100%" height="400"></iframe>`}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`<iframe src="${projectUrl}" width="100%" height="400"></iframe>`)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Embed this project in your website
              </p>
            </div>

            {isRunning && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Activity className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Project is Live</span>
                </div>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  Your project is currently running and accessible via the shared URL
                </p>
              </div>
            )}

            {!isRunning && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                  <Square className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Project Stopped</span>
                </div>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  Start your project to make it accessible via the shared URL
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
            {!isRunning && (
              <Button onClick={handleRunProject}>
                <Play className="w-4 h-4 mr-2" />
                Run & Share
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}