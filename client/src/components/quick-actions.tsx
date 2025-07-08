import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Bug, Github, Rocket, Users, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Create Project",
      description: "Start a new project with AI",
      icon: Plus,
      color: "blue-500",
      onClick: () => {
        setLocation('/create-project');
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
