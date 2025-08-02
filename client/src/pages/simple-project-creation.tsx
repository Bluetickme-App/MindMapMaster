import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User, Users, Bot, Zap, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: number;
  name: string;
  specialization: string;
  aiProvider: string;
  experienceLevel: string;
  capabilities: string[];
}

export default function SimpleProjectCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState<'single' | 'team'>('single');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [brief, setBrief] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch available agents
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: projectType === 'single' || step === 2
  });

  const createProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a project name.',
        variant: 'destructive'
      });
      return;
    }

    if (projectType === 'single' && !selectedAgentId) {
      toast({
        title: 'Agent Selection Required',
        description: 'Please select an agent for your project.',
        variant: 'destructive'
      });
      return;
    }

    if (projectType === 'team' && selectedAgentIds.length === 0) {
      toast({
        title: 'Team Selection Required',
        description: 'Please select at least one agent for your team.',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Actually create the project in the database and file system
      const projectData = {
        name: projectName,
        description: projectDescription || '',
        language: 'javascript',
        framework: 'react',
        status: 'active',
        agentIds: projectType === 'single' ? [selectedAgentId] : selectedAgentIds,
        projectType,
        brief: brief || ''
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const createdProject = await response.json();
      
      toast({
        title: 'Project Created Successfully',
        description: `${projectName} has been created and is ready for development.`
      });

      // Navigate to the actual workspace with the real project
      setLocation(`/replit-workspace?project=${createdProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Project Creation Failed',
        description: 'There was an error creating your project. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getSuggestedAgents = () => {
    // Simple logic to suggest agents based on project description
    const description = projectDescription.toLowerCase();
    const suggested = agents.filter(agent => {
      const spec = agent.specialization.toLowerCase();
      if (description.includes('react') && spec.includes('react')) return true;
      if (description.includes('python') && spec.includes('python')) return true;
      if (description.includes('php') && spec.includes('php')) return true;
      if (description.includes('design') && spec.includes('design')) return true;
      if (description.includes('css') && spec.includes('css')) return true;
      if (spec.includes('roadmap') || spec.includes('ai')) return true;
      return false;
    });
    return suggested.slice(0, 4);
  };

  const nextStep = () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a project name to continue.',
        variant: 'destructive'
      });
      return;
    }
    
    if (projectType === 'team') {
      const suggested = getSuggestedAgents();
      if (suggested.length > 0) {
        setSelectedAgentIds(suggested.map(agent => agent.id));
      }
    }
    
    setStep(2);
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Create New Project
        </CardTitle>
        <CardDescription>
          Start with a single agent or build with a team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My awesome project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="What are you building?"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Project Type</Label>
          <RadioGroup
            value={projectType}
            onValueChange={(value: 'single' | 'team') => setProjectType(value)}
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer flex-1">
                <User className="h-4 w-4" />
                <div>
                  <div className="font-medium">Single Agent</div>
                  <div className="text-sm text-muted-foreground">Work with one specialized AI agent</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <RadioGroupItem value="team" id="team" />
              <Label htmlFor="team" className="flex items-center gap-2 cursor-pointer flex-1">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Team Collaboration</div>
                  <div className="text-sm text-muted-foreground">Collaborate with multiple AI specialists</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button onClick={nextStep} className="w-full">
          Next: Choose {projectType === 'single' ? 'Agent' : 'Team'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => {
    if (projectType === 'single') {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Choose Your Agent
            </CardTitle>
            <CardDescription>
              Select a specialized AI agent for your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{agent.specialization}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {agent.aiProvider}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {agent.experienceLevel}
                      </Badge>
                      {selectedAgentId === agent.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={createProject}
                disabled={!selectedAgentId || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Team project
    const suggestedAgents = getSuggestedAgents();
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Build Your Team
          </CardTitle>
          <CardDescription>
            Add a project brief and select your AI team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="brief">Project Brief (Optional)</Label>
            <Textarea
              id="brief"
              placeholder="Describe your project requirements, features, and goals..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          {suggestedAgents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Suggested Team</Label>
                <Badge variant="secondary" className="text-xs">
                  Auto-selected based on your description
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{agent.specialization}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {agent.aiProvider}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label>All Available Agents</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {agents.map(agent => {
                const isSelected = selectedAgentIds.includes(agent.id);
                const isSuggested = suggestedAgents.some(s => s.id === agent.id);
                
                return (
                  <div
                    key={agent.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isSuggested
                        ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      const newSelected = isSelected
                        ? selectedAgentIds.filter(id => id !== agent.id)
                        : [...selectedAgentIds, agent.id];
                      setSelectedAgentIds(newSelected);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{agent.specialization}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {agent.aiProvider}
                        </Badge>
                        {isSelected && <Check className="h-4 w-4 text-green-500" />}
                        {isSuggested && !isSelected && <Badge variant="secondary" className="text-xs">Suggested</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={createProject}
              disabled={selectedAgentIds.length === 0 || isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Team Project'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Project
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build with AI agents in a streamlined, intuitive way
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              step >= 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-400'}`} />
              Project Details
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              step >= 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-400'}`} />
              {projectType === 'single' ? 'Choose Agent' : 'Build Team'}
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </div>
  );
}