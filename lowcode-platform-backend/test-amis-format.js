/*
 * @Description: AMIS格式标准化测试脚本
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 02:15:00
 * @LastEditors: henry.xiukun
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试AMIS格式的API接口
const testEndpoints = [
  {
    name: 'AMIS演示 - 数组数据',
    url: '/api/v1/amis-demo/array',
    method: 'GET',
    expectedFormat: 'array_with_options',
  },
  {
    name: 'AMIS演示 - 分页数据',
    url: '/api/v1/amis-demo/pagination',
    method: 'GET',
    expectedFormat: 'pagination_with_options',
  },
  {
    name: '项目列表',
    url: '/api/v1/projects',
    method: 'GET',
    expectedFormat: 'pagination_with_options',
  },
  {
    name: '实体列表',
    url: '/api/v1/entities',
    method: 'GET',
    expectedFormat: 'pagination_with_options',
  },
  {
    name: '关系类型列表',
    url: '/api/v1/relationships/meta/types',
    method: 'GET',
    expectedFormat: 'array_with_options',
  },
  {
    name: '关系列表',
    url: '/api/v1/relationships',
    method: 'GET',
    expectedFormat: 'pagination_with_options',
  },
];

/**
 * 验证AMIS格式
 */
function validateAmisFormat(data, expectedFormat) {
  const errors = [];
  const warnings = [];

  // 基础格式检查
  if (!data || typeof data !== 'object') {
    errors.push('响应数据必须是对象');
    return { isValid: false, errors, warnings };
  }

  if (typeof data.status !== 'number') {
    errors.push('缺少status字段或类型错误');
  }

  if (typeof data.msg !== 'string') {
    errors.push('缺少msg字段或类型错误');
  }

  if (data.data === undefined) {
    errors.push('缺少data字段');
    return { isValid: false, errors, warnings };
  }

  // 检查具体格式
  switch (expectedFormat) {
    case 'array_with_options':
      if (!data.data.options || !Array.isArray(data.data.options)) {
        errors.push('data.options字段缺失或不是数组');
      }
      break;

    case 'pagination_with_options':
      if (!data.data.options || !Array.isArray(data.data.options)) {
        errors.push('data.options字段缺失或不是数组');
      }
      if (typeof data.data.page !== 'number') {
        errors.push('data.page字段缺失或不是数字');
      }
      if (typeof data.data.perPage !== 'number') {
        errors.push('data.perPage字段缺失或不是数字');
      }
      if (typeof data.data.total !== 'number') {
        errors.push('data.total字段缺失或不是数字');
      }
      break;

    default:
      warnings.push('未知的预期格式');
  }

  // 检查是否使用了旧格式
  if (data.data.items) {
    warnings.push('检测到旧格式的items字段，应使用options');
  }
  if (data.data.current) {
    warnings.push('检测到旧格式的current字段，应使用page');
  }
  if (data.data.size) {
    warnings.push('检测到旧格式的size字段，应使用perPage');
  }
  if (data.data.records) {
    warnings.push('检测到旧格式的records字段，应使用options');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 测试单个API接口
 */
async function testEndpoint(endpoint) {
  console.log(`\n🔍 测试: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.method} ${endpoint.url}`);

  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.url}`,
      timeout: 10000,
    });

    console.log(`   状态码: ${response.status}`);

    // 验证AMIS格式
    const validation = validateAmisFormat(response.data, endpoint.expectedFormat);

    if (validation.isValid) {
      console.log('   ✅ AMIS格式验证通过');
    } else {
      console.log('   ❌ AMIS格式验证失败:');
      validation.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('   ⚠️ 格式警告:');
      validation.warnings.forEach(warning => {
        console.log(`      - ${warning}`);
      });
    }

    // 显示响应数据结构
    console.log('   📊 响应数据结构:');
    if (response.data.data) {
      const dataKeys = Object.keys(response.data.data);
      console.log(`      data字段包含: [${dataKeys.join(', ')}]`);
      
      if (response.data.data.options) {
        console.log(`      options数组长度: ${response.data.data.options.length}`);
      }
      if (response.data.data.items) {
        console.log(`      items数组长度: ${response.data.data.items.length}`);
      }
    }

    return {
      endpoint: endpoint.name,
      success: true,
      validation,
      responseStructure: response.data.data ? Object.keys(response.data.data) : [],
    };

  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
    
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${error.response.data?.message || error.response.statusText}`);
    }

    return {
      endpoint: endpoint.name,
      success: false,
      error: error.message,
    };
  }
}

/**
 * 主测试函数
 */
async function runAmisFormatTests() {
  console.log('🚀 AMIS格式标准化测试');
  console.log('================================\n');

  // 等待服务启动
  console.log('⏳ 检查服务状态...');
  let serverReady = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!serverReady && attempts < maxAttempts) {
    try {
      await axios.get(`${BASE_URL}/api/v1/amis-demo/array`, { timeout: 2000 });
      serverReady = true;
      console.log('✅ 服务已就绪\n');
    } catch (error) {
      attempts++;
      console.log(`⏳ 等待服务启动... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!serverReady) {
    console.log('❌ 服务未启动，请先启动服务');
    return;
  }

  // 执行测试
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 生成测试报告
  console.log('\n📊 测试报告');
  console.log('================================');

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const validFormatCount = results.filter(r => r.success && r.validation?.isValid).length;
  const invalidFormatCount = results.filter(r => r.success && !r.validation?.isValid).length;
  const warningCount = results.filter(r => r.success && r.validation?.warnings?.length > 0).length;

  console.log(`总测试数: ${results.length}`);
  console.log(`请求成功: ${successCount}`);
  console.log(`请求失败: ${failureCount}`);
  console.log(`格式正确: ${validFormatCount}`);
  console.log(`格式错误: ${invalidFormatCount}`);
  console.log(`有警告: ${warningCount}`);

  // 详细结果
  console.log('\n📋 详细结果:');
  results.forEach(result => {
    const status = result.success ? 
      (result.validation?.isValid ? '✅' : '⚠️') : '❌';
    console.log(`${status} ${result.endpoint}`);
    
    if (result.success && result.responseStructure) {
      console.log(`   数据字段: [${result.responseStructure.join(', ')}]`);
    }
    
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  // 建议
  console.log('\n💡 改进建议:');
  
  if (invalidFormatCount > 0) {
    console.log('- 修复格式错误的接口，确保使用AMIS标准格式');
  }
  
  if (warningCount > 0) {
    console.log('- 将旧格式字段(items, current, size, records)改为AMIS标准字段(options, page, perPage)');
  }
  
  if (failureCount > 0) {
    console.log('- 检查失败的接口，确保服务正常运行');
  }
  
  if (validFormatCount === successCount && successCount === results.length) {
    console.log('🎉 所有接口都符合AMIS标准格式！');
  }

  console.log('\n🎯 AMIS格式标准化测试完成！');
}

// 运行测试
runAmisFormatTests().catch(console.error);
