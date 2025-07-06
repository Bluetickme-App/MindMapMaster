import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Star, GitFork } from "lucide-react";
import { SiJavascript, SiPython, SiTypescript } from "react-icons/si";
import type { GithubRepository } from "@shared/schema";

const getLanguageIcon = (language: string | null) => {
  if (!language) return null;
  
  switch (language.toLowerCase()) {
    case 'javascript':
      return <SiJavascript className="w-3 h-3 text-yellow-500" />;
    case 'python':
      return <SiPython className="w-3 h-3 text-blue-500" />;
    case 'typescript':
      return <SiTypescript className="w-3 h-3 text-blue-600" />;
    default:
      return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
  }
};

export default function GitHubIntegration() {
  const { data: repositories = [], isLoading } = useQuery<GithubRepository[]>({
    queryKey: ['/api/github/repositories'],
  });

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
          <CardTitle className="text-lg font-semibold text-slate-100">GitHub Integration</CardTitle>
          <Button
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
          >
            <Github className="w-4 h-4 mr-2" />
            Connect Repository
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {repositories.length === 0 ? (
          <div className="text-center py-8">
            <Github className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No repositories connected</p>
            <p className="text-sm text-slate-500 mt-1">Connect your GitHub account to sync repositories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.slice(0, 6).map((repo) => (
              <Card
                key={repo.id}
                className="bg-background border-slate-600 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-100 truncate">
                      {repo.name}
                    </h4>
                    <Badge
                      variant={repo.visibility === 'public' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {repo.visibility}
                    </Badge>
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
                        {repo.stars}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center">
                        <GitFork className="w-3 h-3 mr-1" />
                        {repo.forks}
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
