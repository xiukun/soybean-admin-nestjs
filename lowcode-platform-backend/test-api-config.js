const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// API配置管理测试
async function testApiConfigAPI() {
  console.log('🚀 开始API配置管理测试...\n');

  let projectId = null;
  let entityId = null;
  let apiConfigId = null;
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
          name: 'API配置测试项目',
          code: 'api_config_test_project',
          description: '用于API配置管理测试的项目',
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
      name: '创建测试实体',
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
          data: { entityId },
          message: '测试实体创建成功'
        };
      }
    },
    {
      name: '创建GET API配置',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/api-configs`, {
          projectId,
          name: '获取用户列表',
          code: 'getUserList',
          method: 'GET',
          path: '/users',
          entityId,
          description: '获取用户列表的API',
          parameters: [
            {
              name: 'page',
              type: 'INTEGER',
              location: 'QUERY',
              required: false,
              description: '页码',
              defaultValue: 1
            },
            {
              name: 'limit',
              type: 'INTEGER',
              location: 'QUERY',
              required: false,
              description: '每页数量',
              defaultValue: 10
            }
          ],
          responses: [
            {
              statusCode: 200,
              description: '成功返回用户列表',
              schema: {
                type: 'object',
                properties: {
                  users: { type: 'array' },
                  total: { type: 'integer' }
                }
              }
            }
          ],
          security: {
            type: 'jwt'
          }
        });
        
        apiConfigId = response.data.id;
        
        return {
          success: response.status === 201,
          data: response.data,
          message: 'GET API配置创建成功'
        };
      }
    },
    {
      name: '创建POST API配置',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/api-configs`, {
          projectId,
          name: '创建用户',
          code: 'createUser',
          method: 'POST',
          path: '/users',
          entityId,
          description: '创建新用户的API',
          parameters: [
            {
              name: 'name',
              type: 'STRING',
              location: 'BODY',
              required: true,
              description: '用户名称'
            },
            {
              name: 'email',
              type: 'STRING',
              location: 'BODY',
              required: true,
              description: '用户邮箱'
            }
          ],
          responses: [
            {
              statusCode: 201,
              description: '用户创建成功',
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            },
            {
              statusCode: 400,
              description: '请求参数错误'
            }
          ],
          security: {
            type: 'jwt'
          }
        });
        
        return {
          success: response.status === 201,
          data: response.data,
          message: 'POST API配置创建成功'
        };
      }
    },
    {
      name: '获取API配置详情',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/${apiConfigId}`);
        
        return {
          success: response.status === 200 && 
                  response.data.id === apiConfigId &&
                  response.data.method === 'GET',
          data: response.data,
          message: 'API配置详情获取成功'
        };
      }
    },
    {
      name: '根据项目获取API配置列表',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}`);
        
        return {
          success: response.status === 200 && 
                  Array.isArray(response.data) &&
                  response.data.length >= 2,
          data: { count: response.data.length },
          message: 'API配置列表获取成功'
        };
      }
    },
    {
      name: '分页获取API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/paginated?page=1&limit=10`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('apiConfigs') &&
                  response.data.hasOwnProperty('total'),
          data: {
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit
          },
          message: '分页API配置列表获取成功'
        };
      }
    },
    {
      name: '根据代码获取API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/code/getUserList`);
        
        return {
          success: response.status === 200 && 
                  response.data.code === 'getUserList' &&
                  response.data.method === 'GET',
          data: response.data,
          message: '根据代码获取API配置成功'
        };
      }
    },
    {
      name: '根据实体获取API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/entity/${entityId}`);
        
        return {
          success: response.status === 200 && 
                  Array.isArray(response.data) &&
                  response.data.every(api => api.entityId === entityId),
          data: { count: response.data.length },
          message: '根据实体获取API配置成功'
        };
      }
    },
    {
      name: '获取已发布的API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/published`);
        
        return {
          success: response.status === 200 && Array.isArray(response.data),
          data: { publishedCount: response.data.length },
          message: '获取已发布API配置成功'
        };
      }
    },
    {
      name: '获取API配置统计信息',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/stats`);
        
        return {
          success: response.status === 200 && 
                  response.data.hasOwnProperty('total') &&
                  response.data.hasOwnProperty('draft') &&
                  response.data.hasOwnProperty('published') &&
                  response.data.hasOwnProperty('get') &&
                  response.data.hasOwnProperty('post'),
          data: response.data,
          message: 'API配置统计信息获取成功'
        };
      }
    },
    {
      name: '搜索API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/paginated?search=用户`);
        
        return {
          success: response.status === 200 && 
                  response.data.apiConfigs.some(api => api.name.includes('用户')),
          data: { found: response.data.apiConfigs.length },
          message: 'API配置搜索成功'
        };
      }
    },
    {
      name: '按方法筛选API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/paginated?method=GET`);
        
        return {
          success: response.status === 200 && 
                  response.data.apiConfigs.every(api => api.method === 'GET'),
          data: { getCount: response.data.apiConfigs.length },
          message: '按方法筛选API配置成功'
        };
      }
    },
    {
      name: '按状态筛选API配置',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api-configs/project/${projectId}/paginated?status=DRAFT`);
        
        return {
          success: response.status === 200 && 
                  response.data.apiConfigs.every(api => api.status === 'DRAFT'),
          data: { draftCount: response.data.apiConfigs.length },
          message: '按状态筛选API配置成功'
        };
      }
    },
    {
      name: '测试重复代码验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/api-configs`, {
            projectId,
            name: '重复代码测试API',
            code: 'getUserList', // 使用已存在的代码
            method: 'PUT',
            path: '/users/duplicate',
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
      name: '测试重复路径验证',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/api-configs`, {
            projectId,
            name: '重复路径测试API',
            code: 'duplicatePath',
            method: 'GET', // 使用已存在的方法和路径组合
            path: '/users',
            description: '测试重复路径验证'
          });
          
          return {
            success: false,
            message: '应该返回409冲突错误'
          };
        } catch (error) {
          return {
            success: error.response && error.response.status === 409,
            data: { errorCode: error.response?.status },
            message: '重复路径验证成功'
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
      // 删除项目会级联删除所有实体和API配置
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
  console.log('🚀 低代码平台API配置管理测试');
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

  const results = await testApiConfigAPI();

  if (results.failed === 0) {
    console.log('\n🎉 所有API配置管理测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testApiConfigAPI };
