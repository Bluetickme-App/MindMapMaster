import { Router } from 'express';
import { LiveEditingService } from './services/live-editing-service';

export function createLiveEditingRoutes(liveEditingService: LiveEditingService) {
  const router = Router();

  // Start gym buddy transformation demo
  router.post('/start-gym-buddy-demo', async (req, res) => {
    try {
      await liveEditingService.simulateGymBuddyTransformation();
      res.json({ 
        success: true, 
        message: 'Gym buddy transformation demo started' 
      });
    } catch (error) {
      console.error('Error starting gym buddy demo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to start transformation demo' 
      });
    }
  });

  // Get active live editing sessions
  router.get('/sessions', async (req, res) => {
    try {
      const sessions = liveEditingService.getActiveSessions();
      res.json({ sessions });
    } catch (error) {
      console.error('Error getting live sessions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get live sessions' 
      });
    }
  });

  // Start a new live editing session
  router.post('/sessions/start', async (req, res) => {
    try {
      const { agentId, fileName, projectId } = req.body;
      
      if (!agentId || !fileName || !projectId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters: agentId, fileName, projectId' 
        });
      }

      const sessionId = await liveEditingService.startSession(agentId, fileName, projectId);
      res.json({ 
        success: true, 
        sessionId,
        message: 'Live editing session started' 
      });
    } catch (error) {
      console.error('Error starting live session:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to start live editing session' 
      });
    }
  });

  // End a live editing session
  router.post('/sessions/:sessionId/end', async (req, res) => {
    try {
      const { sessionId } = req.params;
      await liveEditingService.endSession(sessionId);
      res.json({ 
        success: true, 
        message: 'Live editing session ended' 
      });
    } catch (error) {
      console.error('Error ending live session:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to end live editing session' 
      });
    }
  });

  return router;
}