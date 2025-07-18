import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Globe, Code, Database, FileCode } from 'lucide-react';

interface ProjectConfig {
  id: string;
  name: string;
  type: 'html' | 'react' | 'node' | 'python' | 'php';
  devUrl: string;
  entryPoint: string;
  assets: string[];
}

interface DevUrlsResponse {
  projects: ProjectConfig[];
  devUrls: string[];
}

const typeIcons = {
  html: <Globe className="w-4 h-4" />,
  react: <Code className="w-4 h-4" />,
  node: <FileCode className="w-4 h-4" />,
  python: <Database className="w-4 h-4" />,
  php: <FileCode className="w-4 h-4" />
};

const typeColors = {
  html: 'bg-blue-100 text-blue-800',
  react: 'bg-cyan-100 text-cyan-800',
  node: 'bg-green-100 text-green-800',
  python: 'bg-yellow-100 text-yellow-800',
  php: 'bg-purple-100 text-purple-800'
};

export default function DevUrls() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevUrls = async () => {
    try {
      const response = await fetch('/api/dev-urls');
      const data: DevUrlsResponse = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching dev URLs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerReload = async (projectId: string) => {
    try {
      await fetch(`/api/dev-urls/${projectId}/reload`, { method: 'POST' });
    } catch (error) {
      console.error('Error triggering reload:', error);
    }
  };

  const refreshProjects = async () => {
    setRefreshing(true);
    await fetchDevUrls();
  };

  useEffect(() => {
    fetchDevUrls();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Development URLs</h1>
          <p className="text-gray-600 mt-2">
            Access your projects with unique development URLs like Replit
          </p>
        </div>
        <Button
          onClick={refreshProjects}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Projects
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600">
                Create a project to see its development URL here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {typeIcons[project.type]}
                    {project.name}
                  </CardTitle>
                  <Badge className={typeColors[project.type]}>
                    {project.type.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Entry Point:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {project.entryPoint}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Assets:</span>
                    <span className="text-xs">{project.assets.length} files</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Dev URL</span>
                  </div>
                  <code className="text-sm text-blue-600 break-all">
                    {project.devUrl}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(project.devUrl, '_blank')}
                    className="flex-1"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                  <Button
                    onClick={() => triggerReload(project.id)}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How Dev URLs Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each project gets a unique development URL like <code>localhost:5000/dev/project-name</code></li>
          <li>• URLs are automatically generated based on project type and structure</li>
          <li>• Live reload functionality helps with development workflow</li>
          <li>• Static assets are served automatically with proper MIME types</li>
        </ul>
      </div>
    </div>
  );
}