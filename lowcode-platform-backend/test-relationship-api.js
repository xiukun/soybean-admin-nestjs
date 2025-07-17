const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 关系管理API测试
async function testRelationshipAPI() {
  console.log('🚀 开始关系管理API测试...\n');

  let projectId = null;
  let sourceEntityId = null;
  let targetEntityId = null;
  let relationshipId = null;
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
          name: '关系测试项目',
          code: 'relationship_test_project',
          description: '用于关系管理测试的项目',
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
      name: '创建源实体',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/entities`, {
          projectId,
          name: '用户实体',
          code: 'User',
          tableName: 'users',
          description: '用户信息实体',
          category: 'core'
        });
        
        sourceEntityId = response.data.id;
        
        return {
          success: response.status === 201,
          data: { sourceEntityId },
          message: '源实体创建成功'
        };
      }
    },
    {
      name: '创建目标实体',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/entities`, {
          projectId,
          name: '订单实体',
          code: 'Order',
          tableName: 'orders',
          description: '订单信息实体',
          category: 'business'
        });
        
        targetEntityId = response.data.id;
        
        return {
          success: response.status === 201,
          data: { targetEntityId },
          message: '目标实体创建成功'
        };
      }
    },
    {
      name: '创建关系',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/relationships`, {
          projectId,
          name: '用户订单关系',
          code: 'UserOrders',
          type: 'ONE_TO_MANY',
          sourceEntityId,
          targetEntityId,
          description: '用户与订单的一对多关系',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        
        relationshipId = response.data.id;
        
        return {
          success: response.status === 201,
          data: response.data,
          message: '关系创建成功'
        };
      }
    },
    {
      name: '获取关系详情',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/${relationshipId}`);
        
        return {
          success: response.status === 200 && response.data.id === relationshipId,
          data: response.data,
          message: '关系详情获取成功'
        };
      }
    },
    {
      name: '根据项目ID获取关系列表',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}`);
        
        return {
          success: response.status === 200 && Array.isArray(response.data),
          data: { count: response.data.length },
          message: '关系列表获取成功'
        };
      }
    },
    {
      name: '分页获取关系',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/paginated?page=1&limit=10`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('relationships') &&
                  response.data.hasOwnProperty('total'),
          data: {
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit
          },
          message: '分页关系列表获取成功'
        };
      }
    },
    {
      name: '根据代码获取关系',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/code/UserOrders`);
        
        return {
          success: response.status === 200 && response.data.code === 'UserOrders',
          data: response.data,
          message: '根据代码获取关系成功'
        };
      }
    },
    {
      name: '根据实体获取关系',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/entity/${sourceEntityId}`);
        
        return {
          success: response.status === 200 && Array.isArray(response.data),
          data: { count: response.data.length },
          message: '根据实体获取关系成功'
        };
      }
    },
    {
      name: '获取关系图',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/graph`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('entities') &&
                  response.data.hasOwnProperty('relationships'),
          data: {
            entitiesCount: response.data.entities.length,
            relationshipsCount: response.data.relationships.length
          },
          message: '关系图获取成功'
        };
      }
    },
    {
      name: '获取关系统计信息',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/stats`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('total') &&
                  response.data.hasOwnProperty('oneToOne') &&
                  response.data.hasOwnProperty('oneToMany') &&
                  response.data.hasOwnProperty('manyToOne') &&
                  response.data.hasOwnProperty('manyToMany'),
          data: response.data,
          message: '关系统计信息获取成功'
        };
      }
    },
    {
      name: '创建多对多关系',
      test: async () => {
        // 先创建一个新的实体
        const categoryResponse = await axios.post(`${BASE_URL}/entities`, {
          projectId,
          name: '分类实体',
          code: 'Category',
          tableName: 'categories',
          description: '分类信息实体'
        });

        const categoryEntityId = categoryResponse.data.id;

        const response = await axios.post(`${BASE_URL}/relationships`, {
          projectId,
          name: '订单分类关系',
          code: 'OrderCategories',
          type: 'MANY_TO_MANY',
          sourceEntityId: targetEntityId, // 订单
          targetEntityId: categoryEntityId, // 分类
          description: '订单与分类的多对多关系'
        });
        
        return {
          success: response.status === 201 && response.data.type === 'MANY_TO_MANY',
          data: response.data,
          message: '多对多关系创建成功'
        };
      }
    },
    {
      name: '搜索关系',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/paginated?search=用户`);
        
        return {
          success: response.status === 200 && 
                  response.data.relationships.some(r => r.name.includes('用户')),
          data: { found: response.data.relationships.length },
          message: '关系搜索成功'
        };
      }
    },
    {
      name: '按类型筛选关系',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/relationships/project/${projectId}/paginated?type=ONE_TO_MANY`);
        
        return {
          success: response.status === 200 && 
                  response.data.relationships.every(r => r.type === 'ONE_TO_MANY'),
          data: { oneToManyCount: response.data.relationships.length },
          message: '按类型筛选关系成功'
        };
      }
    },
    {
      name: '测试重复代码验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/relationships`, {
            projectId,
            name: '重复代码测试关系',
            code: 'UserOrders', // 使用已存在的代码
            type: 'ONE_TO_ONE',
            sourceEntityId,
            targetEntityId,
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
      // 删除项目会级联删除所有实体和关系
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
  console.log('🚀 低代码平台关系管理API测试');
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

  const results = await testRelationshipAPI();

  if (results.failed === 0) {
    console.log('\n🎉 所有关系管理API测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRelationshipAPI };
