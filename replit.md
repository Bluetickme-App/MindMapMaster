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

## Changelog

Changelog:
- July 06, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Preferences
- Wants to add multi-agent capabilities similar to LangChain model
- Developers should be able to communicate with each other
- Designers should be able to discuss page design with developers
- Interested in collaborative development workflows
- Prefers comprehensive development roadmaps with suggested features

### Project Vision
- Multi-agent system where different roles (developers, designers) can collaborate
- Integration with existing CodeCraft platform
- Focus on team collaboration and communication features