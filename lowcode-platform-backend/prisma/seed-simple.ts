import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始低代码平台种子数据初始化...');

  try {
    // 检查数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 检查是否已经初始化过
    const existingProject = await prisma.project.findFirst();
    if (existingProject) {
      console.log('📋 数据已存在，跳过初始化');
      return;
    }

    // 创建示例项目
    console.log('📁 创建示例项目...');
    const project = await prisma.project.create({
      data: {
        id: 'demo-project-1',
        name: '演示项目',
        code: 'demo-project-1',
        description: '用于演示和测试的项目',
        version: '1.0.0',
        config: {
          database: { type: 'postgresql', host: 'localhost', port: 5432 },
          api: { baseUrl: '/api/v1', prefix: 'demo' }
        },
        status: 'ACTIVE',
        createdBy: 'system',
      },
    });

    console.log('✅ 项目创建完成:', project.name);

    // 创建一个简单的API配置
    console.log('🔌 创建示例API配置...');
    const apiConfig = await prisma.apiConfig.create({
      data: {
        projectId: project.id,
        name: '获取用户列表',
        code: 'get-users',
        description: '获取系统中的用户列表',
        method: 'GET',
        path: '/api/users',
        parameters: [],
        responses: {
          '200': {
            description: '成功获取用户列表',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        security: { type: 'none' },
        config: {},
        status: 'PUBLISHED',
        version: '1.0.0',
        createdBy: 'system',
      },
    });

    console.log('✅ API配置创建完成:', apiConfig.name);

    // 统计数据
    const projectCount = await prisma.project.count();
    const apiConfigCount = await prisma.apiConfig.count();

    console.log('📊 种子数据统计:');
    console.log(`   项目数量: ${projectCount}`);
    console.log(`   API配置数量: ${apiConfigCount}`);
    console.log('🎉 低代码平台种子数据初始化完成!');

  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
