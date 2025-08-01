import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Code, MessageSquare, Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClaudeResponse {
  text?: string;
  code?: string;
  explanation?: string;
  language?: string;
  framework?: string;
  analysis?: string;
  insights?: string[];
  summary?: string;
  recommendations?: string[];
  message?: string;
  model?: string;
}

export default function ClaudeSDK() {
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, ClaudeResponse>>({});
  const { toast } = useToast();

  // Text Generation State
  const [textPrompt, setTextPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(4000);
  const [temperature, setTemperature] = useState(0.7);

  // Code Generation State
  const [codePrompt, setCodePrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("");

  // Text Analysis State
  const [analysisText, setAnalysisText] = useState("");
  const [analysisType, setAnalysisType] = useState("general");

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const callClaudeAPI = async (endpoint: string, data: any, responseKey: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/claude/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResponses(prev => ({ ...prev, [responseKey]: result }));
      
      toast({
        title: "Success!",
        description: `Claude ${endpoint} completed successfully`,
      });
    } catch (error) {
      console.error(`Claude ${endpoint} error:`, error);
      toast({
        title: "Error",
        description: `Failed to call Claude ${endpoint}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateText = () => {
    if (!textPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }
    callClaudeAPI('generate', { prompt: textPrompt, maxTokens, temperature }, 'text');
  };

  const generateCode = () => {
    if (!codePrompt.trim()) {
      toast({ title: "Error", description: "Please enter a code prompt", variant: "destructive" });
      return;
    }
    callClaudeAPI('code', { prompt: codePrompt, language, framework }, 'code');
  };

  const analyzeText = () => {
    if (!analysisText.trim()) {
      toast({ title: "Error", description: "Please enter text to analyze", variant: "destructive" });
      return;
    }
    callClaudeAPI('analyze', { text: analysisText, analysisType }, 'analysis');
  };

  const sendChatMessage = () => {
    if (!currentMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    const newMessages = [...chatMessages, { role: 'user', content: currentMessage }];
    setChatMessages(newMessages);
    setCurrentMessage("");

    callClaudeAPI('chat', { messages: newMessages, systemPrompt }, 'chat').then(() => {
      if (responses.chat?.message) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: responses.chat.message }]);
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🤖 Claude SDK Integration
        </h1>
        <p className="text-lg text-muted-foreground">
          Advanced AI capabilities with Claude Sonnet 4.0 - The latest model from Anthropic
        </p>
        <Badge variant="secondary" className="mt-2">
          Model: claude-sonnet-4-20250514
        </Badge>
      </div>

      <Tabs defaultValue="text" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Text Generation
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code Generation
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Text Analysis
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat Interface
          </TabsTrigger>
        </TabsList>

        {/* Text Generation Tab */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Text Generation with Claude</CardTitle>
              <CardDescription>
                Generate high-quality text content using Claude's advanced language model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Prompt</label>
                  <Textarea
                    placeholder="Enter your text generation prompt..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <Input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      min={100}
                      max={8000}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperature</label>
                    <Input
                      type="number"
                      step={0.1}
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      min={0}
                      max={1}
                    />
                  </div>
                  <Button 
                    onClick={generateText} 
                    disabled={loading} 
                    className="w-full"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Generate Text
                  </Button>
                </div>
              </div>

              {responses.text && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{responses.text.text}</pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Badge>Model: {responses.text.model}</Badge>
                      <Badge variant="outline">Tokens: {responses.text.usage?.output_tokens || 'N/A'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Generation Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Generation with Claude</CardTitle>
              <CardDescription>
                Generate production-ready code with explanations and best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Code Prompt</label>
                  <Textarea
                    placeholder="Describe the code you want to generate..."
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Framework (Optional)</label>
                    <Input
                      placeholder="e.g., React, Vue, Express..."
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateCode} 
                    disabled={loading} 
                    className="w-full"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Generate Code
                  </Button>
                </div>
              </div>

              {responses.code && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generated Code</CardTitle>
                      <div className="flex gap-2">
                        <Badge>{responses.code.language}</Badge>
                        {responses.code.framework && <Badge variant="outline">{responses.code.framework}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">{responses.code.code}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  {responses.code.explanation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Explanation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{responses.code.explanation}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Text Analysis with Claude</CardTitle>
              <CardDescription>
                Analyze text for insights, sentiment, and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Text to Analyze</label>
                  <Textarea
                    placeholder="Enter the text you want to analyze..."
                    value={analysisText}
                    onChange={(e) => setAnalysisText(e.target.value)}
                    rows={8}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analysis Type</label>
                    <Select value={analysisType} onValueChange={setAnalysisType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Analysis</SelectItem>
                        <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                        <SelectItem value="business">Business Analysis</SelectItem>
                        <SelectItem value="technical">Technical Analysis</SelectItem>
                        <SelectItem value="creative">Creative Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={analyzeText} 
                    disabled={loading} 
                    className="w-full"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Analyze Text
                  </Button>
                </div>
              </div>

              {responses.analysis && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analysis Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded">{responses.analysis.summary}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Detailed Analysis</h4>
                        <p className="text-sm text-muted-foreground">{responses.analysis.analysis}</p>
                      </div>

                      {responses.analysis.insights && responses.analysis.insights.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Key Insights</h4>
                          <ul className="space-y-1">
                            {responses.analysis.insights.map((insight, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {responses.analysis.recommendations && responses.analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {responses.analysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Interface Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat with Claude</CardTitle>
              <CardDescription>
                Have a conversation with Claude using the latest model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">System Prompt (Optional)</label>
                <Input
                  placeholder="Set Claude's personality or role..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {chatMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center">Start a conversation with Claude...</p>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white dark:bg-gray-700 border'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}