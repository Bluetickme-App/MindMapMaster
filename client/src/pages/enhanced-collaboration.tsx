import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Bot, 
  Code, 
  Palette, 
  Server, 
  CheckCircle, 
  Clock, 
  Send,
  Plus,
  Activity,
  Brain,
  Zap,
  MessageSquare,
  Settings
} from 'lucide-react';

interface EnhancedAgent {
  id: string;
  name: string;
  role: string;
  specialization: string;
  provider: 'openai' | 'claude' | 'gemini';
  capabilities: string[];
  active: boolean;
}

interface CollaborationMessage {
  id: string;
  content: string;
  agentName: string;
  agentRole: string;
  timestamp: string;
  type: 'message' | 'code' | 'suggestion' | 'decision';
}

interface Collaboration {
  id: string;
  objective: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  status: 'active' | 'paused' | 'completed';
  currentPhase: string;
  messageCount: number;
  createdAt: string;
  completedAt?: string;
  messages?: CollaborationMessage[];
}

export default function EnhancedCollaboration() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [objective, setObjective] = useState('');
  const [activeCollaboration, setActiveCollaboration] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgentForMessage, setSelectedAgentForMessage] = useState<string>('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch enhanced agents
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/enhanced-agents'],
    refetchInterval: 30000,
  });

  // Fetch collaborations
  const { data: collaborationsData, isLoading: collaborationsLoading } = useQuery({
    queryKey: ['/api/enhanced-agents/collaborations'],
    refetchInterval: 10000,
  });

  // Fetch active collaboration details
  const { data: activeCollaborationData, isLoading: collaborationLoading } = useQuery({
    queryKey: ['/api/enhanced-agents/collaborations', activeCollaboration],
    enabled: !!activeCollaboration,
    refetchInterval: 5000,
  });

  const agents = agentsData?.agents || [];
  const collaborations = collaborationsData?.collaborations || [];
  const currentCollaboration = activeCollaborationData?.collaboration;

  // Start collaboration mutation
  const startCollaboration = useMutation({
    mutationFn: async (data: { objective: string; agentIds: string[] }) => {
      return apiRequest('POST', '/api/enhanced-agents/collaborate', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Collaboration Started",
        description: `Team collaboration initiated for: ${objective}`,
      });
      setActiveCollaboration(data.collaboration.id);
      setObjective('');
      setSelectedAgents([]);
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents/collaborations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start collaboration",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: { message: string; agentId: string }) => {
      return apiRequest('POST', `/api/enhanced-agents/collaborations/${activeCollaboration}/message`, data);
    },
    onSuccess: (data) => {
      setNewMessage('');
      setSelectedAgentForMessage('');
      queryClient.invalidateQueries({ 
        queryKey: ['/api/enhanced-agents/collaborations', activeCollaboration] 
      });
      toast({
        title: "Message Sent",
        description: `${agents.find(a => a.id === data.agentId)?.name} is responding...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const getAgentIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'frontend developer': return Code;
      case 'backend developer': return Server;
      case 'ai integration specialist': return Brain;
      case 'css specialist': return Palette;
      case 'devops engineer': return Settings;
      default: return Bot;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-500';
      case 'claude': return 'bg-purple-500';
      case 'gemini': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartCollaboration = () => {
    if (!objective.trim() || selectedAgents.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide an objective and select at least one agent",
        variant: "destructive",
      });
      return;
    }

    startCollaboration.mutate({
      objective: objective.trim(),
      agentIds: selectedAgents
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedAgentForMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter a message and select an agent",
        variant: "destructive",
      });
      return;
    }

    sendMessage.mutate({
      message: newMessage.trim(),
      agentId: selectedAgentForMessage
    });
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Enhanced Agent Collaboration</h1>
          <p className="text-slate-400">Work with a team of specialized AI agents to build complete applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Selection & New Collaboration */}
          <div className="space-y-6">
            <Card className="bg-surface border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Available Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentsLoading ? (
                  <div className="text-slate-400">Loading agents...</div>
                ) : (
                  agents.map((agent: EnhancedAgent) => {
                    const IconComponent = getAgentIcon(agent.role);
                    const isSelected = selectedAgents.includes(agent.id);
                    
                    return (
                      <div
                        key={agent.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                        onClick={() => handleAgentToggle(agent.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={`${getProviderColor(agent.provider)} text-white`}>
                              <IconComponent className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-100 font-medium">{agent.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {agent.provider}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{agent.role}</p>
                            <p className="text-xs text-slate-500">{agent.specialization}</p>
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                        </div>
                      </div>
                    );
                  })
                )}

                <Separator className="bg-slate-700" />

                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe what you want to build..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100"
                    rows={3}
                  />
                  
                  <Button
                    onClick={handleStartCollaboration}
                    disabled={startCollaboration.isPending || !objective.trim() || selectedAgents.length === 0}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {startCollaboration.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Start Collaboration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collaborations List */}
            <Card className="bg-surface border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Collaborations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {collaborationsLoading ? (
                    <div className="text-slate-400">Loading collaborations...</div>
                  ) : collaborations.length === 0 ? (
                    <div className="text-slate-400">No collaborations yet</div>
                  ) : (
                    <div className="space-y-3">
                      {collaborations.map((collab: Collaboration) => (
                        <div
                          key={collab.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            activeCollaboration === collab.id
                              ? 'border-primary bg-primary/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                          onClick={() => setActiveCollaboration(collab.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={collab.status === 'active' ? 'default' : 'secondary'}>
                              {collab.status}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {collab.messageCount} messages
                            </span>
                          </div>
                          <p className="text-sm text-slate-100 mb-1">{collab.objective}</p>
                          <p className="text-xs text-slate-400">
                            {collab.participants.length} agents • {collab.currentPhase}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Active Collaboration */}
          <div className="lg:col-span-2">
            {activeCollaboration ? (
              <Card className="bg-surface border-slate-700 h-[800px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {currentCollaboration?.objective || 'Loading...'}
                  </CardTitle>
                  {currentCollaboration && (
                    <div className="flex flex-wrap gap-2">
                      {currentCollaboration.participants?.map((participant: any) => (
                        <Badge key={participant.id} variant="outline">
                          {participant.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    {collaborationLoading ? (
                      <div className="text-slate-400">Loading conversation...</div>
                    ) : currentCollaboration?.messages?.length === 0 ? (
                      <div className="text-slate-400">No messages yet</div>
                    ) : (
                      <div className="space-y-4">
                        {currentCollaboration?.messages?.map((message: CollaborationMessage) => {
                          const agent = agents.find((a: EnhancedAgent) => a.name === message.agentName);
                          const IconComponent = getAgentIcon(message.agentRole);
                          
                          return (
                            <div key={message.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className={`${agent ? getProviderColor(agent.provider) : 'bg-gray-500'} text-white`}>
                                  <IconComponent className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-slate-100 font-medium">{message.agentName}</span>
                                  <span className="text-xs text-slate-400">{message.agentRole}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {message.type}
                                  </Badge>
                                </div>
                                <div className="text-slate-300 text-sm bg-slate-800 p-3 rounded-lg">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={selectedAgentForMessage}
                        onChange={(e) => setSelectedAgentForMessage(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100"
                      >
                        <option value="">Select agent to message...</option>
                        {currentCollaboration?.participants?.map((participant: any) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.name} ({participant.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-slate-100"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendMessage.isPending || !newMessage.trim() || !selectedAgentForMessage}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-surface border-slate-700 h-[800px] flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-100 mb-2">No Active Collaboration</h3>
                  <p className="text-slate-400">Select a team and start a new collaboration</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}