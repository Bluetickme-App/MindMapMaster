#!/usr/bin/env node

// Automated Railway deployment script
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚂 Deploying to Railway...');

try {
  // Check if Railway CLI is installed
  console.log('🔍 Checking Railway CLI...');
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI found');
  } catch (error) {
    console.log('📦 Installing Railway CLI...');
    execSync('npm install -g @railway/cli', { stdio: 'inherit' });
  }

  // Build for Railway
  console.log('🔨 Building for Railway...');
  execSync('node scripts/build-railway.js', { stdio: 'inherit' });

  // Check if Railway project exists
  console.log('🔍 Checking Railway project...');
  try {
    execSync('railway status', { stdio: 'pipe' });
    console.log('✅ Railway project found');
  } catch (error) {
    console.log('🆕 Initializing Railway project...');
    execSync('railway init', { stdio: 'inherit' });
  }

  // Deploy to Railway
  console.log('🚂 Deploying to Railway...');
  execSync('railway up', { stdio: 'inherit' });

  console.log('✅ Railway deployment completed!');
  console.log('🔗 Check your Railway dashboard for the deployment URL');

} catch (error) {
  console.error('❌ Railway deployment failed:', error.message);
  console.log('💡 Make sure to:');
  console.log('   1. Login to Railway: railway login');
  console.log('   2. Set environment variables in Railway dashboard');
  console.log('   3. Ensure PostgreSQL service is configured');
  process.exit(1);
}