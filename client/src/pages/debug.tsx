import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bug, Search, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function DebugPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Bug className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Debug Assistant</h2>
              <p className="text-sm text-slate-400">AI-powered code debugging and error analysis</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-surface border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Debug Your Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code" className="text-slate-200">Paste your code here</Label>
                  <Textarea
                    id="code"
                    placeholder="Paste your code that needs debugging..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="min-h-[200px] bg-slate-800 border-slate-600 text-slate-100 font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="error" className="text-slate-200">Error message (optional)</Label>
                  <Textarea
                    id="error"
                    placeholder="Paste any error messages you're seeing..."
                    value={error}
                    onChange={(e) => setError(e.target.value)}
                    className="min-h-[100px] bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>

                <Button className="w-full bg-accent hover:bg-accent/90">
                  <Bug className="w-4 h-4 mr-2" />
                  Analyze & Debug
                </Button>
              </CardContent>
            </Card>

            {suggestions.length > 0 && (
              <Card className="bg-surface border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span>Debug Suggestions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-slate-800 rounded-lg">
                        <p className="text-slate-200">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}