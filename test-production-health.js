#!/usr/bin/env node

// Test script to verify production deployment health endpoints
import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🚀 Testing Production Health Endpoints...\n');

// Clean up any existing build
if (existsSync('dist')) {
  rmSync('dist', { recursive: true });
  console.log('🧹 Cleaned existing build directory');
}

// Start build process
console.log('⚡ Building application...');
const buildProcess = spawn('npm', ['run', 'build'], { 
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'production' }
});

let buildOutput = '';
buildProcess.stdout.on('data', (data) => {
  buildOutput += data.toString();
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  buildOutput += data.toString();
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Build completed successfully');
    
    // Check build artifacts
    if (existsSync('dist/index.js')) {
      console.log('✅ Server bundle created: dist/index.js');
      
      // Test production server start
      console.log('\n🚀 Starting production server...');
      const prodServer = spawn('node', ['dist/index.js'], { 
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      let serverOutput = '';
      prodServer.stdout.on('data', (data) => {
        serverOutput += data.toString();
        process.stdout.write(data);
        
        if (data.toString().includes('serving on port 5000')) {
          console.log('\n✅ Production server started successfully');
          
          // Test health endpoints
          setTimeout(async () => {
            try {
              const { default: fetch } = await import('node-fetch');
              
              console.log('\n🩺 Testing health endpoints...');
              
              // Test /health endpoint
              const healthResponse = await fetch('http://localhost:5000/health');
              if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('✅ /health endpoint working:', healthData);
              } else {
                console.log('❌ /health endpoint failed:', healthResponse.status);
              }
              
              // Test /ready endpoint
              const readyResponse = await fetch('http://localhost:5000/ready');
              if (readyResponse.ok) {
                const readyData = await readyResponse.json();
                console.log('✅ /ready endpoint working:', readyData);
              } else {
                console.log('❌ /ready endpoint failed:', readyResponse.status);
              }
              
              console.log('\n🎉 Production deployment tests completed!');
              
            } catch (error) {
              console.error('❌ Health check failed:', error.message);
            } finally {
              prodServer.kill();
              process.exit(0);
            }
          }, 3000);
        }
      });
      
      prodServer.stderr.on('data', (data) => {
        serverOutput += data.toString();
        process.stderr.write(data);
      });
      
      prodServer.on('close', (code) => {
        console.log(`\nProduction server exited with code ${code}`);
        process.exit(code);
      });
      
      // Kill server after 30 seconds if no response
      setTimeout(() => {
        console.log('⏰ Timeout: Killing production server');
        prodServer.kill();
        process.exit(1);
      }, 30000);
      
    } else {
      console.log('❌ Server bundle not found in dist/index.js');
      process.exit(1);
    }
  } else {
    console.log(`❌ Build failed with exit code ${code}`);
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});