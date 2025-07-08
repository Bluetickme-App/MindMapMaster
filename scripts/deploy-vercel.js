#!/usr/bin/env node

// Automated Vercel deployment script
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Deploying to Vercel...');

try {
  // Check if Vercel CLI is installed
  console.log('🔍 Checking Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI found');
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Build for Vercel
  console.log('🔨 Building for Vercel...');
  execSync('node scripts/build-vercel.js', { stdio: 'inherit' });

  // Deploy to Vercel
  console.log('🚀 Deploying to Vercel...');
  execSync('vercel --prod --yes', { stdio: 'inherit' });

  console.log('✅ Vercel deployment completed!');
  console.log('🔗 Check your Vercel dashboard for the deployment URL');

} catch (error) {
  console.error('❌ Vercel deployment failed:', error.message);
  console.log('💡 Make sure to:');
  console.log('   1. Login to Vercel: vercel login');
  console.log('   2. Set environment variables in Vercel dashboard');
  console.log('   3. Ensure all required dependencies are installed');
  process.exit(1);
}