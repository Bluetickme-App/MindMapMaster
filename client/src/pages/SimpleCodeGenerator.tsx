import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Code, Bot, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  job: string;
  avatar: string;
  color: string;
}

interface GeneratedCode {
  id: string;
  agent: string;
  job: string;
  code: string;
  explanation: string;
  status: 'working' | 'completed' | 'error';
}

const AGENTS: Agent[] = [
  {
    id: 'openai',
    name: 'Alex',
    job: 'Frontend Developer',
    avatar: '👨‍💻',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'claude',
    name: 'Maya',
    job: 'Backend Developer', 
    avatar: '👩‍💻',
    color: 'from-purple-500 to-violet-500'
  },
  {
    id: 'gemini',
    name: 'Sam',
    job: 'Full-Stack Developer',
    avatar: '🧑‍💻', 
    color: 'from-blue-500 to-cyan-500'
  }
];

export default function SimpleCodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedCode[]>([]);
  const { toast } = useToast();

  const generateCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Tell me what you want to build",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const newResults: GeneratedCode[] = [
      { 
        id: 'openai', 
        agent: 'Alex', 
        job: 'Creating the user interface and components',
        code: '', 
        explanation: '', 
        status: 'working' 
      },
      { 
        id: 'claude', 
        agent: 'Maya', 
        job: 'Building the backend logic and API',
        code: '', 
        explanation: '', 
        status: 'working' 
      }
    ];
    setResults(newResults);

    try {
      // Generate with OpenAI (Full App)
      const openaiPromise = fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Create a complete web application: ${prompt}`, language: 'javascript', framework: 'react' }),
      }).then(async (res) => {
        const data = await res.json();
        let code = data.code;
        let explanation = data.explanation;

        // Handle OpenAI response parsing
        if (typeof code === 'string' && code.startsWith('```json')) {
          try {
            const jsonStr = code.replace(/```json\n/, '').replace(/\n```$/, '');
            const parsed = JSON.parse(jsonStr);
            code = parsed.code || code;
            explanation = parsed.explanation || explanation;
          } catch (e) {
            console.log('Using raw response');
          }
        }

        setResults(prev => prev.map(r => 
          r.id === 'openai' 
            ? { ...r, code, explanation, status: 'completed' as const }
            : r
        ));
      });

      // Generate with Claude (Full App)
      const claudePromise = fetch('/api/claude/full-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Build a comprehensive application: ${prompt}`, language: 'javascript', framework: 'react' }),
      }).then(async (res) => {
        const data = await res.json();
        let code = data.code;
        let explanation = data.explanation;

        // Handle structured application response
        if (data.type === 'full-application' && data.projectData) {
          code = `🚀 Complete Application Generated!\n\n${code}`;
          explanation = `Maya built: ${data.projectData.projectName || 'Full Application'} - ${explanation}`;
        } else if (typeof code === 'string' && code.startsWith('```json')) {
          try {
            const jsonStr = code.replace(/```json\n/, '').replace(/\n```$/, '');
            const parsed = JSON.parse(jsonStr);
            code = parsed.code || code;
            explanation = parsed.explanation || explanation;
          } catch (e) {
            console.log('Using raw response');
          }
        }

        setResults(prev => prev.map(r => 
          r.id === 'claude' 
            ? { ...r, code, explanation, status: 'completed' as const }
            : r
        ));
      });

      await Promise.all([openaiPromise, claudePromise]);

      toast({
        title: "Applications Generated!",
        description: "Both AI development team members have created complete applications for you",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: "Something went wrong generating the code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white">
          AI Development Team
        </h1>
        <p className="text-lg text-slate-400 mb-6">
          Meet your AI developers - each with their own specialty
        </p>
        
        {/* Agent Team Display */}
        <div className="flex justify-center gap-6 mb-8">
          {AGENTS.slice(0, 2).map((agent) => (
            <div key={agent.id} className="text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl mb-2 mx-auto`}>
                {agent.avatar}
              </div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-slate-400">{agent.job}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-white">What do you want to build?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Create a React login form with email and password fields"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] text-white bg-slate-900 border-slate-700 resize-none text-base"
          />
          <Button 
            onClick={generateCode}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-3 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Team is Working...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Start Development Team
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {results.map((result) => (
            <Card key={result.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AGENTS.find(a => a.id === result.id)?.color} flex items-center justify-center text-lg`}>
                    {AGENTS.find(a => a.id === result.id)?.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{result.agent}</span>
                      <Badge 
                        variant={result.status === 'completed' ? 'default' : 'secondary'}
                        className={result.status === 'completed' ? 'bg-green-600' : result.status === 'working' ? 'bg-blue-600 animate-pulse' : 'bg-red-600'}
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{result.job}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.status === 'working' ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
                    <p className="text-slate-400">{result.job}...</p>
                  </div>
                ) : result.status === 'completed' ? (
                  <>
                    {result.explanation && (
                      <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
                        <p className="text-sm text-slate-300">
                          <span className="text-slate-400 font-medium">Explanation:</span> {result.explanation}
                        </p>
                      </div>
                    )}
                    {result.code && (
                      <div className="bg-black border border-slate-600 rounded-lg p-4 overflow-x-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-medium">Generated Code:</span>
                          <Badge variant="outline" className="text-xs">JavaScript</Badge>
                        </div>
                        <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                          {result.code}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-400">Error generating code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-12">
            <Code className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold mb-2 text-white">Ready to Generate Code</h3>
            <p className="text-slate-400">
              Enter what you want to build above and click "Generate Code" to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}