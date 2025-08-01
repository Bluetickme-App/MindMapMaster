import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Play, Pause, Video, Code, Bot, Users, Zap, Eye, Download, Share, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentExecution {
  id: string;
  agent: string;
  task: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  code: string;
  explanation: string;
  timestamp: number;
}

interface VideoFrame {
  timestamp: number;
  agentId: string;
  action: string;
  code: string;
  explanation: string;
}

export default function VideoCodeAgents() {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [agents, setAgents] = useState<AgentExecution[]>([]);
  const [videoFrames, setVideoFrames] = useState<VideoFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Configuration
  const [prompt, setPrompt] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["openai", "claude"]);
  const [projectType, setProjectType] = useState("webapp");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("react");
  const [complexity, setComplexity] = useState("moderate");
  const [showLiveCode, setShowLiveCode] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [autoGenerate, setAutoGenerate] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const availableAgents = [
    { id: "openai", name: "OpenAI Codex", model: "gpt-4o", color: "green-500", specialty: "Code Generation" },
    { id: "claude", name: "Claude AI", model: "claude-sonnet-4-20250514", color: "purple-500", specialty: "Analysis & Documentation" },
    { id: "gemini", name: "Google Gemini", model: "gemini-pro", color: "blue-500", specialty: "Multi-modal Processing" },
  ];

  useEffect(() => {
    if (playing && duration > 0) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setPlaying(false);
            return 0;
          }
          return prev + 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [playing, duration]);

  const startVideoGeneration = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a coding prompt", variant: "destructive" });
      return;
    }

    setLoading(true);
    setRecording(true);
    setAgents([]);
    setVideoFrames([]);
    setCurrentTime(0);

    try {
      // Create agent execution tasks
      const agentTasks: AgentExecution[] = selectedAgents.map((agentId, index) => ({
        id: `${agentId}-${Date.now()}`,
        agent: agentId,
        task: prompt,
        status: 'queued',
        progress: 0,
        code: '',
        explanation: '',
        timestamp: Date.now() + (index * 2000)
      }));

      setAgents(agentTasks);

      // Execute agents sequentially with video recording
      for (let i = 0; i < agentTasks.length; i++) {
        const agent = agentTasks[i];
        
        // Update agent status to running
        setAgents(prev => prev.map(a => 
          a.id === agent.id ? { ...a, status: 'running' as const } : a
        ));

        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setAgents(prev => prev.map(a => 
            a.id === agent.id ? { ...a, progress } : a
          ));
        }

        // Call appropriate AI service
        let result;
        if (agent.agent === 'openai') {
          result = await callOpenAI(prompt, language, framework);
        } else if (agent.agent === 'claude') {
          result = await callClaude(prompt, language, framework);
        } else {
          result = await callGemini(prompt, language, framework);
        }

        // Update agent with results
        setAgents(prev => prev.map(a => 
          a.id === agent.id ? { 
            ...a, 
            status: 'completed' as const, 
            code: result.code, 
            explanation: result.explanation 
          } : a
        ));

        // Add video frame
        const frame: VideoFrame = {
          timestamp: Date.now() - agentTasks[0].timestamp,
          agentId: agent.id,
          action: `Generated ${language} code`,
          code: result.code,
          explanation: result.explanation
        };

        setVideoFrames(prev => [...prev, frame]);
      }

      setDuration(Date.now() - agentTasks[0].timestamp);
      setRecording(false);

      toast({
        title: "Video Generation Complete!",
        description: `Created coding video with ${selectedAgents.length} AI agents`,
      });

    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate coding video",
        variant: "destructive",
      });
      setRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const callOpenAI = async (prompt: string, language: string, framework: string) => {
    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language, framework }),
    });
    
    if (!response.ok) throw new Error('OpenAI API failed');
    return await response.json();
  };

  const callClaude = async (prompt: string, language: string, framework: string) => {
    const response = await fetch('/api/claude/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language, framework }),
    });
    
    if (!response.ok) throw new Error('Claude API failed');
    return await response.json();
  };

  const callGemini = async (prompt: string, language: string, framework: string) => {
    // Placeholder for Gemini integration
    return {
      code: `// Gemini-generated ${language} code\n// ${prompt}\nconsole.log("Generated by Gemini");`,
      explanation: `Gemini analysis: This ${language} code addresses the prompt "${prompt}" using ${framework} framework.`
    };
  };

  const playVideo = () => {
    setPlaying(!playing);
  };

  const exportVideo = async () => {
    toast({
      title: "Export Started",
      description: "Generating MP4 video file...",
    });

    // Simulate video export
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Video exported as coding-agents-demo.mp4",
      });
    }, 3000);
  };

  const getAgentByType = (agentId: string) => {
    return availableAgents.find(a => a.id === agentId);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎬 AI Video Coding Agents Platform
        </h1>
        <p className="text-lg text-muted-foreground">
          Watch AI agents collaborate in real-time to solve coding challenges
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {availableAgents.map(agent => (
            <Badge key={agent.id} variant="secondary" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full bg-${agent.color}`}></div>
              {agent.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Video Configuration
            </CardTitle>
            <CardDescription>Configure your AI coding agents video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Coding Prompt</label>
              <Textarea
                placeholder="Enter your coding challenge (e.g., 'Create a React todo app with TypeScript')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Framework</label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="next">Next.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Active Agents</label>
              <div className="space-y-2">
                {availableAgents.map(agent => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${agent.color}`}></div>
                      <span className="text-sm">{agent.name}</span>
                    </div>
                    <Switch
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAgents(prev => [...prev, agent.id]);
                        } else {
                          setSelectedAgents(prev => prev.filter(id => id !== agent.id));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Live Code</span>
                <Switch checked={showLiveCode} onCheckedChange={setShowLiveCode} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Explanations</span>
                <Switch checked={showExplanations} onCheckedChange={setShowExplanations} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-Generate</span>
                <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
              </div>
            </div>

            <Button 
              onClick={startVideoGeneration} 
              disabled={loading || recording || selectedAgents.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Video...
                </>
              ) : recording ? (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Video Generation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Video Player & Agent Timeline */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                AI Coding Video
              </div>
              <div className="flex gap-2">
                {duration > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={exportVideo}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Display Area */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8 min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
              <div className="relative z-10">
                {recording ? (
                  <div className="text-center">
                    <div className="relative">
                      <div className="animate-ping bg-red-500 w-6 h-6 rounded-full mx-auto mb-4 opacity-75"></div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-500 w-4 h-4 rounded-full"></div>
                    </div>
                    <p className="text-white text-xl font-semibold mb-2">Recording AI Agents...</p>
                    <p className="text-slate-300">Capturing real-time collaboration</p>
                  </div>
                ) : duration > 0 ? (
                  <div className="text-center text-white">
                    <Bot className="w-20 h-20 mx-auto mb-4 text-blue-400" />
                    <p className="text-xl font-bold mb-2">Video Ready - {formatTime(duration)}</p>
                    <p className="text-slate-300">
                      {videoFrames.length} agent interactions recorded
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      {selectedAgents.map(agentId => {
                        const agent = getAgentByType(agentId);
                        return (
                          <div key={agentId} className={`w-3 h-3 rounded-full ${
                            agent?.color === 'green-500' ? 'bg-green-500' :
                            agent?.color === 'purple-500' ? 'bg-purple-500' :
                            agent?.color === 'blue-500' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}></div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <Video className="w-20 h-20 mx-auto mb-4 text-slate-500" />
                    <p className="text-xl font-semibold mb-2">No video generated yet</p>
                    <p className="text-slate-500">Configure agents and click "Start Video Generation"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Controls */}
            {duration > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playVideo}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <div className="flex-1">
                    <Progress 
                      value={(currentTime / duration) * 100} 
                      className="h-3 bg-slate-700"
                    />
                  </div>
                  
                  <span className="text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Agent Timeline */}
            {agents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-blue-400" />
                  Agent Execution Timeline
                </h3>
                <ScrollArea className="h-64 bg-slate-900/30 border border-slate-700 rounded-lg p-4">
                  <div className="space-y-4">
                    {agents.map((agent, index) => {
                      const agentInfo = getAgentByType(agent.agent);
                      return (
                        <div key={agent.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${
                                agentInfo?.color === 'green-500' ? 'bg-green-500' :
                                agentInfo?.color === 'purple-500' ? 'bg-purple-500' :
                                agentInfo?.color === 'blue-500' ? 'bg-blue-500' :
                                'bg-gray-500'
                              } shadow-lg`}></div>
                              <span className="font-semibold text-white">{agentInfo?.name}</span>
                              <Badge 
                                variant={
                                  agent.status === 'completed' ? 'default' :
                                  agent.status === 'running' ? 'secondary' :
                                  agent.status === 'error' ? 'destructive' : 'outline'
                                }
                                className={
                                  agent.status === 'completed' ? 'bg-green-600 hover:bg-green-600' :
                                  agent.status === 'running' ? 'bg-blue-600 hover:bg-blue-600 animate-pulse' :
                                  ''
                                }
                              >
                                {agent.status}
                              </Badge>
                            </div>
                            <span className="text-sm font-medium text-slate-300">
                              {agent.progress}%
                            </span>
                          </div>
                          
                          <Progress 
                            value={agent.progress} 
                            className="h-2 mb-4 bg-slate-700" 
                          />
                          
                          {agent.status === 'completed' && (
                            <div className="space-y-3">
                              {showExplanations && (
                                <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
                                  <p className="text-sm text-slate-300 leading-relaxed">
                                    <span className="text-slate-400 font-medium">Analysis:</span> {agent.explanation}
                                  </p>
                                </div>
                              )}
                              {showLiveCode && agent.code && (
                                <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg overflow-x-auto">
                                  <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                                    {agent.code.substring(0, 300)}...
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Panel */}
      {duration > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Video Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(duration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedAgents.length}</div>
                <div className="text-sm text-muted-foreground">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{videoFrames.length}</div>
                <div className="text-sm text-muted-foreground">Code Generations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{language}</div>
                <div className="text-sm text-muted-foreground">Language</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}