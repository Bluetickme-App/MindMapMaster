import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Code, Download, Eye, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GeneratedCode {
  code: string;
  explanation: string;
  language: string;
  framework?: string;
}

export default function TestGenerationPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('Create a simple portfolio website with a hero section, about section, and contact form using HTML, CSS, and JavaScript');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);

  // Generate code mutation
  const generateCode = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('POST', '/api/generate', {
        prompt,
        language: 'html',
        framework: 'vanilla'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data);
      toast({
        title: "Code generated successfully",
        description: "Your code has been generated and is ready for use",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate code",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }
    generateCode.mutate(prompt);
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    
    const blob = new Blob([generatedCode.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewCode = () => {
    if (!generatedCode) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(generatedCode.code);
      newWindow.document.close();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Wand2 className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Test Code Generation</h1>
          <p className="text-muted-foreground">Test the AI code generation capabilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Code Generation Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe what you want to build..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px]"
            />
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleGenerate}
                disabled={generateCode.isPending}
                className="flex-1"
              >
                {generateCode.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                Make sure you have configured your API keys in Settings for code generation to work.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Code</CardTitle>
              {generatedCode && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{generatedCode.language}</Badge>
                  {generatedCode.framework && (
                    <Badge variant="outline">{generatedCode.framework}</Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedCode ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Explanation:</h4>
                  <p className="text-sm text-muted-foreground">{generatedCode.explanation}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Code:</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-sm">
                    <code>{generatedCode.code}</code>
                  </pre>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={previewCode} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={downloadCode} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Generated code will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Test Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Create a simple portfolio website with HTML, CSS, and JavaScript",
              "Build a responsive landing page for a tech startup",
              "Create a blog website template with modern design",
              "Build a contact form with validation",
              "Create a pricing table component",
              "Build a dashboard layout with sidebar navigation"
            ].map((testPrompt, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => setPrompt(testPrompt)}
                className="text-left h-auto p-4 whitespace-normal"
              >
                {testPrompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}