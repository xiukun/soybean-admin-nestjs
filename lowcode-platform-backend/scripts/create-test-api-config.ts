import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestApiConfig() {
  console.log('🔧 创建测试API配置...');

  try {
    // 1. 检查或创建示例项目
    console.log('📁 检查示例项目...');
    let project = await prisma.project.findFirst({
      where: { code: 'demo-project-1' }
    });

    if (!project) {
      console.log('📁 创建示例项目...');
      project = await prisma.project.create({
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
      console.log('✅ 示例项目创建成功:', project.name);
    } else {
      console.log('✅ 示例项目已存在:', project.name);
    }

    // 2. 检查或创建示例实体
    console.log('🏗️ 检查示例实体...');
    let entity = await prisma.entity.findFirst({
      where: { 
        projectId: project.id,
        code: 'User'
      }
    });

    if (!entity) {
      console.log('🏗️ 创建示例实体...');
      entity = await prisma.entity.create({
        data: {
          id: 'demo-entity-user',
          projectId: project.id,
          name: '用户',
          code: 'User',
          tableName: 'demo_users',
          description: '用户实体，包含基本的用户信息',
          category: '用户管理',
          config: { displayName: '用户', icon: 'user', color: '#1890ff' },
          status: 'PUBLISHED',
          createdBy: 'system',
        },
      });
      console.log('✅ 示例实体创建成功:', entity.name);
    } else {
      console.log('✅ 示例实体已存在:', entity.name);
    }

    // 3. 创建或更新API配置（使用固定ID）
    console.log('🔌 创建测试API配置...');
    
    // 删除可能存在的旧配置
    await prisma.apiConfig.deleteMany({
      where: {
        OR: [
          { id: 'api-user-list' },
          { 
            projectId: project.id,
            code: 'get-users'
          }
        ]
      }
    });

    const apiConfig = await prisma.apiConfig.create({
      data: {
        id: 'api-user-list', // 使用固定ID以便测试
        projectId: project.id,
        entityId: entity.id,
        name: '获取用户列表',
        code: 'get-users',
        description: '获取系统中的用户列表API',
        method: 'GET',
        path: '/api/users',
        parameters: [
          {
            name: 'page',
            type: 'number',
            description: '页码',
            required: false,
            defaultValue: 1
          },
          {
            name: 'limit',
            type: 'number',
            description: '每页数量',
            required: false,
            defaultValue: 10
          }
        ],
        responses: {
          '200': {
            description: '成功获取用户列表',
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      email: { type: 'string' },
                      nickname: { type: 'string' },
                      status: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' }
              }
            }
          }
        },
        security: { 
          type: 'bearer',
          bearerFormat: 'JWT'
        },
        config: {
          timeout: 30000,
          retries: 3
        },
        status: 'PUBLISHED',
        version: '1.0.0',
        createdBy: 'system',
      },
    });

    console.log('✅ 测试API配置创建成功:');
    console.log(`   ID: ${apiConfig.id}`);
    console.log(`   名称: ${apiConfig.name}`);
    console.log(`   方法: ${apiConfig.method}`);
    console.log(`   路径: ${apiConfig.path}`);
    console.log(`   状态: ${apiConfig.status}`);

    // 4. 验证API配置
    console.log('🔍 验证API配置...');
    const createdConfig = await prisma.apiConfig.findUnique({
      where: { id: 'api-user-list' },
      include: {
        project: true,
        entity: true
      }
    });

    if (createdConfig) {
      console.log('✅ API配置验证成功');
      console.log(`   项目: ${createdConfig.project.name}`);
      console.log(`   实体: ${createdConfig.entity?.name || '无'}`);
    } else {
      console.log('❌ API配置验证失败');
    }

    // 5. 显示测试URL
    console.log('\n🌐 测试URL:');
    console.log(`   GET http://localhost:9527/proxy-lowcodeService/api-configs/api-user-list/test`);
    console.log(`   Authorization: Bearer YOUR_JWT_TOKEN`);

  } catch (error) {
    console.error('❌ 创建测试API配置失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  createTestApiConfig()
    .then(() => {
      console.log('🎉 测试API配置创建完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createTestApiConfig };
