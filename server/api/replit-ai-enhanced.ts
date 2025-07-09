import express from 'express';
import { replitAIEnhanced } from '../services/replit-ai-enhanced';
import { storage } from '../storage';

const router = express.Router();

// Create app from natural language description (Agent)
router.post('/agent/create-app', async (req, res) => {
  try {
    const { description, userId = 1, enhancement = 'ai' } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: 'App description is required' });
    }

    console.log('[Replit AI Agent] Creating app from description:', description);
    
    const result = await replitAIEnhanced.createAppFromDescription(description, userId);
    
    res.json({
      success: true,
      project: result.project,
      checkpoint: result.checkpoint,
      effort: result.effort,
      cost: result.cost,
      message: 'App created successfully! Check the project workspace to see your new application.'
    });
  } catch (error) {
    console.error('Error creating app with Agent:', error);
    res.status(500).json({ 
      message: 'Failed to create app', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Assistant endpoints
router.post('/assistant/explain', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: 'explain',
      mode: 'basic' // Free explanation
    });

    res.json({
      success: true,
      explanation: result.result.explanation,
      concepts: result.result.concepts,
      cost: 0 // Basic mode is free
    });
  } catch (error) {
    console.error('Error explaining code:', error);
    res.status(500).json({ message: 'Failed to explain code' });
  }
});

router.post('/assistant/fix', async (req, res) => {
  try {
    const { code, language, mode = 'basic' } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: 'fix',
      mode
    });

    res.json({
      success: true,
      result: result.result,
      mode,
      cost: result.cost
    });
  } catch (error) {
    console.error('Error fixing code:', error);
    res.status(500).json({ message: 'Failed to fix code' });
  }
});

router.post('/assistant/add-feature', async (req, res) => {
  try {
    const { code, language, featureDescription, mode = 'basic' } = req.body;
    
    if (!code || !language || !featureDescription) {
      return res.status(400).json({ message: 'Code, language, and feature description are required' });
    }

    const result = await replitAIEnhanced.assistWithCode({
      code,
      language,
      action: 'add-feature',
      mode,
      context: { featureDescription }
    });

    res.json({
      success: true,
      result: result.result,
      mode,
      cost: result.cost
    });
  } catch (error) {
    console.error('Error adding feature:', error);
    res.status(500).json({ message: 'Failed to add feature' });
  }
});

// Usage statistics
router.get('/usage-stats/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await replitAIEnhanced.getUsageStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ message: 'Failed to get usage statistics' });
  }
});

// Get AI capabilities
router.get('/capabilities', async (req, res) => {
  res.json({
    agent: {
      features: [
        'Natural language to complete app',
        'Complex feature building',
        'Effort-based pricing',
        'Dynamic intelligence (Extended thinking & High power)',
        'Automatic checkpoints for rollback'
      ],
      pricing: {
        simple: '$0.10 - $0.20',
        moderate: '$0.30 - $0.70',
        complex: '$1.00 - $4.00'
      }
    },
    assistant: {
      basic: {
        features: ['Code explanation', 'Bug identification', 'Feature suggestions'],
        cost: 'Free'
      },
      advanced: {
        features: ['Automatic bug fixes', 'Feature implementation', 'Code refactoring'],
        cost: '$0.05 per edit'
      }
    }
  });
});

export default router;