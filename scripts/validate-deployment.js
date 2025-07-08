#!/usr/bin/env node

// Deployment validation script
const http = require('http');
const fs = require('fs');

console.log('🔍 Starting deployment validation...');

// Check if build files exist
const requiredFiles = [
  'dist/index.js',
  'dist/package.json',
  'dist/client/index.html'
];

console.log('📁 Checking build files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Found: ${file}`);
}

// Validate environment variables
console.log('🌍 Validating environment variables...');
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

console.log('✅ Environment variables validated');

// Test health endpoints
function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description} endpoint working`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ ${description} endpoint failed with status ${res.statusCode}`);
          reject(new Error(`${description} endpoint failed`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${description} endpoint error:`, err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error(`❌ ${description} endpoint timeout`);
      req.destroy();
      reject(new Error(`${description} endpoint timeout`));
    });

    req.end();
  });
}

// Wait for server to start
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is ready');
          resolve();
        } else if (retries > 0) {
          console.log(`⏳ Server starting... (${retries} retries left)`);
          setTimeout(tryConnect, 2000);
          retries--;
        } else {
          reject(new Error('Server failed to start'));
        }
      });

      req.on('error', () => {
        if (retries > 0) {
          console.log(`⏳ Waiting for server... (${retries} retries left)`);
          setTimeout(tryConnect, 2000);
          retries--;
        } else {
          reject(new Error('Server failed to start'));
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (retries > 0) {
          setTimeout(tryConnect, 2000);
          retries--;
        } else {
          reject(new Error('Server timeout'));
        }
      });

      req.end();
    };

    tryConnect();
  });
}

async function validateDeployment() {
  try {
    // Wait for server
    await waitForServer();
    
    // Test health endpoints
    console.log('🏥 Testing health endpoints...');
    const healthData = await testEndpoint('/health', 'Health');
    const readyData = await testEndpoint('/ready', 'Ready');
    
    console.log('📊 Health status:', healthData);
    console.log('🚀 Ready status:', readyData);
    
    // Test API endpoints
    console.log('🔌 Testing API endpoints...');
    await testEndpoint('/api/user', 'User API');
    await testEndpoint('/api/projects', 'Projects API');
    
    console.log('✅ All deployment validation checks passed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Deployment validation failed:', error.message);
    process.exit(1);
  }
}

validateDeployment();