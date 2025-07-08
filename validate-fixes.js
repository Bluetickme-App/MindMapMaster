#!/usr/bin/env node

// Simple validation script to test deployment fixes
import fs from 'fs';
import http from 'http';

console.log('🔍 Validating deployment fixes...');

// Check if all fix files exist
const fixFiles = [
  'server/production-config.ts',
  'DEPLOYMENT_FIXES_APPLIED.md',
  'build-production.sh',
  'scripts/build-production.js',
  'scripts/validate-deployment.js'
];

console.log('📁 Checking deployment fix files...');
let allFilesExist = true;
for (const file of fixFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
}

// Check if server files have been modified correctly
console.log('\n🔧 Checking server modifications...');
const serverIndexContent = fs.readFileSync('server/index.ts', 'utf8');
const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
const webSocketContent = fs.readFileSync('server/services/websocket-manager.ts', 'utf8');

const checks = [
  {
    name: 'Health endpoints in server/index.ts',
    content: serverIndexContent,
    pattern: /app\.get\(\'\/health\'/,
    expected: true
  },
  {
    name: 'Ready endpoints in server/index.ts',
    content: serverIndexContent,
    pattern: /app\.get\(\'\/ready\'/,
    expected: true
  },
  {
    name: 'Graceful shutdown handlers',
    content: serverIndexContent,
    pattern: /process\.on\(\'SIGTERM\'/,
    expected: true
  },
  {
    name: 'Production error handling',
    content: serverIndexContent,
    pattern: /if \(app\.get\(\"env\"\) === \"development\"\)/,
    expected: true
  },
  {
    name: 'WebSocket error handling',
    content: routesContent,
    pattern: /Don\'t exit in production - continue without WebSocket/,
    expected: true
  },
  {
    name: 'WebSocket constructor error handling',
    content: webSocketContent,
    pattern: /WebSocket disabled in production due to error/,
    expected: true
  }
];

let allChecksPass = true;
for (const check of checks) {
  const matches = check.pattern.test(check.content);
  if (matches === check.expected) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    allChecksPass = false;
  }
}

// Test health endpoints
console.log('\n🏥 Testing health endpoints...');

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
          console.log(`✅ ${name} endpoint working`);
          resolve(JSON.parse(data));
        } else {
          console.log(`❌ ${name} endpoint failed with status ${res.statusCode}`);
          reject(new Error(`${name} endpoint failed`));
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} endpoint error: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${name} endpoint timeout`);
      reject(new Error(`${name} endpoint timeout`));
    });

    req.end();
  });
}

async function testHealthEndpoints() {
  try {
    const healthData = await testEndpoint('/health', 'Health');
    const readyData = await testEndpoint('/ready', 'Ready');
    
    console.log('\n📊 Health check results:');
    console.log(`   Status: ${healthData.status}`);
    console.log(`   Environment: ${healthData.environment}`);
    console.log(`   Database: ${readyData.database}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Health endpoint test failed: ${error.message}`);
    return false;
  }
}

// Run all validations
async function runValidation() {
  console.log('\n🧪 Running comprehensive validation...');
  
  const healthTestPassed = await testHealthEndpoints();
  
  console.log('\n📋 Validation Summary:');
  console.log(`   Fix files exist: ${allFilesExist ? '✅' : '❌'}`);
  console.log(`   Server modifications: ${allChecksPass ? '✅' : '❌'}`);
  console.log(`   Health endpoints: ${healthTestPassed ? '✅' : '❌'}`);
  
  if (allFilesExist && allChecksPass && healthTestPassed) {
    console.log('\n🎉 All deployment fixes validated successfully!');
    console.log('✅ Application is ready for production deployment');
    return true;
  } else {
    console.log('\n❌ Some deployment fixes failed validation');
    return false;
  }
}

runValidation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });