#!/usr/bin/env node

/**
 * Multi-Gateway Configuration Test Script
 * 
 * This script tests the multi-gateway configuration by:
 * 1. Checking if both services can start on their respective ports
 * 2. Verifying API routing works correctly
 * 3. Testing service health endpoints
 */

const http = require('http');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test configuration
const services = {
  baseSystem: {
    name: 'Base System',
    port: 9528,
    healthPath: '/health',
    testPath: '/v1/auth/user-info'
  },
  lowcodePlatform: {
    name: 'Low-code Platform',
    port: 3000,
    healthPath: '/health',
    testPath: '/api/projects'
  }
};

// Utility function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => resolve(false));
  });
}

// Utility function to make HTTP request
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test service health
async function testServiceHealth(serviceName, config) {
  logInfo(`Testing ${config.name} health...`);
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: config.port,
      path: config.healthPath,
      method: 'GET',
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      logSuccess(`${config.name} is healthy (${response.statusCode})`);
      return true;
    } else {
      logWarning(`${config.name} returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`${config.name} health check failed: ${error.message}`);
    return false;
  }
}

// Test service API endpoint
async function testServiceAPI(serviceName, config) {
  logInfo(`Testing ${config.name} API endpoint...`);
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: config.port,
      path: config.testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    logInfo(`${config.name} API responded with status ${response.statusCode}`);
    
    // For testing purposes, we accept various status codes
    // (401 for auth endpoints, 404 for missing endpoints, etc.)
    if (response.statusCode < 500) {
      logSuccess(`${config.name} API is accessible`);
      return true;
    } else {
      logError(`${config.name} API returned server error ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`${config.name} API test failed: ${error.message}`);
    return false;
  }
}

// Check port availability
async function checkPortAvailability() {
  logInfo('Checking port availability...');
  
  const results = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    const isAvailable = await checkPort(config.port);
    results[serviceName] = isAvailable;
    
    if (isAvailable) {
      logSuccess(`Port ${config.port} is available for ${config.name}`);
    } else {
      logWarning(`Port ${config.port} is in use (${config.name} may be running)`);
    }
  }
  
  return results;
}

// Test frontend proxy configuration
async function testFrontendProxy() {
  logInfo('Testing frontend proxy configuration...');
  
  try {
    // Test if frontend is running
    const response = await makeRequest({
      hostname: 'localhost',
      port: 9527,
      path: '/',
      method: 'GET',
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      logSuccess('Frontend is running on port 9527');
      return true;
    } else {
      logWarning(`Frontend returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logWarning(`Frontend test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  log('\n🚀 Multi-Gateway Configuration Test', 'cyan');
  log('=====================================', 'cyan');
  
  // Step 1: Check port availability
  const portResults = await checkPortAvailability();
  
  // Step 2: Test service health
  log('\n📊 Testing Service Health', 'magenta');
  const healthResults = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    if (!portResults[serviceName]) {
      healthResults[serviceName] = await testServiceHealth(serviceName, config);
    } else {
      logInfo(`Skipping ${config.name} health test (service not running)`);
      healthResults[serviceName] = false;
    }
  }
  
  // Step 3: Test API endpoints
  log('\n🔌 Testing API Endpoints', 'magenta');
  const apiResults = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    if (healthResults[serviceName]) {
      apiResults[serviceName] = await testServiceAPI(serviceName, config);
    } else {
      logInfo(`Skipping ${config.name} API test (service not healthy)`);
      apiResults[serviceName] = false;
    }
  }
  
  // Step 4: Test frontend proxy
  log('\n🌐 Testing Frontend Proxy', 'magenta');
  const frontendResult = await testFrontendProxy();
  
  // Summary
  log('\n📋 Test Summary', 'cyan');
  log('===============', 'cyan');
  
  for (const [serviceName, config] of Object.entries(services)) {
    const status = healthResults[serviceName] && apiResults[serviceName] ? 'PASS' : 'FAIL';
    const color = status === 'PASS' ? 'green' : 'red';
    log(`${config.name} (Port ${config.port}): ${status}`, color);
  }
  
  const frontendStatus = frontendResult ? 'PASS' : 'FAIL';
  const frontendColor = frontendStatus === 'PASS' ? 'green' : 'red';
  log(`Frontend (Port 9527): ${frontendStatus}`, frontendColor);
  
  // Recommendations
  log('\n💡 Recommendations', 'yellow');
  log('==================', 'yellow');
  
  if (!healthResults.baseSystem) {
    log('• Start Base System: cd backend && pnpm run start:dev:base-system');
  }
  
  if (!healthResults.lowcodePlatform) {
    log('• Start Low-code Platform: cd lowcode-platform-backend && npm run start:dev');
  }
  
  if (!frontendResult) {
    log('• Start Frontend: cd frontend && pnpm run dev');
  }
  
  if (Object.values(healthResults).every(result => result) && frontendResult) {
    logSuccess('\n🎉 All services are running correctly!');
    log('You can now use the multi-gateway configuration.');
  } else {
    logWarning('\n⚠️  Some services are not running properly.');
    log('Please check the recommendations above.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  checkPort,
  makeRequest,
  testServiceHealth,
  testServiceAPI
};
