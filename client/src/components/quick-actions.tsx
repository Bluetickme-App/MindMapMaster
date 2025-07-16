import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Bug, Github, Rocket, Users, Plus, Globe, MessageSquare, Building, Code, Sparkles, Map } from "lucide-react";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Create Project",
      description: "Single agent or team collaboration",
      icon: Plus,
      color: "blue-500",
      onClick: () => {
        setLocation('/create-simple');
      },
    },
    {
      title: "Replit Clone",
      description: "Full development environment",
      icon: Code,
      color: "blue-600",
      onClick: () => {
        setLocation('/replit');
      },
    },
    {
      title: "Multi-Agent Collaboration",
      description: "AI teams working together",
      icon: Users,
      color: "purple-500",
      onClick: () => {
        setLocation('/collaboration');
      },
    },
    {
      title: "Generate Code",
      description: "AI-powered code generation",
      icon: Wand2,
      color: "primary",
      onClick: () => {
        setLocation('/generate');
      },
    },
    {
      title: "Debug Code",
      description: "Intelligent error detection",
      icon: Bug,
      color: "accent",
      onClick: () => {
        setLocation('/debug');
      },
    },
    {
      title: "GitHub Sync",
      description: "Repository management",
      icon: Github,
      color: "orange-500",
      onClick: () => {
        setLocation('/github');
      },
    },
    {
      title: "Deploy",
      description: "Instant deployment",
      icon: Rocket,
      color: "purple-500",
      onClick: () => {
        setLocation('/deploy');
      },
    },
    {
      title: "Showcase Website",
      description: "5-page professional portfolio",
      icon: Globe,
      color: "green-500",
      onClick: () => {
        setLocation('/showcase');
      },
    },
    {
      title: "Team Discussion",
      description: "AI agents design collaboration",
      icon: MessageSquare,
      color: "cyan-500",
      onClick: () => {
        setLocation('/team-discussion');
      },
    },
    {
      title: "WeLet Properties",
      description: "Property management platform",
      icon: Building,
      color: "emerald-500",
      onClick: () => {
        setLocation('/welet-properties');
      },
    },
    {
      title: "Replit AI Enhanced",
      description: "Advanced AI Agent & Assistant",
      icon: Sparkles,
      color: "indigo-500",
      onClick: () => {
        setLocation('/replit-ai-enhanced');
      },
    },
    {
      title: "Create New Repl",
      description: "Simple project creation",
      icon: Plus,
      color: "green-500",
      onClick: () => {
        setLocation('/replit-simple');
      },
    },
    {
      title: "AI Development Roadmap",
      description: "AI-powered roadmap & workspace",
      icon: Map,
      color: "teal-500",
      onClick: () => {
        setLocation('/agent-roadmap-flow');
      },
    },
    {
      title: "Multi-AI SDK Demo",
      description: "OpenAI, Claude & Gemini integration",
      icon: Sparkles,
      color: "pink-500",
      onClick: () => {
        setLocation('/multi-ai-sdk-demo');
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.title}
            className="bg-surface border-slate-700 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${action.color}/10 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${action.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{action.title}</h3>
                  <p className="text-sm text-slate-400">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
