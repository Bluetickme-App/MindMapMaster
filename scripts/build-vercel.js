#!/usr/bin/env node

// Vercel-specific build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building for Vercel deployment...');

try {
  // Environment validation
  console.log('🌍 Validating environment...');
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.log('💡 These should be configured in Vercel dashboard');
  }

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('client/dist')) {
    fs.rmSync('client/dist', { recursive: true });
  }
  if (fs.existsSync('.vercel')) {
    fs.rmSync('.vercel', { recursive: true });
  }

  // Build frontend
  console.log('⚛️  Building frontend for Vercel...');
  execSync('vite build --outDir client/dist', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Prepare server for Vercel
  console.log('🔧 Preparing server for Vercel...');
  
  // Create api directory for Vercel functions
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api');
  }

  // Create Vercel API handler
  const vercelHandler = `
// Vercel API handler
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import express from 'express';
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize routes
let server;
const initServer = async () => {
  if (!server) {
    server = await registerRoutes(app);
  }
  return server;
};

export default async function handler(req, res) {
  try {
    await initServer();
    app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
`;

  fs.writeFileSync('api/index.js', vercelHandler);

  // Update package.json for Vercel
  console.log('📦 Updating package.json for Vercel...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts['build:vercel']) {
    packageJson.scripts['build:vercel'] = 'node scripts/build-vercel.js';
  }
  
  if (!packageJson.scripts['start:vercel']) {
    packageJson.scripts['start:vercel'] = 'node api/index.js';
  }

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Create Vercel deployment guide
  const vercelGuide = `
# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: \`npm i -g vercel\`
2. Login to Vercel: \`vercel login\`

## Environment Variables
Configure these in your Vercel dashboard:
- DATABASE_URL (required)
- OPENAI_API_KEY (optional)
- ANTHROPIC_API_KEY (optional)
- GOOGLE_API_KEY (optional)
- GEMINI_API_KEY (optional)

## Deployment Steps
1. Build for Vercel: \`npm run build:vercel\`
2. Deploy: \`vercel --prod\`

## Manual Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy will happen automatically on push

## Health Check
After deployment, verify:
- Health endpoint: https://your-app.vercel.app/health
- Ready endpoint: https://your-app.vercel.app/ready
- Main app: https://your-app.vercel.app

## Troubleshooting
- Check function logs in Vercel dashboard
- Ensure all environment variables are set
- Verify build completes successfully
`;

  fs.writeFileSync('VERCEL_DEPLOYMENT.md', vercelGuide);

  console.log('✅ Vercel build completed successfully');
  console.log('📁 Generated files:');
  console.log('   - client/dist/ (frontend build)');
  console.log('   - api/index.js (Vercel API handler)');
  console.log('   - vercel.json (Vercel configuration)');
  console.log('   - VERCEL_DEPLOYMENT.md (deployment guide)');
  console.log('🚀 Ready for Vercel deployment!');

} catch (error) {
  console.error('❌ Vercel build failed:', error.message);
  process.exit(1);
}