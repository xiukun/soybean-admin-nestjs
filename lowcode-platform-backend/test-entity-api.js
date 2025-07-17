const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 实体管理API测试
async function testEntityAPI() {
  console.log('🚀 开始实体管理API测试...\n');

  let projectId = null;
  let entityId = null;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // 测试用例
  const tests = [
    {
      name: '创建测试项目',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/projects`, {
          name: '实体测试项目',
          code: 'entity_test_project',
          description: '用于实体管理测试的项目',
          version: '1.0.0'
        });
        
        projectId = response.data.id;
        
        return {
          success: response.status === 201,
          data: { projectId },
          message: '测试项目创建成功'
        };
      }
    },
    {
      name: '创建实体',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/entities`, {
          projectId,
          name: '用户实体',
          code: 'User',
          tableName: 'users',
          description: '用户信息实体',
          category: 'core'
        });
        
        entityId = response.data.id;
        
        return {
          success: response.status === 201,
          data: response.data,
          message: '实体创建成功'
        };
      }
    },
    {
      name: '获取实体详情',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/${entityId}`);
        
        return {
          success: response.status === 200 && response.data.id === entityId,
          data: response.data,
          message: '实体详情获取成功'
        };
      }
    },
    {
      name: '更新实体信息',
      test: async () => {
        const response = await axios.put(`${BASE_URL}/entities/${entityId}`, {
          name: '更新后的用户实体',
          description: '更新后的用户信息实体',
          category: 'business'
        });
        
        return {
          success: response.status === 200 && response.data.name === '更新后的用户实体',
          data: response.data,
          message: '实体更新成功'
        };
      }
    },
    {
      name: '根据项目ID获取实体列表',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}`);
        
        return {
          success: response.status === 200 && Array.isArray(response.data),
          data: { count: response.data.length },
          message: '实体列表获取成功'
        };
      }
    },
    {
      name: '分页获取实体',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}/paginated?page=1&limit=10`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('entities') &&
                  response.data.hasOwnProperty('total'),
          data: {
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit
          },
          message: '分页实体列表获取成功'
        };
      }
    },
    {
      name: '根据代码获取实体',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}/code/User`);
        
        return {
          success: response.status === 200 && response.data.code === 'User',
          data: response.data,
          message: '根据代码获取实体成功'
        };
      }
    },
    {
      name: '搜索实体',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}/paginated?search=用户`);
        
        return {
          success: response.status === 200 && 
                  response.data.entities.some(e => e.name.includes('用户')),
          data: { found: response.data.entities.length },
          message: '实体搜索成功'
        };
      }
    },
    {
      name: '按状态筛选实体',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}/paginated?status=DRAFT`);
        
        return {
          success: response.status === 200 && 
                  response.data.entities.every(e => e.status === 'DRAFT'),
          data: { draftCount: response.data.entities.length },
          message: '按状态筛选实体成功'
        };
      }
    },
    {
      name: '获取实体统计信息',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/entities/project/${projectId}/stats`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('total') &&
                  response.data.hasOwnProperty('draft') &&
                  response.data.hasOwnProperty('published') &&
                  response.data.hasOwnProperty('deprecated'),
          data: response.data,
          message: '实体统计信息获取成功'
        };
      }
    },
    {
      name: '测试重复代码验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/entities`, {
            projectId,
            name: '重复代码测试实体',
            code: 'User', // 使用已存在的代码
            tableName: 'duplicate_users',
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
          await axios.post(`${BASE_URL}/entities`, {
            projectId,
            name: '', // 空名称
            code: 'InvalidEntity',
            tableName: 'invalid_entity'
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
  if (entityId) {
    try {
      await axios.delete(`${BASE_URL}/entities/${entityId}`);
      console.log('🧹 实体测试数据清理完成');
    } catch (error) {
      console.log('⚠️ 实体测试数据清理失败:', error.message);
    }
  }

  if (projectId) {
    try {
      // 先将项目设为非活跃状态，然后删除
      await axios.put(`${BASE_URL}/projects/${projectId}`, {
        status: 'INACTIVE'
      });
      
      await axios.delete(`${BASE_URL}/projects/${projectId}`);
      console.log('🧹 项目测试数据清理完成');
    } catch (error) {
      console.log('⚠️ 项目测试数据清理失败:', error.message);
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
  console.log('🚀 低代码平台实体管理API测试');
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

  const results = await testEntityAPI();

  if (results.failed === 0) {
    console.log('\n🎉 所有实体管理API测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEntityAPI };
