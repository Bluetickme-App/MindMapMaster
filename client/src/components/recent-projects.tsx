import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { SiReact, SiPython, SiNodedotjs } from "react-icons/si";
import type { Project } from "@shared/schema";

const getProjectIcon = (language: string) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
      return SiReact;
    case 'python':
      return SiPython;
    case 'nodejs':
      return SiNodedotjs;
    default:
      return SiReact;
  }
};

const getLanguageColor = (language: string) => {
  switch (language.toLowerCase()) {
    case 'javascript':
      return 'bg-yellow-500';
    case 'typescript':
      return 'bg-blue-500';
    case 'python':
      return 'bg-green-500';
    case 'nodejs':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Updated recently';
  }
};

export default function RecentProjects() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  if (isLoading) {
    return (
      <Card className="bg-surface border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-100">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-700/30 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">Recent Projects</CardTitle>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No projects yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => {
              const Icon = getProjectIcon(project.language);
              const languageColor = getLanguageColor(project.language);
              
              return (
                <div
                  key={project.id}
                  className="flex items-center space-x-3 p-3 bg-background rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-100">{project.name}</h4>
                    <p className="text-xs text-slate-400">
                      {formatTimeAgo(new Date(project.lastModified!))}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === 'active' ? 'bg-accent' : 'bg-slate-500'
                    }`} />
                    <Badge variant="secondary" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
