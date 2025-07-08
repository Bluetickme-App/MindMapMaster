#!/usr/bin/env node

// Quick production test script to validate deployment readiness
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import fetch from 'node-fetch';

console.log('🚀 Testing Production Deployment Readiness...\n');

// Test 1: Check if build can be created
console.log('1. Building application for production...');
const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build successful\n');
    
    // Test 2: Check if built files exist
    console.log('2. Checking build artifacts...');
    if (existsSync('dist/index.js')) {
      console.log('✅ Server bundle created: dist/index.js');
    } else {
      console.log('❌ Missing server bundle');
    }
    
    if (existsSync('dist/assets')) {
      console.log('✅ Client assets created: dist/assets');
    } else {
      console.log('❌ Missing client assets');
    }
    
    // Test 3: Start production server
    console.log('\n3. Starting production server...');
    const prodServer = spawn('npm', ['start'], { stdio: 'pipe' });
    
    let serverStarted = false;
    prodServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('serving on port 5000') && !serverStarted) {
        serverStarted = true;
        setTimeout(async () => {
          try {
            console.log('\n4. Testing health endpoint...');
            const response = await fetch('http://localhost:5000/health');
            const data = await response.json();
            console.log('✅ Health endpoint response:', data);
            
            console.log('\n5. Testing ready endpoint...');
            const readyResponse = await fetch('http://localhost:5000/ready');
            const readyData = await readyResponse.json();
            console.log('✅ Ready endpoint response:', readyData);
            
            console.log('\n🎉 Production deployment tests completed successfully!');
          } catch (error) {
            console.error('❌ Health check failed:', error.message);
          } finally {
            prodServer.kill();
            process.exit(0);
          }
        }, 2000);
      }
    });
    
    prodServer.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    prodServer.on('close', (code) => {
      console.log(`Production server exited with code ${code}`);
      process.exit(code);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        console.error('❌ Production server failed to start within 30 seconds');
        prodServer.kill();
        process.exit(1);
      }
    }, 30000);
    
  } else {
    console.error('❌ Build failed');
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});