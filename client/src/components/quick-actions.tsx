import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Bug, Github, Rocket } from "lucide-react";

const actions = [
  {
    title: "Generate Code",
    description: "AI-powered code generation",
    icon: Wand2,
    color: "primary",
    onClick: () => {
      // TODO: Navigate to code generation section
      document.getElementById('code-generation')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    title: "Debug Code",
    description: "Intelligent error detection",
    icon: Bug,
    color: "accent",
    onClick: () => {
      // TODO: Navigate to debug section
      console.log("Debug code clicked");
    },
  },
  {
    title: "GitHub Sync",
    description: "Repository management",
    icon: Github,
    color: "orange-500",
    onClick: () => {
      // TODO: Navigate to GitHub section
      document.getElementById('github-integration')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    title: "Deploy",
    description: "Instant deployment",
    icon: Rocket,
    color: "purple-500",
    onClick: () => {
      // TODO: Navigate to deployment section
      console.log("Deploy clicked");
    },
  },
];

export default function QuickActions() {
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
