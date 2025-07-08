import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Github, Star, GitFork, Plus, RefreshCw, Settings, ExternalLink, Eye, Lock } from "lucide-react";
import { SiJavascript, SiPython, SiTypescript, SiReact, SiNodedotjs } from "react-icons/si";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  updated_at: string;
}

interface GitHubStatus {
  connected: boolean;
  user: {
    username: string;
    name: string;
  } | null;
}

const getLanguageIcon = (language: string | null) => {
  if (!language) return null;
  
  switch (language.toLowerCase()) {
    case 'javascript':
      return <SiJavascript className="w-3 h-3 text-yellow-500" />;
    case 'python':
      return <SiPython className="w-3 h-3 text-blue-500" />;
    case 'typescript':
      return <SiTypescript className="w-3 h-3 text-blue-600" />;
    case 'react':
      return <SiReact className="w-3 h-3 text-cyan-500" />;
    case 'node':
    case 'nodejs':
      return <SiNodedotjs className="w-3 h-3 text-green-600" />;
    default:
      return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
  }
};

export default function GitHubIntegration() {
  const [githubToken, setGithubToken] = useState("");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [createRepoDialogOpen, setCreateRepoDialogOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: githubStatus } = useQuery<GitHubStatus>({
    queryKey: ['/api/github/status'],
  });

  const { data: repositories = [], isLoading, refetch } = useQuery<GitHubRepository[]>({
    queryKey: ['/api/github/repositories'],
    enabled: githubStatus?.connected,
  });

  const connectMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/github/connect", { token });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "GitHub Connected",
        description: "Successfully connected to GitHub!",
      });
      setConnectDialogOpen(false);
      setGithubToken("");
      queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/github/repositories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to GitHub",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/github/disconnect", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "GitHub Disconnected",
        description: "Successfully disconnected from GitHub",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/github/repositories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect from GitHub",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/github/sync", {});
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Repositories Synced",
        description: `Successfully synced ${data.count} repositories`,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync repositories",
        variant: "destructive",
      });
    },
  });

  const createRepoMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest("POST", "/api/github/repositories", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Repository Created",
        description: "Successfully created new repository",
      });
      setCreateRepoDialogOpen(false);
      setNewRepoName("");
      setNewRepoDescription("");
      setNewRepoPrivate(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create repository",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!githubToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your GitHub personal access token",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate(githubToken);
  };

  const handleCreateRepo = () => {
    if (!newRepoName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a repository name",
        variant: "destructive",
      });
      return;
    }
    createRepoMutation.mutate({
      name: newRepoName,
      description: newRepoDescription || undefined,
      isPrivate: newRepoPrivate,
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-surface border-slate-700" id="github-integration">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-100">GitHub Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-700/30 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-slate-700" id="github-integration">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg font-semibold text-slate-100">GitHub Integration</CardTitle>
            {githubStatus?.connected && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Connected as {githubStatus.user?.username}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {githubStatus?.connected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Dialog open={createRepoDialogOpen} onOpenChange={setCreateRepoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Repo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-surface border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-slate-100">Create New Repository</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="repo-name" className="text-slate-200">Repository Name</Label>
                        <Input
                          id="repo-name"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          placeholder="my-awesome-project"
                          className="bg-background border-slate-600 text-slate-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="repo-description" className="text-slate-200">Description (optional)</Label>
                        <Textarea
                          id="repo-description"
                          value={newRepoDescription}
                          onChange={(e) => setNewRepoDescription(e.target.value)}
                          placeholder="A short description of your project"
                          className="bg-background border-slate-600 text-slate-100"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="repo-private"
                          checked={newRepoPrivate}
                          onCheckedChange={setNewRepoPrivate}
                        />
                        <Label htmlFor="repo-private" className="text-slate-200">
                          Make repository private
                        </Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setCreateRepoDialogOpen(false)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateRepo}
                          disabled={createRepoMutation.isPending}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {createRepoMutation.isPending ? "Creating..." : "Create Repository"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="bg-red-700/20 hover:bg-red-600/30 text-red-400 border-red-600/30"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Connect GitHub
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">Connect to GitHub</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="github-token" className="text-slate-200">
                        GitHub Personal Access Token
                      </Label>
                      <Input
                        id="github-token"
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="bg-background border-slate-600 text-slate-100"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Create a token at GitHub Settings → Developer settings → Personal access tokens
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setConnectDialogOpen(false)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConnect}
                        disabled={connectMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {connectMutation.isPending ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!githubStatus?.connected ? (
          <div className="text-center py-8">
            <Github className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No GitHub connection</p>
            <p className="text-sm text-slate-500 mt-1">Connect your GitHub account to manage repositories</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-8">
            <Github className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No repositories found</p>
            <p className="text-sm text-slate-500 mt-1">Create your first repository or sync existing ones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.slice(0, 6).map((repo) => (
              <Card
                key={repo.id}
                className="bg-background border-slate-600 hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-100 truncate group-hover:text-primary">
                      {repo.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={repo.private ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {repo.private ? (
                          <><Lock className="w-3 h-3 mr-1" />Private</>
                        ) : (
                          <><Eye className="w-3 h-3 mr-1" />Public</>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        onClick={() => window.open(`https://github.com/${repo.full_name}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {repo.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLanguageIcon(repo.language)}
                      <span className="text-xs text-slate-400">
                        {repo.language || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-slate-400 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {repo.stargazers_count}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center">
                        <GitFork className="w-3 h-3 mr-1" />
                        {repo.forks_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
