#!/usr/bin/env node

// Update package.json with deployment scripts
import fs from 'fs';

console.log('📦 Updating package.json with deployment scripts...');

try {
  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add deployment scripts
  const newScripts = {
    'build:vercel': 'node scripts/build-vercel.js',
    'build:railway': 'node scripts/build-railway.js',
    'deploy:vercel': 'node scripts/deploy-vercel.js',
    'deploy:railway': 'node scripts/deploy-railway.js',
    'start:vercel': 'node api/index.js',
    'start:railway': 'NODE_ENV=production node dist/index.js',
    'test:deployment': 'node test-deployment-configs.js'
  };
  
  // Merge with existing scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    ...newScripts
  };
  
  // Write updated package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Package.json updated with deployment scripts:');
  Object.keys(newScripts).forEach(script => {
    console.log(`   - ${script}`);
  });
  
} catch (error) {
  console.error('❌ Failed to update package.json:', error.message);
  process.exit(1);
}