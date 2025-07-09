import { Router } from 'express';
import { replitAgentSystem } from '../services/replit-agent-system';
import { agentOrchestrationService } from '../services/agent-orchestration';
import { storage } from '../storage';

export const replitAgentRouter = Router();

// Create implementation plan (free planning stage)
replitAgentRouter.post('/plan', async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    
    // Get project context
    const project = projectId ? await storage.getProject(projectId) : null;
    
    const context = {
      conversation: {} as any,
      recentMessages: [],
      projectContext: project,
      userPreferences: {}
    };
    
    const plan = await replitAgentSystem.createPlan(prompt, context);
    
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Approve and execute plan
replitAgentRouter.post('/execute', async (req, res) => {
  try {
    const { planId, approved } = req.body;
    const userId = req.user?.id || 1;
    
    if (!approved) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plan must be approved before execution' 
      });
    }
    
    // Approve plan
    replitAgentSystem.approvePlan(planId);
    
    // Execute plan asynchronously
    replitAgentSystem.executePlan(planId, userId)
      .then(() => {
        console.log(`Plan ${planId} executed successfully`);
      })
      .catch(error => {
        console.error(`Plan ${planId} execution failed:`, error);
      });
    
    res.json({ success: true, message: 'Plan execution started' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get progress updates
replitAgentRouter.get('/progress', async (req, res) => {
  try {
    const currentPlan = replitAgentSystem.getCurrentPlan();
    const checkpoints = replitAgentSystem.getCheckpoints();
    
    res.json({ 
      success: true, 
      currentPlan,
      checkpoints,
      totalCheckpoints: checkpoints.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rollback to checkpoint
replitAgentRouter.post('/rollback', async (req, res) => {
  try {
    const { checkpointId } = req.body;
    
    await replitAgentSystem.rollbackToCheckpoint(checkpointId);
    
    res.json({ 
      success: true, 
      message: 'Successfully rolled back to checkpoint' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get checkpoints
replitAgentRouter.get('/checkpoints', async (req, res) => {
  try {
    const checkpoints = replitAgentSystem.getCheckpoints();
    
    res.json({ 
      success: true, 
      checkpoints 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test optimal model routing
replitAgentRouter.post('/test-routing', async (req, res) => {
  try {
    const { taskType, description } = req.body;
    
    // Get agents for testing
    const agents = await storage.getAllAgents();
    
    const testResults = [];
    
    for (const agent of agents) {
      const startTime = Date.now();
      
      try {
        const context = {
          conversation: {} as any,
          recentMessages: [],
          projectContext: { name: 'Test Project' },
          userPreferences: {}
        };
        
        const response = await agentOrchestrationService.generateAgentResponse(
          agent.id,
          description,
          context
        );
        
        const endTime = Date.now();
        
        testResults.push({
          agent: agent.name,
          type: agent.type,
          provider: agent.provider,
          responseTime: endTime - startTime,
          success: true,
          confidence: response.confidence,
          contentLength: response.content.length
        });
      } catch (error) {
        testResults.push({
          agent: agent.name,
          type: agent.type,
          provider: agent.provider,
          success: false,
          error: error.message
        });
      }
    }
    
    // Sort by performance
    testResults.sort((a, b) => {
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;
      if (a.success && b.success) {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      return 0;
    });
    
    res.json({ 
      success: true, 
      taskType,
      description,
      results: testResults,
      recommendation: testResults[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get model performance stats
replitAgentRouter.get('/model-stats', async (req, res) => {
  try {
    const agents = await storage.getAllAgents();
    
    const stats = {
      openai: {
        count: agents.filter(a => a.provider === 'openai').length,
        specializations: agents.filter(a => a.provider === 'openai').map(a => a.type),
        strengths: ['API Development', 'TypeScript', 'System Architecture', 'Backend Development']
      },
      claude: {
        count: agents.filter(a => a.provider === 'claude').length,
        specializations: agents.filter(a => a.provider === 'claude').map(a => a.type),
        strengths: ['UI/UX Design', 'CSS Mastery', 'Component Architecture', 'Code Review']
      },
      gemini: {
        count: agents.filter(a => a.provider === 'gemini').length,
        specializations: agents.filter(a => a.provider === 'gemini').map(a => a.type),
        strengths: ['DevOps', 'Build Optimization', 'Performance', 'Data Processing']
      }
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default replitAgentRouter;