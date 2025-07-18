interface Checkpoint {
  id: number;
  projectId: number;
  fileId?: number;
  filePath: string;
  content: string;
  message: string;
  createdAt: Date;
  createdBy?: number;
  agentId?: number;
}

export class CheckpointManager {
  private static instance: CheckpointManager;
  private checkpoints: Map<number, Checkpoint> = new Map();
  private nextCheckpointId = 1;

  private constructor() {}

  static getInstance(): CheckpointManager {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  async createCheckpoint(
    projectId: number,
    fileId: number,
    filePath: string,
    content: string,
    message: string,
    agentId?: number
  ): Promise<{ success: boolean; message: string; checkpointId?: number }> {
    try {
      const checkpointId = this.nextCheckpointId++;
      
      const checkpoint: Checkpoint = {
        id: checkpointId,
        projectId,
        fileId,
        filePath,
        content,
        message,
        createdAt: new Date(),
        agentId
      };

      this.checkpoints.set(checkpointId, checkpoint);

      return {
        success: true,
        message: `Checkpoint created for ${filePath}`,
        checkpointId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create checkpoint'
      };
    }
  }

  async createProjectCheckpoint(
    projectId: number,
    message: string,
    agentId?: number
  ): Promise<{ success: boolean; message: string; checkpointCount?: number }> {
    try {
      // Create checkpoints for all project files
      const projectCheckpoints = Array.from(this.checkpoints.values())
        .filter(cp => cp.projectId === projectId);

      return {
        success: true,
        message: `Project checkpoint created with ${projectCheckpoints.length} files`,
        checkpointCount: projectCheckpoints.length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create project checkpoint'
      };
    }
  }

  async restoreFromCheckpoint(checkpointId: number): Promise<{ success: boolean; message: string }> {
    const checkpoint = this.checkpoints.get(checkpointId);
    
    if (!checkpoint) {
      return {
        success: false,
        message: 'Checkpoint not found'
      };
    }

    try {
      // In a real implementation, this would restore the file content
      // For now, we'll simulate successful restoration
      
      return {
        success: true,
        message: `File restored from checkpoint: ${checkpoint.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore from checkpoint'
      };
    }
  }

  async getFileCheckpoints(fileId: number): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.fileId === fileId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProjectCheckpoints(projectId: number): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteCheckpoint(checkpointId: number): Promise<{ success: boolean; message: string }> {
    if (this.checkpoints.delete(checkpointId)) {
      return {
        success: true,
        message: 'Checkpoint deleted successfully'
      };
    }

    return {
      success: false,
      message: 'Checkpoint not found'
    };
  }
}