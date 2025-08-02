import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';
import * as prettier from 'prettier';
import { 
  ArrowLeft, 
  Users, 
  User,
  Settings, 
  Folder, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Plus, 
  Send, 
  RefreshCw,
  Eye,
  Code,
  Database,
  Bot,
  Terminal,
  Globe,
  ChevronRight,
  ChevronDown,
  X,
  Save
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface ConsoleMessage {
  id: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  timestamp: string;
}

interface Agent {
  id: string;
  name: string;
  type?: string;
  description?: string;
  specialty?: string;
  specialization?: string;
  capabilities?: string[];
  status?: 'active' | 'busy' | 'offline' | 'online';
  aiProvider?: 'openai' | 'claude' | 'gemini';
  model?: string;
  experienceLevel?: 'expert' | 'senior' | 'junior';
}

export default function WorkspacePage() {
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [showAgentSelection, setShowAgentSelection] = useState(false);
  const [chatCommand, setChatCommand] = useState('');
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components']));
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [agentCheckboxes, setAgentCheckboxes] = useState<Record<string, boolean>>({});
  const [fileContent, setFileContent] = useState<string>('');
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [previewContent, setPreviewContent] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const fetchConversationMessages = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map((msg: any) => {
          const agentInfo = msg.senderType === 'agent' ? agentsQuery.data?.find((a: Agent) => a.id === msg.senderId) : null;
          return {
            id: msg.id.toString(),
            type: msg.senderType === 'agent' ? 'success' : 'info',
            senderType: msg.senderType,
            agentName: agentInfo?.name || '',
            agentProvider: agentInfo?.aiProvider || '',
            message: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          };
        });
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const getAgentName = (agentId: string) => {
    const agent = agentsQuery.data?.find((a: Agent) => a.id === agentId);
    return agent?.name || `Agent ${agentId}`;
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: data.content }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setChatCommand('');
      // Refresh messages immediately
      fetchConversationMessages();
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleChatCommand = () => {
    if (!chatCommand.trim()) return;
    
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Please create a team conversation first",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({ content: chatCommand.trim() });
  };
  
  // Poll for new messages periodically when conversation is active
  useEffect(() => {
    if (!conversationId) return;
    
    const interval = setInterval(() => {
      fetchConversationMessages();
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [conversationId]);

  const createConversationMutation = useMutation({
    mutationFn: async (data: { agentIds: string[] }) => {
      if (!selectedProject?.id) {
        throw new Error('No project selected');
      }
      const response = await fetch(`/api/projects/${selectedProject.id}/team-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentIds: data.agentIds }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Conversation created successfully:', data);
      setConversationId(data.conversationId);
      
      // Update selected agents from the response
      if (data.participants) {
        setSelectedAgents(data.participants);
      }
      
      setMessages([{
        id: Date.now().toString(),
        type: 'success',
        message: `Team conversation created with ${data.participants?.length || 0} agents`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setShowAgentSelection(false);
      setAgentCheckboxes({});
      toast({
        title: "Success",
        description: "Team conversation created successfully!",
      });
      
      // Fetch initial messages
      fetchConversationMessages();
    },
    onError: (error: any) => {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team conversation",
        variant: "destructive",
      });
    },
  });

  const fileTreeQuery = useQuery({
    queryKey: ['/api/files', selectedProject?.id],
    queryFn: async () => {
      const params = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`/api/files${params}`);
      return response.json();
    },
    enabled: true
  });

  useEffect(() => {
    if (projectsQuery.data && projectsQuery.data.length > 0) {
      // Check for project parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectParam = urlParams.get('project');
      
      if (projectParam) {
        const targetProject = projectsQuery.data.find(p => p.id === parseInt(projectParam));
        if (targetProject) {
          setSelectedProject(targetProject);
          return;
        }
      }
      
      // Default to first project if no valid project parameter
      setSelectedProject(projectsQuery.data[0]);
    }
  }, [projectsQuery.data]);

  // Refetch file tree and check for existing conversation when project changes
  useEffect(() => {
    if (selectedProject) {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
      // Check if project has an existing conversation
      fetch(`/api/conversations`)
        .then(res => res.json())
        .then(conversations => {
          const projectConversation = conversations.find(c => c.projectId == selectedProject.id);
          if (projectConversation) {
            setConversationId(projectConversation.id);
            setSelectedAgents(projectConversation.participants || []);
            fetchConversationMessages();
          }
        })
        .catch(err => console.error('Error checking conversations:', err));
    }
  }, [selectedProject, queryClient]);



  const handleFileSelect = async (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node);
      
      // Add to open files if not already open
      if (!openFiles.find(f => f.path === node.path)) {
        setOpenFiles([...openFiles, node]);
      }
      
      // Load real file content from server
      try {
        const params = new URLSearchParams({
          path: node.path
        });
        
        // Add projectId if a project is selected
        if (selectedProject?.id) {
          params.append('projectId', selectedProject.id.toString());
        }
        
        const response = await fetch(`/api/files/content?${params}`);
        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content);
          setActiveTab('editor');
          
          // Update live preview if it's an HTML file
          if (node.path.endsWith('.html')) {
            setPreviewContent(data.content);
          }
        } else {
          throw new Error('Failed to fetch file content');
        }
      } catch (error) {
        console.error('Error loading file:', error);
        toast({
          title: "Error",
          description: "Failed to load file content",
          variant: "destructive",
        });
      }
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



  const handleAgentToggle = (agentId: string, checked: boolean) => {
    setAgentCheckboxes(prev => ({
      ...prev,
      [agentId]: checked
    }));
  };

  const handleCreateTeamConversation = () => {
    const selectedAgentIds = Object.entries(agentCheckboxes)
      .filter(([_, checked]) => checked)
      .map(([id]) => id);
    
    if (selectedAgentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one agent",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating conversation with agent IDs:', selectedAgentIds);
    console.log('Selected project:', selectedProject);
    
    createConversationMutation.mutate({ agentIds: selectedAgentIds });
  };

  const getLanguageFromFileName = (fileName: string): string => {
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
  };

  const handleFormatCode = async () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      const language = getLanguageFromFileName(selectedFile.name);
      
      // Use AI-powered formatting
      const response = await fetch('/api/files/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
          language,
          provider: 'openai' // You can make this configurable
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setFileContent(result.formattedCode);
        toast({
          title: "Code Formatted",
          description: result.explanation || "Your code has been formatted successfully",
        });
        
        // Show suggestions if any
        if (result.suggestions && result.suggestions.length > 0) {
          console.log('AI Suggestions:', result.suggestions);
        }
      } else {
        throw new Error('Failed to format code');
      }
    } catch (error) {
      console.error('Error formatting code:', error);
      toast({
        title: "Format Error",
        description: "Unable to format code with AI. Please check syntax errors.",
        variant: "destructive",
      });
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      const response = await fetch('/api/files/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: fileContent,
          projectId: selectedProject?.id
        }),
      });
      
      if (response.ok) {
        toast({
          title: "File Saved",
          description: `${selectedFile.name} has been saved successfully`,
        });
        
        // Update live preview if it's an HTML file
        if (selectedFile.path.endsWith('.html')) {
          setPreviewContent(fileContent);
        }
      } else {
        throw new Error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Save Error",
        description: "Failed to save file",
        variant: "destructive",
      });
    }
  };

  const handleDebugCode = async () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      const language = getLanguageFromFileName(selectedFile.name);
      
      const response = await fetch('/api/files/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
          language,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setFileContent(result.fixedCode);
        toast({
          title: "Code Debugged",
          description: result.explanation || "Code has been analyzed and improved",
        });
        
        if (result.issues && result.issues.length > 0) {
          console.log('Issues found:', result.issues);
        }
      } else {
        throw new Error('Failed to debug code');
      }
    } catch (error) {
      console.error('Error debugging code:', error);
      toast({
        title: "Debug Error",
        description: "Failed to debug code with AI",
        variant: "destructive",
      });
    }
  };

  const handleExplainCode = async () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      const language = getLanguageFromFileName(selectedFile.name);
      
      const response = await fetch('/api/files/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
          language,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Code Explanation",
          description: result.explanation || "Code analysis completed",
        });
        
        console.log('Code Analysis:', {
          explanation: result.explanation,
          keyFeatures: result.keyFeatures,
          complexity: result.complexity,
          suggestions: result.suggestions
        });
      } else {
        throw new Error('Failed to explain code');
      }
    } catch (error) {
      console.error('Error explaining code:', error);
      toast({
        title: "Explain Error",
        description: "Failed to explain code with AI",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return expandedFolders.has(node.path) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path} className="mb-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer ${
            selectedFile?.path === node.path ? 'bg-primary/10' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              handleFileSelect(node);
            }
          }}
        >
          {node.type === 'folder' && (
            expandedFolders.has(node.path) ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
          )}
          {getFileIcon(node)}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.children && expandedFolders.has(node.path) && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold">Development Workspace</h1>
            {selectedProject && (
              <Badge variant="outline">{selectedProject.name}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setLocation('/create-project')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setLocation('/team-agents')}
            >
              <Users className="w-4 h-4 mr-2" />
              Team Agents
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setLocation('/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Project Selection & Status */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {projectsQuery.data && projectsQuery.data.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-foreground">Project:</label>
                <Select 
                  value={selectedProject?.id?.toString() || ''} 
                  onValueChange={(value) => {
                    const project = projectsQuery.data?.find((p: any) => p.id.toString() === value);
                    setSelectedProject(project);
                  }}
                >
                  <SelectTrigger className="w-48 bg-background border-input">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsQuery.data?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
          </div>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-140px)]">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full rounded-none border-0 border-r">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Folder className="w-4 h-4 mr-2" />
                Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-2">
                  {fileTreeQuery.data && Array.isArray(fileTreeQuery.data) && renderFileTree(fileTreeQuery.data)}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel - AI Agent Chat */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full rounded-none border-0 border-r">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Agent Chat
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedAgents.length} agents
                  </Badge>
                  <Dialog open={showAgentSelection} onOpenChange={setShowAgentSelection}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Select Agents
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Select AI Agents for Team Chat</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4">
                          {agentsQuery.data?.map((agent: Agent) => (
                          <div
                            key={agent.id}
                            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`agent-${agent.id}`}
                              checked={agentCheckboxes[agent.id] || false}
                              onCheckedChange={(checked) => {
                                console.log('Agent checkbox changed:', agent.id, checked);
                                handleAgentToggle(agent.id, checked as boolean);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-primary/10">
                                    {agent.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{agent.name}</p>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {agent.specialty || agent.specialization || 'General AI'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {agent.model === 'gpt-4o' ? 'OpenAI GPT-4o' : 
                                       agent.model === 'claude-sonnet-4-20250514' ? 'Claude Sonnet 4.0' :
                                       agent.model === 'gemini-2.5-flash' ? 'Google Gemini 2.5' : 
                                       agent.aiProvider || agent.model}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {agent.status || agent.experienceLevel || 'online'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {agent.description || `${agent.specialty || agent.specialization || 'AI'} specialist`}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {agent.capabilities?.map((capability, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {capability}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowAgentSelection(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTeamConversation}
                          disabled={createConversationMutation.isPending}
                        >
                          {createConversationMutation.isPending ? 'Creating...' : 'Create Team Chat'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[calc(100vh-200px)] flex flex-col">
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select AI agents and start chatting!</p>
                      </div>
                    ) : (
                      messages.map((msg: any, index) => (
                        <div key={index} className={`p-4 rounded-lg ${msg.senderType === 'agent' ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' : 'bg-gray-50 dark:bg-gray-800/50 mr-8'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.senderType === 'agent' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                              {msg.senderType === 'agent' ? (
                                <Bot className="w-6 h-6 text-white" />
                              ) : (
                                <User className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                  {msg.senderType === 'agent' ? msg.agentName : 'You'}
                                </span>
                                {msg.senderType === 'agent' && msg.agentProvider && (
                                  <Badge variant="secondary" className="text-xs">
                                    {msg.agentProvider}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {msg.timestamp}
                                </span>
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Chat with your AI team..."
                      value={chatCommand}
                      onChange={(e) => setChatCommand(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleChatCommand();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleChatCommand} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Development Tools */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Development Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="editor">
                    <Code className="w-4 h-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="console">
                    <Terminal className="w-4 h-4 mr-2" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="browser">
                    <Globe className="w-4 h-4 mr-2" />
                    Browser
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="h-[calc(100vh-240px)] m-0">
                  <div className="h-full flex flex-col">
                    {selectedFile ? (
                      <>
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Extensions"
                                >
                                  <Settings className="w-4 h-4" />
                                  Extensions
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Editor Extensions</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold">Prettier - Code Formatter</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Format your code using the #1 Code Formatter
                                          </p>
                                          <Badge className="mt-2" variant="secondary">Installed</Badge>
                                        </div>
                                        <Code className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                    </Card>
                                    <Card className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold">ESLint</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Find and fix problems in JavaScript code
                                          </p>
                                          <Button size="sm" variant="outline" className="mt-2">Install</Button>
                                        </div>
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                    </Card>
                                    <Card className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold">GitLens</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Supercharge Git within VS Code
                                          </p>
                                          <Button size="sm" variant="outline" className="mt-2">Install</Button>
                                        </div>
                                        <Database className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                    </Card>
                                    <Card className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold">Auto Import</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Automatically finds and imports modules
                                          </p>
                                          <Button size="sm" variant="outline" className="mt-2">Install</Button>
                                        </div>
                                        <RefreshCw className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                    </Card>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFormatCode()}
                              title="Format Code (Alt+Shift+F)"
                            >
                              <Code className="w-4 h-4" />
                              Format
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDebugCode()}
                              title="Debug Code with AI"
                            >
                              <Bot className="w-4 h-4" />
                              Debug
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExplainCode()}
                              title="Explain Code with AI"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Explain
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveFile()}
                              title="Save (Ctrl+S)"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedFile(null);
                                setOpenFiles(openFiles.filter(f => f.path !== selectedFile.path));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <Editor
                            height="100%"
                            defaultLanguage={getLanguageFromFileName(selectedFile.name)}
                            language={getLanguageFromFileName(selectedFile.name)}
                            value={fileContent}
                            onChange={(value) => setFileContent(value || '')}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: true },
                              fontSize: 14,
                              lineNumbers: 'on',
                              rulers: [80],
                              wordWrap: 'off',
                              automaticLayout: true,
                              formatOnPaste: true,
                              formatOnType: true,
                              scrollBeyondLastLine: false,
                              fixedOverflowWidgets: true,
                              suggestOnTriggerCharacters: true,
                              acceptSuggestionOnEnter: 'on',
                              tabCompletion: 'on',
                              wordBasedSuggestions: true,
                              contextmenu: true,
                              quickSuggestions: {
                                other: true,
                                comments: false,
                                strings: false
                              },
                              parameterHints: {
                                enabled: true
                              },
                              suggestSelection: 'first',
                              folding: true,
                              foldingStrategy: 'indentation',
                              showFoldingControls: 'always',
                              bracketPairColorization: {
                                enabled: true
                              },
                              renderWhitespace: 'selection',
                              renderControlCharacters: false,
                              renderLineHighlight: 'all',
                              renderValidationDecorations: 'on',
                              smoothScrolling: true,
                              cursorBlinking: 'phase',
                              cursorSmoothCaretAnimation: true,
                              accessibilitySupport: 'auto'
                            }}
                            onMount={(editor, monaco) => {
                              // Configure Monaco for error detection
                              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                                noSemanticValidation: false,
                                noSyntaxValidation: false,
                              });
                              
                              monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                                target: monaco.languages.typescript.ScriptTarget.ESNext,
                                allowNonTsExtensions: true,
                                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                                module: monaco.languages.typescript.ModuleKind.ESNext,
                                noEmit: true,
                                esModuleInterop: true,
                                jsx: monaco.languages.typescript.JsxEmit.React,
                                reactNamespace: 'React',
                                allowJs: true,
                                typeRoots: ['node_modules/@types']
                              });
                              
                              // Add keyboard shortcuts
                              editor.addAction({
                                id: 'format-code',
                                label: 'Format Code',
                                keybindings: [
                                  monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F
                                ],
                                contextMenuGroupId: 'navigation',
                                run: () => handleFormatCode()
                              });
                              
                              editor.addAction({
                                id: 'save-file',
                                label: 'Save File',
                                keybindings: [
                                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S
                                ],
                                run: () => handleSaveFile()
                              });
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select a file to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="h-[calc(100vh-240px)] m-0">
                  <div className="h-full p-4">
                    <div className="bg-white rounded-lg border h-full">
                      {previewContent ? (
                        <iframe
                          srcDoc={previewContent}
                          className="w-full h-full rounded-lg"
                          title="Live Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : selectedProject ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select an HTML file to preview</p>
                            <p className="text-sm mt-2">Project: {selectedProject.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select a project to start previewing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="console" className="h-[calc(100vh-240px)] m-0">
                  <div className="h-full p-4">
                    <div className="bg-black text-green-400 p-4 rounded-lg h-full font-mono text-sm">
                      <div className="space-y-2">
                        <div>$ npm run dev</div>
                        <div>Starting development server...</div>
                        <div>Server running on port 5000</div>
                        <div className="text-gray-400"># Ready for commands</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="browser" className="h-[calc(100vh-240px)] m-0">
                  <div className="h-full p-4">
                    <div className="bg-white rounded-lg border h-full">
                      <iframe
                        src="http://localhost:5000"
                        className="w-full h-full rounded-lg"
                        title="Live Application"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}