/*
 * @Description: AMIS兼容性全面测试
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 02:45:00
 * @LastEditors: henry.xiukun
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://127.0.0.1:3000';
const TEST_RESULTS_DIR = './test-results';

// 确保测试结果目录存在
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

/**
 * 发送HTTP请求
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AMIS-Compatibility-Test/1.0',
      },
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: responseData,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            rawData: responseData,
            parseError: error.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * AMIS格式验证器
 */
class AmisFormatValidator {
  static validateBasicResponse(data) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
      errors.push('响应数据必须是对象');
      return { isValid: false, errors, warnings };
    }

    // 检查基础字段
    if (typeof data.status !== 'number') {
      errors.push('缺少status字段或类型错误');
    } else if (data.status !== 0 && data.status !== 1) {
      warnings.push('status字段值不标准，建议使用0(成功)或1(失败)');
    }

    if (typeof data.msg !== 'string') {
      errors.push('缺少msg字段或类型错误');
    }

    if (data.data === undefined) {
      errors.push('缺少data字段');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateListFormat(data) {
    const errors = [];
    const warnings = [];

    if (!data.data || typeof data.data !== 'object') {
      errors.push('data字段必须是对象');
      return { isValid: false, errors, warnings };
    }

    // 检查AMIS标准字段
    if (data.data.options !== undefined) {
      if (!Array.isArray(data.data.options)) {
        errors.push('options字段必须是数组');
      }
    } else if (data.data.items !== undefined) {
      warnings.push('使用了旧格式的items字段，建议改为options');
      if (!Array.isArray(data.data.items)) {
        errors.push('items字段必须是数组');
      }
    }

    // 检查分页字段
    if (data.data.page !== undefined) {
      if (typeof data.data.page !== 'number') {
        errors.push('page字段必须是数字');
      }
    } else if (data.data.current !== undefined) {
      warnings.push('使用了旧格式的current字段，建议改为page');
    }

    if (data.data.perPage !== undefined) {
      if (typeof data.data.perPage !== 'number') {
        errors.push('perPage字段必须是数字');
      }
    } else if (data.data.size !== undefined) {
      warnings.push('使用了旧格式的size字段，建议改为perPage');
    }

    if (data.data.total !== undefined && typeof data.data.total !== 'number') {
      errors.push('total字段必须是数字');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateArrayFormat(data) {
    const errors = [];
    const warnings = [];

    if (!data.data || typeof data.data !== 'object') {
      errors.push('data字段必须是对象');
      return { isValid: false, errors, warnings };
    }

    if (data.data.options !== undefined) {
      if (!Array.isArray(data.data.options)) {
        errors.push('options字段必须是数组');
      }
    } else if (data.data.items !== undefined) {
      warnings.push('使用了旧格式的items字段，建议改为options');
    } else if (Array.isArray(data.data)) {
      warnings.push('data字段直接是数组，建议包装在options字段中');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

/**
 * 测试用例定义
 */
const testCases = [
  // AMIS演示接口
  {
    name: 'AMIS演示 - 数组数据',
    url: '/api/v1/amis-demo/array',
    method: 'GET',
    expectedFormat: 'array',
    description: '测试数组数据的AMIS格式',
  },
  {
    name: 'AMIS演示 - 分页数据',
    url: '/api/v1/amis-demo/pagination',
    method: 'GET',
    expectedFormat: 'pagination',
    description: '测试分页数据的AMIS格式',
  },
  {
    name: 'AMIS演示 - 对象数据',
    url: '/api/v1/amis-demo/object',
    method: 'GET',
    expectedFormat: 'object',
    description: '测试对象数据的AMIS格式',
  },

  // 项目管理接口
  {
    name: '项目列表（数组）',
    url: '/api/v1/projects',
    method: 'GET',
    expectedFormat: 'array',
    description: '测试项目列表的数组格式',
  },
  {
    name: '项目分页列表',
    url: '/api/v1/projects/paginated?current=1&size=5',
    method: 'GET',
    expectedFormat: 'pagination',
    description: '测试项目分页列表的格式',
  },

  // 实体管理接口
  {
    name: '实体分页列表',
    url: '/api/v1/entities/project/test-project-id/paginated?current=1&size=5',
    method: 'GET',
    expectedFormat: 'pagination',
    description: '测试实体分页列表的格式',
  },

  // 关系管理接口
  {
    name: '关系类型列表',
    url: '/api/v1/relationships/meta/types',
    method: 'GET',
    expectedFormat: 'array',
    description: '测试关系类型列表格式',
  },
  {
    name: '关系列表',
    url: '/api/v1/relationships?page=1&perPage=5',
    method: 'GET',
    expectedFormat: 'pagination',
    description: '测试关系列表的分页格式',
  },

  // 代码生成接口
  {
    name: '关联查询配置列表',
    url: '/api/v1/code-generation/join-query/configs?page=1&perPage=5',
    method: 'GET',
    expectedFormat: 'pagination',
    description: '测试关联查询配置列表格式',
  },
];

/**
 * 执行单个测试用例
 */
async function runTestCase(testCase) {
  console.log(`\n🔍 测试: ${testCase.name}`);
  console.log(`   描述: ${testCase.description}`);
  console.log(`   URL: ${testCase.method} ${testCase.url}`);

  const result = {
    name: testCase.name,
    url: testCase.url,
    method: testCase.method,
    expectedFormat: testCase.expectedFormat,
    success: false,
    status: null,
    validation: null,
    errors: [],
    warnings: [],
    responseTime: 0,
    responseSize: 0,
  };

  try {
    const startTime = Date.now();
    const response = await makeRequest(`${BASE_URL}${testCase.url}`, testCase.method);
    const endTime = Date.now();

    result.responseTime = endTime - startTime;
    result.status = response.status;
    result.responseSize = response.rawData ? response.rawData.length : 0;

    console.log(`   状态码: ${response.status}`);
    console.log(`   响应时间: ${result.responseTime}ms`);
    console.log(`   响应大小: ${result.responseSize} bytes`);

    if (response.status === 200) {
      // 基础格式验证
      const basicValidation = AmisFormatValidator.validateBasicResponse(response.data);
      result.validation = basicValidation;

      if (basicValidation.isValid) {
        // 根据预期格式进行详细验证
        let detailedValidation;
        switch (testCase.expectedFormat) {
          case 'array':
            detailedValidation = AmisFormatValidator.validateArrayFormat(response.data);
            break;
          case 'pagination':
            detailedValidation = AmisFormatValidator.validateListFormat(response.data);
            break;
          case 'object':
            detailedValidation = { isValid: true, errors: [], warnings: [] };
            break;
          default:
            detailedValidation = { isValid: true, errors: [], warnings: [] };
        }

        result.errors = [...basicValidation.errors, ...detailedValidation.errors];
        result.warnings = [...basicValidation.warnings, ...detailedValidation.warnings];
        result.success = result.errors.length === 0;

        if (result.success) {
          console.log('   ✅ AMIS格式验证通过');
        } else {
          console.log('   ❌ AMIS格式验证失败:');
          result.errors.forEach(error => console.log(`      - ${error}`));
        }

        if (result.warnings.length > 0) {
          console.log('   ⚠️ 格式警告:');
          result.warnings.forEach(warning => console.log(`      - ${warning}`));
        }

        // 显示数据结构
        if (response.data.data) {
          const dataKeys = Object.keys(response.data.data);
          console.log(`   📊 数据结构: [${dataKeys.join(', ')}]`);
          
          if (response.data.data.options && Array.isArray(response.data.data.options)) {
            console.log(`   📝 options数组长度: ${response.data.data.options.length}`);
          }
          if (response.data.data.items && Array.isArray(response.data.data.items)) {
            console.log(`   📝 items数组长度: ${response.data.data.items.length}`);
          }
        }

      } else {
        result.errors = basicValidation.errors;
        result.warnings = basicValidation.warnings;
        console.log('   ❌ 基础格式验证失败:');
        result.errors.forEach(error => console.log(`      - ${error}`));
      }

    } else {
      result.errors.push(`HTTP状态码错误: ${response.status}`);
      console.log(`   ❌ 请求失败: HTTP ${response.status}`);
      
      if (response.data && response.data.message) {
        console.log(`   错误信息: ${response.data.message}`);
      }
    }

  } catch (error) {
    result.errors.push(`请求异常: ${error.message}`);
    console.log(`   ❌ 请求异常: ${error.message}`);
  }

  return result;
}

/**
 * 生成测试报告
 */
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      withWarnings: results.filter(r => r.warnings.length > 0).length,
    },
    performance: {
      averageResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length),
      maxResponseTime: Math.max(...results.map(r => r.responseTime)),
      minResponseTime: Math.min(...results.map(r => r.responseTime)),
      totalResponseSize: results.reduce((sum, r) => sum + r.responseSize, 0),
    },
    results: results,
  };

  return report;
}

/**
 * 保存测试报告
 */
function saveTestReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(TEST_RESULTS_DIR, `amis-compatibility-${timestamp}.json`);
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportFile}`);
  
  // 生成简化的文本报告
  const textReportFile = path.join(TEST_RESULTS_DIR, `amis-compatibility-${timestamp}.txt`);
  const textReport = generateTextReport(report);
  fs.writeFileSync(textReportFile, textReport);
  console.log(`📄 文本报告已保存: ${textReportFile}`);
}

/**
 * 生成文本报告
 */
function generateTextReport(report) {
  let text = `AMIS兼容性测试报告\n`;
  text += `生成时间: ${report.timestamp}\n`;
  text += `==========================================\n\n`;
  
  text += `测试总结:\n`;
  text += `- 总测试数: ${report.summary.total}\n`;
  text += `- 通过数: ${report.summary.passed}\n`;
  text += `- 失败数: ${report.summary.failed}\n`;
  text += `- 有警告: ${report.summary.withWarnings}\n`;
  text += `- 通过率: ${Math.round((report.summary.passed / report.summary.total) * 100)}%\n\n`;
  
  text += `性能统计:\n`;
  text += `- 平均响应时间: ${report.performance.averageResponseTime}ms\n`;
  text += `- 最大响应时间: ${report.performance.maxResponseTime}ms\n`;
  text += `- 最小响应时间: ${report.performance.minResponseTime}ms\n`;
  text += `- 总响应大小: ${Math.round(report.performance.totalResponseSize / 1024)}KB\n\n`;
  
  text += `详细结果:\n`;
  text += `==========================================\n`;
  
  report.results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    text += `${index + 1}. ${status} ${result.name}\n`;
    text += `   URL: ${result.method} ${result.url}\n`;
    text += `   状态码: ${result.status}\n`;
    text += `   响应时间: ${result.responseTime}ms\n`;
    
    if (result.errors.length > 0) {
      text += `   错误:\n`;
      result.errors.forEach(error => {
        text += `     - ${error}\n`;
      });
    }
    
    if (result.warnings.length > 0) {
      text += `   警告:\n`;
      result.warnings.forEach(warning => {
        text += `     - ${warning}\n`;
      });
    }
    
    text += `\n`;
  });
  
  return text;
}

/**
 * 主测试函数
 */
async function runAmisCompatibilityTests() {
  console.log('🚀 AMIS兼容性全面测试');
  console.log('==========================================\n');

  // 检查服务状态
  console.log('⏳ 检查服务状态...');
  try {
    await makeRequest(`${BASE_URL}/api/v1/amis-demo/array`);
    console.log('✅ 服务正常运行\n');
  } catch (error) {
    console.log('❌ 服务未启动或无法访问');
    console.log(`错误: ${error.message}`);
    return;
  }

  // 执行测试用例
  console.log(`📋 开始执行 ${testCases.length} 个测试用例...\n`);
  
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${i + 1}/${testCases.length}]`);
    
    const result = await runTestCase(testCase);
    results.push(result);
    
    // 添加延迟避免请求过快
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 生成和保存报告
  const report = generateTestReport(results);
  saveTestReport(report);

  // 显示总结
  console.log('\n📊 测试总结');
  console.log('==========================================');
  console.log(`总测试数: ${report.summary.total}`);
  console.log(`通过数: ${report.summary.passed}`);
  console.log(`失败数: ${report.summary.failed}`);
  console.log(`有警告: ${report.summary.withWarnings}`);
  console.log(`通过率: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`);
  
  console.log('\n⚡ 性能统计');
  console.log('==========================================');
  console.log(`平均响应时间: ${report.performance.averageResponseTime}ms`);
  console.log(`最大响应时间: ${report.performance.maxResponseTime}ms`);
  console.log(`最小响应时间: ${report.performance.minResponseTime}ms`);

  // 建议
  console.log('\n💡 改进建议');
  console.log('==========================================');
  
  const failedTests = results.filter(r => !r.success);
  const testsWithWarnings = results.filter(r => r.warnings.length > 0);
  
  if (failedTests.length === 0 && testsWithWarnings.length === 0) {
    console.log('🎉 所有测试都通过了，AMIS格式完全兼容！');
  } else {
    if (failedTests.length > 0) {
      console.log(`- 修复 ${failedTests.length} 个失败的测试用例`);
    }
    if (testsWithWarnings.length > 0) {
      console.log(`- 处理 ${testsWithWarnings.length} 个警告，建议使用AMIS标准字段名`);
    }
  }

  console.log('\n🎯 AMIS兼容性测试完成！');
  
  return report;
}

// 运行测试
if (require.main === module) {
  runAmisCompatibilityTests().catch(console.error);
}

module.exports = {
  runAmisCompatibilityTests,
  AmisFormatValidator,
};
