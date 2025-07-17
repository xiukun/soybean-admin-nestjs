const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// amis接口规范测试
async function testAmisCompliance() {
  console.log('🚀 开始amis接口规范测试...\n');

  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // 测试用例
  const tests = [
    {
      name: '测试字符串数据的amis格式',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/string`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.message === 'Hello, amis!';
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '字符串数据正确包装为amis格式'
        };
      }
    },
    {
      name: '测试数组数据的amis格式',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/array`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          Array.isArray(response.data.data.items) &&
          response.data.data.items.length === 3;
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '数组数据正确包装为amis格式'
        };
      }
    },
    {
      name: '测试对象数据的amis格式',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/object`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.id === 1 &&
          response.data.data.name === 'Test User';
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '对象数据正确包装为amis格式'
        };
      }
    },
    {
      name: '测试分页数据的amis格式（新参数名）',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/users?page=1&perPage=5`);

        const isValidAmis =
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          Array.isArray(response.data.data.options) &&
          response.data.data.page === 1 &&
          response.data.data.perPage === 5 &&
          typeof response.data.data.total === 'number';

        return {
          success: isValidAmis,
          data: response.data,
          message: '分页数据正确包装为amis格式（使用新的参数名）'
        };
      }
    },
    {
      name: '测试分页数据的amis格式（兼容旧参数名）',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/users?page=2&limit=3`);

        const isValidAmis =
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          Array.isArray(response.data.data.options) &&
          response.data.data.page === 2 &&
          response.data.data.perPage === 3 &&
          typeof response.data.data.total === 'number';

        return {
          success: isValidAmis,
          data: response.data,
          message: '分页数据正确包装为amis格式（兼容旧参数名limit）'
        };
      }
    },
    {
      name: '测试创建操作的amis格式',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/amis-demo/create-user`, {
          name: 'Test User',
          email: 'test@example.com'
        });
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.name === 'Test User' &&
          response.data.data.email === 'test@example.com';
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '创建操作返回正确的amis格式'
        };
      }
    },
    {
      name: '测试已经是amis格式的响应',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/already-amis`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          response.data.msg === '操作成功' &&
          response.data.data &&
          response.data.data.name === 'Already amis format';
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '已经是amis格式的响应保持不变'
        };
      }
    },
    {
      name: '测试复杂数据结构的amis格式',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/complex-data`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.user &&
          Array.isArray(response.data.data.permissions) &&
          response.data.data.settings &&
          response.data.data.statistics;
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '复杂数据结构正确包装为amis格式'
        };
      }
    },
    {
      name: '验证无效字符串格式被转换',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/validation-demo?format=invalid-string`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.text === 'This is invalid for amis';
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '无效字符串格式被正确转换为amis格式'
        };
      }
    },
    {
      name: '验证无效数组格式被转换',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/validation-demo?format=invalid-array`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          Array.isArray(response.data.data.items) &&
          response.data.data.items.includes('invalid');
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '无效数组格式被正确转换为amis格式'
        };
      }
    },
    {
      name: '验证有效amis格式保持不变',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/validation-demo?format=valid-amis`);
        
        const isValidAmis = 
          response.data.status === 0 &&
          typeof response.data.msg === 'string' &&
          response.data.data &&
          response.data.data.id === 1;
        
        return {
          success: isValidAmis,
          data: response.data,
          message: '有效amis格式保持不变'
        };
      }
    },
    {
      name: '验证所有响应都不包含裸字符串',
      test: async () => {
        const endpoints = [
          '/amis-demo/string',
          '/amis-demo/array',
          '/amis-demo/object',
          '/amis-demo/users',
          '/amis-demo/complex-data'
        ];
        
        let allValid = true;
        const results = [];
        
        for (const endpoint of endpoints) {
          const response = await axios.get(`${BASE_URL}${endpoint}`);
          const isString = typeof response.data === 'string';
          const isArray = Array.isArray(response.data);
          
          if (isString || isArray) {
            allValid = false;
          }
          
          results.push({
            endpoint,
            isString,
            isArray,
            hasAmisStructure: response.data.hasOwnProperty('status') && 
                             response.data.hasOwnProperty('msg') && 
                             response.data.hasOwnProperty('data')
          });
        }
        
        return {
          success: allValid,
          data: { results },
          message: allValid ? '所有响应都符合amis规范' : '存在不符合amis规范的响应'
        };
      }
    },
    {
      name: '验证所有响应都不包含裸数组',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/amis-demo/array`);
        
        const isNotRawArray = !Array.isArray(response.data);
        const hasCorrectStructure = 
          response.data.status === 0 &&
          response.data.data &&
          Array.isArray(response.data.data.items);
        
        return {
          success: isNotRawArray && hasCorrectStructure,
          data: response.data,
          message: '数组数据被正确包装，不是裸数组'
        };
      }
    }
  ];

  // 执行测试
  for (const testCase of tests) {
    try {
      console.log(`🧪 执行测试: ${testCase.name}`);
      const result = await testCase.test();
      
      if (result.success) {
        console.log(`✅ ${testCase.name} - ${result.message}`);
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          // 只显示amis响应的关键信息
          if (result.data.status !== undefined) {
            console.log(`   amis格式: status=${result.data.status}, msg="${result.data.msg}", data类型=${typeof result.data.data}`);
          } else {
            console.log(`   数据:`, JSON.stringify(result.data, null, 2));
          }
        }
        testResults.passed++;
      } else {
        console.log(`❌ ${testCase.name} - ${result.message || '测试失败'}`);
        if (result.data) {
          console.log(`   响应数据:`, JSON.stringify(result.data, null, 2));
        }
        testResults.failed++;
      }
      
      testResults.tests.push({
        name: testCase.name,
        success: result.success,
        message: result.message,
        data: result.data
      });
      
    } catch (error) {
      console.log(`❌ ${testCase.name} - 执行失败:`, error.message);
      testResults.failed++;
      testResults.tests.push({
        name: testCase.name,
        success: false,
        message: error.message
      });
    }
    
    console.log(''); // 空行分隔
  }

  // 输出测试结果
  console.log('\n📊 amis接口规范测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  return testResults;
}

// 主函数
async function main() {
  console.log('🚀 低代码平台amis接口规范测试');
  console.log('=====================================\n');

  // 检查服务是否运行
  try {
    await axios.get(`${BASE_URL}/projects`);
    console.log('✅ 服务器连接正常\n');
  } catch (error) {
    console.error('❌ 无法连接到服务器，请确保服务正在运行在 http://localhost:3000');
    console.error('   运行命令: npm run start:dev');
    return;
  }

  const results = await testAmisCompliance();

  if (results.failed === 0) {
    console.log('\n🎉 所有amis接口规范测试通过！');
    console.log('✨ 低代码平台的API接口完全符合amis规范要求');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查amis接口规范实现。');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAmisCompliance };
