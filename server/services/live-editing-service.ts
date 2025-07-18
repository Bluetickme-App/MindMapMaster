import { EventEmitter } from 'events';

export interface LiveUpdate {
  sessionId: string;
  fileName: string;
  content: string;
  agentName: string;
  timestamp: string;
  updateType: 'partial' | 'complete' | 'thinking' | 'error';
  message?: string;
}

export interface LiveSession {
  id: string;
  agentName: string;
  fileName: string;
  isActive: boolean;
  startedAt: string;
}

class LiveEditingService extends EventEmitter {
  private activeSessions: Map<string, LiveSession> = new Map();
  private isGymBuddyDemoRunning = false;

  async startGymBuddyDemo(): Promise<boolean> {
    if (this.isGymBuddyDemoRunning) {
      return false;
    }

    this.isGymBuddyDemoRunning = true;
    
    // Create sessions for 3 agents
    const sessions: LiveSession[] = [
      {
        id: 'maya-design-session',
        agentName: 'Maya Rodriguez (Designer)',
        fileName: 'GymBuddy.html',
        isActive: true,
        startedAt: new Date().toISOString()
      },
      {
        id: 'sam-react-session',
        agentName: 'Sam Park (Developer)',
        fileName: 'components/GymBuddyApp.jsx',
        isActive: true,
        startedAt: new Date().toISOString()
      },
      {
        id: 'jordan-profile-session',
        agentName: 'Jordan Kim (CSS Specialist)',
        fileName: 'components/UserProfile.jsx',
        isActive: true,
        startedAt: new Date().toISOString()
      }
    ];

    // Store sessions
    sessions.forEach(session => {
      this.activeSessions.set(session.id, session);
    });

    // Start the demo simulation
    this.simulateGymBuddyTransformation();
    
    return true;
  }

  private async simulateGymBuddyTransformation() {
    // Agent 1: Maya (Designer) transforms basic HTML
    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'maya-design-session',
        fileName: 'GymBuddy.html',
        content: '',
        agentName: 'Maya Rodriguez',
        timestamp: new Date().toISOString(),
        updateType: 'thinking',
        message: 'Analyzing the basic gym buddy finder... I need to modernize this design with CSS Grid and better visual hierarchy.'
      });
    }, 1000);

    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'maya-design-session',
        fileName: 'GymBuddy.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GymBuddy - Find Your Perfect Workout Partner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }`,
        agentName: 'Maya Rodriguez',
        timestamp: new Date().toISOString(),
        updateType: 'partial',
        message: 'Adding modern CSS foundation with gradient background and typography...'
      });
    }, 3000);

    // Agent 2: Sam (Developer) creates React components
    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'sam-react-session',
        fileName: 'components/GymBuddyApp.jsx',
        content: '',
        agentName: 'Sam Park',
        timestamp: new Date().toISOString(),
        updateType: 'thinking',
        message: 'Converting this to a React app with search functionality and user filtering...'
      });
    }, 5000);

    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'sam-react-session',
        fileName: 'components/GymBuddyApp.jsx',
        content: `import React, { useState, useEffect } from 'react';

const GymBuddyApp = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState('all');

  useEffect(() => {
    // Simulated gym buddy data
    setUsers([
      {
        id: 1,
        name: 'Alex Johnson',
        workoutType: 'Strength Training',
        experienceLevel: 'Intermediate',
        preferredTimes: 'Morning',
        location: 'Downtown Gym',
        profileImage: '/profiles/alex.jpg',
        isOnline: true,
        fitnessGoals: 'Build muscle mass',
        interests: ['Powerlifting', 'Nutrition']
      },
      {
        id: 2,
        name: 'Sarah Chen',
        workoutType: 'Cardio & HIIT',
        experienceLevel: 'Advanced',
        preferredTimes: 'Evening',
        location: 'Central Fitness',
        profileImage: '/profiles/sarah.jpg',
        isOnline: false,
        fitnessGoals: 'Weight loss and endurance',
        interests: ['Running', 'Cycling', 'CrossFit']
      }
    ]);
  }, []);`,
        agentName: 'Sam Park',
        timestamp: new Date().toISOString(),
        updateType: 'partial',
        message: 'Creating React component structure with state management and mock data...'
      });
    }, 7000);

    // Agent 3: Jordan (CSS) creates user profile component
    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'jordan-profile-session',
        fileName: 'components/UserProfile.jsx',
        content: '',
        agentName: 'Jordan Kim',
        timestamp: new Date().toISOString(),
        updateType: 'thinking',
        message: 'Designing an interactive user profile card with expand/collapse functionality...'
      });
    }, 9000);

    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'jordan-profile-session',
        fileName: 'components/UserProfile.jsx',
        content: `import React, { useState } from 'react';

const UserProfile = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="user-card">
      <div className="user-avatar">
        <img src={user.profileImage || '/default-avatar.png'} alt={user.name} />
        <div className="status-indicator"></div>
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
        agentName: 'Jordan Kim',
        timestamp: new Date().toISOString(),
        updateType: 'complete',
        message: 'Completed interactive user profile with expand/collapse and connection features!'
      });
    }, 12000);

    // Final completion updates
    setTimeout(() => {
      this.emitLiveUpdate({
        sessionId: 'maya-design-session',
        fileName: 'GymBuddy.html',
        content: 'Full modern HTML with responsive CSS Grid layout completed',
        agentName: 'Maya Rodriguez',
        timestamp: new Date().toISOString(),
        updateType: 'complete',
        message: '✅ Modern responsive design with gradient backgrounds and mobile-first layout complete!'
      });

      this.emitLiveUpdate({
        sessionId: 'sam-react-session',
        fileName: 'components/GymBuddyApp.jsx',
        content: 'React application with search, filtering, and state management completed',
        agentName: 'Sam Park',
        timestamp: new Date().toISOString(),
        updateType: 'complete',
        message: '✅ Full React app with search functionality and user management complete!'
      });
    }, 15000);

    // End demo
    setTimeout(() => {
      this.isGymBuddyDemoRunning = false;
      this.activeSessions.clear();
      this.emit('demo-complete');
    }, 18000);
  }

  private emitLiveUpdate(update: LiveUpdate) {
    this.emit('liveUpdate', update);
  }

  getActiveSessions(): LiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  isDemoRunning(): boolean {
    return this.isGymBuddyDemoRunning;
  }
}

export const liveEditingService = new LiveEditingService();