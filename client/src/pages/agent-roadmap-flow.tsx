import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import MonacoEditor from '@monaco-editor/react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { 
  ArrowLeft,
  Map,
  Users,
  Loader2,
  Check,
  Clock,
  Zap,
  Upload,
  Camera,
  Bot,
  Code2,
  Palette,
  Database,
  Shield,
  TestTube,
  Rocket,
  GitBranch,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Save,
  Folder,
  FolderOpen,
  File,
  Terminal,
  Eye,
  MessageSquare,
  FileCode,
  FileJson,
  FileText,
  Image,
  QrCode,
  Bug
} from 'lucide-react';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  suggestedAgents: string[];
  estimatedTime: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  artifacts?: {
    type: 'screenshot' | 'code' | 'design';
    url: string;
    description: string;
  }[];
}

interface TeamAgent {
  id: number;
  name: string;
  specialization: string;
  avatar: string;
  status: 'available' | 'busy';
  currentTask?: string;
}

// Component imports for workspace functionality
const FileTree = ({ projectId }: { projectId: number | null }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      // Simulate file structure
      setFiles([
        { id: '1', name: 'src', type: 'folder', children: [
          { id: '2', name: 'components', type: 'folder', children: [] },
          { id: '3', name: 'App.tsx', type: 'file' },
          { id: '4', name: 'index.css', type: 'file' }
        ]},
        { id: '5', name: 'package.json', type: 'file' },
        { id: '6', name: 'README.md', type: 'file' }
      ]);
    }
  }, [projectId]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFile = (file: any, level = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const Icon = file.type === 'folder' ? (isExpanded ? FolderOpen : Folder) : 
      file.name.endsWith('.json') ? FileJson :
      file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? FileCode :
      FileText;

    return (
      <div key={file.id}>
        <div 
          className="flex items-center gap-2 px-2 py-1 hover:bg-muted cursor-pointer rounded"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => file.type === 'folder' && toggleFolder(file.id)}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{file.name}</span>
        </div>
        {file.type === 'folder' && isExpanded && file.children?.map((child: any) => 
          renderFile(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {files.map(file => renderFile(file))}
    </div>
  );
};

const AgentActivity = ({ stepId, agents }: { stepId: string; agents: TeamAgent[] }) => {
  const [activities, setActivities] = useState<string[]>([]);

  useEffect(() => {
    // Simulate agent activities
    const interval = setInterval(() => {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const actions = [
        `${agent.name} is analyzing requirements...`,
        `${agent.name} is generating code...`,
        `${agent.name} is reviewing implementation...`,
        `${agent.name} is optimizing performance...`
      ];
      setActivities(prev => [...prev.slice(-2), actions[Math.floor(Math.random() * actions.length)]]);
    }, 3000);

    return () => clearInterval(interval);
  }, [agents]);

  return (
    <div className="space-y-1">
      {activities.map((activity, i) => (
        <p key={i} className="text-xs text-muted-foreground">{activity}</p>
      ))}
    </div>
  );
};

const AgentChat = ({ agents, projectId, onDebug }: { 
  agents: TeamAgent[]; 
  projectId: number | null;
  onDebug: (error: string) => void;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    }]);

    // Simulate agent response
    setTimeout(() => {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: agent.name,
        content: `I'll help you with that. Let me analyze the requirements...`,
        timestamp: new Date()
      }]);
    }, 1000);

    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                  {msg.sender[0]}
                </div>
              )}
              <div className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agents..."
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

