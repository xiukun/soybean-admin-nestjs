// 简单的代码生成测试脚本
const axios = require('axios');

async function testCodeGeneration() {
  try {
    console.log('🧪 开始测试代码生成功能...');

    // 1. 获取项目列表
    console.log('📋 获取项目列表...');
    const projectsResponse = await axios.get('http://localhost:9521/api/v1/projects', {
      headers: {
        'Authorization': 'Bearer test-token' // 这里需要真实的token
      }
    });
    
    if (projectsResponse.data.data.length === 0) {
      console.log('❌ 没有找到项目，请先创建项目');
      return;
    }

    const projectId = projectsResponse.data.data[0].id;
    console.log(`✅ 找到项目: ${projectId}`);

    // 2. 获取模板列表
    console.log('📝 获取模板列表...');
    const templatesResponse = await axios.get('http://localhost:9521/api/v1/templates', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    if (templatesResponse.data.data.length === 0) {
      console.log('❌ 没有找到模板');
      return;
    }

    const templateId = templatesResponse.data.data[0].id;
    console.log(`✅ 找到模板: ${templateId}`);

    // 3. 执行代码生成
    console.log('🔧 开始生成代码...');
    const generateRequest = {
      projectId: projectId,
      templateIds: [templateId],
      variables: {
        projectName: 'TestProject',
        author: 'Code Generator',
        timestamp: new Date().toISOString()
      },
      options: {
        overwriteExisting: true,
        generateTests: false,
        generateDocs: false,
        architecture: 'base-biz',
        framework: 'nestjs'
      }
    };

    const generateResponse = await axios.post(
      'http://localhost:9521/api/v1/code-generation/generate',
      generateRequest,
      {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ 代码生成请求已提交');
    console.log('📊 生成结果:', JSON.stringify(generateResponse.data, null, 2));

    // 4. 检查生成进度
    if (generateResponse.data.data.taskId) {
      console.log('📈 检查生成进度...');
      const progressResponse = await axios.get(
        `http://localhost:9521/api/v1/code-generation/progress/${generateResponse.data.data.taskId}`,
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );

      console.log('📊 进度信息:', JSON.stringify(progressResponse.data, null, 2));
    }

    console.log('🎉 代码生成测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testCodeGeneration();
