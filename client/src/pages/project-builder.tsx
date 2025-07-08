import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Sparkles, Code, Download, Copy, Eye, FileText, Users, 
  CheckSquare, MessageSquare, Play, Zap, Upload, Mic, Search, 
  Loader2, Globe, ExternalLink, Clock, Target
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'feature' | 'design' | 'integration';
  priority: 'high' | 'medium' | 'low';
  estimated: string;
  completed: boolean;
}

interface GeneratedCode {
  code: string;
  explanation: string;
  language: string;
  framework?: string;
}

export default function ProjectBuilderPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<'prompt' | 'roadmap' | 'build' | 'preview'>('prompt');
  
  // Project Configuration
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [framework, setFramework] = useState('React');
  const [complexity, setComplexity] = useState('medium');
  
  // Roadmap
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [customRequirements, setCustomRequirements] = useState('');
  const [includeTeam, setIncludeTeam] = useState(false);
  
  // Build Phase
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [buildProgress, setBuildProgress] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  
  // File uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const projectTemplates = [
    { id: 'ecommerce', name: 'E-commerce Store', description: 'Online store with cart and payments' },
    { id: 'portfolio', name: 'Portfolio Website', description: 'Personal or professional portfolio' },
    { id: 'dashboard', name: 'Admin Dashboard', description: 'Data visualization and management' },
    { id: 'blog', name: 'Blog Platform', description: 'Content management system' },
    { id: 'social', name: 'Social App', description: 'User profiles and interactions' },
    { id: 'taskmanager', name: 'Task Manager', description: 'Project and task organization' },
    { id: 'custom', name: 'Custom Project', description: 'Start from scratch' }
  ];

  // Generate roadmap based on project details
  const generateRoadmap = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest('POST', '/api/generate-roadmap', projectData);
      const data = await response.json();
      return data.roadmap;
    },
    onSuccess: (data) => {
      setRoadmapItems(data || []);
      setCurrentStep('roadmap');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate roadmap"
      });
    }
  });

  // Generate code based on roadmap
  const buildProject = useMutation({
    mutationFn: async (roadmapData: any) => {
      setIsBuilding(true);
      setBuildProgress(0);
      
      // Simulate progressive build
      const interval = setInterval(() => {
        setBuildProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await apiRequest('POST', '/api/build-project', roadmapData);
      const data = await response.json();
      
      clearInterval(interval);
      setBuildProgress(100);
      setIsBuilding(false);
      
      return data;
    },
    onSuccess: (data) => {
      setGeneratedCode(data);
      setCurrentStep('preview');
      
      // Invalidate projects cache to refresh the project list
      queryClient.invalidateQueries({
        queryKey: ['/api/projects']
      });
      
      toast({
        title: "Project Created Successfully!",
        description: `${projectName} has been built and added to your projects.`
      });
    },
    onError: (error: any) => {
      setIsBuilding(false);
      toast({
        variant: "destructive",
        title: "Build Failed",
        description: error.message || "Failed to build project"
      });
    }
  });

  const handleStartProject = () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your project"
      });
      return;
    }

    generateRoadmap.mutate({
      name: projectName,
      description: projectDescription,
      language,
      framework,
      complexity,
      template: selectedTemplate
    });
  };

  const handleBuildProject = () => {
    const selectedItems = roadmapItems.filter(item => item.completed);
    
    if (selectedItems.length === 0) {
      toast({
        variant: "destructive", 
        title: "No Features Selected",
        description: "Please select at least one feature to build"
      });
      return;
    }

    buildProject.mutate({
      projectName,
      description: projectDescription,
      language,
      framework,
      roadmap: selectedItems,
      customRequirements,
      includeTeam
    });
  };

  const toggleRoadmapItem = (id: string) => {
    setRoadmapItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const [selectedTemplate, setSelectedTemplate] = useState('');

  const createPreviewHTML = (code: string) => {
    return `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Project Builder</h1>
              <Badge variant="outline">
                Step {currentStep === 'prompt' ? '1' : currentStep === 'roadmap' ? '2' : currentStep === 'build' ? '3' : '4'} of 4
              </Badge>
            </div>
            {includeTeam && currentStep === 'roadmap' && (
              <Button variant="outline" onClick={() => setLocation('/team-agents')}>
                <Users className="w-4 h-4 mr-2" />
                Open Team Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Project Configuration */}
        {currentStep === 'prompt' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Hi CodeCraft, what do you want to make?</h2>
              <p className="text-muted-foreground">Describe your project and we'll create a development roadmap</p>
            </div>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Choose a Template or Start Custom</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        if (template.id !== 'custom') {
                          setProjectName(template.name);
                          setProjectDescription(template.description);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Name</label>
                  <Input 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter your project name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Project Description</label>
                  <Textarea 
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe what you want to build in detail..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="PHP">PHP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Framework</label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="React">React</SelectItem>
                        <SelectItem value="Vue">Vue.js</SelectItem>
                        <SelectItem value="Angular">Angular</SelectItem>
                        <SelectItem value="Svelte">Svelte</SelectItem>
                        <SelectItem value="Next.js">Next.js</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Complexity</label>
                    <Select value={complexity} onValueChange={setComplexity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Enhanced Context (Optional) */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Enhanced Context (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                      />
                      {selectedImage && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedImage.name}
                        </p>
                      )}
                    </div>

                    <Button variant="outline" className="w-full">
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Description
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Web Research
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleStartProject}
                  disabled={generateRoadmap.isPending}
                  className="w-full"
                >
                  {generateRoadmap.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Development Roadmap
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Development Roadmap */}
        {currentStep === 'roadmap' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Development Roadmap for {projectName}</h2>
              <p className="text-muted-foreground">Select the features and components you want to include</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Roadmap Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckSquare className="w-5 h-5 mr-2" />
                      Suggested Features & Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {roadmapItems.length > 0 ? roadmapItems.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox 
                            checked={item.completed}
                            onCheckedChange={() => toggleRoadmapItem(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.estimated}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-muted-foreground py-8">
                          <p>Loading roadmap...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Options & Team Chat */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      placeholder="Any specific requirements or additional features you need?"
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Development Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={includeTeam}
                          onCheckedChange={setIncludeTeam}
                        />
                        <label className="text-sm font-medium">
                          Include development team in planning
                        </label>
                      </div>
                      
                      {includeTeam && (
                        <Alert>
                          <Users className="w-4 h-4" />
                          <AlertDescription>
                            Your AI development team will join a conference-style chat to discuss the roadmap and provide expert input.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation('/team-agents')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Team Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Language:</strong> {language}</p>
                    <p><strong>Framework:</strong> {framework}</p>
                    <p><strong>Complexity:</strong> {complexity}</p>
                    <p><strong>Selected Features:</strong> {roadmapItems.filter(i => i.completed).length}/{roadmapItems.length}</p>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleBuildProject}
                  disabled={buildProject.isPending}
                  className="w-full"
                >
                  {buildProject.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building Project...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Building
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Building Phase */}
        {currentStep === 'build' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Building Your Project</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Code className="w-12 h-12 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">Creating {projectName}</p>
                  <p className="text-muted-foreground">
                    Building with {language} and {framework}
                  </p>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${buildProgress}%` }}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {buildProgress}% Complete
                </p>

                {buildProgress === 100 && (
                  <div className="space-y-4">
                    <Badge className="bg-green-500">
                      Build Complete!
                    </Badge>
                    <Button onClick={() => setCurrentStep('preview')}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Your Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Live Preview */}
        {currentStep === 'preview' && generatedCode && (
          <div className="max-w-full">
            <div className="flex items-center justify-between mb-6">
              <Alert className="flex-1 mr-4 border-green-200 bg-green-50">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✓ Project "{projectName}" has been successfully generated and added to your projects!
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setLocation('/workspace')}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Workspace
                </Button>
                <Button 
                  onClick={() => setLocation('/')}
                  variant="outline"
                  size="sm"
                >
                  All Projects
                </Button>
              </div>
            </div>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="code">Source Code</TabsTrigger>
                <TabsTrigger value="explanation">Explanation</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-6">
                <Card className="h-[600px]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Live Preview - {projectName}</CardTitle>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Globe className="w-4 h-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <iframe
                      src={createPreviewHTML(generatedCode.code)}
                      className="w-full h-[500px] border-0"
                      title="Live Preview"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Code</CardTitle>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                      <code>{generatedCode.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explanation" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {generatedCode.explanation}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}