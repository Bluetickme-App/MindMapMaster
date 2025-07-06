import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Copy, Expand } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CodeGenerationResponse {
  code: string;
  explanation: string;
  suggestions: string[];
}

export default function CodeGenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("react");
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCodeMutation = useMutation({
    mutationFn: async (data: { prompt: string; language: string; framework: string }) => {
      const response = await apiRequest("POST", "/api/generate-code", data);
      return response.json();
    },
    onSuccess: (data: CodeGenerationResponse) => {
      setGeneratedCode(data);
      toast({
        title: "Code Generated",
        description: "Your code has been generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe what you want to build",
        variant: "destructive",
      });
      return;
    }

    generateCodeMutation.mutate({
      prompt,
      language,
      framework,
    });
  };

  const copyToClipboard = async () => {
    if (generatedCode?.code) {
      await navigator.clipboard.writeText(generatedCode.code);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    }
  };

  return (
    <Card className="bg-surface border-slate-700" id="code-generation">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">
            AI Code Generation
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
            <Expand className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium text-slate-300">
            Describe what you want to build
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-2 bg-background border-slate-600 text-slate-100 placeholder-slate-400 focus:border-primary"
            rows={3}
            placeholder="Example: Create a React component that displays a user profile card with avatar, name, and bio..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language" className="text-sm font-medium text-slate-300">
              Language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-2 bg-background border-slate-600 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="framework" className="text-sm font-medium text-slate-300">
              Framework
            </Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger className="mt-2 bg-background border-slate-600 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="vue">Vue.js</SelectItem>
                <SelectItem value="angular">Angular</SelectItem>
                <SelectItem value="nodejs">Node.js</SelectItem>
                <SelectItem value="express">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generateCodeMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {generateCodeMutation.isPending ? (
            <>Generating...</>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Code
            </>
          )}
        </Button>

        {generatedCode && (
          <div className="mt-6 bg-background border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Generated Code</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-slate-100"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="font-mono text-sm text-slate-100 overflow-x-auto whitespace-pre-wrap">
              <code>{generatedCode.code}</code>
            </pre>
            {generatedCode.explanation && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-300">{generatedCode.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
