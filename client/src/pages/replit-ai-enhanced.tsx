import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Editor } from '@monaco-editor/react';
import { Link } from 'wouter';
import {
  Sparkles,
  Bot,
  Code2,
  Zap,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Wand2,
  Brain,
  Rocket,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function ReplitAIEnhanced() {
  const [activeTab, setActiveTab] = useState('agent');
  const [appDescription, setAppDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [assistantMode, setAssistantMode] = useState<'basic' | 'advanced'>('basic');
  const [featureDescription, setFeatureDescription] = useState('');
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  // Fetch AI capabilities
  const capabilitiesQuery = useQuery({
    queryKey: ['/api/replit-ai/capabilities']
  });

  // Fetch usage stats
  const usageStatsQuery = useQuery({
    queryKey: ['/api/replit-ai/usage-stats/1']
  });

  // Create app mutation (Agent)
  const createAppMutation = useMutation({
    mutationFn: async (description: string) => {
      setIsCreatingApp(true);
      return apiRequest('POST', '/api/replit-ai/agent/create-app', { description });
    },
    onSuccess: (data) => {
      setIsCreatingApp(false);
      toast({
        title: "App Created Successfully! 🎉",
        description: `Your app has been created. Cost: $${data.cost?.toFixed(2) || '0.00'}`,
      });
      // Navigate to project workspace
      if (data.project?.id) {
        window.location.href = `/workspace?projectId=${data.project.id}`;
      }
    },
    onError: (error) => {
      setIsCreatingApp(false);
      toast({
        title: "Failed to create app",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Assistant mutations
  const explainCodeMutation = useMutation({
    mutationFn: async (params: { code: string; language: string }) => {
      return apiRequest('POST', '/api/replit-ai/assistant/explain', params);
    },
    onSuccess: (data) => {
      toast({
        title: "Code Explained",
        description: "Check the explanation below (Free!)",
      });
    }
  });

  const fixCodeMutation = useMutation({
    mutationFn: async (params: { code: string; language: string; mode: string }) => {
      return apiRequest('POST', '/api/replit-ai/assistant/fix', params);
    },
    onSuccess: (data) => {
      if (data.mode === 'advanced') {
        toast({
          title: "Code Fixed",
          description: `Cost: $${data.cost}`,
        });
      }
    }
  });

  const addFeatureMutation = useMutation({
    mutationFn: async (params: { code: string; language: string; featureDescription: string; mode: string }) => {
      return apiRequest('POST', '/api/replit-ai/assistant/add-feature', params);
    },
    onSuccess: (data) => {
      if (data.mode === 'advanced') {
        toast({
          title: "Feature Added",
          description: `Cost: $${data.cost}`,
        });
      }
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-purple-600" />
          Replit AI Enhanced System
        </h1>
        <p className="text-lg text-muted-foreground">
          Experience the power of AI-driven development with Agent and Assistant capabilities
        </p>
      </div>

      {/* Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-purple-600" />
              Agent Capabilities
            </CardTitle>
            <CardDescription>Build complete apps from natural language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Wand2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Natural Language to App</p>
                  <p className="text-sm text-muted-foreground">Describe your idea, get a working app</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Dynamic Intelligence</p>
                  <p className="text-sm text-muted-foreground">Extended thinking & high power modes</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Automatic Checkpoints</p>
                  <p className="text-sm text-muted-foreground">Safe rollback at any time</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Effort-Based Pricing</p>
                  <p className="text-sm text-muted-foreground">Pay based on complexity: $0.10 - $4.00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-blue-600" />
              Assistant Capabilities
            </CardTitle>
            <CardDescription>Get instant help with your code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Code Explanation</p>
                  <p className="text-sm text-muted-foreground">Understand any code instantly (Free!)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Quick Fixes</p>
                  <p className="text-sm text-muted-foreground">Identify and fix bugs automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Rocket className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Feature Addition</p>
                  <p className="text-sm text-muted-foreground">Add new features with AI assistance</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Flexible Pricing</p>
                  <p className="text-sm text-muted-foreground">Basic: Free | Advanced: $0.05/edit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      {usageStatsQuery.data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageStatsQuery.data.stats.totalTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Agent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageStatsQuery.data.stats.agentTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assistant Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageStatsQuery.data.stats.assistantTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${usageStatsQuery.data.stats.totalCost?.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agent (Build Apps)
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Assistant (Code Help)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create App with Natural Language</CardTitle>
              <CardDescription>
                Describe your app idea in plain English and let AI build it for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app-description">App Description</Label>
                <Textarea
                  id="app-description"
                  placeholder="Create a modern task management app with user authentication, real-time updates, and a beautiful dark mode interface..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Example Descriptions:</h4>
                <div className="space-y-2 text-sm">
                  <p className="cursor-pointer hover:text-primary" onClick={() => setAppDescription("Create a simple landing page for a SaaS product with hero section, features, pricing, and contact form")}>
                    • Simple landing page (Est. cost: $0.10-$0.20)
                  </p>
                  <p className="cursor-pointer hover:text-primary" onClick={() => setAppDescription("Build a todo app with user authentication, categories, due dates, and local storage persistence")}>
                    • Todo app with auth (Est. cost: $0.30-$0.70)
                  </p>
                  <p className="cursor-pointer hover:text-primary" onClick={() => setAppDescription("Create a real-time chat application with rooms, user presence, typing indicators, and message history")}>
                    • Real-time chat app (Est. cost: $1.00-$4.00)
                  </p>
                </div>
              </div>

              <Button
                onClick={() => createAppMutation.mutate(appDescription)}
                disabled={!appDescription || isCreatingApp}
                className="w-full"
                size="lg"
              >
                {isCreatingApp ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Building Your App...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create App with AI Agent
                  </>
                )}
              </Button>

              {isCreatingApp && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 animate-pulse" />
                    Analyzing requirements...
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 animate-pulse" />
                    Generating architecture...
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Code2 className="h-4 w-4 animate-pulse" />
                    Writing code...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistant" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Code Assistant</CardTitle>
              <CardDescription>
                Get instant help with code explanation, debugging, and feature addition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md bg-background"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="php">PHP</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label>Mode</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={assistantMode === 'basic' ? 'default' : 'outline'}
                      onClick={() => setAssistantMode('basic')}
                      className="flex-1"
                    >
                      Basic (Free)
                    </Button>
                    <Button
                      variant={assistantMode === 'advanced' ? 'default' : 'outline'}
                      onClick={() => setAssistantMode('advanced')}
                      className="flex-1"
                    >
                      Advanced ($0.05)
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Your Code</Label>
                <div className="mt-2 border rounded-md overflow-hidden">
                  <Editor
                    height="300px"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => explainCodeMutation.mutate({ code, language })}
                  disabled={!code || explainCodeMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Explain Code (Free)
                </Button>
                <Button
                  onClick={() => fixCodeMutation.mutate({ code, language, mode: assistantMode })}
                  disabled={!code || fixCodeMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Fix Issues {assistantMode === 'advanced' && '($0.05)'}
                </Button>
                <Button
                  onClick={() => {
                    if (featureDescription) {
                      addFeatureMutation.mutate({ code, language, featureDescription, mode: assistantMode });
                    } else {
                      toast({
                        title: "Feature description required",
                        description: "Please describe the feature you want to add",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!code || addFeatureMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Add Feature {assistantMode === 'advanced' && '($0.05)'}
                </Button>
              </div>

              {(assistantMode === 'advanced' || activeTab === 'assistant') && (
                <div>
                  <Label htmlFor="feature-description">Feature Description (for Add Feature)</Label>
                  <Input
                    id="feature-description"
                    placeholder="e.g., Add dark mode toggle, Add user authentication, Add data export..."
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Results Display */}
              {explainCodeMutation.data && (
                <Card className="mt-4 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Code Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{explainCodeMutation.data.explanation}</p>
                    {explainCodeMutation.data.concepts && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Key Concepts:</p>
                        <div className="flex flex-wrap gap-2">
                          {explainCodeMutation.data.concepts.map((concept: string, i: number) => (
                            <Badge key={i} variant="secondary">{concept}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {fixCodeMutation.data?.result && (
                <Card className="mt-4 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {assistantMode === 'basic' ? 'Suggested Fixes' : 'Fixed Code'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assistantMode === 'basic' ? (
                      <p className="whitespace-pre-wrap">{fixCodeMutation.data.result.suggestions}</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Fixed Code:</Label>
                          <div className="mt-2 border rounded-md overflow-hidden">
                            <Editor
                              height="200px"
                              language={language}
                              value={fixCodeMutation.data.result.fixedCode}
                              theme="vs-dark"
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                              }}
                            />
                          </div>
                        </div>
                        {fixCodeMutation.data.result.changes && (
                          <div>
                            <Label>Changes Made:</Label>
                            <div className="mt-2 space-y-1">
                              {fixCodeMutation.data.result.changes.map((change: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <Badge variant={change.type === 'added' ? 'default' : change.type === 'removed' ? 'destructive' : 'secondary'} className="mr-2">
                                    Line {change.line}
                                  </Badge>
                                  <span className="text-muted-foreground">{change.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {addFeatureMutation.data?.result && (
                <Card className="mt-4 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {assistantMode === 'basic' ? 'Feature Suggestion' : 'Feature Added'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assistantMode === 'basic' ? (
                      <p className="whitespace-pre-wrap">{addFeatureMutation.data.result.suggestion}</p>
                    ) : (
                      <div>
                        <Label>Updated Code with Feature:</Label>
                        <div className="mt-2 border rounded-md overflow-hidden">
                          <Editor
                            height="300px"
                            language={language}
                            value={addFeatureMutation.data.result.updatedCode}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 14,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Feature added: {addFeatureMutation.data.result.featureAdded}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Transparent Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Agent Pricing (Effort-Based)</h4>
              <div className="space-y-1 text-sm">
                <p>• Simple apps (landing pages): $0.10 - $0.20</p>
                <p>• Moderate apps (CRUD, API): $0.30 - $0.70</p>
                <p>• Complex apps (real-time, AI): $1.00 - $4.00</p>
                <p className="text-muted-foreground mt-2">Price scales with complexity and effort required</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Assistant Pricing</h4>
              <div className="space-y-1 text-sm">
                <p>• Basic Mode: <span className="font-medium text-green-600">Free</span></p>
                <p className="ml-4 text-muted-foreground">- Code explanations</p>
                <p className="ml-4 text-muted-foreground">- Bug identification</p>
                <p className="ml-4 text-muted-foreground">- Feature suggestions</p>
                <p className="mt-2">• Advanced Mode: <span className="font-medium">$0.05 per edit</span></p>
                <p className="ml-4 text-muted-foreground">- Automatic fixes</p>
                <p className="ml-4 text-muted-foreground">- Feature implementation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}