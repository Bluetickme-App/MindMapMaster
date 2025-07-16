import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Zap, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Cpu,
  Code,
  Palette,
  Server,
  Wrench,
  TestTube,
  Gauge
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface JobAssignment {
  agentId: number;
  jobType: string;
  aiProvider: 'openai' | 'claude' | 'gemini';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedCost: number;
}

interface ProviderHealth {
  [key: string]: {
    available: boolean;
    latency: number;
  };
}

export default function MultiAISDKDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectDescription, setProjectDescription] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');
  const [selectedAssignment, setSelectedAssignment] = useState<JobAssignment | null>(null);
  const [executionPrompt, setExecutionPrompt] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents']
  });

  // Job assignment mutation
  const assignJobsMutation = useMutation({
    mutationFn: async (data: { projectDescription: string; complexity: string }) => {
      return await apiRequest('/api/ai-integration/assign-jobs', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Jobs Assigned',
        description: 'AI providers have been optimally assigned to agents based on their strengths.'
      });
    },
    onError: () => {
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign jobs to AI providers.',
        variant: 'destructive'
      });
    }
  });

  // Job execution mutation
  const executeJobMutation = useMutation({
    mutationFn: async (data: { assignment: JobAssignment; prompt: string }) => {
      return await apiRequest('/api/ai-integration/execute-job', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (result) => {
      setExecutionResult(result);
      toast({
        title: 'Job Executed',
        description: `Successfully executed ${selectedAssignment?.jobType} job using ${selectedAssignment?.aiProvider}.`
      });
    },
    onError: () => {
      toast({
        title: 'Execution Failed',
        description: 'Failed to execute the job.',
        variant: 'destructive'
      });
    }
  });

  // Provider health query
  const { data: providerHealth } = useQuery<ProviderHealth>({
    queryKey: ['/api/ai-integration/provider-health'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleAssignJobs = () => {
    if (!projectDescription.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please enter a project description.',
        variant: 'destructive'
      });
      return;
    }

    assignJobsMutation.mutate({
      projectDescription,
      complexity
    });
  };

  const handleExecuteJob = () => {
    if (!selectedAssignment || !executionPrompt.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a job assignment and enter a prompt.',
        variant: 'destructive'
      });
      return;
    }

    executeJobMutation.mutate({
      assignment: selectedAssignment,
      prompt: executionPrompt
    });
  };

  const getJobIcon = (jobType: string) => {
    const icons = {
      'architecture': Cpu,
      'ui_design': Palette,
      'backend': Server,
      'frontend': Code,
      'devops': Wrench,
      'testing': TestTube,
      'optimization': Gauge
    };
    return icons[jobType] || Bot;
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      'openai': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'claude': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'gemini': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const assignments = assignJobsMutation.data?.assignments || [];
  const totalCost = assignJobsMutation.data?.totalEstimatedCost || 0;
  const breakdown = assignJobsMutation.data?.breakdown || { openai: 0, claude: 0, gemini: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Multi-AI SDK Integration Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Demonstrate how OpenAI, Claude, and Gemini SDKs work together optimally for different job types
          </p>
        </div>

        {/* Provider Health Status */}
        {providerHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Provider Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(providerHealth).map(([provider, health]) => (
                  <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${health.available ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium capitalize">{provider}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {health.latency}ms
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="assign" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">Job Assignment</TabsTrigger>
            <TabsTrigger value="execute">Job Execution</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-6">
            {/* Project Input */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription>
                  Describe your project to get optimal AI provider assignments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="e.g., Build a React e-commerce app with Node.js backend, PostgreSQL database, and AWS deployment"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Complexity</label>
                  <Select value={complexity} onValueChange={(value: any) => setComplexity(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple ($0.10-$0.20)</SelectItem>
                      <SelectItem value="moderate">Moderate ($0.30-$0.70)</SelectItem>
                      <SelectItem value="complex">Complex ($1.00-$4.00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAssignJobs}
                  disabled={assignJobsMutation.isPending}
                  className="w-full"
                >
                  {assignJobsMutation.isPending ? 'Assigning...' : 'Assign Jobs to AI Providers'}
                </Button>
              </CardContent>
            </Card>

            {/* Assignment Results */}
            {assignments.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Assignments */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Provider Assignments</CardTitle>
                    <CardDescription>
                      Optimal routing based on AI provider strengths
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assignments.map((assignment, index) => {
                        const agent = agents.find(a => a.id === assignment.agentId);
                        const IconComponent = getJobIcon(assignment.jobType);
                        
                        return (
                          <div 
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedAssignment === assignment
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{agent?.name}</div>
                                  <div className="text-sm text-muted-foreground capitalize">
                                    {assignment.jobType.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getProviderColor(assignment.aiProvider)}>
                                  {assignment.aiProvider}
                                </Badge>
                                <span className="text-sm font-mono">
                                  ${assignment.estimatedCost.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Cost Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">${totalCost.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Total Estimated Cost</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-500" />
                          OpenAI
                        </span>
                        <span>{breakdown.openai} jobs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-500" />
                          Claude
                        </span>
                        <span>{breakdown.claude} jobs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-500" />
                          Gemini
                        </span>
                        <span>{breakdown.gemini} jobs</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Optimal Distribution
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Jobs assigned based on AI provider strengths and cost efficiency
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="execute" className="space-y-6">
            {/* Job Execution */}
            <Card>
              <CardHeader>
                <CardTitle>Execute AI Job</CardTitle>
                <CardDescription>
                  Test job execution with selected AI provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAssignment ? (
                  <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {agents.find(a => a.id === selectedAssignment.agentId)?.name}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {selectedAssignment.jobType.replace('_', ' ')} via {selectedAssignment.aiProvider}
                        </div>
                      </div>
                      <Badge className={getProviderColor(selectedAssignment.aiProvider)}>
                        {selectedAssignment.aiProvider}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground">
                    Select a job assignment from the previous tab
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Execution Prompt</label>
                  <Textarea
                    placeholder="Enter your prompt for the AI agent..."
                    value={executionPrompt}
                    onChange={(e) => setExecutionPrompt(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleExecuteJob}
                  disabled={executeJobMutation.isPending || !selectedAssignment}
                  className="w-full"
                >
                  {executeJobMutation.isPending ? 'Executing...' : 'Execute Job'}
                </Button>
              </CardContent>
            </Card>

            {/* Execution Results */}
            {executionResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Execution Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Provider:</span> {executionResult.provider}
                    </div>
                    <div>
                      <span className="font-medium">Job Type:</span> {executionResult.jobType}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span> ${executionResult.result.cost.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-medium">Tokens:</span> {executionResult.result.metadata.tokensUsed}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium">AI Response:</label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {executionResult.result.content}
                      </pre>
                    </div>
                  </div>

                  {executionResult.result.metadata && (
                    <div>
                      <label className="text-sm font-medium">Metadata:</label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <pre className="text-xs text-muted-foreground">
                          {JSON.stringify(executionResult.result.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}