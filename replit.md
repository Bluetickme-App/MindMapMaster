# CodeCraft - AI Development Assistant

## Overview

CodeCraft is a comprehensive AI-powered development assistant that combines code generation, debugging, GitHub integration, and API testing capabilities. The system is built as a full-stack web application with a React frontend and Express backend, designed to streamline the development workflow for modern web applications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI component library with shadcn/ui
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**: OpenAI GPT-4o for code generation and GitHub API for repository management
- **Session Management**: In-memory storage (development) with plans for PostgreSQL sessions
- **API Design**: RESTful endpoints with JSON responses

## Key Components

### 1. AI Code Generation System
- **Purpose**: Generate production-ready code based on natural language prompts
- **Implementation**: OpenAI GPT-4o integration with structured JSON responses
- **Features**: 
  - Multi-language support (JavaScript, TypeScript, Python, etc.)
  - Framework-specific code generation (React, Node.js, etc.)
  - Best practices enforcement
  - Code explanation and improvement suggestions

### 2. GitHub Integration
- **Purpose**: Seamless repository management and version control
- **Implementation**: GitHub REST API integration with Octokit
- **Features**:
  - Repository listing and management
  - Real-time repository data
  - Language and framework detection
  - Star and fork tracking

### 3. API Testing Console
- **Purpose**: Comprehensive API testing and debugging
- **Implementation**: Axios-based HTTP client with response analysis
- **Features**:
  - Support for all HTTP methods
  - Request/response logging
  - Performance metrics tracking
  - Custom headers and body support

### 4. Project Management
- **Purpose**: Organize and track development projects
- **Implementation**: Database-driven project tracking
- **Features**:
  - Project categorization by language/framework
  - Status tracking (active, paused, completed)
  - GitHub repository linking
  - Modification history

### 5. UI/UX Design System
- **Purpose**: Consistent, modern interface design
- **Implementation**: Dark theme with custom color palette
- **Features**:
  - Responsive design for all screen sizes
  - Accessible components with proper ARIA labels
  - Consistent spacing and typography
  - Interactive feedback and animations

## Data Flow

### Code Generation Flow
1. User submits prompt with language/framework preferences
2. Backend validates input and constructs OpenAI API request
3. GPT-4o processes request and returns structured code response
4. Generated code is stored in database with user association
5. Frontend displays code with syntax highlighting and explanations

### GitHub Integration Flow
1. User authenticates with GitHub token
2. Backend fetches repository data using GitHub API
3. Repository information is cached and displayed
4. Real-time updates are fetched on user interaction
5. Project associations are maintained in database

### API Testing Flow
1. User configures API request parameters
2. Backend processes request with proper headers and authentication
3. Response data, timing, and status are captured
4. Results are stored for history and analysis
5. Frontend displays formatted results with performance metrics

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **AI Service**: OpenAI GPT-4o API for code generation
- **Version Control**: GitHub API for repository management
- **UI Framework**: Radix UI for accessible components

### Development Dependencies
- **Build Tools**: Vite for frontend, esbuild for backend
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implied by codebase structure)
- **Environment**: Node.js runtime with ES modules

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR
- **Database**: Local PostgreSQL or Neon development database
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, GitHub tokens
- **Port Configuration**: Default Express server with Vite proxy

### Production Build
- **Frontend**: Vite build with optimized asset bundling
- **Backend**: esbuild compilation to single JavaScript file
- **Database**: Drizzle migrations for schema management
- **Deployment**: Railway or similar platform deployment ready

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **APIs**: OpenAI and GitHub API keys via environment variables
- **Sessions**: PostgreSQL session store for production
- **CORS**: Configured for production domain

## Multi-Agent Collaboration System

### Overview
CodeCraft now features a comprehensive multi-agent collaboration system built to the most advanced standards in today's market. This system enables real-time collaboration between specialized AI agents and human developers using multiple AI providers.

### Key Features

#### 1. Multi-AI Provider Integration
- **OpenAI**: GPT-4o for senior developers, code reviewers, and general tasks
- **Anthropic Claude**: Sonnet-4 for designers, product managers, and strategic thinking
- **Google Gemini**: Pro and Flash models for DevOps, QA engineers, and data analysis
- **Consensus Generation**: Multiple AI providers work together for critical decisions
- **Provider Health Monitoring**: Real-time status of all AI services

#### 2. Specialized AI Agent Roles
- **Alex Senior** (Senior Developer): System architecture, code review, technical leadership
- **Sam Junior** (Junior Developer): Feature implementation, documentation, learning-focused
- **Maya Designer** (UI/UX Designer): Design systems, user experience, accessibility
- **Jordan DevOps** (DevOps Engineer): Infrastructure automation, CI/CD, monitoring
- **Riley PM** (Product Manager): Requirements gathering, project planning, stakeholder communication
- **Chris Reviewer** (Code Reviewer): Code quality, security, best practices
- **Taylor QA** (QA Engineer): Testing strategies, automation, quality assurance
- **Morgan Data** (Data Analyst): Analytics, insights, data-driven decisions

#### 3. Real-Time WebSocket Communication
- **Live Chat Interface**: Real-time messaging between users and AI agents
- **Typing Indicators**: Visual feedback when agents are responding
- **Connection Management**: Automatic reconnection and status monitoring
- **Multi-Conversation Support**: Parallel discussions across different projects
- **Agent Status Updates**: Live updates on agent availability and activity

