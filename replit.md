# CodeCraft - AI Development Assistant

## Overview
CodeCraft is an AI-powered development assistant designed to streamline the development workflow. It combines capabilities for code generation, debugging, GitHub integration, API testing, and a comprehensive multi-agent collaboration system. The project's vision is to create a full-stack web application that serves as a robust platform for collaborative development, leveraging AI to enhance efficiency and productivity for individuals and teams, aiming to set a new standard in the market for AI-assisted development.

## User Preferences
Preferred communication style: Simple, everyday language.

### Development Preferences
- Multi-agent capabilities similar to LangChain model
- Developers should be able to communicate with each other
- Designers should be able to discuss page design with developers
- Collaborative development workflows
- Comprehensive development roadmaps with suggested features

### Project Vision
- Multi-agent system where different roles (developers, designers) can collaborate
- Integration with existing CodeCraft platform
- Real-time team collaboration and communication features
- Most advanced standards in today's market implementation
- Internal hosting capability (Replit deployment ready)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful with JSON responses

### Core Architectural Decisions & Features
- **AI Code Generation**: Utilizes OpenAI GPT-4o for generating production-ready code, explanations, and suggestions across multiple languages and frameworks.
- **GitHub Integration**: Seamless repository management via GitHub REST API, enabling repository listing, data fetching, and project linking.
- **API Testing Console**: Provides comprehensive API testing with support for all HTTP methods, request/response logging, and performance metrics.
- **Project Management**: Database-driven system for organizing, categorizing, and tracking development projects, linked with GitHub repositories.
- **UI/UX Design System**: Consistent dark-themed interface, responsive design, accessible components, and interactive feedback.
- **Multi-Agent Collaboration System**: Enables real-time collaboration between specialized AI agents (e.g., Senior Developer, Designer, DevOps) and human developers. It integrates multiple AI providers (OpenAI, Anthropic Claude, Google Gemini) for diverse task routing and consensus generation. Features include live chat, agent orchestration, project-based discussions, and intelligent task assignment.
- **Enhanced Replit AI System**: Provides both Agent (complete app generation from natural language with transparent effort-based pricing) and Assistant (code help, bug fixes, feature implementation) capabilities, outperforming Replit's native AI through multi-provider intelligence and comprehensive checkpoints.
- **Development Workspace**: A full-featured, Replit-like environment with a 3-panel layout including a file explorer, code editor (Monaco), live preview, terminal, and browser tabs, integrated with AI agents for collaborative coding. It supports real file system access and dynamic Dev URLs.
- **Extension Management System**: A marketplace for downloadable tool functions (25+) categorized for development, database, DevOps, and more, allowing agents to perform complex operations.
- **Agent Server Access System**: Allows AI agents to interact directly with the server environment, including NPM dependency management, deep debugging, and configuration updates.
- **Simplified Project Creation**: Streamlined 2-step project creation flow supporting single-agent or team modes, GitHub imports, and website cloning/rebranding.
- **Advanced Collaboration System**: Features file locking to prevent conflicts, checkpoint management for rollbacks, and live editing visualization during multi-agent transformations.

## External Dependencies
- **Database**: PostgreSQL (with Neon serverless hosting)
- **ORM**: Drizzle ORM
- **AI Services**: OpenAI GPT-4o API, Anthropic Claude API, Google Gemini API
- **Version Control**: GitHub API
- **UI Components**: Radix UI
- **HTTP Client**: Axios (for API testing)
- **Build Tools**: Vite, esbuild
- **Code Quality**: ESLint, Prettier
- **Deployment Platforms**: Railway, Vercel