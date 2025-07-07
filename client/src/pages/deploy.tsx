import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Globe, Server, Settings, ExternalLink } from "lucide-react";

export default function DeployPage() {
  const deploymentOptions = [
    {
      name: "Replit Deployment",
      description: "Deploy directly from your Replit workspace",
      status: "Ready",
      icon: Rocket,
      color: "bg-green-500"
    },
    {
      name: "Vercel",
      description: "Deploy to Vercel for optimal performance",
      status: "Available",
      icon: Globe,
      color: "bg-blue-500"
    },
    {
      name: "Railway",
      description: "Deploy to Railway with database support",
      status: "Available", 
      icon: Server,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Rocket className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Deployment</h2>
              <p className="text-sm text-slate-400">Deploy your projects to the cloud</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-surface border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Deployment Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentOptions.map((option, index) => (
                    <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${option.color}/10 rounded-lg flex items-center justify-center`}>
                            <option.icon className={`w-5 h-5 text-${option.color.replace('bg-', '')}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-100">{option.name}</h4>
                            <p className="text-sm text-slate-400">{option.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={option.status === "Ready" ? "default" : "secondary"}>
                            {option.status}
                          </Badge>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Deploy
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Quick Deploy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <h4 className="font-medium text-slate-100 mb-2">Current Project</h4>
                    <p className="text-sm text-slate-400 mb-4">Ready to deploy your CodeCraft application</p>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}