const ArtifactGallery = ({ roadmap }: { roadmap: RoadmapStep[] }) => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {roadmap.filter(step => step.artifacts?.length).map(step => (
          <div key={step.id}>
            <h4 className="font-medium mb-2">{step.title}</h4>
            <div className="space-y-2">
              {step.artifacts?.map((artifact, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-2">
                    {artifact.type === 'screenshot' && <Camera className="h-4 w-4" />}
                    {artifact.type === 'design' && <Palette className="h-4 w-4" />}
                    {artifact.type === 'code' && <Code2 className="h-4 w-4" />}
                    <span className="text-sm">{artifact.description}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LivePreview = ({ projectId }: { projectId: number | null }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (projectId) {
      // In real app, this would be the actual preview URL
      setPreviewUrl(`http://localhost:3000/preview/${projectId}`);
    }
  }, [projectId]);

  return (
    <div className="h-full bg-white">
      {previewUrl ? (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title="Live Preview"
        />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Preview will appear here once the project starts building</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Console = ({ projectId, onError }: { 
  projectId: number | null;
  onError: (error: string) => void;
}) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) {
      // Simulate console output
      const messages = [
        '> Starting development server...',
        '> Installing dependencies...',
        '> Building project...',
        '✓ Server running on http://localhost:3000'
      ];
      
      messages.forEach((msg, i) => {
        setTimeout(() => {
          setLogs(prev => [...prev, msg]);
        }, i * 1000);
      });
    }
  }, [projectId]);

  return (
    <div className="h-full bg-black text-green-400 font-mono text-sm p-4 overflow-auto">
      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  );
};

const QRDisplay = ({ projectId }: { projectId: number | null }) => {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      // Generate QR code for the preview URL
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/preview/${projectId}`);
    }
  }, [projectId]);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {qrCode ? (
        <>
          <img src={qrCode} alt="QR Code" className="mb-4" />
          <p className="text-sm text-muted-foreground">Scan to preview on mobile</p>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>QR code will appear here</p>
        </div>
      )}
    </div>
  );
};

const DebugPanel = ({ errors, agents }: { 
  errors: string[];
  agents: TeamAgent[];
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Debug Console</h4>
        <Card className="p-4 bg-muted">
          {errors.length > 0 ? (
            <div className="space-y-2">
              {errors.map((error, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Bug className="h-4 w-4 text-red-500 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No errors detected</p>
          )}
        </Card>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">AI Debug Assistant</h4>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Select an agent to help debug issues:
          </p>
          <div className="space-y-2">
            {agents.map(agent => (
              <Button
                key={agent.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold mr-2">
                  {agent.name[0]}
                </div>
                {agent.name} - {agent.specialization}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function AgentRoadmapFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projectDescription, setProjectDescription] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'describe' | 'roadmap' | 'execution'>('describe');
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [assignedAgents, setAssignedAgents] = useState<Record<string, TeamAgent[]>>({});
  const [projectId, setProjectId] = useState<number | null>(null);
  const [debugErrors, setDebugErrors] = useState<string[]>([]);

  // Fetch available team agents
  const agentsQuery = useQuery({
    queryKey: ['/api/team-agents']
  });

  // Generate roadmap
  const generateRoadmapMutation = useMutation({
    mutationFn: async (description: string) => {
      // First create the project
      const project = await apiRequest('POST', '/api/projects', {
        name: description.split(' ').slice(0, 3).join(' '),
        description: description,
        language: 'JavaScript',
        framework: 'React',
        status: 'active'
      });
      
      setProjectId(project.id);
      
      // Then generate roadmap
      const roadmapResponse = await apiRequest('POST', '/api/replit-ai/roadmap/generate', {
        description: description,
        projectId: project.id
      });
      
      return { project, roadmap: roadmapResponse.roadmap };
    },
    onSuccess: (data) => {
      setRoadmap(data.roadmap);
      setCurrentPhase('roadmap');
      toast({
        title: "Roadmap Generated! 🗺️",
        description: "Review the roadmap and assign agents to each step",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate roadmap",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  // Start execution with assigned agents
  const startExecutionMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('No project ID');
      
      return apiRequest('POST', '/api/replit-ai/roadmap/execute', {
        projectId,
        roadmap,
        assignedAgents
      });
    },
    onSuccess: () => {
      setCurrentPhase('execution');
      toast({
        title: "Execution Started! 🚀",
        description: "Agents are working on your project",
      });
    }
  });

  // Update step progress
  const updateStepProgress = (stepId: string, progress: number, status: 'in-progress' | 'completed') => {
    setRoadmap(prev => prev.map(step => 
      step.id === stepId ? { ...step, progress, status } : step
    ));
  };

  // Upload screenshot/artifact
  const uploadArtifactMutation = useMutation({
    mutationFn: async (data: { stepId: string; file: File; type: 'screenshot' | 'design' | 'code' }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('type', data.type);
      formData.append('stepId', data.stepId);
      
      return fetch('/api/upload-artifact', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Artifact Uploaded! 📎",
        description: "Progress has been saved",
      });
    }
  });

  // Assign agents to a step
  const assignAgentsToStep = (stepId: string, agents: TeamAgent[]) => {
    setAssignedAgents(prev => ({
      ...prev,
      [stepId]: agents
    }));
  };

  const handleDebugRequest = (error: string) => {
    setDebugErrors(prev => [...prev, error]);
    toast({
      title: "Debug Request",
      description: "AI agents are analyzing the error..."
    });
  };

  const handleConsoleError = (error: string) => {
    setDebugErrors(prev => [...prev, error]);
  };

  // Get suggested agents for a step
  const getSuggestedAgents = (step: RoadmapStep): TeamAgent[] => {
    if (!agentsQuery.data) return [];
    
    return agentsQuery.data.filter((agent: TeamAgent) => 
      step.suggestedAgents.some(suggested => 
        agent.specialization.toLowerCase().includes(suggested.toLowerCase())
      )
    );
  };

  const getAgentIcon = (specialization: string) => {
    const icons: Record<string, any> = {
      'developer': Code2,
      'designer': Palette,
      'database': Database,
      'devops': Shield,
      'qa': TestTube,
      'ai': Bot,
      'css': Palette,
      'react': Code2
    };
    
    const key = Object.keys(icons).find(k => specialization.toLowerCase().includes(k));
    const Icon = icons[key || 'developer'];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Map className="h-10 w-10 text-blue-600" />
          AI-Powered Development Roadmap
        </h1>
        <p className="text-lg text-muted-foreground">
          Let AI create a roadmap and assign the perfect team for your project
        </p>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentPhase === 'describe' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`rounded-full p-2 ${currentPhase === 'describe' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Code2 className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium">Describe</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          <div className={`flex items-center ${currentPhase === 'roadmap' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`rounded-full p-2 ${currentPhase === 'roadmap' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Map className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium">Roadmap</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          <div className={`flex items-center ${currentPhase === 'execution' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`rounded-full p-2 ${currentPhase === 'execution' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Rocket className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium">Execute</span>
          </div>
        </div>
      </div>

      {/* Phase 1: Describe Project */}
      {currentPhase === 'describe' && (
        <Card>
          <CardHeader>
            <CardTitle>What would you like to build?</CardTitle>
            <CardDescription>
              Describe your project and AI will create a detailed roadmap with team assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: Create a modern e-commerce platform with user authentication, product catalog, shopping cart, payment integration, and admin dashboard. Include responsive design and real-time inventory updates."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="min-h-[150px]"
            />
            <Button
              onClick={() => generateRoadmapMutation.mutate(projectDescription)}
              disabled={!projectDescription.trim() || generateRoadmapMutation.isPending}
              className={`w-full transition-all duration-300 ${
                generateRoadmapMutation.isPending 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse' 
                  : ''
              }`}
              size="lg"
            >
              {generateRoadmapMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="animate-pulse">Generating Roadmap...</span>
                  <div className="ml-2 flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <Map className="mr-2 h-4 w-4" />
                  Generate Roadmap
                </>
              )}
            </Button>
            
            {generateRoadmapMutation.isPending && (
              <div className="mt-4 p-4 bg-muted rounded-lg animate-fadeIn">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">AI is analyzing your project requirements...</p>
                  </div>
                  <div className="flex items-center gap-2 animate-fadeIn" style={{ animationDelay: '1s' }}>
                    <Code2 className="h-4 w-4 text-blue-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Creating development phases and milestones...</p>
                  </div>
                  <div className="flex items-center gap-2 animate-fadeIn" style={{ animationDelay: '2s' }}>
                    <Users className="h-4 w-4 text-green-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Selecting the best team for your project...</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Review Roadmap and Assign Agents */}
      {currentPhase === 'roadmap' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Roadmap</CardTitle>
              <CardDescription>
                Review the roadmap and assign agents to each step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {roadmap.map((step, index) => (
                    <Card key={step.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold">{step.title}</h4>
                              <Badge variant="outline">
                                <Clock className="mr-1 h-3 w-3" />
                                {step.estimatedTime}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                            
                            {/* Suggested Agents */}
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-2">Suggested Team Members:</p>
                              <div className="flex flex-wrap gap-2">
                                {getSuggestedAgents(step).map((agent) => (
                                  <Button
                                    key={agent.id}
                                    variant={assignedAgents[step.id]?.some(a => a.id === agent.id) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      const current = assignedAgents[step.id] || [];
                                      const isAssigned = current.some(a => a.id === agent.id);
                                      if (isAssigned) {
                                        assignAgentsToStep(step.id, current.filter(a => a.id !== agent.id));
                                      } else {
                                        assignAgentsToStep(step.id, [...current, agent]);
                                      }
                                    }}
                                  >
                                    {getAgentIcon(agent.specialization)}
                                    <span className="ml-1">{agent.name}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Assigned Agents */}
                            {assignedAgents[step.id]?.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {assignedAgents[step.id].length} agent{assignedAgents[step.id].length > 1 ? 's' : ''} assigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Assign agents to each step before starting execution
                </div>
                <Button
                  onClick={() => startExecutionMutation.mutate()}
                  disabled={Object.keys(assignedAgents).length === 0 || startExecutionMutation.isPending}
                  size="lg"
                >
                  {startExecutionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Execution
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase 3: Execution with Development Workspace */}
      {currentPhase === 'execution' && (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-12rem)] rounded-lg border">
          {/* Left Panel: File Tree */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full bg-background p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Project Files</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Folder className="h-4 w-4" />
                </Button>
              </div>
              <FileTree projectId={projectId} />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel: Development Progress */}
          <ResizablePanel defaultSize={40}>
            <div className="h-full bg-background p-4">
              <Tabs defaultValue="progress" className="h-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="agents">AI Agents</TabsTrigger>
                  <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="h-[calc(100%-3rem)] overflow-auto">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      {roadmap.map((step, index) => (
                        <Card key={step.id} className={`border-l-4 ${
                          step.status === 'completed' ? 'border-l-green-500' :
                          step.status === 'in-progress' ? 'border-l-blue-500' : 
                          'border-l-gray-300'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {step.status === 'completed' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : step.status === 'in-progress' ? (
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <h4 className="font-semibold">{step.title}</h4>
                                </div>
                                <Progress value={step.progress} className="h-2 mb-2" />
                                
                                {/* Agent Activity */}
                                {step.status === 'in-progress' && assignedAgents[step.id] && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium">Agent Activity</span>
                                    </div>
                                    <AgentActivity stepId={step.id} agents={assignedAgents[step.id]} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="agents" className="h-[calc(100%-3rem)]">
                  <AgentChat 
                    agents={Object.values(assignedAgents).flat()} 
                    projectId={projectId}
                    onDebug={(error) => handleDebugRequest(error)}
                  />
                </TabsContent>

                <TabsContent value="artifacts" className="h-[calc(100%-3rem)]">
                  <ArtifactGallery roadmap={roadmap} />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel: Preview/Console */}
          <ResizablePanel defaultSize={40}>
            <div className="h-full bg-background">
              <Tabs defaultValue="preview" className="h-full">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="console">
                    <Terminal className="mr-2 h-4 w-4" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="qr">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="debug">
                    <Bug className="mr-2 h-4 w-4" />
                    Debug
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="h-[calc(100%-3rem)] p-0">
                  <LivePreview projectId={projectId} />
                </TabsContent>

                <TabsContent value="console" className="h-[calc(100%-3rem)] p-0">
                  <Console 
                    projectId={projectId} 
                    onError={(error) => handleConsoleError(error)}
                  />
                </TabsContent>

                <TabsContent value="qr" className="h-[calc(100%-3rem)] p-4">
                  <QRDisplay projectId={projectId} />
                </TabsContent>

                <TabsContent value="debug" className="h-[calc(100%-3rem)] p-4">
                  <DebugPanel 
                    errors={debugErrors}
                    agents={Object.values(assignedAgents).flat()}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}