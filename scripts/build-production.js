#!/usr/bin/env node

// Production build script with comprehensive error handling
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Environment validation
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  
  // Build frontend
  console.log('⚛️  Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Build backend
  console.log('🔧 Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:ws --external:pg --external:@neondatabase/serverless', { stdio: 'inherit' });
  
  // Copy package.json for production dependencies
  console.log('📦 Copying package.json...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const productionPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    license: packageJson.license,
    dependencies: packageJson.dependencies,
    scripts: {
      start: 'node index.js'
    }
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackageJson, null, 2));
  
  // Create health check script
  console.log('🏥 Creating health check script...');
  const healthScript = `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.error(\`❌ Health check failed with status \${res.statusCode}\`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('❌ Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
`;
  
  fs.writeFileSync('dist/health-check.js', healthScript);
  
  console.log('✅ Production build completed successfully');
  console.log('📁 Build artifacts:');
  console.log('   - dist/index.js (server)');
  console.log('   - dist/client/ (frontend)');
  console.log('   - dist/package.json (dependencies)');
  console.log('   - dist/health-check.js (health monitoring)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}