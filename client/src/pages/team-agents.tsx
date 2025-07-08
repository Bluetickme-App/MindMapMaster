import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Bot, Code, Palette, Database, Brain, Settings, CheckCircle, Plus } from 'lucide-react';

interface DevTeamAgent {
  id: number;
  type: string;
  name: string;
  specialization: string;
  capabilities: string[];
  languages: string[];
  frameworks: string[];
  aiProvider: string;
  experienceLevel: string;
}

interface ProjectRequirement {
  language: string;
  framework?: string;
  projectType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  features: string[];
}

export default function TeamAgentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [requirements, setRequirements] = useState<ProjectRequirement>({
    language: 'javascript',
    framework: 'react',
    projectType: 'webapp',
    complexity: 'moderate',
    features: ['ui', 'api']
  });

  // Get all available agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/team-agents'],
    queryFn: () => fetch('/api/team-agents').then(res => res.json())
  });

  // Get suggested agents based on requirements
  const { data: suggestedAgents = [], isLoading: suggestionLoading } = useQuery({
    queryKey: ['/api/suggest-agents', requirements],
    queryFn: () => 
      fetch('/api/suggest-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements)
      }).then(res => res.json())
  });

  const getAgentIcon = (specialization: string) => {
    switch (specialization) {
      case 'roadmap': return Settings;
      case 'design': return Palette;
      case 'css': return Code;
      case 'ai': return Brain;
      case 'php': return Database;
      case 'python': return Database;
      case 'react': return Code;
      case 'vite': return Settings;
      default: return Bot;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'claude': return 'bg-blue-100 text-blue-800';
      case 'gemini': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleAgent = (agentId: number) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectSuggestedAgents = () => {
    const suggestedIds = suggestedAgents.map((agent: DevTeamAgent) => agent.id);
    setSelectedAgents(suggestedIds);
    toast({
      title: "Agents selected",
      description: `Selected ${suggestedIds.length} suggested agents for your project`
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => setLocation('/')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Development Team Agents</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your AI development team. Select specialized agents for your projects based on technology stack and requirements.
        </p>
      </div>

      {/* Project Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Project Requirements</CardTitle>
          <CardDescription>
            Configure your project requirements to get intelligent agent suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Language</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={requirements.language}
                onChange={(e) => setRequirements(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Framework</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={requirements.framework}
                onChange={(e) => setRequirements(prev => ({ ...prev, framework: e.target.value }))}
              >
                <option value="react">React</option>
                <option value="vite">Vite</option>
                <option value="django">Django</option>
                <option value="laravel">Laravel</option>
                <option value="vanilla">Vanilla</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Project Type</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={requirements.projectType}
                onChange={(e) => setRequirements(prev => ({ ...prev, projectType: e.target.value }))}
              >
                <option value="webapp">Web Application</option>
                <option value="api">API</option>
                <option value="mobile">Mobile App</option>
                <option value="desktop">Desktop App</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Complexity</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={requirements.complexity}
                onChange={(e) => setRequirements(prev => ({ ...prev, complexity: e.target.value as any }))}
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Agents */}
      {suggestedAgents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Suggested Team for Your Project</CardTitle>
                <CardDescription>
                  AI-recommended agents based on your requirements
                </CardDescription>
              </div>
              <Button onClick={selectSuggestedAgents} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Select All Suggested
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedAgents.map((agent: DevTeamAgent) => {
                const IconComponent = getAgentIcon(agent.specialization);
                return (
                  <div key={agent.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <IconComponent className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{agent.specialization} Specialist</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Badge className={getProviderColor(agent.aiProvider)}>{agent.aiProvider}</Badge>
                      <Badge variant="outline">{agent.experienceLevel}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Available Agents */}
      <Card>
        <CardHeader>
          <CardTitle>All Development Team Agents</CardTitle>
          <CardDescription>
            Select agents to build your custom development team ({selectedAgents.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: DevTeamAgent) => {
                const IconComponent = getAgentIcon(agent.specialization);
                const isSelected = selectedAgents.includes(agent.id);
                const isSuggested = suggestedAgents.some((suggested: DevTeamAgent) => suggested.id === agent.id);
                
                return (
                  <div 
                    key={agent.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isSuggested
                        ? 'border-green-500 bg-green-50'
                        : 'hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleAgent(agent.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <IconComponent className={`w-8 h-8 ${
                        isSelected ? 'text-blue-600' : isSuggested ? 'text-green-600' : 'text-gray-600'
                      }`} />
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{agent.specialization} Specialist</p>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex gap-2">
                        <Badge className={getProviderColor(agent.aiProvider)}>{agent.aiProvider}</Badge>
                        <Badge variant="outline">{agent.experienceLevel}</Badge>
                      </div>
                      
                      {agent.languages.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {agent.languages.slice(0, 3).map(lang => (
                            <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {agent.capabilities.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {agent.capabilities.slice(0, 2).join(', ')}
                        {agent.capabilities.length > 2 && '...'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Agents Summary */}
      {selectedAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Team ({selectedAgents.length} agents)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agents
                .filter((agent: DevTeamAgent) => selectedAgents.includes(agent.id))
                .map((agent: DevTeamAgent) => (
                  <Badge key={agent.id} variant="default" className="px-3 py-1">
                    {agent.name} ({agent.specialization})
                  </Badge>
                ))}
            </div>
            <div className="mt-4">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Team Conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          Team agents work together in the same conversation thread, maintaining context and building upon each other's work. Each agent specializes in specific technologies and methodologies.
        </AlertDescription>
      </Alert>
    </div>
  );
}