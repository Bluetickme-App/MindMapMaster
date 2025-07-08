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
import { 
  ArrowLeft, 
  Users, 
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
  ChevronDown
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
  id: number;
  name: string;
  type: string;
  description: string;
  specialization: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'offline';
  aiProvider: 'openai' | 'claude' | 'gemini';
  experienceLevel: 'expert' | 'senior' | 'junior';
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
  const [agentCheckboxes, setAgentCheckboxes] = useState<Record<number, boolean>>({});
  
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
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id.toString(),
          type: msg.senderType === 'agent' ? 'success' : 'info',
          message: `${msg.senderType === 'agent' ? `[${getAgentName(msg.senderId)}] ` : ''}${msg.content}`,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const getAgentName = (agentId: number) => {
    const agent = agentsQuery.data?.find((a: Agent) => a.id === agentId);
    return agent?.name || `Agent ${agentId}`;
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
    mutationFn: async (data: { agentIds: number[] }) => {
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
      if (data.agents) {
        setSelectedAgents(data.agents);
      }
      
      setMessages([{
        id: Date.now().toString(),
        type: 'success',
        message: `Team conversation created with ${data.agents?.length || 0} agents`,
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

  // Mock file system
  const fileSystem: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            { name: 'ui', type: 'folder', path: 'src/components/ui', children: [] },
            { name: 'Button.tsx', type: 'file', path: 'src/components/Button.tsx' },
            { name: 'Card.tsx', type: 'file', path: 'src/components/Card.tsx' },
          ]
        },
        {
          name: 'pages',
          type: 'folder',
          path: 'src/pages',
          children: [
            { name: 'Home.tsx', type: 'file', path: 'src/pages/Home.tsx' },
            { name: 'About.tsx', type: 'file', path: 'src/pages/About.tsx' },
          ]
        },
        { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
        { name: 'index.tsx', type: 'file', path: 'src/index.tsx' },
      ]
    },
    {
      name: 'public',
      type: 'folder',
      path: 'public',
      children: [
        { name: 'index.html', type: 'file', path: 'public/index.html' },
        { name: 'favicon.ico', type: 'file', path: 'public/favicon.ico' },
      ]
    },
    { name: 'package.json', type: 'file', path: 'package.json' },
    { name: 'tsconfig.json', type: 'file', path: 'tsconfig.json' },
    { name: 'README.md', type: 'file', path: 'README.md' },
  ];

  useEffect(() => {
    if (projectsQuery.data && projectsQuery.data.length > 0) {
      setSelectedProject(projectsQuery.data[0]);
    }
  }, [projectsQuery.data]);

  const handleChatCommand = async () => {
    if (!chatCommand.trim()) return;
    
    if (!conversationId) {
      toast({
        title: "No conversation",
        description: "Please create a team conversation first",
        variant: "destructive",
      });
      return;
    }

    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'info',
      message: chatCommand,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, newMessage]);
    
    try {
      // Send message to the team conversation
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: chatCommand,
          messageType: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Poll for agent responses after a short delay
      setTimeout(() => {
        fetchConversationMessages();
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
    
    setChatCommand('');
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
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



  const handleAgentToggle = (agentId: number, checked: boolean) => {
    setAgentCheckboxes(prev => ({
      ...prev,
      [agentId]: checked
    }));
  };

  const handleCreateTeamConversation = () => {
    const selectedAgentIds = Object.entries(agentCheckboxes)
      .filter(([_, checked]) => checked)
      .map(([id]) => parseInt(id));
    
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
                  {renderFileTree(fileSystem)}
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
                              onCheckedChange={(checked) => handleAgentToggle(agent.id, checked as boolean)}
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
                                      {agent.specialization}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {agent.aiProvider}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {agent.experienceLevel}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {agent.description || `${agent.specialization} specialist`}
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
                      messages.map((msg, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{msg.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
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
              <Tabs defaultValue="preview" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
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
                
                <TabsContent value="preview" className="h-[calc(100vh-240px)] m-0">
                  <div className="h-full p-4">
                    <div className="bg-white rounded-lg border h-full">
                      <iframe
                        src="/preview"
                        className="w-full h-full rounded-lg"
                        title="Project Preview"
                      />
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