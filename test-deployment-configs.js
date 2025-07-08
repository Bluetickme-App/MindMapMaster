#!/usr/bin/env node

// Test deployment configurations
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing deployment configurations...');

// Test files exist
const deploymentFiles = [
  'vercel.json',
  'railway.json',
  'nixpacks.toml',
  'Dockerfile',
  'VERCEL_DEPLOYMENT.md',
  'RAILWAY_DEPLOYMENT.md',
  'DEPLOYMENT_COMPARISON.md',
  'scripts/build-vercel.js',
  'scripts/build-railway.js',
  'scripts/deploy-vercel.js',
  'scripts/deploy-railway.js'
];

console.log('📁 Checking deployment files...');
let allFilesExist = true;
for (const file of deploymentFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
}

// Test configuration files are valid JSON
console.log('\n📋 Validating configuration files...');
const configFiles = [
  { file: 'vercel.json', name: 'Vercel' },
  { file: 'railway.json', name: 'Railway' }
];

let allConfigsValid = true;
for (const config of configFiles) {
  try {
    const content = fs.readFileSync(config.file, 'utf8');
    JSON.parse(content);
    console.log(`✅ ${config.name} configuration valid`);
  } catch (error) {
    console.log(`❌ ${config.name} configuration invalid: ${error.message}`);
    allConfigsValid = false;
  }
}

// Test package.json for deployment scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'build:vercel',
  'build:railway',
  'deploy:vercel',
  'deploy:railway'
];

let allScriptsExist = true;
for (const script of requiredScripts) {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ Script found: ${script}`);
  } else {
    console.log(`❌ Script missing: ${script}`);
    allScriptsExist = false;
  }
}

// Test health endpoints
console.log('\n🏥 Testing health endpoints...');
import http from 'http';

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
          resolve();
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
    await testEndpoint('/health', 'Health');
    await testEndpoint('/ready', 'Ready');
    return true;
  } catch (error) {
    return false;
  }
}

// Run all tests
async function runTests() {
  const healthTestPassed = await testHealthEndpoints();
  
  console.log('\n📋 Test Summary:');
  console.log(`   Deployment files exist: ${allFilesExist ? '✅' : '❌'}`);
  console.log(`   Configuration files valid: ${allConfigsValid ? '✅' : '❌'}`);
  console.log(`   Package.json scripts: ${allScriptsExist ? '✅' : '❌'}`);
  console.log(`   Health endpoints: ${healthTestPassed ? '✅' : '❌'}`);
  
  if (allFilesExist && allConfigsValid && allScriptsExist && healthTestPassed) {
    console.log('\n🎉 All deployment configurations are ready!');
    console.log('✅ You can now deploy to:');
    console.log('   - Vercel: npm run deploy:vercel');
    console.log('   - Railway: npm run deploy:railway');
    return true;
  } else {
    console.log('\n❌ Some deployment configurations need attention');
    return false;
  }
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });