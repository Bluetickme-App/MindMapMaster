import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, User, Users, Bot, Zap, FileText, ArrowRight, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: number;
  name: string;
  specialization: string;
  aiProvider: string;
  experienceLevel: string;
  capabilities: string[];
}

interface ProjectCreationData {
  name: string;
  description: string;
  projectType: 'single' | 'team';
  selectedAgentId?: number;
  selectedAgentIds?: number[];
  brief?: string;
  briefFile?: File;
  language?: string;
  framework?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export default function StreamlinedProjectCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectCreationData>({
    name: '',
    description: '',
    projectType: 'single'
  });
  const [dragActive, setDragActive] = useState(false);

  // Fetch available agents
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: projectData.projectType === 'single' || step === 2
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectCreationData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('projectType', data.projectType);
      
      if (data.projectType === 'single' && data.selectedAgentId) {
        formData.append('selectedAgentId', data.selectedAgentId.toString());
      }
      
      if (data.projectType === 'team' && data.selectedAgentIds?.length) {
        formData.append('selectedAgentIds', JSON.stringify(data.selectedAgentIds));
      }
      
      if (data.brief) {
        formData.append('brief', data.brief);
      }
      
      if (data.briefFile) {
        formData.append('briefFile', data.briefFile);
      }
      
      if (data.language) formData.append('language', data.language);
      if (data.framework) formData.append('framework', data.framework);
      if (data.complexity) formData.append('complexity', data.complexity);

      return apiRequest('/api/projects/create-streamlined', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Project Created Successfully',
        description: 'Your project has been created and is ready for development.'
      });
      setLocation(`/replit-clone?projectId=${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Project Creation Failed',
        description: error.message || 'Unable to create project. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Auto-suggest team based on project requirements
  const getSuggestedTeam = () => {
    if (!projectData.language && !projectData.framework) return [];
    
    const suggestedAgents = agents.filter(agent => {
      const capabilities = agent.capabilities || [];
      const specialization = agent.specialization.toLowerCase();
      
      // Always include roadmap specialist for team projects
      if (specialization.includes('roadmap')) return true;
      
      // Language-specific agents
      if (projectData.language) {
        const lang = projectData.language.toLowerCase();
        if (lang.includes('react') && specialization.includes('react')) return true;
        if (lang.includes('python') && specialization.includes('python')) return true;
        if (lang.includes('php') && specialization.includes('php')) return true;
        if (lang.includes('css') && specialization.includes('css')) return true;
      }
      
      // Framework-specific agents
      if (projectData.framework) {
        const framework = projectData.framework.toLowerCase();
        if (framework.includes('vite') && specialization.includes('vite')) return true;
        if (framework.includes('design') && specialization.includes('design')) return true;
      }
      
      // Always include AI specialist and designer for comprehensive projects
      if (specialization.includes('ai') || specialization.includes('design')) return true;
      
      return false;
    });
    
    return suggestedAgents.slice(0, 5); // Limit to 5 agents max
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive'
      });
      return;
    }
    
    setProjectData(prev => ({ ...prev, briefFile: file }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!projectData.name.trim()) {
        toast({
          title: 'Project Name Required',
          description: 'Please enter a project name to continue.',
          variant: 'destructive'
        });
        return;
      }
      if (projectData.projectType === 'team') {
        // Auto-suggest team if we have language/framework info
        const suggested = getSuggestedTeam();
        if (suggested.length > 0) {
          setProjectData(prev => ({
            ...prev,
            selectedAgentIds: suggested.map(agent => agent.id)
          }));
        }
      }
    }
    setStep(step + 1);
  };

  const createProject = () => {
    createProjectMutation.mutate(projectData);
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
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="What are you building?"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="e.g., JavaScript, Python"
                value={projectData.language || ''}
                onChange={(e) => setProjectData(prev => ({ ...prev, language: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="framework">Framework</Label>
              <Input
                id="framework"
                placeholder="e.g., React, Django"
                value={projectData.framework || ''}
                onChange={(e) => setProjectData(prev => ({ ...prev, framework: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Project Type</Label>
          <RadioGroup
            value={projectData.projectType}
            onValueChange={(value: 'single' | 'team') => 
              setProjectData(prev => ({ ...prev, projectType: value }))
            }
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
          Next: Choose {projectData.projectType === 'single' ? 'Agent' : 'Team'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => {
    if (projectData.projectType === 'single') {
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
                    projectData.selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setProjectData(prev => ({ ...prev, selectedAgentId: agent.id }))}
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
                      {projectData.selectedAgentId === agent.id && (
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
                disabled={!projectData.selectedAgentId || createProjectMutation.isPending}
                className="flex-1"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Team project
    const suggestedTeam = getSuggestedTeam();
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Build Your Team
          </CardTitle>
          <CardDescription>
            Upload a project brief and we'll suggest the best team for your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brief Upload */}
          <div className="space-y-4">
            <Label>Project Brief</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brief-text">Write Brief</Label>
                <Textarea
                  id="brief-text"
                  placeholder="Describe your project requirements, features, and goals..."
                  value={projectData.brief || ''}
                  onChange={(e) => setProjectData(prev => ({ ...prev, brief: e.target.value }))}
                  className="mt-1"
                  rows={6}
                />
              </div>
              <div>
                <Label>Or Upload File</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {projectData.briefFile ? (
                      <span className="text-green-600 font-medium">
                        {projectData.briefFile.name}
                      </span>
                    ) : (
                      <>
                        Drop your brief here or <span className="text-blue-600">browse</span>
                        <br />
                        <span className="text-xs">PDF, DOC, TXT up to 10MB</span>
                      </>
                    )}
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Team */}
          {suggestedTeam.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Suggested Team</Label>
                <Badge variant="secondary" className="text-xs">
                  Auto-selected based on your requirements
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestedTeam.map(agent => (
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

          {/* All Available Agents */}
          <div className="space-y-4">
            <Label>All Available Agents</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {agents.map(agent => {
                const isSelected = projectData.selectedAgentIds?.includes(agent.id);
                const isSuggested = suggestedTeam.some(s => s.id === agent.id);
                
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
                      const currentSelected = projectData.selectedAgentIds || [];
                      const newSelected = isSelected
                        ? currentSelected.filter(id => id !== agent.id)
                        : [...currentSelected, agent.id];
                      setProjectData(prev => ({ ...prev, selectedAgentIds: newSelected }));
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
              disabled={!projectData.selectedAgentIds?.length || createProjectMutation.isPending}
              className="flex-1"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Team Project'}
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
              {projectData.projectType === 'single' ? 'Choose Agent' : 'Build Team'}
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