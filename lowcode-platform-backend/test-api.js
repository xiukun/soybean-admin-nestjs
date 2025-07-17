const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试项目管理API
async function testProjectAPI() {
  console.log('🚀 开始测试项目管理API...\n');

  let projectId = null;

  try {
    // 1. 创建项目
    console.log('1. 测试创建项目...');
    const createResponse = await axios.post(`${BASE_URL}/projects`, {
      name: '测试项目',
      code: 'test_project',
      description: '这是一个测试项目',
      version: '1.0.0',
      config: { theme: 'default' }
    });

    console.log('✅ 创建项目成功:', createResponse.data);
    projectId = createResponse.data.id;

    // 2. 获取项目详情
    console.log('\n2. 测试获取项目详情...');
    const getResponse = await axios.get(`${BASE_URL}/projects/${projectId}`);
    console.log('✅ 获取项目详情成功:', getResponse.data);

    // 3. 获取项目列表
    console.log('\n3. 测试获取项目列表...');
    const listResponse = await axios.get(`${BASE_URL}/projects`);
    console.log('✅ 获取项目列表成功，共', listResponse.data.length, '个项目');

    // 4. 分页获取项目
    console.log('\n4. 测试分页获取项目...');
    const paginatedResponse = await axios.get(`${BASE_URL}/projects/paginated?page=1&limit=10`);
    console.log('✅ 分页获取项目成功:', {
      total: paginatedResponse.data.total,
      page: paginatedResponse.data.page,
      limit: paginatedResponse.data.limit,
      totalPages: paginatedResponse.data.totalPages
    });

    // 5. 根据代码获取项目
    console.log('\n5. 测试根据代码获取项目...');
    const getByCodeResponse = await axios.get(`${BASE_URL}/projects/code/test_project`);
    console.log('✅ 根据代码获取项目成功:', getByCodeResponse.data.name);

    // 6. 更新项目
    console.log('\n6. 测试更新项目...');
    const updateResponse = await axios.put(`${BASE_URL}/projects/${projectId}`, {
      name: '更新后的测试项目',
      description: '这是更新后的描述',
      version: '1.1.0'
    });
    console.log('✅ 更新项目成功:', updateResponse.data);

    // 7. 搜索项目
    console.log('\n7. 测试搜索项目...');
    const searchResponse = await axios.get(`${BASE_URL}/projects/paginated?search=更新`);
    console.log('✅ 搜索项目成功，找到', searchResponse.data.projects.length, '个项目');

    // 8. 删除项目
    console.log('\n8. 测试删除项目...');
    await axios.delete(`${BASE_URL}/projects/${projectId}`);
    console.log('✅ 删除项目成功');

    // 9. 验证项目已删除
    console.log('\n9. 验证项目已删除...');
    try {
      await axios.get(`${BASE_URL}/projects/${projectId}`);
      console.log('❌ 项目应该已被删除');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 验证项目已删除成功');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 所有项目管理API测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    // 清理：如果测试失败，尝试删除创建的项目
    if (projectId) {
      try {
        await axios.delete(`${BASE_URL}/projects/${projectId}`);
        console.log('🧹 清理：已删除测试项目');
      } catch (cleanupError) {
        console.log('⚠️ 清理失败，请手动删除测试项目:', projectId);
      }
    }
  }
}

// 测试错误处理
async function testErrorHandling() {
  console.log('\n🔍 开始测试错误处理...\n');

  try {
    // 测试创建重复代码的项目
    console.log('1. 测试创建重复代码的项目...');
    
    // 先创建一个项目
    const project1 = await axios.post(`${BASE_URL}/projects`, {
      name: '项目1',
      code: 'duplicate_test',
      description: '第一个项目'
    });

    // 尝试创建相同代码的项目
    try {
      await axios.post(`${BASE_URL}/projects`, {
        name: '项目2',
        code: 'duplicate_test',
        description: '第二个项目'
      });
      console.log('❌ 应该返回冲突错误');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ 正确返回409冲突错误');
      } else {
        throw error;
      }
    }

    // 清理
    await axios.delete(`${BASE_URL}/projects/${project1.data.id}`);

    // 测试获取不存在的项目
    console.log('\n2. 测试获取不存在的项目...');
    try {
      await axios.get(`${BASE_URL}/projects/00000000-0000-0000-0000-000000000000`);
      console.log('❌ 应该返回404错误');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 正确返回404未找到错误');
      } else {
        throw error;
      }
    }

    // 测试无效的请求数据
    console.log('\n3. 测试无效的请求数据...');
    try {
      await axios.post(`${BASE_URL}/projects`, {
        name: '', // 空名称
        code: 'invalid_project'
      });
      console.log('❌ 应该返回400错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 正确返回400验证错误');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 所有错误处理测试通过！');

  } catch (error) {
    console.error('❌ 错误处理测试失败:', error.response?.data || error.message);
  }
}

// 主函数
async function main() {
  console.log('📋 低代码平台项目管理API测试');
  console.log('=====================================\n');

  // 检查服务是否运行
  try {
    await axios.get(`${BASE_URL}/projects`);
  } catch (error) {
    console.error('❌ 无法连接到服务器，请确保服务正在运行在 http://localhost:3000');
    console.error('   运行命令: npm run start:dev');
    return;
  }

  await testProjectAPI();
  await testErrorHandling();

  console.log('\n✨ 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProjectAPI, testErrorHandling };
