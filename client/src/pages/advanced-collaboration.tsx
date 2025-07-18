import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Unlock, Save, RotateCcw, Eye, AlertCircle, CheckCircle, Users, FileText, Activity, Play, Code, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
}

interface LiveSession {
  id: string;
  agentName: string;
  fileName: string;
  isActive: boolean;
  startedAt: string;
}

interface LiveUpdate {
  sessionId: string;
  fileName: string;
  content: string;
  agentName: string;
  timestamp: string;
  updateType: 'partial' | 'complete' | 'thinking' | 'error';
  message?: string;
}

export default function AdvancedCollaboration() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);

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

  // Mock checkpoint data
  const mockCheckpoints: Checkpoint[] = [
    { id: 1, message: 'Initial homepage component', createdAt: '2025-01-18 14:30', createdBy: 'Maya Designer' },
    { id: 2, message: 'Added responsive layout', createdAt: '2025-01-18 15:15', createdBy: 'Jordan CSS' },
    { id: 3, message: 'Enhanced accessibility', createdAt: '2025-01-18 16:00', createdBy: 'Alex Senior' }
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

  // Mock live sessions
  const mockLiveSessions: LiveSession[] = [
    { id: 'session_1', agentName: 'Sam AI', fileName: 'UserService.ts', isActive: true, startedAt: '2025-01-18 16:30' },
    { id: 'session_2', agentName: 'Taylor QA', fileName: 'test-utils.js', isActive: true, startedAt: '2025-01-18 16:25' }
  ];

  useEffect(() => {
    setCheckpoints(mockCheckpoints);
    setLiveSessions(mockLiveSessions);
  }, []);

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
        setCheckpoints([...checkpoints, newCheckpoint]);
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
              onClick={async () => {
                try {
                  const response = await fetch('/api/live-editing/test-broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  console.log('Test broadcast result:', result);
                  toast({
                    title: result.success ? "✅ Test Sent" : "❌ Test Failed",
                    description: result.message || result.error
                  });
                } catch (error) {
                  console.error('Test error:', error);
                  toast({
                    title: "❌ Test Error",
                    description: "Failed to send test broadcast"
                  });
                }
              }}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Activity className="w-4 h-4 mr-2" />
              Test WebSocket
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
              <ScrollArea className="h-96 w-full border rounded-lg p-4">
                {liveUpdates.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No live streams active. Click "Start Gym Buddy Demo" to watch agents work!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveUpdates.map((update, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {update.agentName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {update.timestamp}
                          </span>
                        </div>
                        
                        {update.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {update.message}
                          </p>
                        )}
                        
                        {update.updateType === 'thinking' ? (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Activity className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : update.content && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mt-2">
                            <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32">
                              {update.content}
                            </pre>
                          </div>
                        )}
                        
                        <Badge 
                          variant={update.updateType === 'complete' ? 'default' : 'secondary'}
                          className="mt-2 text-xs"
                        >
                          {update.updateType}
                        </Badge>
                      </div>
                    ))}
                    <div ref={updatesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
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
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">File lock acquired</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sam AI locked UserService.ts for editing
                    </p>
                  </div>
                  <Badge variant="outline">2 min ago</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Save className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Checkpoint created</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Maya Designer saved checkpoint for HomePage.jsx
                    </p>
                  </div>
                  <Badge variant="outline">5 min ago</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <RotateCcw className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">File restored</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Alex Senior reverted styles.css to previous checkpoint
                    </p>
                  </div>
                  <Badge variant="outline">8 min ago</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}