import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { 
  Sparkles, 
  Code2, 
  ArrowLeft,
  Github,
  GitBranch,
  Loader2,
  Zap,
  Brain,
  Rocket
} from 'lucide-react';

export default function ReplitSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projectPrompt, setProjectPrompt] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEnhancement, setSelectedEnhancement] = useState<'none' | 'ai' | 'extended'>('ai');

  // Recent projects
  const projectsQuery = useQuery({
    queryKey: ['/api/projects']
  });

  // Create project with AI
  const createProjectMutation = useMutation({
    mutationFn: async (data: { prompt: string; enhancement: string }) => {
      setIsCreating(true);
      
      // Simple routing based on enhancement level
      if (data.enhancement === 'none') {
        // Basic project creation
        return apiRequest('POST', '/api/projects', {
          name: data.prompt.split(' ').slice(0, 3).join(' '),
          description: data.prompt,
          language: 'JavaScript',
          framework: 'React',
          status: 'active'
        });
      } else {
        // Use AI Agent for project creation
        return apiRequest('POST', '/api/replit-ai/agent/create-app', {
          description: data.prompt,
          enhancement: data.enhancement
        });
      }
    },
    onSuccess: (data) => {
      setIsCreating(false);
      toast({
        title: "Project Created! 🚀",
        description: "Your project is ready. Opening workspace...",
      });
      
      // Navigate to workspace
      const projectId = data.project?.id || data.id;
      if (projectId) {
        setLocation(`/workspace?projectId=${projectId}`);
      }
    },
    onError: (error) => {
      setIsCreating(false);
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  // Import from GitHub
  const importGitHubMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsCreating(true);
      
      // Extract repo info from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }
      
      const [, owner, repo] = match;
      
      return apiRequest('POST', '/api/projects/import/github', {
        url
      });
    },
    onSuccess: (data) => {
      setIsCreating(false);
      toast({
        title: "Repository Imported! 📦",
        description: "Your GitHub project is ready.",
      });
      
      if (data.id) {
        setLocation(`/workspace?projectId=${data.id}`);
      }
    },
    onError: (error) => {
      setIsCreating(false);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please check the URL",
        variant: "destructive"
      });
    }
  });

  const handleCreateProject = () => {
    if (!projectPrompt.trim()) {
      toast({
        title: "Please describe your project",
        description: "Tell us what you want to build",
        variant: "destructive"
      });
      return;
    }

    createProjectMutation.mutate({
      prompt: projectPrompt,
      enhancement: selectedEnhancement
    });
  };

  const handleImportGitHub = () => {
    if (!gitUrl.trim()) {
      toast({
        title: "Please enter a GitHub URL",
        description: "Example: https://github.com/username/repository",
        variant: "destructive"
      });
      return;
    }

    importGitHubMutation.mutate(gitUrl);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Create a New Repl</h1>
        <p className="text-lg text-muted-foreground">
          Start building with AI or import existing code
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <Sparkles className="mr-2 h-4 w-4" />
            Create with AI
          </TabsTrigger>
          <TabsTrigger value="import">
            <Github className="mr-2 h-4 w-4" />
            Import from GitHub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What do you want to build?</CardTitle>
              <CardDescription>
                Describe your project in natural language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Examples:
• Create a todo app with dark mode
• Build a weather dashboard using OpenWeather API
• Make a real-time chat application with user authentication
• Simple landing page for a SaaS product"
                value={projectPrompt}
                onChange={(e) => setProjectPrompt(e.target.value)}
                className="min-h-[120px]"
                disabled={isCreating}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Enhancement Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={selectedEnhancement === 'none' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedEnhancement('none')}
                    disabled={isCreating}
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    Basic
                  </Button>
                  <Button
                    type="button"
                    variant={selectedEnhancement === 'ai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedEnhancement('ai')}
                    disabled={isCreating}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    AI Powered
                  </Button>
                  <Button
                    type="button"
                    variant={selectedEnhancement === 'extended' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedEnhancement('extended')}
                    disabled={isCreating}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Extended AI
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedEnhancement === 'none' && 'Basic project template with minimal setup'}
                  {selectedEnhancement === 'ai' && 'AI generates complete code based on your description'}
                  {selectedEnhancement === 'extended' && 'Extended AI analysis with best practices and optimizations'}
                </p>
              </div>

              <Button 
                onClick={handleCreateProject}
                disabled={isCreating || !projectPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your project...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Example prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Calculator app",
                  "Todo list with persistence",
                  "Weather dashboard",
                  "Portfolio website",
                  "Blog with markdown",
                  "Real-time chat app"
                ].map((template) => (
                  <Button
                    key={template}
                    variant="outline"
                    size="sm"
                    onClick={() => setProjectPrompt(template)}
                    disabled={isCreating}
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from GitHub</CardTitle>
              <CardDescription>
                Enter a GitHub repository URL to import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  disabled={isCreating}
                  className="flex-1"
                />
                <Button
                  onClick={handleImportGitHub}
                  disabled={isCreating || !gitUrl.trim()}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitBranch className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Supported repositories:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Public GitHub repositories</li>
                  <li>Any programming language</li>
                  <li>Automatic framework detection</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent projects */}
      {projectsQuery.data && projectsQuery.data.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectsQuery.data.slice(0, 5).map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => setLocation(`/workspace?projectId=${project.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {project.language}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}