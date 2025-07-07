import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ExternalLink, Code, Lightbulb } from "lucide-react";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: Lightbulb,
      items: [
        { title: "Quick Start Guide", desc: "Get up and running in minutes" },
        { title: "Basic Code Generation", desc: "Learn to generate code with AI" },
        { title: "Project Setup", desc: "Configure your development environment" },
      ]
    },
    {
      title: "API Reference",
      icon: Code,
      items: [
        { title: "Code Generation API", desc: "Generate code programmatically" },
        { title: "Debug Assistant API", desc: "Automated debugging assistance" },
        { title: "GitHub Integration", desc: "Repository management endpoints" },
      ]
    },
    {
      title: "Multi-Agent Collaboration",
      icon: ExternalLink,
      items: [
        { title: "Agent Setup", desc: "Configure AI agents for your team" },
        { title: "Real-time Communication", desc: "WebSocket-based collaboration" },
        { title: "Agent Orchestration", desc: "Coordinate multiple AI agents" },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Book className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Documentation</h2>
              <p className="text-sm text-slate-400">Learn how to use CodeCraft effectively</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="bg-surface border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center space-x-2">
                    <section.icon className="w-5 h-5 text-primary" />
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        <h4 className="font-medium text-slate-100 mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}