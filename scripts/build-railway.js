#!/usr/bin/env node

// Railway-specific build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚂 Building for Railway deployment...');

try {
  // Environment validation
  console.log('🌍 Validating environment...');
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.log('💡 These should be configured in Railway dashboard');
  }

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }

  // Build frontend
  console.log('⚛️  Building frontend...');
  execSync('vite build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Build backend for Railway
  console.log('🔧 Building backend for Railway...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:ws --external:pg --external:@neondatabase/serverless --external:drizzle-orm --external:drizzle-kit', { 
    stdio: 'inherit' 
  });

  // Create Railway-specific package.json
  console.log('📦 Creating Railway package.json...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const railwayPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    license: packageJson.license,
    engines: {
      node: ">=18.0.0"
    },
    dependencies: {
      // Core dependencies needed for Railway
      'express': packageJson.dependencies.express,
      'ws': packageJson.dependencies.ws,
      'pg': packageJson.dependencies.pg || '^8.11.3',
      '@neondatabase/serverless': packageJson.dependencies['@neondatabase/serverless'],
      'drizzle-orm': packageJson.dependencies['drizzle-orm'],
      'axios': packageJson.dependencies.axios,
      'nanoid': packageJson.dependencies.nanoid,
      'zod': packageJson.dependencies.zod,
      'openai': packageJson.dependencies.openai,
      '@anthropic-ai/sdk': packageJson.dependencies['@anthropic-ai/sdk'],
      '@google/genai': packageJson.dependencies['@google/genai']
    },
    scripts: {
      start: 'node dist/index.js',
      'start:railway': 'NODE_ENV=production node dist/index.js',
      'build:railway': 'node scripts/build-railway.js',
      health: 'curl -f http://localhost:$PORT/health || exit 1'
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(railwayPackageJson, null, 2));

  // Create Railway startup script
  console.log('🚀 Creating Railway startup script...');
  const startupScript = `#!/bin/bash
set -e

echo "🚂 Starting Railway deployment..."

# Set production environment
export NODE_ENV=production

# Use Railway provided PORT or default to 5000
export PORT=\${PORT:-5000}

echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database URL configured: \${DATABASE_URL:+true}"

# Start the application
echo "🚀 Starting CodeCraft application..."
node dist/index.js
`;

  fs.writeFileSync('dist/start.sh', startupScript);
  execSync('chmod +x dist/start.sh');

  // Create Railway deployment guide
  const railwayGuide = `
# Railway Deployment Guide

## Prerequisites
1. Install Railway CLI: \`npm install -g @railway/cli\`
2. Login to Railway: \`railway login\`

## Environment Variables
Configure these in your Railway dashboard:
- DATABASE_URL (required) - PostgreSQL connection string
- OPENAI_API_KEY (optional) - OpenAI API key
- ANTHROPIC_API_KEY (optional) - Anthropic Claude API key
- GOOGLE_API_KEY (optional) - Google AI API key
- GEMINI_API_KEY (optional) - Google Gemini API key

## Deployment Steps

### Method 1: CLI Deployment
1. Build for Railway: \`npm run build:railway\`
2. Initialize Railway project: \`railway init\`
3. Deploy: \`railway up\`

### Method 2: GitHub Integration
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy will happen automatically on push

### Method 3: Docker Deployment
1. Build Docker image: \`railway build\`
2. Deploy: \`railway deploy\`

## Configuration Files
- \`railway.json\` - Railway service configuration
- \`nixpacks.toml\` - Build configuration (optional)
- \`Dockerfile\` - Docker configuration (optional)

## Health Monitoring
Railway will automatically monitor these endpoints:
- Health check: \`/health\`
- Ready check: \`/ready\`

## Database Setup
1. Add PostgreSQL service in Railway dashboard
2. Copy DATABASE_URL from Railway dashboard
3. Set as environment variable

## Troubleshooting
- Check logs: \`railway logs\`
- Check service status: \`railway status\`
- Restart service: \`railway restart\`
- Connect to database: \`railway connect postgres\`

## Scaling
- Railway automatically scales based on traffic
- Configure custom scaling in service settings
- Monitor resource usage in dashboard

## Custom Domain
1. Go to Railway dashboard
2. Select your service
3. Add custom domain in Settings
4. Configure DNS records as shown
`;

  fs.writeFileSync('RAILWAY_DEPLOYMENT.md', railwayGuide);

  // Create Dockerfile for Railway
  console.log('🐳 Creating Dockerfile for Railway...');
  const dockerfile = `
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY dist/package.json ./
COPY dist/start.sh ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["./start.sh"]
`;

  fs.writeFileSync('Dockerfile', dockerfile);

  // Create nixpacks.toml for Railway
  console.log('📋 Creating nixpacks.toml for Railway...');
  const nixpacks = `
[phases.build]
cmd = "npm run build:railway"

[phases.install]
cmd = "npm ci --only=production"

[start]
cmd = "npm run start:railway"

[variables]
NODE_ENV = "production"
`;

  fs.writeFileSync('nixpacks.toml', nixpacks);

  // Update main package.json
  console.log('📦 Updating main package.json...');
  if (!packageJson.scripts['build:railway']) {
    packageJson.scripts['build:railway'] = 'node scripts/build-railway.js';
  }
  
  if (!packageJson.scripts['start:railway']) {
    packageJson.scripts['start:railway'] = 'NODE_ENV=production node dist/index.js';
  }

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  console.log('✅ Railway build completed successfully');
  console.log('📁 Generated files:');
  console.log('   - dist/index.js (backend build)');
  console.log('   - dist/client/ (frontend build)');
  console.log('   - dist/package.json (Railway dependencies)');
  console.log('   - dist/start.sh (Railway startup script)');
  console.log('   - railway.json (Railway configuration)');
  console.log('   - Dockerfile (Docker configuration)');
  console.log('   - nixpacks.toml (Nixpacks configuration)');
  console.log('   - RAILWAY_DEPLOYMENT.md (deployment guide)');
  console.log('🚂 Ready for Railway deployment!');

} catch (error) {
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}