interface FileLock {
  fileId: number;
  agentId: number;
  lockedAt: Date;
  agentName?: string;
}

export class FileLockingService {
  private static instance: FileLockingService;
  private locks: Map<number, FileLock> = new Map();

  private constructor() {}

  static getInstance(): FileLockingService {
    if (!FileLockingService.instance) {
      FileLockingService.instance = new FileLockingService();
    }
    return FileLockingService.instance;
  }

  async lockFile(fileId: number, agentId: number): Promise<{ success: boolean; message: string }> {
    if (this.locks.has(fileId)) {
      const existingLock = this.locks.get(fileId);
      return {
        success: false,
        message: `File is already locked by agent ${existingLock?.agentId}`
      };
    }

    this.locks.set(fileId, {
      fileId,
      agentId,
      lockedAt: new Date()
    });

    return {
      success: true,
      message: `File ${fileId} locked successfully by agent ${agentId}`
    };
  }

  async unlockFile(fileId: number, agentId: number): Promise<{ success: boolean; message: string }> {
    const lock = this.locks.get(fileId);
    
    if (!lock) {
      return {
        success: false,
        message: 'File is not locked'
      };
    }

    if (lock.agentId !== agentId) {
      return {
        success: false,
        message: 'File is locked by another agent'
      };
    }

    this.locks.delete(fileId);
    
    return {
      success: true,
      message: `File ${fileId} unlocked successfully`
    };
  }

  async getLockedFiles(projectId: number): Promise<FileLock[]> {
    return Array.from(this.locks.values());
  }

  isFileLocked(fileId: number): boolean {
    return this.locks.has(fileId);
  }

  getFileLock(fileId: number): FileLock | undefined {
    return this.locks.get(fileId);
  }
}