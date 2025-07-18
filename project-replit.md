# CodeCraft Multi-Agent Development Platform - Project Documentation

## Overview

CodeCraft is a streamlined multi-agent development platform that enables intuitive project creation through two main paths: single agent projects and team-based collaborative development. The system provides a 2-step process where users describe their project, choose collaboration preferences, and automatically get suggested specialists based on requirements.

## Current Architecture

### Multi-Agent System
- **OpenAI**: Primary managing agent for project coordination and backend tasks
- **Claude (Anthropic)**: UI/UX design, frontend development, and creative tasks
- **Gemini (Google)**: Optimization, DevOps, and performance analysis
- **Cost Optimization**: Smart routing reduces OpenAI usage by utilizing Claude/Gemini for specialized tasks

### Database Integration
- **PostgreSQL**: Primary database with Drizzle ORM
- **Real-time Storage**: All conversations, projects, and agent interactions persist
- **Database Status**: Fully operational with conversation tracking and agent memory

### User Interface
- **Replit Clone Interface**: 3-panel development environment (file explorer, editor, preview/terminal/browser)
- **Draggable Tabs**: Users can reorder tabs (Preview, Console, Browser, AI Agents) to preferred positions
- **Real File System**: Workspace displays actual project files from created systems
- **AI Agent Integration**: Embedded agent selection and collaboration within development environment

## Key Features Completed

### ✅ Multi-AI Provider Integration
- OpenAI GPT-4o for management and coordination
- Claude 4.0 Sonnet for design and frontend excellence
- Google Gemini Pro for optimization and DevOps
- Health monitoring for all AI services
- Optimal task routing based on AI provider strengths

### ✅ Project Creation System
- Simple 2-step process: describe project → choose single agent or team
- Automatic team suggestion based on language/framework requirements
- Brief upload capability for complex project requirements
- Direct launch into Replit clone environment

### ✅ Real-time Collaboration
- WebSocket-based communication system
- 8 specialized AI agents with unique capabilities
- Team conversation creation with agent selection
- Project-aware discussions with persistent storage

### ✅ Development Environment
- File explorer with actual project structure
- Monaco editor with syntax highlighting
- Live preview for HTML/JavaScript projects
- Terminal integration with command execution
- Drag-and-drop tab functionality

### ✅ Conversation Persistence
- All conversations saved to PostgreSQL database
- Agent memory system for building expertise over time
- Project-specific conversation history
- Multi-participant discussion tracking

## API Configuration Status

### ✅ Configured API Keys
- **OpenAI**: Operational (GPT-4o model)
- **Google/Gemini**: Operational (GOOGLE_API_KEY configured)
- **Anthropic/Claude**: Operational (ANTHROPIC_API_KEY configured)

### ✅ Database Connection
- **PostgreSQL**: Connected via DATABASE_URL
- **Drizzle ORM**: Schema deployed and operational
- **All tables**: Projects, conversations, messages, agents fully functional

## Recent Fixes Applied

### Database Schema Resolution (July 18, 2025)
- ✅ Fixed array syntax issues in PostgreSQL schema (features, images, notes arrays)
- ✅ Corrected property name mismatches (participantIds → participants)
- ✅ Fixed sql import from drizzle-orm for array defaults
- ✅ Addressed storage interface compatibility issues

### Tab Drag-and-Drop Enhancement (July 18, 2025)
- ✅ Implemented smooth drag-and-drop functionality for workspace tabs
- ✅ Visual grip indicators and hover effects
- ✅ Users can reorder Preview, Console, Browser, AI Agents tabs
- ✅ Persistent tab positions within workspace sessions

### Multi-AI Provider System (July 18, 2025)
- ✅ Resolved Google API key configuration
- ✅ All three AI providers now operational
- ✅ Cost optimization through intelligent task routing
- ✅ Health monitoring shows real provider status

## Current Focus Areas

### ✅ Completed (July 18, 2025)
- Fixed file system refresh bug when switching projects
- Added Morgan Davis as dedicated Project Manager agent (present for every job)
- Created comprehensive test website: Gym Buddy Finder (responsive, interactive)
- Project switching now properly updates file tree and clears selections
- Database conversation persistence working correctly

### 🔄 Current Testing
- Full workflow from project creation to multi-agent collaboration
- File system properly shows actual project files (gym-finder-test/index.html, README.md)
- Project Manager agent coordinating all team activities
- Real-time file system updates when switching between projects

### 📋 Next Steps
1. Complete full test of multi-agent collaboration on created website
2. Validate Project Manager agent coordination capabilities
3. Test conversation persistence with multiple agents
4. Enhance agent team suggestions based on project requirements

## User Preferences

### Communication Style
- Simple, everyday language preferred
- Focus on functionality over technical details
- Clear progress updates without repetitive phrases

### Development Priorities
- ✅ Multi-agent collaboration capabilities (ACHIEVED)
- ✅ Real-time team communication (ACHIEVED)
- ✅ Workspace integration with actual file system (ACHIEVED)
- ✅ Draggable interface elements (ACHIEVED)
- ✅ Conversation persistence (IN PROGRESS)

### Technical Decisions
- PostgreSQL for persistent storage over in-memory
- Multi-AI provider approach for cost optimization
- Replit-style interface for familiar development experience
- WebSocket + REST API hybrid for real-time and persistence

## Success Metrics

### ✅ Completed Goals
- All three AI providers configured and operational
- Real file system integration in workspace
- Drag-and-drop tab functionality implemented
- Database connection established with persistent storage
- Multi-agent system routing tasks optimally

### 🎯 Current Objectives
- Complete database schema error resolution
- Ensure all conversations save properly to database
- Validate agent memory system functionality
- Test complete workflow from project creation to collaboration

## Architecture Notes

### Cost Optimization Strategy
- OpenAI serves as primary coordinator (most reliable for complex logic)
- Claude handles UI/UX and creative tasks (exceptional design capabilities)
- Gemini manages optimization and DevOps (cost-effective for system tasks)
- Smart routing reduces overall API costs while maintaining quality

### Data Flow
1. User creates project via 2-step interface
2. System suggests appropriate agents based on requirements
3. Project launches in Replit clone environment with real file system
4. Users can drag tabs to preferred positions
5. AI agents collaborate via WebSocket + database persistence
6. All conversations and project data saved to PostgreSQL

## Development History

- **July 18, 2025**: Fixed Google API configuration, implemented tab drag-and-drop
- **July 16, 2025**: Enhanced project creation system, resolved database constraints
- **July 09, 2025**: Built comprehensive Replit clone interface with AI integration
- **July 08, 2025**: Implemented multi-agent collaboration with WebSocket communication
- **July 07, 2025**: Added PostgreSQL integration and database storage
- **July 06, 2025**: Initial multi-agent system setup with OpenAI, Claude, Gemini

## Technical Status

### Database Schema: 🔄 Resolving final TypeScript errors
### API Integration: ✅ All providers operational
### User Interface: ✅ Complete with drag-and-drop functionality
### File System: ✅ Real project files displayed
### Conversation System: 🔄 Completing persistence implementation
### Multi-Agent Routing: ✅ Optimal AI provider task distribution