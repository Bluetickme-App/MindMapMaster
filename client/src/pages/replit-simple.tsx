import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Github, Bot, Globe, Zap, Users, Code2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  specialization: string;
  specialty?: string;
  aiProvider?: string;
  model?: string;
  status?: string;
}

export default function ReplitSimple() {
  const [projectType, setProjectType] = useState<'create' | 'github' | 'clone'>('create');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [useTeam, setUseTeam] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/replit-simple/create', data);
    },
    onSuccess: (data) => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      // Navigate to workspace with the new project
      window.location.href = `/workspace?project=${data.projectId}`;
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create project');
    },
  });

  const handleCreateProject = () => {
    const projectData: any = {
      type: projectType,
      useTeam,
      selectedAgents: useTeam ? selectedAgents : [],
    };

    if (projectType === 'create') {
      projectData.description = description;
    } else if (projectType === 'github') {
      projectData.githubUrl = githubUrl;
      if (githubToken) {
        projectData.githubToken = githubToken;
      }
    } else if (projectType === 'clone') {
      projectData.websiteUrl = websiteUrl;
      projectData.brandName = brandName;
    }

    createProjectMutation.mutate(projectData);
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'claude': return 'bg-purple-100 text-purple-800';
      case 'gemini': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <Code2 className="inline-block mr-3 h-8 w-8" />
            Replit Simple
          </h1>
          <p className="text-slate-300">Create, import, or clone projects with AI agents</p>
        </div>

        <Card className="bg-white/10 backdrop-blur border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Project Creation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Type Selection */}
            <Tabs value={projectType} onValueChange={(value: any) => setProjectType(value)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="create" className="data-[state=active]:bg-purple-600">
                  <Bot className="h-4 w-4 mr-2" />
                  Create New
                </TabsTrigger>
                <TabsTrigger value="github" className="data-[state=active]:bg-purple-600">
                  <Github className="h-4 w-4 mr-2" />
                  Import GitHub
                </TabsTrigger>
                <TabsTrigger value="clone" className="data-[state=active]:bg-purple-600">
                  <Globe className="h-4 w-4 mr-2" />
                  Clone & Rebrand
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Describe your project
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g., Build a social media dashboard with real-time analytics..."
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="github" className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    GitHub Repository URL
                  </label>
                  <Input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    GitHub Token (optional - for private repos)
                  </label>
                  <Input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    Required only for private repositories. Get yours at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" 
                       className="text-purple-400 hover:text-purple-300">
                      github.com/settings/tokens
                    </a>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="clone" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      Website URL to Clone
                    </label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      New Brand Name
                    </label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="YourBrand"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Team Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white text-sm font-medium">
                  Build with AI Team
                </label>
                <Button
                  variant={useTeam ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseTeam(!useTeam)}
                  className={useTeam ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-white hover:bg-slate-800"}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {useTeam ? 'Team Mode' : 'Solo Mode'}
                </Button>
              </div>

              {useTeam && (
                <div>
                  <p className="text-slate-300 text-sm mb-3">
                    Select AI agents to work on your project
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAgents.includes(agent.id)
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-white font-medium text-sm">{agent.name}</div>
                        <div className="text-slate-400 text-xs capitalize">{agent.specialty || agent.specialization || 'General AI'}</div>
                        <Badge 
                          className={`mt-1 text-xs ${getProviderColor(agent.model || agent.aiProvider)}`}
                        >
                          {agent.model === 'gpt-4o' ? 'OpenAI GPT-4o' : 
                           agent.model === 'claude-sonnet-4-20250514' ? 'Claude Sonnet 4.0' :
                           agent.model === 'gemini-2.5-flash' ? 'Google Gemini 2.5' : 
                           agent.aiProvider || agent.model}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    Selected: {selectedAgents.length} agents
                  </p>
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending || 
                (projectType === 'create' && !description.trim()) ||
                (projectType === 'github' && !githubUrl.trim()) ||
                (projectType === 'clone' && (!websiteUrl.trim() || !brandName.trim()))
              }
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
            >
              {createProjectMutation.isPending ? (
                'Creating Project...'
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {projectType === 'create' && 'Create Project'}
                  {projectType === 'github' && 'Import from GitHub'}
                  {projectType === 'clone' && 'Clone & Rebrand'}
                </>
              )}
            </Button>

            {(createProjectMutation.error || error) && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <div className="text-red-400 text-sm whitespace-pre-line">
                  {error || (createProjectMutation.error as any)?.message || 'Failed to create project'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link href="/workspace">
            <Card className="bg-white/10 backdrop-blur border-slate-700 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Code2 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Workspace</h3>
                <p className="text-slate-400 text-sm">Code editor & preview</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/collaboration">
            <Card className="bg-white/10 backdrop-blur border-slate-700 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Team Chat</h3>
                <p className="text-slate-400 text-sm">AI agent collaboration</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/">
            <Card className="bg-white/10 backdrop-blur border-slate-700 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Bot className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Dashboard</h3>
                <p className="text-slate-400 text-sm">All projects & tools</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}