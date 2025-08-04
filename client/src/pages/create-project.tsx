import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Github,
  Globe,
  Code,
  Smartphone,
  Database,
  Wand2,
  Upload,
  Download,
  Rocket,
  Clock,
  Star,
  GitBranch,
  Eye,
  Users,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  framework?: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
  githubUrl?: string;
  deployUrl?: string;
  isPublic: boolean;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
}

export default function CreateProjectPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [projectPrompt, setProjectPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [blueprint, setBlueprint] = useState<{
    workflow: string[];
    blueprint: string;
  } | null>(null);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [agentMode, setAgentMode] = useState<"single" | "multi">("single");
  const [singleAgent, setSingleAgent] = useState<"codex" | "claude">("codex");

  // Fetch recent projects
  const { data: recentProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch GitHub repositories
  const { data: githubRepos = [], refetch: refetchGitHub } = useQuery<
    GitHubRepo[]
  >({
    queryKey: ["/api/github/repositories"],
  });

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      language: string;
      framework?: string;
      template?: string;
    }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Project created",
        description: `${data.name} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/workspace");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Import from GitHub mutation
  const importFromGitHub = useMutation({
    mutationFn: async (repoUrl: string) => {
      console.log("GitHub import mutation called with:", repoUrl);
      const response = await apiRequest("POST", "/api/projects/import/github", {
        url: repoUrl,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Project imported",
        description: `${data.name} has been imported from GitHub`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/workspace");
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import from GitHub",
        variant: "destructive",
      });
    },
  });

  // Generate project blueprint mutation
  const generateBlueprint = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/projects/blueprint", {
        prompt,
      });
      return response;
    },
    onSuccess: (data) => {
      setBlueprint(data.blueprint);
      setShowBlueprint(true);
    },
    onError: (error: any) => {
      toast({
        title: "Blueprint generation failed",
        description: error.message || "Failed to generate project blueprint",
        variant: "destructive",
      });
    },
  });

  // Generate project from AI mutation
  const generateProject = useMutation({
    mutationFn: async (data: {
      description: string;
      blueprint: { workflow: string[]; blueprint: string };
      agents: string[];
    }) => {
      const response = await apiRequest("POST", "/api/projects/generate", data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Project generated",
        description: `${data.project.name} has been generated with AI`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/workspace");
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate project",
        variant: "destructive",
      });
    },
  });

  const quickTemplates = [
    {
      id: "portfolio",
      name: "Portfolio Website",
      icon: Globe,
      description: "Personal portfolio with projects showcase",
    },
    {
      id: "blog",
      name: "Blog Platform",
      icon: Code,
      description: "Modern blog with CMS capabilities",
    },
    {
      id: "ecommerce",
      name: "E-commerce Store",
      icon: Smartphone,
      description: "Online store with payment integration",
    },
    {
      id: "dashboard",
      name: "Admin Dashboard",
      icon: Database,
      description: "Analytics dashboard with charts",
    },
    {
      id: "api",
      name: "REST API",
      icon: Database,
      description: "Backend API with authentication",
    },
    {
      id: "mobile",
      name: "Mobile App",
      icon: Smartphone,
      description: "Cross-platform mobile application",
    },
  ];

  const handleStartBuild = () => {
    if (!projectPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please describe what you want to build",
        variant: "destructive",
      });
      return;
    }
    generateBlueprint.mutate(projectPrompt);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = quickTemplates.find((t) => t.id === templateId);
    if (!template) return;

    createProject.mutate({
      name: template.name,
      description: template.description,
      language: "javascript",
      framework: "react",
      template: templateId,
    });
  };

  const handleGitHubImport = (repo: GitHubRepo) => {
    console.log("Importing GitHub repository:", repo);
    // Construct GitHub URL from full_name if html_url is not available
    const githubUrl = repo.html_url || `https://github.com/${repo.full_name}`;
    console.log("Using GitHub URL:", githubUrl);
    importFromGitHub.mutate(githubUrl);
  };

  const handleUrlImport = () => {
    if (!importUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    importFromGitHub.mutate(importUrl);
  };

  const handleConfirmBuild = () => {
    if (!blueprint) return;
    const agents = agentMode === "single" ? [singleAgent] : ["codex", "claude"];
    generateProject.mutate({ description: projectPrompt, blueprint, agents });
    setShowBlueprint(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Hi {userData?.name?.split(" ")[0] || "Developer"}, what do you want to
          make?
        </h1>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Input
              placeholder="Describe an app or site you want to create..."
              value={projectPrompt}
              onChange={(e) => setProjectPrompt(e.target.value)}
              className="pr-32 h-12 text-lg"
              onKeyPress={(e) => e.key === "Enter" && handleStartBuild()}
            />
            <Button
              onClick={handleStartBuild}
              disabled={generateProject.isPending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              {generateProject.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Build
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            "Workout tracker",
            "Link in bio",
            "Gym buddy finder",
            "Task manager",
            "Recipe app",
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setProjectPrompt(suggestion)}
              className="text-sm"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      {/* Creation Options */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="github">Import from GitHub</TabsTrigger>
          <TabsTrigger value="url">Import from URL</TabsTrigger>
          <TabsTrigger value="recent">Recent Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <Button
                          onClick={() => handleTemplateSelect(template.id)}
                          size="sm"
                          className="mt-3"
                          disabled={createProject.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="github" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your GitHub Repositories</h3>
            <Button onClick={() => refetchGitHub()} variant="outline" size="sm">
              <Github className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {githubRepos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {githubRepos.slice(0, 6).map((repo) => (
                <Card
                  key={repo.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{repo.name}</h4>
                          {repo.private && (
                            <Badge variant="secondary">Private</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {repo.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          {repo.language && <span>{repo.language}</span>}
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{repo.stargazers_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{repo.forks_count}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleGitHubImport(repo)}
                        size="sm"
                        disabled={importFromGitHub.isPending}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Github className="w-4 h-4" />
              <AlertDescription>
                No GitHub repositories found. Make sure you've configured your
                GitHub token in Settings.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import from URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={importFromGitHub.isPending}
                >
                  {importFromGitHub.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  Supports GitHub, GitLab, and other Git repository URLs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Recent Projects</h3>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentProjects.slice(0, 6).map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{project.name}</h4>
                          <Badge
                            variant={
                              project.status === "active"
                                ? "default"
                                : project.status === "completed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {project.status}
                          </Badge>
                          {project.isPublic && (
                            <Badge variant="outline">Public</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>{project.language}</span>
                          {project.framework && (
                            <span>{project.framework}</span>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setLocation("/workspace")}
                        size="sm"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Plus className="w-4 h-4" />
              <AlertDescription>
                No projects yet. Create your first project using one of the
                options above.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={showBlueprint} onOpenChange={setShowBlueprint}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Blueprint</DialogTitle>
          </DialogHeader>
          {blueprint && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Workflow</h3>
                <ul className="list-disc list-inside space-y-1">
                  {blueprint.workflow.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Blueprint</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {blueprint.blueprint}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Agent Selection</h3>
                <RadioGroup
                  value={agentMode}
                  onValueChange={(val) =>
                    setAgentMode(val as "single" | "multi")
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="agent-single" />
                    <Label htmlFor="agent-single">Single Agent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multi" id="agent-multi" />
                    <Label htmlFor="agent-multi">Multiple Agents</Label>
                  </div>
                </RadioGroup>
                {agentMode === "single" && (
                  <RadioGroup
                    value={singleAgent}
                    onValueChange={(val) =>
                      setSingleAgent(val as "codex" | "claude")
                    }
                    className="flex space-x-4 mt-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="codex" id="codex" />
                      <Label htmlFor="codex">Codex</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="claude" id="claude" />
                      <Label htmlFor="claude">Claude Code</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleConfirmBuild}
              disabled={generateProject.isPending}
            >
              {generateProject.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm and Build"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
