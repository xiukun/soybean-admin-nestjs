import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始amis低代码后端种子数据初始化...');

  try {
    // 检查是否已经初始化过
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      console.log('📋 数据已存在，跳过初始化');
      return;
    }

    // Seed default users
    console.log('👥 创建默认用户...');

    const defaultUsers = [
      {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        nickname: 'Administrator',
        status: 'ACTIVE',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'user-001',
        username: 'demo',
        email: 'demo@example.com',
        password: await bcrypt.hash('demo123', 10),
        nickname: 'Demo User',
        status: 'ACTIVE',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    for (const user of defaultUsers) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: {
          email: user.email,
          nickname: user.nickname,
          status: user.status,
          updatedBy: user.updatedBy,
        },
        create: user,
      });
    }
    console.log('  ✅ 默认用户创建完成');

    // Seed default roles
    console.log('🔐 创建默认角色...');

    const defaultRoles = [
      {
        id: 'role-admin',
        name: 'Administrator',
        code: 'ADMIN',
        description: 'System administrator with full access',
        status: 'ACTIVE',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'role-user',
        name: 'User',
        code: 'USER',
        description: 'Regular user with limited access',
        status: 'ACTIVE',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'role-guest',
        name: 'Guest',
        code: 'GUEST',
        description: 'Guest user with read-only access',
        status: 'ACTIVE',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    for (const role of defaultRoles) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          status: role.status,
          updatedBy: role.updatedBy,
        },
        create: role,
      });
    }
    console.log('  ✅ 默认角色创建完成');

    // 创建用户角色关联
    console.log('🔗 创建用户角色关联...');
    const userRoleAssignments = [
      {
        userId: 'admin-001',
        roleId: 'role-admin',
      },
      {
        userId: 'user-001',
        roleId: 'role-user',
      }
    ];

    for (const assignment of userRoleAssignments) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: assignment.userId,
            roleId: assignment.roleId,
          }
        },
        update: {},
        create: assignment,
      });
    }
    console.log('  ✅ 用户角色关联创建完成');

    // 创建示例页面模板
    console.log('📄 创建示例页面模板...');
    const pageTemplates = [
      {
        id: 'template-crud-list',
        name: 'CRUD列表页面',
        description: '标准的增删改查列表页面模板',
        category: '数据管理',
        content: JSON.stringify({
          type: 'page',
          title: '数据管理',
          body: [
            {
              type: 'crud',
              api: '/api/data',
              columns: [
                { name: 'id', label: 'ID', type: 'text' },
                { name: 'name', label: '名称', type: 'text' },
                { name: 'status', label: '状态', type: 'status' },
                { name: 'createdAt', label: '创建时间', type: 'datetime' }
              ],
              headerToolbar: [
                {
                  type: 'button',
                  label: '新增',
                  actionType: 'dialog',
                  dialog: {
                    title: '新增数据',
                    body: {
                      type: 'form',
                      api: 'post:/api/data',
                      body: [
                        { type: 'input-text', name: 'name', label: '名称', required: true },
                        { type: 'select', name: 'status', label: '状态', options: [
                          { label: '启用', value: 'active' },
                          { label: '禁用', value: 'inactive' }
                        ]}
                      ]
                    }
                  }
                }
              ]
            }
          ]
        }),
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'template-form-page',
        name: '表单页面',
        description: '标准的表单页面模板',
        category: '表单',
        content: JSON.stringify({
          type: 'page',
          title: '表单页面',
          body: {
            type: 'form',
            mode: 'horizontal',
            api: 'post:/api/submit',
            body: [
              { type: 'input-text', name: 'title', label: '标题', required: true },
              { type: 'textarea', name: 'description', label: '描述' },
              { type: 'select', name: 'category', label: '分类', options: [] },
              { type: 'switch', name: 'enabled', label: '启用状态' }
            ]
          }
        }),
        status: 'ACTIVE',
        createdBy: 'system',
      }
    ];

    for (const template of pageTemplates) {
      await prisma.pageTemplate.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          status: template.status,
          updatedAt: new Date(),
        },
        create: {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log('  ✅ 示例页面模板创建完成');

    // 统计数据
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const templateCount = await prisma.pageTemplate.count();

    console.log('📊 种子数据统计:');
    console.log(`   用户数量: ${userCount}`);
    console.log(`   角色数量: ${roleCount}`);
    console.log(`   页面模板数量: ${templateCount}`);
    console.log('🎉 amis低代码后端种子数据初始化完成!');

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
