import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Unlock, Save, RotateCcw, Eye, AlertCircle, CheckCircle, Users, FileText, Activity, Play, Code, Sparkles, Monitor, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface FileInfo {
  id: number;
  name: string;
  path: string;
  isLocked: boolean;
  lockedBy?: string;
  content: string;
}

interface Checkpoint {
  id: number;
  message: string;
  createdAt: string;
  createdBy: string;
  fileCount?: number;
  size?: string;
}

interface LiveSession {
  id: string;
  agentName: string;
  fileName: string;
  isActive: boolean;
  startedAt: string;
  lastActivity?: string;
  linesModified?: number;
}

interface LiveUpdate {
  sessionId: string;
  fileName: string;
  content: string;
  agentName: string;
  timestamp: string;
  updateType: 'partial' | 'complete' | 'thinking' | 'error' | 'code_change';
  message?: string;
  action?: string;
  lineCount?: number;
}

interface ActivityLogItem {
  id: number;
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  agent: string;
  status: string;
}

export default function AdvancedCollaboration() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);

  // Fetch live data from APIs
  const { data: checkpoints = [], refetch: refetchCheckpoints } = useQuery({
    queryKey: ['/api/collaboration/checkpoints'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: liveSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['/api/collaboration/live-sessions'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { data: activityLog = [], refetch: refetchActivity } = useQuery({
    queryKey: ['/api/collaboration/activity-log'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Mock file data
  const mockFiles: FileInfo[] = [
    { 
      id: 1, 
      name: 'HomePage.jsx', 
      path: '/src/components/HomePage.jsx',
      isLocked: false,
      content: `import React from 'react';\n\nconst HomePage = () => {\n  return (\n    <div className="homepage">\n      <h1>Welcome to CodeCraft</h1>\n      <p>Your AI development assistant</p>\n    </div>\n  );\n};\n\nexport default HomePage;`
    },
    { 
      id: 2, 
      name: 'UserService.ts', 
      path: '/src/services/UserService.ts',
      isLocked: true,
      lockedBy: 'Sam AI',
      content: `export class UserService {\n  async getUser(id: string) {\n    // AI Agent working on this...\n    return fetch(\`/api/users/\${id}\`);\n  }\n\n  async updateUser(id: string, data: any) {\n    return fetch(\`/api/users/\${id}\`, {\n      method: 'PUT',\n      body: JSON.stringify(data)\n    });\n  }\n}`
    },
    { 
      id: 3, 
      name: 'styles.css', 
      path: '/src/styles/styles.css',
      isLocked: false,
      content: `.homepage {\n  padding: 2rem;\n  text-align: center;\n}\n\n.homepage h1 {\n  color: #2563eb;\n  font-size: 3rem;\n  margin-bottom: 1rem;\n}\n\n.homepage p {\n  color: #64748b;\n  font-size: 1.2rem;\n}`
    }
  ];



  // WebSocket connection for live updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('Connected to live editing WebSocket');
      toast({
        title: "🔴 Live Stream Connected",
        description: "Ready to stream agent responses in real-time"
      });
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'liveUpdate') {
          let update = null;
          // Parse content if it's a JSON string
          if (typeof data.content === 'string') {
            try {
              update = JSON.parse(data.content);
            } catch (e) {
              console.error('Error parsing WebSocket message:', e);
              return;
            }
          } else if (data.data) {
            update = data.data;
          }
          console.log('Live update received:', update);
          
          // Only proceed if we have valid update data
          if (!update || !update.sessionId) {
            console.log('Invalid update data, skipping...');
            return;
          }
          
          // Add live session if not exists
          setLiveSessions(prev => {
            const exists = prev.find(s => s.id === update.sessionId);
            if (!exists) {
              const newSession = {
                id: update.sessionId,
                agentName: update.agentName,
                fileName: update.fileName,
                isActive: true,
                startedAt: new Date().toLocaleTimeString()
              };
              console.log('Adding new live session:', newSession);
              return [...prev, newSession];
            }
            return prev;
          });
          
          // Add live update with current timestamp
          const newUpdate = {
            sessionId: update.sessionId,
            fileName: update.fileName,
            content: update.content,
            agentName: update.agentName,
            timestamp: new Date().toLocaleTimeString(),
            updateType: update.updateType,
            message: update.message
          };
          console.log('Adding live update:', newUpdate);
          
          setLiveUpdates(prev => {
            const updated = [...prev, newUpdate];
            console.log('Total live updates:', updated.length);
            return updated;
          });
          
          // Auto-scroll to bottom
          setTimeout(() => {
            updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        // Legacy support for existing message types
        else if (data.type === 'session_start') {
          setLiveSessions(prev => [...prev, {
            id: data.data.sessionId,
            agentName: data.data.agentId === 3 ? 'Maya Rodriguez' : data.data.agentId === 2 ? 'Sam Park' : 'AI Agent',
            fileName: data.data.fileName,
            isActive: true,
            startedAt: new Date().toLocaleTimeString()
          }]);
        } else if (data.type === 'session_end') {
          setLiveSessions(prev => 
            prev.map(s => s.id === data.data.sessionId ? { ...s, isActive: false } : s)
          );
        } else if (data.type === 'code_update') {
          setLiveUpdates(prev => [...prev, {
            sessionId: data.data.sessionId,
            fileName: data.data.fileName,
            content: data.data.content,
            agentName: data.data.agentName,
            timestamp: new Date().toLocaleTimeString(),
            updateType: data.data.updateType,
            message: data.data.message
          }]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('Disconnected from live editing WebSocket');
      toast({
        title: "❌ Live Stream Disconnected",
        description: "Attempting to reconnect..."
      });
    };
    
    return () => {
      wsRef.current?.close();
    };
  }, []);
  
  // Auto-scroll to latest updates
  useEffect(() => {
    updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveUpdates]);

  // Start gym buddy transformation demo
  const startRealTransformation = async () => {
    setIsStreamingActive(true);
    setLiveUpdates([]); // Clear previous updates
    setLiveSessions([]); // Clear previous sessions
    
    try {
      const response = await fetch('/api/live-editing/start-agent-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 1, // Test Project (Gym Buddy)
          conversationId: 6 // Project Manager conversation
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Agents Working Live",
          description: `${result.agentsWorking} agents are now modifying files - watch the stream!`
        });
        console.log('Agent work started:', result);
      } else {
        throw new Error('Failed to start transformation');
      }
    } catch (error) {
      console.error('Error starting real transformation:', error);
      toast({
        title: "Error",
        description: "Failed to start real agent transformation",
        variant: "destructive"
      });
      setIsStreamingActive(false);
    }
  };

  // WebSocket connection for live updates

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    setFileContent(file.content);
  };

  const handleLockFile = async () => {
    if (!selectedFile) return;
    
    setIsLocking(true);
    try {
      // Simulate API call to lock file
      const response = await fetch(`/api/files/${selectedFile.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 1 }) // Current user as agent
      });

      if (response.ok) {
        setSelectedFile({ ...selectedFile, isLocked: true, lockedBy: 'You' });
        toast({
          title: "File Locked",
          description: `${selectedFile.name} is now locked for editing`,
        });
      }
    } catch (error) {
      toast({
        title: "Lock Failed",
        description: "Could not lock file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockFile = async () => {
    if (!selectedFile) return;
    
    setIsLocking(true);
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 1 })
      });

      if (response.ok) {
        setSelectedFile({ ...selectedFile, isLocked: false, lockedBy: undefined });
        toast({
          title: "File Unlocked",
          description: `${selectedFile.name} is now available for editing`,
        });
      }
    } catch (error) {
      toast({
        title: "Unlock Failed",
        description: "Could not unlock file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLocking(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!selectedFile) return;
    
    setIsCreatingCheckpoint(true);
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 1,
          filePath: selectedFile.path,
          content: fileContent,
          message: `Checkpoint for ${selectedFile.name}`,
          agentId: 1
        })
      });

      if (response.ok) {
        const newCheckpoint = {
          id: checkpoints.length + 1,
          message: `Checkpoint for ${selectedFile.name}`,
          createdAt: new Date().toISOString(),
          createdBy: 'You'
        };
        refetchCheckpoints();
        toast({
          title: "Checkpoint Created",
          description: "File state saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Checkpoint Failed",
        description: "Could not create checkpoint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCheckpoint(false);
    }
  };

  const handleRestoreCheckpoint = async (checkpointId: number) => {
    try {
      const response = await fetch(`/api/checkpoints/${checkpointId}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "Checkpoint Restored",
          description: "File reverted to previous state",
        });
        // Reload file content
        if (selectedFile) {
          setFileContent(selectedFile.content);
        }
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Could not restore checkpoint. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Advanced Collaboration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            File locking, checkpoints, and live editing for seamless team collaboration
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {liveSessions.filter(s => s.isActive).length} Active Sessions
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Explorer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Files
            </CardTitle>
            <CardDescription>Select a file to collaborate on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockFiles.map((file) => (
              <div
                key={file.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFile?.id === file.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{file.name}</span>
                  {file.isLocked && (
                    <Lock className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{file.path}</p>
                {file.isLocked && file.lockedBy && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Locked by {file.lockedBy}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* File Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedFile ? selectedFile.name : 'Select a file'}
                {selectedFile?.isLocked && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              {selectedFile && (
                <div className="flex gap-2">
                  {selectedFile.isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnlockFile}
                      disabled={isLocking || selectedFile.lockedBy !== 'You'}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLockFile}
                      disabled={isLocking}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Lock
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCheckpoint}
                    disabled={isCreatingCheckpoint || !selectedFile}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Checkpoint
                  </Button>
                </div>
              )}
            </div>
            {selectedFile && (
              <CardDescription>
                {selectedFile.isLocked 
                  ? `🔒 Locked by ${selectedFile.lockedBy}`
                  : '🔓 Available for editing'
                }
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                disabled={selectedFile.isLocked && selectedFile.lockedBy !== 'You'}
                className="w-full h-96 p-4 font-mono text-sm border rounded-lg resize-none"
                placeholder="File content will appear here..."
              />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select a file from the explorer to start editing
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Features */}
      <Tabs defaultValue="checkpoints" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
            <TabsTrigger value="streaming">Live Stream</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button 
              onClick={startRealTransformation}
              disabled={isStreamingActive}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStreamingActive ? 'Agents Working...' : 'Start Real AI Transformation'}
            </Button>
            
            <Button 
              onClick={() => {
                const chatMessage = prompt("Send message to working agents:");
                if (chatMessage) {
                  toast({
                    title: "💬 Message Sent",
                    description: `"${chatMessage}" - Agents will respond during next task`
                  });
                }
              }}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Chat with Agents
            </Button>
          </div>
        </div>
        
        <TabsContent value="checkpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                File Checkpoints
              </CardTitle>
              <CardDescription>
                Restore your files to previous states when agents break code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{checkpoint.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {checkpoint.createdAt} by {checkpoint.createdBy}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreCheckpoint(checkpoint.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Editing Sessions
              </CardTitle>
              <CardDescription>
                See which agents are currently working on files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">{session.agentName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Editing {session.fileName}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Started {session.startedAt}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaming" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Streaming Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Live Agent Streaming
                  <Badge variant={isStreamingActive ? "default" : "secondary"} className="ml-2">
                    {isStreamingActive ? 'LIVE' : 'OFFLINE'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Watch agents transform your gym buddy project in real-time with live code updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-slate-950">
                  {liveUpdates.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No live streams active. Click "Start Real AI Transformation" to watch agents work!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {liveUpdates.map((update, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-slate-900/50 rounded-r-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="font-bold text-blue-400 text-sm">
                                {update.agentName}
                              </span>
                              {update.fileName && update.fileName !== 'transformation_complete' && (
                                <span className="text-xs text-slate-400">→ {update.fileName}</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {update.timestamp}
                            </span>
                          </div>
                          
                          {update.action && (
                            <p className="text-xs text-slate-300 mb-2 italic">
                              {update.action}
                            </p>
                          )}
                          
                          {update.updateType === 'thinking' ? (
                            <div className="flex items-center gap-2 text-yellow-400">
                              <Activity className="w-3 h-3 animate-spin" />
                              <span className="text-xs">Thinking...</span>
                            </div>
                          ) : update.content && update.fileName !== 'transformation_complete' && (
                            <div className="bg-slate-900 rounded p-3 mt-2 border border-blue-500/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-blue-400 font-semibold">{update.fileName}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-green-400">LIVE</span>
                                </div>
                              </div>
                              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap overflow-auto max-h-32 leading-relaxed border-l-2 border-green-500/50 pl-3">
                                {update.content}
                              </pre>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <span>👤 {update.agentName}</span>
                                <span>•</span>
                                <span>{new Date(update.timestamp).toLocaleTimeString()}</span>
                                {update.lineCount && (
                                  <>
                                    <span>•</span>
                                    <span>{update.lineCount} lines modified</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={update.updateType === 'complete' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {update.updateType === 'code_change' ? 'CODE_UPDATED' : update.updateType.toUpperCase()}
                            </Badge>
                            {update.lineCount && (
                              <span className="text-xs text-slate-500">
                                {update.lineCount} lines
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={updatesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Live Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Live Preview
                  <Badge variant={liveUpdates.length > 0 ? "default" : "secondary"} className="ml-2">
                    {liveUpdates.length > 0 ? 'UPDATING' : 'STATIC'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  See the transformed gym buddy app as agents modify it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full border rounded-lg overflow-hidden bg-white">
                  {liveUpdates.length === 0 ? (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center text-gray-500">
                        <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Preview will appear when agents start working</p>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src="/gym-buddy-preview"
                      className="w-full h-full border-0"
                      title="Gym Buddy Live Preview"
                      key={liveUpdates.length} // Force refresh when updates change
                    />
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/gym-buddy-preview', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const iframe = document.querySelector('iframe[title="Gym Buddy Live Preview"]') as HTMLIFrameElement;
                      if (iframe) iframe.src = iframe.src; // Force refresh
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Collaboration Activity
              </CardTitle>
              <CardDescription>
                Recent collaboration events and agent actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLog.map((activity) => {
                  const getIcon = (iconType: string) => {
                    switch (iconType) {
                      case 'lock': return <Lock className="h-5 w-5 text-red-500" />;
                      case 'unlock': return <Unlock className="h-5 w-5 text-green-500" />;
                      case 'save': return <Save className="h-5 w-5 text-blue-500" />;
                      case 'code': return <Code className="h-5 w-5 text-purple-500" />;
                      case 'users': return <Users className="h-5 w-5 text-cyan-500" />;
                      default: return <Activity className="h-5 w-5 text-gray-500" />;
                    }
                  };

                  const getStatusColor = (status: string) => {
                    return status === 'active' ? 'default' : 'outline';
                  };

                  return (
                    <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getIcon(activity.icon)}
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <Badge variant={getStatusColor(activity.status)} className="text-xs">
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
                {activityLog.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent collaboration activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}