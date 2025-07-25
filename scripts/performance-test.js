#!/usr/bin/env node

/**
 * 统一JWT认证系统性能测试脚本
 * 测试JWT生成、验证、刷新等操作的性能
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// 测试配置
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  concurrency: parseInt(process.env.TEST_CONCURRENCY || '10', 10),
  iterations: parseInt(process.env.TEST_ITERATIONS || '100', 10),
  testUser: {
    username: process.env.TEST_USERNAME || 'admin',
    password: process.env.TEST_PASSWORD || 'admin123',
  },
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 性能统计类
class PerformanceStats {
  constructor(name) {
    this.name = name;
    this.times = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
  }

  addTime(time) {
    this.times.push(time);
  }

  addError(error) {
    this.errors.push(error);
  }

  getStats() {
    if (this.times.length === 0) {
      return {
        name: this.name,
        count: 0,
        errors: this.errors.length,
        avg: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
        totalTime: this.endTime - this.startTime,
      };
    }

    const sorted = [...this.times].sort((a, b) => a - b);
    const sum = this.times.reduce((a, b) => a + b, 0);

    return {
      name: this.name,
      count: this.times.length,
      errors: this.errors.length,
      avg: sum / this.times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      totalTime: this.endTime - this.startTime,
      rps: this.times.length / ((this.endTime - this.startTime) / 1000),
    };
  }

  printStats() {
    const stats = this.getStats();
    
    colorLog('cyan', `\n=== ${stats.name} ===`);
    console.log(`Total Requests: ${stats.count}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Success Rate: ${((stats.count - stats.errors) / stats.count * 100).toFixed(2)}%`);
    console.log(`Average Time: ${stats.avg.toFixed(2)}ms`);
    console.log(`Min Time: ${stats.min.toFixed(2)}ms`);
    console.log(`Max Time: ${stats.max.toFixed(2)}ms`);
    console.log(`95th Percentile: ${stats.p95.toFixed(2)}ms`);
    console.log(`99th Percentile: ${stats.p99.toFixed(2)}ms`);
    console.log(`Requests/Second: ${stats.rps.toFixed(2)}`);
    console.log(`Total Time: ${stats.totalTime.toFixed(2)}ms`);
  }
}

// HTTP客户端
class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.refreshToken = null;
  }

  async request(method, path, data = null, headers = {}) {
    const start = performance.now();
    
    try {
      const config = {
        method,
        url: `${this.baseUrl}${path}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (data) {
        config.data = data;
      }

      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await axios(config);
      const end = performance.now();
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        time: end - start,
      };
    } catch (error) {
      const end = performance.now();
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        time: end - start,
      };
    }
  }

  async login() {
    const result = await this.request('POST', '/api/auth/login', CONFIG.testUser);
    
    if (result.success && result.data.data) {
      this.token = result.data.data.accessToken;
      this.refreshToken = result.data.data.refreshToken;
    }
    
    return result;
  }

  async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const result = await this.request('POST', '/api/auth/refresh', {
      refreshToken: this.refreshToken,
    });

    if (result.success && result.data.data) {
      this.token = result.data.data.accessToken;
      this.refreshToken = result.data.data.refreshToken;
    }

    return result;
  }

  async getProfile() {
    return await this.request('GET', '/api/auth/profile');
  }

  async logout() {
    const result = await this.request('POST', '/api/auth/logout');
    this.token = null;
    this.refreshToken = null;
    return result;
  }
}

// 测试函数
async function testLogin(stats) {
  const client = new HttpClient(CONFIG.baseUrl);
  
  stats.start();
  
  const promises = [];
  for (let i = 0; i < CONFIG.iterations; i++) {
    promises.push(
      (async () => {
        const result = await client.login();
        
        if (result.success) {
          stats.addTime(result.time);
        } else {
          stats.addError(result.error);
        }
      })()
    );

    // 控制并发数
    if (promises.length >= CONFIG.concurrency) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  stats.end();
}

async function testTokenVerification(stats) {
  const client = new HttpClient(CONFIG.baseUrl);
  
  // 先登录获取token
  await client.login();
  
  stats.start();
  
  const promises = [];
  for (let i = 0; i < CONFIG.iterations; i++) {
    promises.push(
      (async () => {
        const result = await client.getProfile();
        
        if (result.success) {
          stats.addTime(result.time);
        } else {
          stats.addError(result.error);
        }
      })()
    );

    // 控制并发数
    if (promises.length >= CONFIG.concurrency) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  stats.end();
}

async function testTokenRefresh(stats) {
  const client = new HttpClient(CONFIG.baseUrl);
  
  // 先登录获取token
  await client.login();
  
  stats.start();
  
  const promises = [];
  for (let i = 0; i < Math.min(CONFIG.iterations, 50); i++) { // 限制刷新次数
    promises.push(
      (async () => {
        const result = await client.refreshTokens();
        
        if (result.success) {
          stats.addTime(result.time);
        } else {
          stats.addError(result.error);
        }
      })()
    );

    // 控制并发数
    if (promises.length >= Math.min(CONFIG.concurrency, 5)) { // 限制刷新并发
      await Promise.all(promises);
      promises.length = 0;
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  stats.end();
}

async function testMixedOperations(stats) {
  const clients = Array.from({ length: CONFIG.concurrency }, () => new HttpClient(CONFIG.baseUrl));
  
  // 所有客户端先登录
  await Promise.all(clients.map(client => client.login()));
  
  stats.start();
  
  const promises = [];
  for (let i = 0; i < CONFIG.iterations; i++) {
    const client = clients[i % clients.length];
    const operation = i % 4; // 4种操作轮换
    
    promises.push(
      (async () => {
        let result;
        
        switch (operation) {
          case 0: // 获取用户信息
            result = await client.getProfile();
            break;
          case 1: // 刷新token (每10次操作刷新一次)
            if (i % 10 === 0) {
              result = await client.refreshTokens();
            } else {
              result = await client.getProfile();
            }
            break;
          case 2: // 重新登录 (每20次操作重新登录一次)
            if (i % 20 === 0) {
              result = await client.login();
            } else {
              result = await client.getProfile();
            }
            break;
          default: // 默认获取用户信息
            result = await client.getProfile();
            break;
        }
        
        if (result.success) {
          stats.addTime(result.time);
        } else {
          stats.addError(result.error);
        }
      })()
    );

    // 控制并发数
    if (promises.length >= CONFIG.concurrency) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  stats.end();
}

// 主测试函数
async function runPerformanceTests() {
  colorLog('green', '🚀 Starting JWT Authentication Performance Tests');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Concurrency: ${CONFIG.concurrency}`);
  console.log(`Iterations: ${CONFIG.iterations}`);
  console.log(`Test User: ${CONFIG.testUser.username}`);

  try {
    // 测试服务是否可用
    colorLog('yellow', '\n📡 Testing service availability...');
    const client = new HttpClient(CONFIG.baseUrl);
    const healthCheck = await client.request('GET', '/health');
    
    if (!healthCheck.success) {
      colorLog('red', '❌ Service is not available');
      process.exit(1);
    }
    
    colorLog('green', '✅ Service is available');

    // 1. 登录性能测试
    colorLog('yellow', '\n🔐 Testing login performance...');
    const loginStats = new PerformanceStats('Login Performance');
    await testLogin(loginStats);
    loginStats.printStats();

    // 2. Token验证性能测试
    colorLog('yellow', '\n🔍 Testing token verification performance...');
    const verificationStats = new PerformanceStats('Token Verification Performance');
    await testTokenVerification(verificationStats);
    verificationStats.printStats();

    // 3. Token刷新性能测试
    colorLog('yellow', '\n🔄 Testing token refresh performance...');
    const refreshStats = new PerformanceStats('Token Refresh Performance');
    await testTokenRefresh(refreshStats);
    refreshStats.printStats();

    // 4. 混合操作性能测试
    colorLog('yellow', '\n🎯 Testing mixed operations performance...');
    const mixedStats = new PerformanceStats('Mixed Operations Performance');
    await testMixedOperations(mixedStats);
    mixedStats.printStats();

    // 总结
    colorLog('green', '\n📊 Performance Test Summary');
    console.log('All tests completed successfully!');
    
    const allStats = [loginStats, verificationStats, refreshStats, mixedStats];
    const totalRequests = allStats.reduce((sum, stats) => sum + stats.getStats().count, 0);
    const totalErrors = allStats.reduce((sum, stats) => sum + stats.getStats().errors, 0);
    const avgRps = allStats.reduce((sum, stats) => sum + stats.getStats().rps, 0) / allStats.length;
    
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Overall Success Rate: ${((totalRequests - totalErrors) / totalRequests * 100).toFixed(2)}%`);
    console.log(`Average RPS: ${avgRps.toFixed(2)}`);

  } catch (error) {
    colorLog('red', `❌ Performance test failed: ${error.message}`);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runPerformanceTests().catch(error => {
    colorLog('red', `Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  PerformanceStats,
  HttpClient,
};
