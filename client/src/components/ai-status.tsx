import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AiStatus {
  status: string;
  usage: number;
  requestsToday: number;
  avgResponseTime: number;
}

export default function AiStatus() {
  const { data: status, isLoading } = useQuery<AiStatus>({
    queryKey: ['/api/ai-status'],
  });

  if (isLoading) {
    return (
      <Card className="bg-surface border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-100">AI Assistant Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-700/30 rounded" />
            <div className="h-2 bg-slate-700/30 rounded" />
            <div className="h-4 bg-slate-700/30 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-surface border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-100">AI Assistant Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-slate-400">Unable to load AI status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">AI Assistant Status</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status.status === 'online' ? 'bg-accent' : 'bg-red-500'
            }`} />
            <Badge variant={status.status === 'online' ? 'secondary' : 'destructive'} className="text-xs">
              {status.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">API Usage</span>
          <span className="text-sm text-slate-100">{status.usage}%</span>
        </div>
        <Progress value={status.usage} className="w-full" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Requests Today</span>
          <span className="text-sm text-slate-100">{status.requestsToday}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Response Time</span>
          <span className="text-sm text-slate-100">{status.avgResponseTime}s</span>
        </div>
      </CardContent>
    </Card>
  );
}
