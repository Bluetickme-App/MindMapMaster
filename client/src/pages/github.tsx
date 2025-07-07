import Sidebar from "@/components/sidebar";
import GitHubIntegration from "@/components/github-integration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function GitHubPage() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Github className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">GitHub Integration</h2>
              <p className="text-sm text-slate-400">Manage your repositories and sync with GitHub</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <GitHubIntegration />
        </main>
      </div>
    </div>
  );
}