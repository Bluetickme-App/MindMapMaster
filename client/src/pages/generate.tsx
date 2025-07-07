import Sidebar from "@/components/sidebar";
import CodeGenerationPanel from "@/components/code-generation-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

export default function GeneratePage() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Code Generation</h2>
              <p className="text-sm text-slate-400">Generate code with AI assistance</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <CodeGenerationPanel />
        </main>
      </div>
    </div>
  );
}