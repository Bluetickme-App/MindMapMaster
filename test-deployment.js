#!/usr/bin/env node

// Comprehensive deployment test script
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

console.log('🧪 Starting comprehensive deployment test...');

// Test build process
async function testBuild() {
  console.log('🔨 Testing build process...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        console.error(`❌ Build failed with code ${code}`);
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    buildProcess.on('error', (error) => {
      console.error('❌ Build process error:', error);
      reject(error);
    });
  });
}

// Test production server startup
async function testProductionServer() {
  console.log('🚀 Testing production server startup...');
  
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit'
    });

    let serverStarted = false;
    
    // Give server time to start
    setTimeout(async () => {
      try {
        await testHealthEndpoints();
        console.log('✅ Production server started successfully');
        serverProcess.kill();
        resolve();
      } catch (error) {
        console.error('❌ Production server test failed:', error.message);
        serverProcess.kill();
        reject(error);
      }
    }, 10000); // Wait 10 seconds for server to start

    serverProcess.on('error', (error) => {
      console.error('❌ Server startup error:', error);
      if (!serverStarted) {
        reject(error);
      }
    });
  });
}

// Test health endpoints
async function testHealthEndpoints() {
  console.log('🏥 Testing health endpoints...');
  
  const endpoints = [
    { path: '/health', name: 'Health' },
    { path: '/ready', name: 'Ready' }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.path, endpoint.name);
  }
}

// Test individual endpoint
function testEndpoint(path, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} endpoint working`);
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`${name} endpoint failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`${name} endpoint error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`${name} endpoint timeout`));
    });

    req.end();
  });
}

// Main test runner
async function runTests() {
  try {
    // Test build
    await testBuild();
    
    // Verify build artifacts
    console.log('📁 Verifying build artifacts...');
    const requiredFiles = [
      'dist/index.js',
      'dist/client/index.html'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing required file: ${file}`);
      }
      console.log(`✅ Found: ${file}`);
    }
    
    // Test production server
    await testProductionServer();
    
    console.log('🎉 All deployment tests passed!');
    console.log('✅ Application is ready for production deployment');
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();