#### 4. Agent Orchestration System
- **Collaborative Sessions**: Multi-agent teams working on specific objectives
- **Phase Management**: Planning → Design → Implementation → Review workflows
- **Decision Making**: Consensus-based decisions with reasoning transparency
- **Task Assignment**: Intelligent routing of tasks to appropriate agents
- **Knowledge Sharing**: Agents learn from interactions and build expertise

#### 5. Project-Based Collaboration
- **Project Discussions**: Dedicated conversations for each project
- **Participant Management**: Dynamic addition/removal of agents based on needs
- **Context Awareness**: Agents understand project history and requirements
- **Workflow Integration**: Seamless integration with existing development workflows

### Technical Architecture

#### Backend Services
- **Agent Orchestration Service**: Manages multi-agent collaboration workflows
- **Multi-AI Provider Service**: Unified interface for OpenAI, Claude, and Gemini
- **WebSocket Manager**: Real-time communication system with connection management
- **Agent Initialization Service**: Automatic setup of specialized AI agents

#### Database Schema
- **Agents Table**: Stores agent profiles, capabilities, and configurations
- **Conversations Table**: Manages multi-participant discussion threads
- **Messages Table**: Real-time message storage with metadata
- **Agent Knowledge Table**: Persistent learning and expertise tracking
- **Collaboration Sessions**: Project-based team collaboration records

#### Frontend Components
- **Collaboration Dashboard**: Comprehensive real-time interface
- **Agent Management Panel**: Visual agent status and capabilities
- **Live Chat Interface**: Real-time messaging with typing indicators
- **Provider Status Monitor**: Health and availability of AI services
- **Session Management**: Active collaboration tracking and controls

### User Interface Features

#### Quick Actions Integration
- **Multi-Agent Collaboration** button added to main dashboard
- **Direct Navigation** to collaboration interface
- **Visual Indicators** for active collaboration sessions
- **Real-Time Stats** showing connection status and activity

#### Collaboration Dashboard
- **Three-Tab Interface**: Real-time Chat, Active Collaborations, AI Providers
- **Agent Selection**: Choose specific agents for collaboration
- **Live Communication**: Real-time chat with multiple AI agents
- **Session Progress**: Visual progress tracking for multi-phase projects
- **Provider Health**: Live status of all AI services

### Advanced Capabilities

#### Agent Intelligence
- **Role-Specific Responses**: Each agent responds based on their specialization
- **Context Awareness**: Agents understand project context and history
- **Learning System**: Agents build knowledge from interactions
- **Intelligent Routing**: Smart assignment of tasks to appropriate agents

#### Collaboration Features
- **Multi-Phase Workflows**: Structured approach to project development
- **Consensus Generation**: Multiple AI providers collaborate on decisions
- **Real-Time Coordination**: Live coordination between different agent types
- **Progress Tracking**: Visual representation of collaboration progress

#### Integration Points
- **Existing Project System**: Seamless integration with current projects
- **GitHub Integration**: Agents can work with repository data
- **Code Generation**: Enhanced code generation with multi-agent input
- **API Testing**: Collaborative testing and debugging workflows

## Changelog

Changelog:
- July 06, 2025. Initial setup
- July 06, 2025. Implemented comprehensive multi-agent collaboration system with:
  - Multi-AI provider integration (OpenAI, Claude, Gemini)
  - Real-time WebSocket communication system
  - 8 specialized AI agent roles with unique capabilities
  - Agent orchestration and collaboration workflows
  - Live collaboration dashboard with three-tab interface
  - Project-based team collaboration features
  - Advanced consensus generation and decision-making
  - Real-time status monitoring and connection management
- July 07, 2025. Added PostgreSQL database integration:
  - Created database connection with Drizzle ORM
  - Replaced in-memory storage with DatabaseStorage
  - Successfully migrated all data models to database
  - Fixed sidebar navigation and created dedicated pages for all features
  - All API endpoints now functional with persistent data storage
- July 07, 2025. Created comprehensive development workspace:
  - Full-featured workspace similar to Replit with file explorer, live preview, console
  - Integrated file system management with backend API endpoints
  - Real-time console for command execution
  - Secrets management with JSON/ENV format support
  - Database deployment and object storage interfaces
  - Settings page with API key configuration and testing
  - Complete development environment ready for expansion
- July 08, 2025. Enhanced AI code generation with Codex-style capabilities:
  - Implemented advanced code generation using OpenAI GPT-4o with specialized prompts
  - Added real-time preview windows similar to Replit's interface
  - Created debugging and code explanation endpoints (/api/debug, /api/explain)
  - Enhanced system prompts for production-ready, well-documented code
  - Added live iframe preview with sandboxed execution
  - Integrated copy, preview, download, and explanation features
  - System now provides Codex-level coding assistance and debugging

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Preferences
- ✅ Multi-agent capabilities similar to LangChain model (IMPLEMENTED)
- ✅ Developers should be able to communicate with each other (IMPLEMENTED)
- ✅ Designers should be able to discuss page design with developers (IMPLEMENTED)
- ✅ Collaborative development workflows (IMPLEMENTED)
- ✅ Comprehensive development roadmaps with suggested features (IMPLEMENTED)

### Project Vision (ACHIEVED)
- ✅ Multi-agent system where different roles (developers, designers) can collaborate
- ✅ Integration with existing CodeCraft platform
- ✅ Real-time team collaboration and communication features
- ✅ Most advanced standards in today's market implementation
- ✅ Internal hosting capability (Replit deployment ready)