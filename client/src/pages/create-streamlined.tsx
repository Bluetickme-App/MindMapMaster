import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wand2, 
  Rocket, 
  Users, 
  Code2, 
  Loader2,
  ArrowRight,
  Sparkles,
  Brain
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

const QUICK_SUGGESTIONS = [
  "A modern social media dashboard with real-time notifications",
  "E-commerce store with AI-powered product recommendations", 
  "Task management app with team collaboration features",
  "Personal finance tracker with budget insights",
  "Recipe sharing platform with meal planning",
  "Fitness tracker with workout scheduling"
];

const EXAMPLE_PROJECTS = [
  { icon: "🛒", title: "E-commerce", desc: "Build online stores with payments" },
  { icon: "📱", title: "Social App", desc: "Create social platforms with chat" },
  { icon: "📊", title: "Dashboard", desc: "Analytics and data visualization" },
  { icon: "🎮", title: "Game/Quiz", desc: "Interactive games and quizzes" },
  { icon: "💼", title: "Business Tool", desc: "CRM, project management, etc." },
  { icon: "🏥", title: "Health/Fitness", desc: "Wellness and tracking apps" }
];

export default function CreateStreamlinedPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createProjectMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest('/api/streamlined-project', {
        method: 'POST',
        body: { description }
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Project Created Successfully!",
        description: `${data.projectName} is ready. AI team assembled and workspace prepared.`
      });
      // Navigate to the workspace
      setLocation('/replit-clone');
    },
    onError: (error: any) => {
      toast({
        title: "Project Creation Failed",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    }
  });

  const handleCreateProject = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what you want to build",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createProjectMutation.mutateAsync(projectDescription);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setProjectDescription(suggestion);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Project Builder</h1>
              <p className="text-slate-400">Describe your idea, and our AI team will build it</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Main Creation Card */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="w-5 h-5" />
              What do you want to build?
            </CardTitle>
            <p className="text-slate-400">
              Describe your project in plain English. Our AI team will handle the rest.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Input */}
            <div className="space-y-3">
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Example: A social media app where users can share photos, follow friends, and get AI-powered content recommendations. Include user profiles, real-time chat, and a modern design."
                className="min-h-[120px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                disabled={isCreating}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {projectDescription.length}/1000 characters
                </p>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  AI will auto-select team & tech stack
                </Badge>
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !projectDescription.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 h-auto"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Project & Assembling AI Team...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Build My Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Suggestions */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Ideas</CardTitle>
            <p className="text-slate-400 text-sm">Click any suggestion to get started</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="justify-start h-auto p-3 text-left bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200 hover:text-white"
                  disabled={isCreating}
                >
                  <Wand2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Example Categories */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Popular Categories</CardTitle>
            <p className="text-slate-400 text-sm">Inspiration for your next project</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {EXAMPLE_PROJECTS.map((project, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-800 border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                  onClick={() => handleSuggestionClick(`Build a ${project.title.toLowerCase()} application. ${project.desc}.`)}
                >
                  <div className="text-2xl mb-2">{project.icon}</div>
                  <h3 className="font-medium text-white text-sm">{project.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{project.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2">1. Describe Your Idea</h3>
                <p className="text-sm text-slate-400">Tell us what you want to build in plain English</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2">2. AI Team Assembly</h3>
                <p className="text-sm text-slate-400">Our AI agents automatically select the best team and tech stack</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2">3. Start Building</h3>
                <p className="text-sm text-slate-400">Get a fully configured workspace and start collaborating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}