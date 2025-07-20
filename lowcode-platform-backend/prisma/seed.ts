import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // 创建示例项目
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {
      name: '演示项目',
      description: '用于演示和测试的项目',
      updatedAt: new Date(),
    },
    create: {
      id: 'demo-project-1',
      name: '演示项目',
      code: 'demo-project-1',
      description: '用于演示和测试的项目',
      version: '1.0.0',
      config: {},
      status: 'ACTIVE',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ 项目创建完成:', project.name);

  // 创建示例API配置
  const apiConfigs = [
    {
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
    },
    {
      name: '创建用户',
      code: 'create-user',
      description: '创建新用户',
      method: 'POST',
      path: '/api/users',
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: '用户姓名',
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          description: '用户邮箱',
        },
      ],
      responses: {
        '201': {
          description: '用户创建成功',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '400': {
          description: '请求参数错误',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              errors: { type: 'array' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '更新用户',
      code: 'update-user',
      description: '更新用户信息',
      method: 'PUT',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: '用户姓名',
        },
        {
          name: 'email',
          type: 'string',
          required: false,
          description: '用户邮箱',
        },
      ],
      responses: {
        '200': {
          description: '用户更新成功',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '删除用户',
      code: 'delete-user',
      description: '删除用户',
      method: 'DELETE',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
      ],
      responses: {
        '204': {
          description: '用户删除成功',
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '获取用户详情',
      code: 'get-user',
      description: '根据ID获取用户详情',
      method: 'GET',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
      ],
      responses: {
        '200': {
          description: '成功获取用户详情',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'none' },
      config: {},
    },
  ];

  for (const apiConfig of apiConfigs) {
    const created = await prisma.apiConfig.upsert({
      where: {
        projectId_code: {
          projectId: project.id,
          code: apiConfig.code,
        },
      },
      update: {
        name: apiConfig.name,
        description: apiConfig.description,
        method: apiConfig.method,
        path: apiConfig.path,
        parameters: apiConfig.parameters,
        responses: apiConfig.responses,
        security: apiConfig.security,
        config: apiConfig.config,
        updatedAt: new Date(),
      },
      create: {
        projectId: project.id,
        name: apiConfig.name,
        code: apiConfig.code,
        description: apiConfig.description,
        method: apiConfig.method,
        path: apiConfig.path,
        parameters: apiConfig.parameters,
        responses: apiConfig.responses,
        security: apiConfig.security,
        config: apiConfig.config,
        status: 'PUBLISHED',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ API配置创建完成:', created.name);
  }

  // 统计数据
  const projectCount = await prisma.project.count();
  const apiConfigCount = await prisma.apiConfig.count();

  console.log('📊 种子数据统计:');
  console.log(`   项目数量: ${projectCount}`);
  console.log(`   API配置数量: ${apiConfigCount}`);
  console.log('🎉 种子数据初始化完成!');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
