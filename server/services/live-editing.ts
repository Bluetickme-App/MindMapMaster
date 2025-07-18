interface LiveEditingSession {
  id: string;
  projectId: number;
  fileId: number;
  agentId: number;
  agentName?: string;
  startedAt: Date;
  isActive: boolean;
  lastActivity: Date;
}

interface EditingUpdate {
  sessionId: string;
  fileId: number;
  content: string;
  agentId: number;
  changeType: 'edit' | 'insert' | 'delete' | 'replace';
  lineNumbers?: number[];
  timestamp: Date;
}

export class LiveEditingService {
  private static instance: LiveEditingService;
  private sessions: Map<string, LiveEditingSession> = new Map();
  private updates: Map<string, EditingUpdate[]> = new Map();

  private constructor() {}

  static getInstance(): LiveEditingService {
    if (!LiveEditingService.instance) {
      LiveEditingService.instance = new LiveEditingService();
    }
    return LiveEditingService.instance;
  }

  async startEditingSession(
    projectId: number,
    fileId: number,
    agentId: number
  ): Promise<{ success: boolean; message: string; sessionId?: string }> {
    try {
      const sessionId = `session_${Date.now()}_${agentId}`;
      
      const session: LiveEditingSession = {
        id: sessionId,
        projectId,
        fileId,
        agentId,
        startedAt: new Date(),
        isActive: true,
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, session);
      this.updates.set(sessionId, []);

      return {
        success: true,
        message: `Live editing session started for file ${fileId}`,
        sessionId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start live editing session'
      };
    }
  }

  async endEditingSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return {
        success: false,
        message: 'Session not found'
      };
    }

    session.isActive = false;
    session.lastActivity = new Date();

    return {
      success: true,
      message: 'Live editing session ended'
    };
  }

  async broadcastFileUpdate(
    sessionId: string,
    fileId: number,
    content: string,
    agentId: number,
    changeType: 'edit' | 'insert' | 'delete' | 'replace',
    lineNumbers?: number[]
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      throw new Error('Invalid or inactive session');
    }

    const update: EditingUpdate = {
      sessionId,
      fileId,
      content,
      agentId,
      changeType,
      lineNumbers,
      timestamp: new Date()
    };

    const sessionUpdates = this.updates.get(sessionId) || [];
    sessionUpdates.push(update);
    this.updates.set(sessionId, sessionUpdates);

    // Update session activity
    session.lastActivity = new Date();

    // In a real implementation, this would broadcast via WebSocket
    console.log(`Broadcasting file update for session ${sessionId}: ${changeType} by agent ${agentId}`);
  }

  async getActiveEditingSessions(projectId: number): Promise<LiveEditingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.projectId === projectId && session.isActive)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getSessionUpdates(sessionId: string): Promise<EditingUpdate[]> {
    return this.updates.get(sessionId) || [];
  }

  async getFileActiveSessions(fileId: number): Promise<LiveEditingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.fileId === fileId && session.isActive);
  }

  isFileBeingEdited(fileId: number): boolean {
    return Array.from(this.sessions.values())
      .some(session => session.fileId === fileId && session.isActive);
  }

  getSessionById(sessionId: string): LiveEditingSession | undefined {
    return this.sessions.get(sessionId);
  }
}