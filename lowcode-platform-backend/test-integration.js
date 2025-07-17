const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 项目管理集成测试
async function testProjectIntegration() {
  console.log('🔄 开始项目管理集成测试...\n');

  let projectId = null;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // 测试用例
  const tests = [
    {
      name: '创建项目',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/projects`, {
          name: '集成测试项目',
          code: 'integration_test_project',
          description: '用于集成测试的项目',
          version: '1.0.0',
          config: { 
            theme: 'default',
            features: ['entity', 'api', 'codegen']
          }
        });
        
        projectId = response.data.id;
        
        return {
          success: response.status === 201,
          data: response.data,
          message: '项目创建成功'
        };
      }
    },
    {
      name: '获取项目详情',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects/${projectId}`);
        
        return {
          success: response.status === 200 && response.data.id === projectId,
          data: response.data,
          message: '项目详情获取成功'
        };
      }
    },
    {
      name: '更新项目信息',
      test: async () => {
        const response = await axios.put(`${BASE_URL}/projects/${projectId}`, {
          name: '更新后的集成测试项目',
          description: '更新后的项目描述',
          version: '1.1.0'
        });
        
        return {
          success: response.status === 200 && response.data.name === '更新后的集成测试项目',
          data: response.data,
          message: '项目更新成功'
        };
      }
    },
    {
      name: '获取项目列表',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects`);
        
        return {
          success: response.status === 200 && Array.isArray(response.data),
          data: { count: response.data.length },
          message: '项目列表获取成功'
        };
      }
    },
    {
      name: '分页获取项目',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects/paginated?page=1&limit=10`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('projects') &&
                  response.data.hasOwnProperty('total'),
          data: {
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit
          },
          message: '分页项目列表获取成功'
        };
      }
    },
    {
      name: '根据代码获取项目',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects/code/integration_test_project`);
        
        return {
          success: response.status === 200 && response.data.code === 'integration_test_project',
          data: response.data,
          message: '根据代码获取项目成功'
        };
      }
    },
    {
      name: '搜索项目',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects/paginated?search=集成测试`);
        
        return {
          success: response.status === 200 && 
                  response.data.projects.some(p => p.name.includes('集成测试')),
          data: { found: response.data.projects.length },
          message: '项目搜索成功'
        };
      }
    },
    {
      name: '按状态筛选项目',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/projects/paginated?status=ACTIVE`);
        
        return {
          success: response.status === 200 && 
                  response.data.projects.every(p => p.status === 'ACTIVE'),
          data: { activeCount: response.data.projects.length },
          message: '按状态筛选项目成功'
        };
      }
    },
    {
      name: '测试重复代码验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/projects`, {
            name: '重复代码测试项目',
            code: 'integration_test_project', // 使用已存在的代码
            description: '测试重复代码验证'
          });
          
          return {
            success: false,
            message: '应该返回409冲突错误'
          };
        } catch (error) {
          return {
            success: error.response && error.response.status === 409,
            data: { errorCode: error.response?.status },
            message: '重复代码验证成功'
          };
        }
      }
    },
    {
      name: '测试无效数据验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/projects`, {
            name: '', // 空名称
            code: 'invalid_project'
          });
          
          return {
            success: false,
            message: '应该返回400验证错误'
          };
        } catch (error) {
          return {
            success: error.response && error.response.status === 400,
            data: { errorCode: error.response?.status },
            message: '数据验证成功'
          };
        }
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
        if (result.data) {
          console.log(`   数据:`, JSON.stringify(result.data, null, 2));
        }
        testResults.passed++;
      } else {
        console.log(`❌ ${testCase.name} - ${result.message || '测试失败'}`);
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

  // 清理测试数据
  if (projectId) {
    try {
      // 先将项目设为非活跃状态，然后删除
      await axios.put(`${BASE_URL}/projects/${projectId}`, {
        status: 'INACTIVE'
      });
      
      await axios.delete(`${BASE_URL}/projects/${projectId}`);
      console.log('🧹 测试数据清理完成');
    } catch (error) {
      console.log('⚠️ 测试数据清理失败:', error.message);
    }
  }

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  return testResults;
}

// 主函数
async function main() {
  console.log('🚀 低代码平台项目管理集成测试');
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

  const results = await testProjectIntegration();

  if (results.failed === 0) {
    console.log('\n🎉 所有集成测试通过！项目管理功能运行正常。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProjectIntegration };
