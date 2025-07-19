import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Code, Wand2, Bug, RefreshCw, Zap, FileText, TestTube, BookOpen, ArrowLeftRight, TrendingUp, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodexResponse {
  code: string;
  explanation?: string;
  suggestions?: string[];
  language: string;
  confidence: number;
  executionTime: number;
}

const languages = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 
  'php', 'ruby', 'sql', 'html', 'css', 'swift', 'kotlin', 'scala'
];

const frameworks = [
  'react', 'vue', 'angular', 'nextjs', 'express', 'fastapi', 'django', 
  'flask', 'spring', 'dotnet', 'laravel', 'rails'
];

export default function CodexEnhanced() {
  const [activeTab, setActiveTab] = useState('generate');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [framework, setFramework] = useState('');
  const [context, setContext] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [fromLanguage, setFromLanguage] = useState('javascript');
  const [toLanguage, setToLanguage] = useState('python');
  const [requirements, setRequirements] = useState('');
  const [target, setTarget] = useState('');
  const [response, setResponse] = useState<CodexResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleApiCall = async (endpoint: string, data: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/codex/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResponse(result);
      toast({
        title: "Success",
        description: `Code ${endpoint} completed in ${result.executionTime}ms`
      });
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${endpoint} code`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Code copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const renderResponse = () => {
    if (!response) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Generated Code
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{response.language}</Badge>
              <Badge variant="outline">
                {(response.confidence * 100).toFixed(0)}% confidence
              </Badge>
              <Badge variant="outline">
                {response.executionTime}ms
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(response.code)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              <code>{response.code}</code>
            </pre>
          </div>
          
          {response.explanation && (
            <div>
              <h4 className="font-semibold mb-2">Explanation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {response.explanation}
              </p>
            </div>
          )}
          
          {response.suggestions && response.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Suggestions</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {response.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Codex Enhanced</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Advanced AI-powered code generation, completion, and analysis using GPT-4o
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="generate" className="flex items-center gap-1">
            <Wand2 className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-1">
            <Code className="w-4 h-4" />
            Complete
          </TabsTrigger>
          <TabsTrigger value="explain" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Explain
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-1">
            <Bug className="w-4 h-4" />
            Debug
          </TabsTrigger>
          <TabsTrigger value="refactor" className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Refactor
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Optimize
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-1">
            <TestTube className="w-4 h-4" />
            Test
          </TabsTrigger>
          <TabsTrigger value="convert" className="flex items-center gap-1">
            <ArrowLeftRight className="w-4 h-4" />
            Convert
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Describe what you want to build</Label>
                <Textarea
                  id="prompt"
                  placeholder="Create a React component that displays a user profile with avatar, name, and bio..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="framework">Framework (optional)</Label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.map(fw => (
                        <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="context">Additional Context (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Any specific requirements, patterns, or constraints..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={() => handleApiCall('generate', { prompt, language, framework, context, mode: 'completion' })}
                disabled={loading || !prompt}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <CardTitle>Complete Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="partial-code">Partial Code</Label>
                <Textarea
                  id="partial-code"
                  placeholder="function calculateTax(income) {"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="complete-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('complete', { code, language, context })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Completing...' : 'Complete Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explain">
          <Card>
            <CardHeader>
              <CardTitle>Explain Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="explain-code">Code to Explain</Label>
                <Textarea
                  id="explain-code"
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="explain-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('explain', { code, language })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Explaining...' : 'Explain Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="debug-code">Code with Issues</Label>
                <Textarea
                  id="debug-code"
                  placeholder="Paste your buggy code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="error-message">Error Message</Label>
                <Textarea
                  id="error-message"
                  placeholder="Paste the error message or describe the issue..."
                  value={error}
                  onChange={(e) => setError(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="debug-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('debug', { code, error, language })}
                disabled={loading || !code || !error}
                className="w-full"
              >
                {loading ? 'Debugging...' : 'Debug Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refactor">
          <Card>
            <CardHeader>
              <CardTitle>Refactor Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="refactor-code">Code to Refactor</Label>
                <Textarea
                  id="refactor-code"
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="requirements">Refactoring Requirements</Label>
                <Input
                  id="requirements"
                  placeholder="e.g., improve readability, add error handling, use modern syntax..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="refactor-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('refactor', { code, language, requirements })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Refactoring...' : 'Refactor Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize">
          <Card>
            <CardHeader>
              <CardTitle>Optimize Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="optimize-code">Code to Optimize</Label>
                <Textarea
                  id="optimize-code"
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="target">Optimization Target</Label>
                <Input
                  id="target"
                  placeholder="e.g., performance, memory usage, speed, efficiency..."
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="optimize-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('optimize', { code, language, target })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Optimizing...' : 'Optimize Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Generate Test Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-code">Code to Test</Label>
                <Textarea
                  id="test-code"
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="test-language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleApiCall('test-cases', { code, language })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Generating Tests...' : 'Generate Test Cases'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convert">
          <Card>
            <CardHeader>
              <CardTitle>Convert Between Languages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="convert-code">Code to Convert</Label>
                <Textarea
                  id="convert-code"
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-language">From Language</Label>
                  <Select value={fromLanguage} onValueChange={setFromLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="to-language">To Language</Label>
                  <Select value={toLanguage} onValueChange={setToLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => handleApiCall('convert', { code, fromLanguage, toLanguage })}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? 'Converting...' : `Convert ${fromLanguage} to ${toLanguage}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderResponse()}
    </div>
  );
}