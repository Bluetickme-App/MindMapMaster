import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Package, 
  Search, 
  Download, 
  Trash2, 
  Settings, 
  Play, 
  Pause,
  GitBranch,
  Code,
  Database,
  Server,
  Globe,
  FileText,
  Wrench,
  Star,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tools: ExtensionTool[];
  enabled: boolean;
  installed: boolean;
  downloadUrl?: string;
  githubUrl?: string;
  dependencies?: string[];
  permissions?: string[];
  icon?: string;
  readme?: string;
  changelog?: string;
  downloads?: number;
  rating?: number;
  lastUpdated?: string;
}

interface ExtensionTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
  category: string;
  icon?: string;
  examples?: any[];
}

const categoryIcons = {
  'Core': Package,
  'Development': Code,
  'Database': Database,
  'DevOps': Server,
  'Integration': Globe,
  'Version Control': GitBranch,
  'Configuration': Settings,
  'Server': Server,
  'Package Management': Package,
  'Testing': FileText,
  'Search': Search,
  'API': Globe
};

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || Wrench;
};

export default function ExtensionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [activeTab, setActiveTab] = useState('installed');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, any>>({});
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch extensions
  const { data: extensions, isLoading } = useQuery({
    queryKey: ['/api/extensions', searchQuery, selectedCategory, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (activeTab === 'installed') params.append('installed', 'true');
      
      const response = await apiRequest(`/api/extensions?${params}`);
      return response.data;
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/extensions/categories'],
    queryFn: async () => {
      const response = await apiRequest('/api/extensions/categories');
      return response.data;
    }
  });

  // Fetch extension stats
  const { data: stats } = useQuery({
    queryKey: ['/api/extensions/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/extensions/stats');
      return response.data;
    }
  });

  // Fetch available tools
  const { data: availableTools } = useQuery({
    queryKey: ['/api/extensions/tools/available'],
    queryFn: async () => {
      const response = await apiRequest('/api/extensions/tools/available');
      return response.data;
    }
  });

  // Install extension mutation
  const installMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      return await apiRequest(`/api/extensions/${extensionId}/install`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/extensions'] });
      toast({
        title: "Extension Installed",
        description: "Extension has been installed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install extension",
        variant: "destructive",
      });
    }
  });

  // Uninstall extension mutation
  const uninstallMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      return await apiRequest(`/api/extensions/${extensionId}/uninstall`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/extensions'] });
      toast({
        title: "Extension Uninstalled",
        description: "Extension has been uninstalled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Uninstallation Failed",
        description: error.message || "Failed to uninstall extension",
        variant: "destructive",
      });
    }
  });

  // Toggle extension mutation
  const toggleMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      return await apiRequest(`/api/extensions/${extensionId}/toggle`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/extensions'] });
      toast({
        title: "Extension Toggled",
        description: "Extension status has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Toggle Failed",
        description: error.message || "Failed to toggle extension",
        variant: "destructive",
      });
    }
  });

  // Execute tool mutation
  const executeToolMutation = useMutation({
    mutationFn: async ({ toolName, parameters }: { toolName: string; parameters: any }) => {
      return await apiRequest(`/api/extensions/tools/${toolName}/execute`, {
        method: 'POST',
        body: { parameters }
      });
    },
    onSuccess: (data, variables) => {
      setToolResults(prev => ({
        ...prev,
        [variables.toolName]: data.data
      }));
      toast({
        title: "Tool Executed",
        description: `${variables.toolName} executed successfully`,
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Execution Failed",
        description: error.message || `Failed to execute ${variables.toolName}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setExecutingTool(null);
    }
  });

  const handleInstall = (extensionId: string) => {
    installMutation.mutate(extensionId);
  };

  const handleUninstall = (extensionId: string) => {
    uninstallMutation.mutate(extensionId);
  };

  const handleToggle = (extensionId: string) => {
    toggleMutation.mutate(extensionId);
  };

  const handleExecuteTool = async (toolName: string, parameters: any = {}) => {
    setExecutingTool(toolName);
    executeToolMutation.mutate({ toolName, parameters });
  };

  const copyToolUsage = (toolName: string, example: any) => {
    const usage = `// Execute ${toolName} tool
const result = await extensionManager.executeTool('${toolName}', ${JSON.stringify(example, null, 2)});`;
    
    navigator.clipboard.writeText(usage);
    setCopiedTool(toolName);
    setTimeout(() => setCopiedTool(null), 2000);
    
    toast({
      title: "Code Copied",
      description: "Tool usage code copied to clipboard",
    });
  };

  const renderExtensionCard = (extension: Extension) => {
    const IconComponent = getCategoryIcon(extension.category);
    
    return (
      <Card key={extension.id} className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{extension.name}</CardTitle>
                <CardDescription className="text-sm">
                  v{extension.version} by {extension.author}
                </CardDescription>
              </div>
            </div>
            <Badge variant={extension.enabled ? 'default' : 'secondary'}>
              {extension.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {extension.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{extension.category}</Badge>
            <Badge variant="outline">{extension.tools.length} tools</Badge>
            {extension.rating && (
              <Badge variant="outline" className="gap-1">
                <Star className="w-3 h-3" />
                {extension.rating.toFixed(1)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            {extension.installed ? (
              <>
                <Switch
                  checked={extension.enabled}
                  onCheckedChange={() => handleToggle(extension.id)}
                  className="data-[state=checked]:bg-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {extension.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(extension.id)}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Uninstall
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleInstall(extension.id)}
                disabled={installMutation.isPending}
                className="ml-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExtension(extension)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    {extension.name}
                  </DialogTitle>
                  <DialogDescription>
                    {extension.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Extension Info</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Version:</strong> {extension.version}</p>
                        <p><strong>Author:</strong> {extension.author}</p>
                        <p><strong>Category:</strong> {extension.category}</p>
                        <p><strong>Tools:</strong> {extension.tools.length}</p>
                      </div>
                    </div>
                    
                    {extension.githubUrl && (
                      <div>
                        <h4 className="font-medium mb-2">Links</h4>
                        <a 
                          href={extension.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          GitHub Repository
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Available Tools</h4>
                    <div className="grid gap-3">
                      {extension.tools.map((tool, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-muted-foreground" />
                              <h5 className="font-medium">{tool.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {tool.category}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              {tool.examples && tool.examples[0] && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToolUsage(tool.name, tool.examples[0])}
                                >
                                  {copiedTool === tool.name ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExecuteTool(tool.name, tool.examples?.[0] || {})}
                                disabled={executingTool === tool.name}
                              >
                                {executingTool === tool.name ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {tool.description}
                          </p>
                          {tool.examples && tool.examples[0] && (
                            <div className="bg-muted p-2 rounded text-xs">
                              <strong>Example:</strong> {JSON.stringify(tool.examples[0], null, 2)}
                            </div>
                          )}
                          {toolResults[tool.name] && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <strong>Result:</strong> {JSON.stringify(toolResults[tool.name], null, 2)}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Extensions</h1>
          <p className="text-muted-foreground">
            Manage and extend your development environment with powerful tools
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{stats.total}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{stats.installed}</div>
              <div className="text-muted-foreground">Installed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{stats.enabled}</div>
              <div className="text-muted-foreground">Enabled</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{availableTools?.length || 0}</div>
              <div className="text-muted-foreground">Tools</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="installed" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extensions?.filter((ext: Extension) => ext.installed).map(renderExtensionCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extensions?.map(renderExtensionCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4">
            {availableTools?.map((tool: ExtensionTool, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">{tool.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {tool.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {tool.examples && tool.examples[0] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToolUsage(tool.name, tool.examples[0])}
                      >
                        {copiedTool === tool.name ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteTool(tool.name, tool.examples?.[0] || {})}
                      disabled={executingTool === tool.name}
                    >
                      {executingTool === tool.name ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {tool.description}
                </p>
                {tool.examples && tool.examples[0] && (
                  <div className="bg-muted p-2 rounded text-xs">
                    <strong>Example:</strong> {JSON.stringify(tool.examples[0], null, 2)}
                  </div>
                )}
                {toolResults[tool.name] && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <strong>Result:</strong> {JSON.stringify(toolResults[tool.name], null, 2)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}