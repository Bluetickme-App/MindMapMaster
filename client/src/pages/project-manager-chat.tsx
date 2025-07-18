import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MessageSquare, Users, CheckCircle } from "lucide-react";

interface ProjectPlan {
  projectId: number;
  objective: string;
  phases: Array<{
    name: string;
    tasks: Array<{
      agentId: number;
      taskDescription: string;
      priority: 'high' | 'medium' | 'low';
      estimatedTime: string;
      dependencies: number[];
    }>;
    timeline: string;
  }>;
  teamComposition: number[];
}

export default function ProjectManagerChat() {
  const [taskDescription, setTaskDescription] = useState("Transform the current basic Gym Buddy Finder into a proper modern website with images, interactive functionality, user profiles, responsive design, and a complete user experience. The current version is just basic HTML - we need a full-featured web application with image uploads, user matching algorithms, interactive maps, chat functionality, and modern UI components.");
  const [requiredSkills, setRequiredSkills] = useState("Frontend Development, UI/UX Design, Backend API Development, Image Processing, Database Design, React Components");
  const [isLoading, setIsLoading] = useState(false);
  const [coordinationResult, setCoordinationResult] = useState<{
    conversationId: number;
    plan: ProjectPlan;
    message: string;
  } | null>(null);

  const handleCoordination = async () => {
    if (!taskDescription.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/project-manager/coordinate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 1,
          taskDescription: taskDescription.trim(),
          requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (!response.ok) throw new Error('Failed to coordinate task');

      const result = await response.json();
      setCoordinationResult(result);
      
      // Clear form
      setTaskDescription("");
      setRequiredSkills("");
    } catch (error) {
      console.error('Coordination error:', error);
      alert('Failed to coordinate task with Project Manager');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-6 h-6 text-blue-400" />
              Project Manager - Morgan Davis
            </CardTitle>
            <CardDescription className="text-gray-400">
              Communicate with your Project Manager who will coordinate tasks with the relevant team members
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Task Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Delegate Task to Team</CardTitle>
            <CardDescription className="text-gray-400">
              Describe what you need done, and the Project Manager will assign appropriate specialists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Task Description</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Example: I want to add user authentication to the website with login/signup forms..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Required Skills (optional)</label>
              <Input
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="javascript, react, backend, database (comma-separated)"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <Button 
              onClick={handleCoordination}
              disabled={!taskDescription.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <MessageSquare className="w-4 h-4 mr-2 animate-spin" />
                  Coordinating with Project Manager...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Delegate to Project Manager
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Coordination Result */}
        {coordinationResult && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Task Coordinated Successfully
              </CardTitle>
              <CardDescription className="text-gray-400">
                {coordinationResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Plan */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Project Plan</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-4">
                    <strong>Objective:</strong> {coordinationResult.plan.objective}
                  </p>
                  
                  {coordinationResult.plan.phases.map((phase, phaseIndex) => (
                    <div key={phaseIndex} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-medium text-white">{phase.name}</h4>
                        <Badge variant="outline" className="text-gray-300 border-gray-500">
                          {phase.timeline}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {phase.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="bg-gray-600 p-3 rounded border-l-4 border-blue-500">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-gray-200 text-sm">{task.taskDescription}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)} text-white`}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-400">Agent {task.agentId}</span>
                                  <span className="text-xs text-gray-400">{task.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Composition */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Assigned Team</h3>
                <div className="flex flex-wrap gap-2">
                  {coordinationResult.plan.teamComposition.map((agentId) => (
                    <Badge key={agentId} variant="secondary" className="bg-blue-600 text-white">
                      Agent {agentId}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Next Steps:</strong> The Project Manager has delegated tasks to the appropriate team members. 
                  They will begin working on your request and coordinate amongst themselves to deliver the solution.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}