import { WebSocketServer, WebSocket } from 'ws';
import { storage } from '../storage';

export interface LiveEditingSession {
  sessionId: string;
  agentId: number;
  fileName: string;
  projectId: number;
  startTime: Date;
  isActive: boolean;
}

export interface LiveCodeUpdate {
  sessionId: string;
  fileName: string;
  content: string;
  agentName: string;
  timestamp: Date;
  updateType: 'partial' | 'complete' | 'thinking' | 'error';
  message?: string;
}

export class LiveEditingService {
  private sessions = new Map<string, LiveEditingSession>();
  private connections = new Set<WebSocket>();
  
  constructor(private webSocketManager: any) {}

  // Start a live editing session for an agent
  async startSession(agentId: number, fileName: string, projectId: number): Promise<string> {
    const sessionId = `session_${Date.now()}_${agentId}`;
    
    const session: LiveEditingSession = {
      sessionId,
      agentId,
      fileName,
      projectId,
      startTime: new Date(),
      isActive: true
    };
    
    this.sessions.set(sessionId, session);
    
    // Broadcast session start
    this.broadcastUpdate({
      type: 'session_start',
      data: session
    });
    
    return sessionId;
  }

  // End a live editing session
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
      
      this.broadcastUpdate({
        type: 'session_end',
        data: session
      });
    }
  }

  // Stream live code updates from agents
  async streamCodeUpdate(update: LiveCodeUpdate): Promise<void> {
    this.broadcastUpdate({
      type: 'code_update',
      data: update
    });
  }

  // Simulate agent working on gym buddy transformation
  async simulateGymBuddyTransformation(): Promise<void> {
    const agents = await storage.getAllAgents();
    const frontendAgent = agents.find(a => a.name === 'Maya Rodriguez' || a.type === 'designer');
    const reactAgent = agents.find(a => a.name === 'Sam Park' || a.type === 'junior_developer');
    
    if (!frontendAgent || !reactAgent) return;

    // Start multiple sessions for different files
    const sessions = [
      await this.startSession(frontendAgent.id, 'gym-buddy-app.jsx', 1),
      await this.startSession(reactAgent.id, 'components/UserProfile.jsx', 1),
      await this.startSession(frontendAgent.id, 'styles/modern-gym.css', 1)
    ];

    // Simulate Maya working on main app component
    setTimeout(() => this.simulateAgentWork(sessions[0], frontendAgent.name, 'gym-buddy-app.jsx'), 1000);
    
    // Simulate Sam working on user profiles
    setTimeout(() => this.simulateAgentWork(sessions[1], reactAgent.name, 'components/UserProfile.jsx'), 3000);
    
    // Simulate Maya working on modern CSS
    setTimeout(() => this.simulateAgentWork(sessions[2], frontendAgent.name, 'styles/modern-gym.css'), 5000);
  }

  private async simulateAgentWork(sessionId: string, agentName: string, fileName: string) {
    const updates = this.getGymBuddyUpdates(fileName, agentName);
    
    for (let i = 0; i < updates.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delays
      
      await this.streamCodeUpdate({
        sessionId,
        fileName,
        content: updates[i].content,
        agentName,
        timestamp: new Date(),
        updateType: updates[i].type as any,
        message: updates[i].message
      });
    }
    
    await this.endSession(sessionId);
  }

  private getGymBuddyUpdates(fileName: string, agentName: string) {
    if (fileName === 'gym-buddy-app.jsx') {
      return [
        {
          type: 'thinking',
          content: '',
          message: `${agentName}: Starting transformation of basic HTML to modern React app...`
        },
        {
          type: 'partial',
          content: `import React, { useState, useEffect } from 'react';
import './styles/modern-gym.css';

const GymBuddyApp = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');`,
          message: `${agentName}: Adding React hooks and modern state management...`
        },
        {
          type: 'partial',
          content: `import React, { useState, useEffect } from 'react';
import './styles/modern-gym.css';
import UserProfile from './components/UserProfile';
import SearchBar from './components/SearchBar';

const GymBuddyApp = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Load gym buddy data
    fetchGymBuddies();
  }, []);

  const fetchGymBuddies = async () => {
    try {
      const response = await fetch('/api/gym-buddies');
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching gym buddies:', error);
    }
  };`,
          message: `${agentName}: Adding API integration and data fetching...`
        },
        {
          type: 'complete',
          content: `import React, { useState, useEffect } from 'react';
import './styles/modern-gym.css';
import UserProfile from './components/UserProfile';
import SearchBar from './components/SearchBar';

const GymBuddyApp = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchGymBuddies();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.workoutType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchGymBuddies = async () => {
    try {
      const response = await fetch('/api/gym-buddies');
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching gym buddies:', error);
    }
  };

  return (
    <div className="gym-buddy-app">
      <header className="app-header">
        <h1>🏋️ Gym Buddy Finder</h1>
        <p>Find your perfect workout partner</p>
      </header>
      
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <div className="users-grid">
        {filteredUsers.map(user => (
          <UserProfile 
            key={user.id}
            user={user}
          />
        ))}
      </div>
    </div>
  );
};

export default GymBuddyApp;`,
          message: `${agentName}: ✅ Completed modern React app with search and responsive grid!`
        }
      ];
    } else if (fileName === 'components/UserProfile.jsx') {
      return [
        {
          type: 'thinking',
          content: '',
          message: `${agentName}: Creating interactive user profile component...`
        },
        {
          type: 'partial',
          content: `import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <div className="user-card">
      <div className="user-avatar">
        <img src={user.profileImage || '/default-avatar.png'} alt={user.name} />
      </div>`,
          message: `${agentName}: Adding profile image and basic structure...`
        },
        {
          type: 'complete',
          content: `import React, { useState } from 'react';

const UserProfile = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`user-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="user-avatar">
        <img src={user.profileImage || '/default-avatar.png'} alt={user.name} />
        <div className="status-indicator ${user.isOnline ? 'online' : 'offline'}"></div>
      </div>
      
      <div className="user-info">
        <h3>{user.name}</h3>
        <p className="workout-type">{user.workoutType}</p>
        <p className="experience">Experience: {user.experienceLevel}</p>
        
        {isExpanded && (
          <div className="expanded-info">
            <p><strong>Goals:</strong> {user.fitnessGoals}</p>
            <p><strong>Schedule:</strong> {user.preferredTimes}</p>
            <p><strong>Location:</strong> {user.location}</p>
            <div className="interests">
              {user.interests?.map(interest => (
                <span key={interest} className="interest-tag">{interest}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="user-actions">
        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Less Info' : 'More Info'}
        </button>
        <button className="connect-btn">
          🤝 Connect
        </button>
      </div>
    </div>
  );
};

export default UserProfile;`,
          message: `${agentName}: ✅ Created interactive user profiles with expand/collapse and connect functionality!`
        }
      ];
    } else if (fileName === 'styles/modern-gym.css') {
      return [
        {
          type: 'thinking',
          content: '',
          message: `${agentName}: Designing modern, responsive CSS for gym buddy app...`
        },
        {
          type: 'partial',
          content: `/* Modern Gym Buddy App Styles */
.gym-buddy-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}`,
          message: `${agentName}: Adding modern header with gradient background...`
        },
        {
          type: 'complete',
          content: `/* Modern Gym Buddy App Styles */
.gym-buddy-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.user-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.user-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #667eea;
}

.status-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.offline {
  background: #6b7280;
}

.user-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.workout-type {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.experience {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.expanded-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.interest-tag {
  background: #f3f4f6;
  color: #4b5563;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  display: inline-block;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.expand-btn, .connect-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-btn {
  background: #f3f4f6;
  color: #4b5563;
}

.connect-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.connect-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .gym-buddy-app {
    padding: 1rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
}`,
          message: `${agentName}: ✅ Completed modern responsive design with animations and mobile support!`
        }
      ];
    }
    
    return [];
  }

  // WebSocket connection management
  addConnection(ws: WebSocket) {
    this.connections.add(ws);
    
    ws.on('close', () => {
      this.connections.delete(ws);
    });
  }

  private broadcastUpdate(update: any) {
    const message = JSON.stringify(update);
    
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Get active sessions
  getActiveSessions(): LiveEditingSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }
}