import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import QuickActions from "@/components/quick-actions";
import CodeGenerationPanel from "@/components/code-generation-panel";
import RecentProjects from "@/components/recent-projects";
import AiStatus from "@/components/ai-status";
import ApiTestingConsole from "@/components/api-testing-console";
import GitHubIntegration from "@/components/github-integration";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Development Dashboard</h2>
              <p className="text-sm text-slate-400">Manage your projects and AI-powered development workflow</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/create-streamlined">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
              <Button variant="outline" className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600">
                <Bell className="w-4 h-4 mr-2" />
                <span className="bg-accent text-background text-xs px-2 py-1 rounded-full ml-1">3</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <QuickActions />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <CodeGenerationPanel />
            </div>
            <div className="space-y-6">
              <RecentProjects />
              <AiStatus />
            </div>
          </div>

          <div className="mt-8">
            <ApiTestingConsole />
          </div>

          <div className="mt-8">
            <GitHubIntegration />
          </div>
        </main>
      </div>
    </div>
  );
}
