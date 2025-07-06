import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ApiTestResponse {
  statusCode: number;
  response: string;
  responseTime: number;
}

export default function ApiTestingConsole() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("https://api.example.com/v1/users");
  const [headers, setHeaders] = useState('{"Authorization": "Bearer token", "Content-Type": "application/json"}');
  const [body, setBody] = useState('{"name": "John Doe", "email": "john@example.com"}');
  const [response, setResponse] = useState<ApiTestResponse | null>(null);
  const { toast } = useToast();

  const sendRequestMutation = useMutation({
    mutationFn: async (data: { method: string; endpoint: string; headers: string; body: string }) => {
      const response = await apiRequest("POST", "/api/test-api", data);
      return response.json();
    },
    onSuccess: (data: ApiTestResponse) => {
      setResponse(data);
      toast({
        title: "Request Sent",
        description: `Response received with status ${data.statusCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to send request",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = () => {
    if (!endpoint.trim()) {
      toast({
        title: "Endpoint Required",
        description: "Please enter an API endpoint",
        variant: "destructive",
      });
      return;
    }

    sendRequestMutation.mutate({
      method,
      endpoint,
      headers,
      body,
    });
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "bg-accent/10 text-accent";
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-500/10 text-yellow-500";
    if (statusCode >= 500) return "bg-red-500/10 text-red-500";
    return "bg-slate-500/10 text-slate-500";
  };

  return (
    <Card className="bg-surface border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">API Testing Console</CardTitle>
          <Button className="bg-accent hover:bg-accent/90 text-white">
            <Play className="w-4 h-4 mr-2" />
            Run Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="method" className="text-sm font-medium text-slate-300">
                HTTP Method
              </Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-2 bg-background border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="endpoint" className="text-sm font-medium text-slate-300">
                API Endpoint
              </Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="mt-2 bg-background border-slate-600 text-slate-100 placeholder-slate-400"
                placeholder="https://api.example.com/v1/users"
              />
            </div>

            <div>
              <Label htmlFor="headers" className="text-sm font-medium text-slate-300">
                Headers
              </Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="mt-2 bg-background border-slate-600 text-slate-100 placeholder-slate-400 font-mono text-sm"
                rows={3}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              />
            </div>

            <div>
              <Label htmlFor="body" className="text-sm font-medium text-slate-300">
                Request Body
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-2 bg-background border-slate-600 text-slate-100 placeholder-slate-400 font-mono text-sm"
                rows={4}
                placeholder='{"name": "John Doe", "email": "john@example.com"}'
              />
            </div>
          </div>

          {/* Response Display */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-300">Response</Label>
              <div className="mt-2 bg-background border border-slate-600 rounded-lg p-4 h-64 overflow-y-auto">
                {response ? (
                  <>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge className={getStatusColor(response.statusCode)}>
                        {response.statusCode} {response.statusCode === 200 ? 'OK' : 'Error'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Response time: {response.responseTime}ms
                      </span>
                    </div>
                    <pre className="font-mono text-sm text-slate-100 whitespace-pre-wrap">
                      <code>{response.response}</code>
                    </pre>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">No response yet. Send a request to see the results.</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSendRequest}
                disabled={sendRequestMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {sendRequestMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Test
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
