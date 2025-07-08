import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Users, 
  Bot, 
  Code, 
  Palette, 
  Server, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Send,
  Plus,
  Settings,
  Activity,
  Brain,
  Zap,
  Target
} from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'offline';
  avatar?: string;
  model?: string;
  provider?: string;
}

interface Conversation {
  id: number;
  title: string;
  type: string;
  participants: number[];
  status: 'active' | 'paused' | 'completed';
  lastActivity: Date;
  projectId?: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderType: 'user' | 'agent';
  timestamp: Date;
  messageType: 'text' | 'code' | 'image' | 'file';
  metadata?: Record<string, any>;
}

interface CollaborationSession {
  id: number;
  projectId: number;
  objective: string;
  participants: Agent[];
  currentPhase: string;
  progress: number;
  decisions: Array<{
    decision: string;
    madeBy: number;
    reasoning: string;
    timestamp: Date;
  }>;
  outcomes: string[];
}

interface WebSocketMessage {
  type: 'agent_message' | 'user_message' | 'system_notification' | 'typing_indicator' | 'agent_status_update';
  conversationId: number;
  senderId: number;
  senderType: 'user' | 'agent';
  content?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export default function CollaborationDashboard() {
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [isStartingCollaboration, setIsStartingCollaboration] = useState(false);
  const [collaborationObjective, setCollaborationObjective] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch active collaborations
  const { data: activeCollaborations = [], isLoading: collaborationsLoading } = useQuery({
    queryKey: ['/api/collaborations/active'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch AI providers
  const { data: aiProviders = [], isLoading: providersLoading } = useQuery({
    queryKey: ['/api/ai-providers'],
  });

  // Fetch WebSocket connection stats
  const { data: wsStats = { totalConnections: 0, activeConversations: 0, typingUsers: 0 } } = useQuery({
    queryKey: ['/api/websocket/stats'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port || '5000';
    const wsUrl = `${protocol}//${host}:${port}/ws?userId=1`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.log('Non-JSON WebSocket message received:', event.data);
      }
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    return () => {
      websocket.close();
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'user_message':
      case 'agent_message':
        if (message.conversationId === activeConversation) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: message.content || '',
            senderId: message.senderId,
            senderType: message.senderType,
            timestamp: new Date(message.timestamp),
            messageType: message.metadata?.messageType || 'text',
            metadata: message.metadata
          }]);
        }
        break;
      
      case 'typing_indicator':
        if (message.conversationId === activeConversation) {
          if (message.content === 'typing') {
            setTypingUsers(prev => new Set(prev).add(message.senderId));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(message.senderId);
              return newSet;
            });
          }
        }
        break;
      
      case 'agent_status_update':
        queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
        break;
      
      case 'system_notification':
        try {
          const notification = JSON.parse(message.content || '{}');
          if (notification.type === 'conversation_history') {
            setMessages(notification.messages || []);
          } else if (notification.type === 'collaborative_session_started') {
            toast({
              title: "Collaborative Session Started",
              description: `New collaboration session for: ${notification.objective}`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/collaborations/active'] });
          }
        } catch (error) {
          console.error('Error parsing system notification:', error);
        }
        break;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !activeConversation) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasWs: !!ws, 
        hasConversation: !!activeConversation,
        connectionStatus 
      });
      return;
    }
    
    const message: WebSocketMessage = {
      type: 'user_message',
      conversationId: activeConversation,
      senderId: 1,
      senderType: 'user',
      content: newMessage,
      timestamp: new Date()
    };
    
    console.log('Sending message:', message);
    ws.send(JSON.stringify(message));
    setNewMessage('');
  };

  const startCollaborationSession = useMutation({
    mutationFn: async (data: { objective: string; agentIds: number[] }) => {
      console.log('Starting collaboration with agents:', data.agentIds);
      
      try {
        // Get the selected agents' capabilities
        const selectedAgentsData = data.agentIds.map(id => 
          (agents as Agent[]).find((a: Agent) => a.id === id)
        ).filter(Boolean);
        
        console.log('Selected agents:', selectedAgentsData);
        
        const response = await apiRequest('POST', '/api/collaborations/start', {
          projectId: 1,
          objective: data.objective,
          requiredCapabilities: selectedAgentsData.flatMap(agent => agent?.capabilities || [])
        });
        
        console.log('API response:', response);
        return response;
      } catch (error) {
        console.error('API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Collaboration started successfully:', data);
      toast({
        title: "Collaboration Started",
        description: "Multi-agent collaboration session has been initiated",
      });
      setIsStartingCollaboration(false);
      setCollaborationObjective('');
      setSelectedAgents([]);
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/active'] });
      
      // If we have a conversation ID, navigate to it
      if (data && data.id) {
        // Find the conversation created for this collaboration
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    },
    onError: (error: any) => {
      console.error('Failed to start collaboration:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to start collaboration session",
        variant: "destructive",
      });
    }
  });

  const joinConversation = (conversationId: number) => {
    if (ws) {
      console.log('Joining conversation:', conversationId);
      ws.send(JSON.stringify({
        type: 'join_conversation',
        conversationId,
        senderId: 1,
        senderType: 'user',
        timestamp: new Date()
      }));
      setActiveConversation(conversationId);
      setMessages([]);
      
      // Load conversation messages
      queryClient.fetchQuery({
        queryKey: [`/api/conversations/${conversationId}/messages`],
      }).then((data: any) => {
        if (data) {
          console.log('Loaded messages for conversation:', data);
          setMessages(data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      });
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'senior_developer':
      case 'junior_developer':
        return <Code className="w-4 h-4" />;
      case 'designer':
        return <Palette className="w-4 h-4" />;
      case 'devops':
        return <Server className="w-4 h-4" />;
      case 'product_manager':
        return <Target className="w-4 h-4" />;
      case 'code_reviewer':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPhaseProgress = (phase: string) => {
    switch (phase) {
      case 'planning':
        return 25;
      case 'design':
        return 50;
      case 'implementation':
        return 75;
      case 'review':
        return 90;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Multi-Agent Collaboration Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Orchestrate AI agents for collaborative development projects
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 
                     'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Activity className="w-4 h-4" />
                    <span>{(wsStats as any).totalConnections || 0} connections</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{(wsStats as any).activeConversations || 0} active chats</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{(wsStats as any).typingUsers || 0} typing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agents Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {agentsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    </div>
                  ) : (
                    (agents as Agent[]).map((agent: Agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          if (selectedAgents.includes(agent.id)) {
                            setSelectedAgents(prev => prev.filter(id => id !== agent.id));
                          } else {
                            setSelectedAgents(prev => [...prev, agent.id]);
                          }
                        }}
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={agent.avatar} />
                            <AvatarFallback>
                              {getAgentIcon(agent.type)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(agent.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">{agent.name}</p>
                            {selectedAgents.includes(agent.id) && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {agent.type.replace('_', ' ')}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {agent.provider || 'openai'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {agent.model || 'gpt-4o'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {/* Start Collaboration Button */}
              <div className="mt-4 space-y-2">
                <Dialog open={isStartingCollaboration} onOpenChange={setIsStartingCollaboration}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={selectedAgents.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Collaboration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Collaboration Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Objective</label>
                        <Textarea
                          placeholder="Describe what you want to accomplish..."
                          value={collaborationObjective}
                          onChange={(e) => setCollaborationObjective(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Selected Agents</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedAgents.map(agentId => {
                            const agent = (agents as Agent[]).find((a: Agent) => a.id === agentId);
                            return agent ? (
                              <Badge key={agentId} variant="secondary">
                                {agent.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <Button 
                        onClick={() => startCollaborationSession.mutate({ 
                          objective: collaborationObjective, 
                          agentIds: selectedAgents 
                        })}
                        className="w-full"
                        disabled={!collaborationObjective.trim() || startCollaborationSession.isPending}
                      >
                        {startCollaborationSession.isPending ? 'Starting...' : 'Start Collaboration'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Real-time Chat</TabsTrigger>
                <TabsTrigger value="collaborations">Active Collaborations</TabsTrigger>
                <TabsTrigger value="providers">AI Providers</TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Conversations List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {conversationsLoading ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
                            </div>
                          ) : (
                            (conversations as Conversation[]).map((conversation: Conversation) => (
                              <div
                                key={conversation.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  activeConversation === conversation.id
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => joinConversation(conversation.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {conversation.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {conversation.participants.length} participants
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Chat Interface */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {activeConversation ? `Chat ${activeConversation}` : 'Select a conversation'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeConversation ? (
                        <div className="space-y-4">
                          {/* Messages */}
                          <ScrollArea className="h-[300px] border rounded-md p-3">
                            <div className="space-y-3">
                              {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    message.senderType === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] p-3 rounded-lg ${
                                      message.senderType === 'user'
                                        ? 'bg-blue-500 text-white ml-auto'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 mb-1">
                                      {message.senderType === 'agent' && (
                                        <div className="flex items-center space-x-1">
                                          <Bot className="w-3 h-3" />
                                          <span className="text-xs font-medium">
                                            Agent {message.senderId}
                                          </span>
                                        </div>
                                      )}
                                      <span className="text-xs opacity-70">
                                        {message.timestamp.toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                </div>
                              ))}
                              {typingUsers.size > 0 && (
                                <div className="flex justify-start">
                                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                    <div className="flex items-center space-x-1">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                      </div>
                                      <span className="text-xs text-gray-500">typing...</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div ref={messagesEndRef} />
                          </ScrollArea>

                          {/* Message Input */}
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              className="flex-1"
                            />
                            <Button 
                              onClick={sendMessage} 
                              disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Connection Status */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <span>
                              Status: <span className={connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>
                                {connectionStatus}
                              </span>
                            </span>
                            <span>
                              {typingUsers.size > 0 && `${typingUsers.size} agent(s) typing...`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                          <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Select a conversation to start chatting</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Collaborations Tab */}
              <TabsContent value="collaborations" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {collaborationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    </div>
                  ) : (
                    (activeCollaborations as CollaborationSession[]).map((collaboration: CollaborationSession) => (
                      <Card key={collaboration.id}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Brain className="w-5 h-5 mr-2" />
                            {collaboration.objective}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Progress</span>
                                <Badge variant="outline">{collaboration.currentPhase}</Badge>
                              </div>
                              <Progress value={getPhaseProgress(collaboration.currentPhase)} className="h-2" />
                            </div>
                            
                            <div>
                              <span className="text-sm font-medium">Participants</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {collaboration.participants.map((agent) => (
                                  <Badge key={agent.id} variant="secondary" className="text-xs">
                                    {agent.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {collaboration.decisions.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Recent Decisions</span>
                                <div className="mt-1 space-y-1">
                                  {collaboration.decisions.slice(-2).map((decision, index) => (
                                    <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      <p className="font-medium">{decision.decision}</p>
                                      <p className="text-gray-500 mt-1">{decision.reasoning}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* AI Providers Tab */}
              <TabsContent value="providers" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {providersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    </div>
                  ) : (
                    (aiProviders as { name: string; models: string[] }[]).map((provider: { name: string; models: string[] }) => (
                      <Card key={provider.name}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Zap className="w-5 h-5 mr-2" />
                            {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-sm text-green-600">Available</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Models</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {provider.models.map((model) => (
                                  <Badge key={model} variant="outline" className="text-xs">
                                    {model}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}