import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, Users, Send, ArrowLeft, Eye, Code, 
  Palette, Database, Globe, Zap
} from "lucide-react";
import type { Agent, Conversation, Message } from "@shared/schema";

interface TeamShowcaseDiscussionProps {
  conversationId?: number;
  onBack?: () => void;
}

export default function TeamShowcaseDiscussion({ conversationId, onBack }: TeamShowcaseDiscussionProps) {
  const [newMessage, setNewMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(conversationId || null);
  const [isPolling, setIsPolling] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Create team conversation for showcase website
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      // Select relevant agents for the showcase website discussion
      const relevantAgentIds = agents
        .filter(agent => 
          ['Maya Designer', 'Alex Senior', 'Jordan CSS', 'Riley PM', 'Sam AI'].includes(agent.name)
        )
        .map(agent => agent.id)
        .slice(0, 5); // Limit to 5 agents

      const response = await apiRequest("POST", "/api/conversations", {
        title: "5-Page Showcase Website Design & Development",
        projectId: null,
        participantIds: relevantAgentIds,
        type: "team_discussion"
      });
      return response;
    },
    onSuccess: (data: any) => {
      setActiveConversationId(data.id);
      toast({
        title: "Team Discussion Started",
        description: "AI agents are ready to discuss the showcase website",
      });
      
      // Send initial project briefing
      sendInitialBriefing(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start team discussion",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
        role: "user",
        agentId: null
      });
      return response;
    },
    onSuccess: () => {
      setNewMessage("");
      setIsPolling(true);
      // Start polling for agent responses
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId, 'messages'] });
        setIsPolling(false);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Fetch messages
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', activeConversationId, 'messages'],
    enabled: !!activeConversationId,
    refetchInterval: isPolling ? 2000 : false,
  });

  // Send initial briefing to agents
  const sendInitialBriefing = async (conversationId: number) => {
    const briefing = `🚀 **PROJECT BRIEFING: 5-Page Professional Showcase Website**

We need to create a comprehensive 5-page website that demonstrates our development team's capabilities. Here are the requirements:

**Pages Required:**
1. **Home** - Hero section, team stats, value proposition
2. **About** - Team member profiles, expertise, experience
3. **Services** - Development services, AI integration, cloud solutions
4. **Portfolio** - Case studies, project examples, client work
5. **Contact** - Contact form, why choose us, call-to-action

**Design Requirements:**
- Modern, professional design with dark theme
- Gradient effects and animations
- Responsive layout for all devices
- Accessible components with proper ARIA labels
- Interactive elements and smooth transitions

**Technical Requirements:**
- React + TypeScript implementation
- Tailwind CSS for styling
- Component-based architecture
- Performance optimized
- SEO-friendly structure

**Content Focus:**
- Showcase our AI-powered development approach
- Highlight multi-agent collaboration capabilities
- Demonstrate technical expertise across different areas
- Professional case studies and client testimonials
- Clear value proposition and competitive advantages

Please provide your expert input based on your specialization:
- **Maya Designer**: UI/UX design, user experience, visual hierarchy
- **Alex Senior**: Technical architecture, performance, best practices
- **Jordan CSS**: Styling approach, animations, responsive design
- **Riley PM**: Project strategy, content structure, user journey
- **Sam AI**: AI integration opportunities, smart features, automation

Let's discuss and refine this project together! 💡`;

    try {
      await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content: briefing,
        role: "user",
        agentId: null
      });
      
      // Trigger agent responses
      setTimeout(() => {
        refetchMessages();
      }, 1000);
    } catch (error) {
      console.error("Failed to send briefing:", error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content: newMessage
    });
  };

  const getAgentName = (agentId: number | null) => {
    if (!agentId) return "User";
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || "Unknown Agent";
  };

  const getAgentAvatar = (agentId: number | null) => {
    if (!agentId) return "U";
    const agent = agents.find(a => a.id === agentId);
    return agent?.name.split(' ').map(n => n[0]).join('') || "A";
  };

  const getAgentColor = (agentId: number | null) => {
    if (!agentId) return "bg-blue-600";
    const agent = agents.find(a => a.id === agentId);
    const colors = {
      "Maya Designer": "bg-purple-600",
      "Alex Senior": "bg-green-600", 
      "Jordan CSS": "bg-yellow-600",
      "Riley PM": "bg-red-600",
      "Sam AI": "bg-blue-600"
    };
    return colors[agent?.name as keyof typeof colors] || "bg-gray-600";
  };

  if (!activeConversationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Team Showcase Discussion</h1>
              <p className="text-slate-400">Start a collaborative discussion about the 5-page showcase website</p>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="bg-slate-700 border-slate-600 text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-4">Ready to Start Team Discussion?</CardTitle>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Our AI agents are ready to collaborate on designing and developing a professional 5-page showcase website. 
                Each agent will contribute their expertise to create an outstanding result.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {agents
                  .filter(agent => 
                    ['Maya Designer', 'Alex Senior', 'Jordan CSS', 'Riley PM', 'Sam AI'].includes(agent.name)
                  )
                  .slice(0, 5)
                  .map((agent) => (
                    <div key={agent.id} className="text-center">
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarFallback className={getAgentColor(agent.id)}>
                          {getAgentAvatar(agent.id)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-white font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-400">{agent.specialty}</div>
                    </div>
                  ))
                }
              </div>

              <Button 
                onClick={() => createConversationMutation.mutate()}
                disabled={createConversationMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                {createConversationMutation.isPending ? "Starting Discussion..." : "Start Team Discussion"}
                <MessageSquare className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
          </Card>

          {/* Project Preview */}
          <Card className="bg-slate-900/50 border-slate-700 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Showcase Website Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-slate-300 mb-6">
                The team will collaborate on creating a professional 5-page website showcasing our development capabilities:
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <Globe className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Home</div>
                  <div className="text-xs text-slate-400">Hero & Stats</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-white font-medium">About</div>
                  <div className="text-xs text-slate-400">Team Profiles</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <Code className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Services</div>
                  <div className="text-xs text-slate-400">What We Do</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <Palette className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Portfolio</div>
                  <div className="text-xs text-slate-400">Our Work</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Contact</div>
                  <div className="text-xs text-slate-400">Get In Touch</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-slate-900/50 border-r border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Team Discussion</h2>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Card className="bg-slate-800/50 border-slate-600 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Project: Showcase Website</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pages:</span>
                  <span className="text-slate-300">5 Pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-300">Professional</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tech:</span>
                  <span className="text-slate-300">React + TS</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Team Members</h3>
            {agents
              .filter(agent => 
                ['Maya Designer', 'Alex Senior', 'Jordan CSS', 'Riley PM', 'Sam AI'].includes(agent.name)
              )
              .slice(0, 5)
              .map((agent) => (
                <div key={agent.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={getAgentColor(agent.id)}>
                      {getAgentAvatar(agent.id)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-white">{agent.name}</div>
                    <div className="text-xs text-slate-400">{agent.specialty}</div>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-slate-900/50 border-b border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">5-Page Showcase Website Discussion</h1>
                <p className="text-slate-400 text-sm">Collaborative design and development planning</p>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {messages.length} Messages
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-4">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className={getAgentColor(message.agentId)}>
                      {getAgentAvatar(message.agentId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {getAgentName(message.agentId)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isPolling && (
                <div className="flex items-center space-x-2 text-slate-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Agents are thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="bg-slate-900/50 border-t border-slate-700 p-6">
            <div className="flex space-x-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share your thoughts or ask the team a question..."
                className="bg-slate-800 border-slate-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}