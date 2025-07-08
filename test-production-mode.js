#!/usr/bin/env node

// Simple test for production mode startup
import http from 'http';
import { spawn } from 'child_process';

console.log('🧪 Testing production mode startup...');

// Test production server startup
async function testProductionMode() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server in production mode...');
    
    const serverProcess = spawn('node', ['server/index.ts'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        // Use tsx for TypeScript execution
        PATH: process.env.PATH 
      },
      stdio: 'inherit'
    });

    let testCompleted = false;
    
    // Give server time to start
    setTimeout(async () => {
      if (testCompleted) return;
      
      try {
        console.log('🏥 Testing health endpoints...');
        
        // Test health endpoint
        const healthResponse = await testEndpoint('/health', 'Health');
        console.log('✅ Health endpoint response:', healthResponse);
        
        // Test ready endpoint
        const readyResponse = await testEndpoint('/ready', 'Ready');
        console.log('✅ Ready endpoint response:', readyResponse);
        
        console.log('🎉 Production mode test completed successfully!');
        testCompleted = true;
        serverProcess.kill();
        resolve();
        
      } catch (error) {
        console.error('❌ Production mode test failed:', error.message);
        testCompleted = true;
        serverProcess.kill();
        reject(error);
      }
    }, 8000); // Wait 8 seconds for server to start

    serverProcess.on('error', (error) => {
      console.error('❌ Server startup error:', error);
      if (!testCompleted) {
        testCompleted = true;
        reject(error);
      }
    });
  });
}

// Test individual endpoint
function testEndpoint(path, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
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

// Run the test
testProductionMode()
  .then(() => {
    console.log('✅ All production mode tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Production mode test failed:', error.message);
    process.exit(1);
  });