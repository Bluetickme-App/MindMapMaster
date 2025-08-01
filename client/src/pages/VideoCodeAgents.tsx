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

export default function VibeCodeAgents() {
  const [collaborating, setCollaborating] = useState(false);
  const [agents, setAgents] = useState<AgentExecution[]>([]);
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

  // Clean up old video controls - not needed for collaboration mode

  const startVibeCollaboration = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a coding prompt", variant: "destructive" });
      return;
    }

    setLoading(true);
    setCollaborating(true);
    setAgents([]);

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

        // Update UI for collaboration vibe
        const currentAgent = availableAgents.find(a => a.id === agent.agent);
        toast({
          title: `${currentAgent?.name} is vibing!`,
          description: `Generated ${language} code with great energy`,
        });
      }

      setCollaborating(false);

      toast({
        title: "Collaboration Complete! ✨",
        description: `Amazing vibes from ${selectedAgents.length} AI agents working together`,
      });

    } catch (error) {
      console.error('Vibe collaboration error:', error);
      toast({
        title: "Error",
        description: "The vibe got disrupted - please try again",
        variant: "destructive",
      });
      setCollaborating(false);
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

  // Helper functions
  const getAgentByType = (agentId: string) => {
    return availableAgents.find(a => a.id === agentId);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-100 via-blue-100 to-slate-100 bg-clip-text text-transparent">
          Build Ambitious Apps
        </h1>
        <h2 className="text-2xl font-semibold mb-4 text-slate-300">
          With Multi-Agent AI Collaboration
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Advanced AI agents working together to create production-ready applications. Combining OpenAI Codex, Claude Sonnet 4.0, and intelligent collaboration patterns.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          {availableAgents.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
              <div className={`w-3 h-3 rounded-full ${
                agent.color === 'green-500' ? 'bg-green-400' :
                agent.color === 'purple-500' ? 'bg-purple-400' :
                agent.color === 'blue-500' ? 'bg-blue-400' :
                'bg-gray-400'
              } shadow-lg shadow-current/50`}></div>
              <span className="text-sm font-medium text-slate-300">{agent.name}</span>
              <span className="text-xs text-slate-500">{agent.model}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Project Configuration
            </CardTitle>
            <CardDescription>Configure AI agents for your application development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Application Requirements</label>
              <Textarea
                placeholder="Describe your ambitious app idea (e.g., 'Build a full-stack e-commerce platform with React, TypeScript, payment integration, and real-time inventory management')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
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
                <span className="text-sm">Live Code Preview</span>
                <Switch checked={showLiveCode} onCheckedChange={setShowLiveCode} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Reasoning</span>
                <Switch checked={showExplanations} onCheckedChange={setShowExplanations} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Production Mode</span>
                <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
              </div>
            </div>

            <Button 
              onClick={startVibeCollaboration} 
              disabled={loading || collaborating || selectedAgents.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Initializing AI Agents...
                </>
              ) : collaborating ? (
                <>
                  <Users className="w-4 h-4 mr-2 animate-pulse" />
                  Building Application...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Start Building
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Collaboration Space & Agent Timeline */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Development Environment
              </div>
              <div className="flex gap-2">
                {agents.length > 0 && (
                  <>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export Code
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
            {/* Collaboration Display Area */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8 min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10"></div>
              <div className="relative z-10">
                {collaborating ? (
                  <div className="text-center">
                    <div className="relative">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <Code className="w-16 h-16 text-blue-400 animate-pulse" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-white text-xl font-semibold mb-2">AI Agents Collaborating</p>
                    <p className="text-slate-300">Building production-ready application architecture</p>
                  </div>
                ) : agents.length > 0 ? (
                  <div className="text-center text-white">
                    <div className="flex justify-center mb-4">
                      {selectedAgents.map((agentId, index) => {
                        const agent = getAgentByType(agentId);
                        return (
                          <Bot 
                            key={agentId} 
                            className={`w-12 h-12 mx-1 ${
                              agent?.color === 'green-500' ? 'text-green-400' :
                              agent?.color === 'purple-500' ? 'text-purple-400' :
                              agent?.color === 'blue-500' ? 'text-blue-400' :
                              'text-gray-400'
                            } animate-pulse`}
                            style={{ animationDelay: `${index * 200}ms` }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xl font-bold mb-2">Application Generated Successfully</p>
                    <p className="text-slate-300">
                      {agents.length} AI agents collaborated to build your application
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <div className="flex justify-center mb-4">
                      <Bot className="w-16 h-16 mx-2 text-slate-500" />
                      <Users className="w-16 h-16 mx-2 text-slate-500" />
                      <Code className="w-16 h-16 mx-2 text-slate-500" />
                    </div>
                    <p className="text-xl font-semibold mb-2">Ready to Build</p>
                    <p className="text-slate-500">Configure your project requirements and deploy AI agents</p>
                  </div>
                )}
              </div>
            </div>

            {/* Collaboration interface - removed old video controls */}

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

      {/* Collaboration Stats Panel */}
      {agents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Collaboration Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{agents.filter(a => a.status === 'completed').length}</div>
                <div className="text-sm text-muted-foreground">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedAgents.length}</div>
                <div className="text-sm text-muted-foreground">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{agents.length}</div>
                <div className="text-sm text-muted-foreground">Total Executions</div>
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