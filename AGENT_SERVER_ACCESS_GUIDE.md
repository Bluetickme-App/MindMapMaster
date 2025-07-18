# Agent Server Access Guide

## Overview
The AI agents now have comprehensive server access capabilities including dependency management, configuration updates, deep debugging, and system monitoring. This guide outlines all available tools and their usage.

## Available API Endpoints

### 1. NPM Package Management
- `POST /api/agent/install-dependency` - Install NPM packages
- `POST /api/agent/uninstall-dependency` - Remove NPM packages  
- `POST /api/agent/update-dependencies` - Update all dependencies

### 2. Server Configuration Management
- `POST /api/agent/update-config` - Update server configuration files
- `GET /api/agent/read-config` - Read server configuration files

### 3. Deep Server Debugging & Command Execution
- `POST /api/agent/execute-command` - Execute system commands
- `GET /api/agent/server-logs` - Get server logs with filtering
- `GET /api/agent/system-info` - Get comprehensive system information

### 4. Environment Management
- `POST /api/agent/update-environment` - Update environment variables
- `POST /api/agent/restart-server` - Restart the server

### 5. File System Operations
- `POST /api/agent/create-file` - Create configuration files

### 6. Command History and Monitoring
- `GET /api/agent/command-history` - View command execution history
- `POST /api/agent/clear-history` - Clear command history

## Agent Capabilities

### Jordan CSS (Gemini)
- Install CSS frameworks: `tailwindcss`, `postcss`, `autoprefixer`
- Update build configurations: `vite.config.ts`, `tailwind.config.ts`
- Execute CSS build commands: `npm run build:css`
- Monitor CSS compilation logs
- Create CSS configuration files

### Sam AI (OpenAI)
- Install AI/ML packages: `openai`, `@anthropic-ai/sdk`, `@google/genai`
- Update AI service configurations
- Execute AI training/testing commands
- Monitor AI service logs
- Create AI configuration files

### Morgan Vite (Gemini)
- Install build tools: `vite`, `rollup`, `esbuild`
- Update build configurations: `vite.config.ts`, `rollup.config.js`
- Execute build commands: `npm run build`, `npm run dev`
- Monitor build process logs
- Create build configuration files

### Carlos PHP (Claude)
- Install PHP packages via Composer
- Update PHP configurations: `php.ini`, `composer.json`
- Execute PHP commands: `php artisan`, `composer install`
- Monitor PHP-FPM logs
- Create PHP configuration files

### Riley Python (OpenAI)
- Install Python packages: `pip install`, `poetry add`
- Update Python configurations: `requirements.txt`, `pyproject.toml`
- Execute Python commands: `python`, `poetry run`
- Monitor Python application logs
- Create Python configuration files

### Taylor React (OpenAI)
- Install React packages: `react`, `react-dom`, `@types/react`
- Update React configurations: `package.json`, `tsconfig.json`
- Execute React commands: `npm run dev`, `npm run build`
- Monitor React development server logs
- Create React configuration files

### Alex Roadmap (OpenAI)
- Install project management tools
- Update project configurations
- Execute project setup commands
- Monitor project deployment logs
- Create project documentation files

### Maya Designer (Claude)
- Install design tools: `figma`, `design-tokens`
- Update design configurations
- Execute design build commands
- Monitor design system logs
- Create design configuration files

## Usage Examples

### Install a New Package
```bash
curl -X POST http://localhost:5000/api/agent/install-dependency \
  -H "Content-Type: application/json" \
  -d '{"packageName": "axios", "isDev": false}'
```

### Execute System Command
```bash
curl -X POST http://localhost:5000/api/agent/execute-command \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la", "timeout": 5000}'
```

### Get Server Logs
```bash
curl -X GET "http://localhost:5000/api/agent/server-logs?service=npm&lines=50"
```

### Update Configuration
```bash
curl -X POST http://localhost:5000/api/agent/update-config \
  -H "Content-Type: application/json" \
  -d '{"configPath": "vite.config.ts", "configData": {"server": {"port": 3000}}}'
```

### Get System Information
```bash
curl -X GET http://localhost:5000/api/agent/system-info
```

## Agent Integration

Agents can now:
1. **Install Dependencies**: Add new packages required for their specialization
2. **Update Configurations**: Modify server, build, and application configurations
3. **Execute Commands**: Run system commands for debugging and development
4. **Monitor System**: Access deep server logs and system metrics
5. **Manage Environment**: Update environment variables and restart services
6. **Create Files**: Generate configuration and setup files

## Security Features

- All commands are logged with timestamps
- Environment variables are masked in responses
- File operations are restricted to project directories
- Command timeouts prevent hanging operations
- Command history tracking for audit purposes

## Error Handling

All endpoints return standardized responses:
```json
{
  "success": true/false,
  "output": "command output",
  "error": "error message if any",
  "timestamp": "2025-07-18T17:00:00.000Z",
  "command": "executed command"
}
```

This comprehensive server access system allows AI agents to perform advanced development tasks, troubleshoot issues, and maintain the development environment autonomously.