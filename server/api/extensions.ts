import { Request, Response } from 'express';
import { extensionManager } from '../services/extension-manager';

// Get all extensions
export async function getExtensions(req: Request, res: Response) {
  try {
    const { category, search, installed, enabled } = req.query;
    
    let extensions = extensionManager.getAllExtensions();
    
    // Filter by category
    if (category && typeof category === 'string') {
      extensions = extensions.filter(ext => ext.category === category);
    }
    
    // Filter by search query
    if (search && typeof search === 'string') {
      extensions = extensionManager.searchExtensions(search);
    }
    
    // Filter by installed status
    if (installed === 'true') {
      extensions = extensions.filter(ext => ext.installed);
    } else if (installed === 'false') {
      extensions = extensions.filter(ext => !ext.installed);
    }
    
    // Filter by enabled status
    if (enabled === 'true') {
      extensions = extensions.filter(ext => ext.enabled);
    } else if (enabled === 'false') {
      extensions = extensions.filter(ext => !ext.enabled);
    }
    
    res.json({
      success: true,
      data: extensions,
      total: extensions.length
    });
  } catch (error) {
    console.error('Error getting extensions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get extensions'
    });
  }
}

// Get extension by ID
export async function getExtensionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const extension = extensionManager.getExtension(id);
    
    if (!extension) {
      return res.status(404).json({
        success: false,
        error: 'Extension not found'
      });
    }
    
    res.json({
      success: true,
      data: extension
    });
  } catch (error) {
    console.error('Error getting extension:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get extension'
    });
  }
}

// Install extension
export async function installExtension(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await extensionManager.installExtension(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error installing extension:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to install extension'
    });
  }
}

// Uninstall extension
export async function uninstallExtension(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await extensionManager.uninstallExtension(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error uninstalling extension:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to uninstall extension'
    });
  }
}

// Toggle extension (enable/disable)
export async function toggleExtension(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await extensionManager.toggleExtension(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        enabled: result.enabled
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error toggling extension:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle extension'
    });
  }
}

// Get all available tools
export async function getAvailableTools(req: Request, res: Response) {
  try {
    const tools = extensionManager.getAllAvailableTools();
    
    res.json({
      success: true,
      data: tools,
      total: tools.length
    });
  } catch (error) {
    console.error('Error getting available tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available tools'
    });
  }
}

// Execute tool
export async function executeTool(req: Request, res: Response) {
  try {
    const { toolName } = req.params;
    const { parameters } = req.body;
    
    const result = await extensionManager.executeTool(toolName, parameters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing tool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute tool'
    });
  }
}

// Get extension categories
export async function getExtensionCategories(req: Request, res: Response) {
  try {
    const categories = extensionManager.getAllCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
}

// Get extension statistics
export async function getExtensionStats(req: Request, res: Response) {
  try {
    const stats = extensionManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting extension stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get extension stats'
    });
  }
}

// Add repository
export async function addRepository(req: Request, res: Response) {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name and URL are required'
      });
    }
    
    const result = await extensionManager.addRepository(name, url);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error adding repository:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add repository'
    });
  }
}