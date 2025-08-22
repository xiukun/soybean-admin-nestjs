import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting amis-lowcode-backend seed...');

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.testUser.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
  }

  // 创建示例角色
  const roles = [
    {
      id: 'role-admin',
      name: '管理员',
      code: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: ['*'],
      status: 'ACTIVE',
      createdBy: 'system',
    },
    {
      id: 'role-user',
      name: '普通用户',
      code: 'user',
      description: '普通用户，拥有基础权限',
      permissions: ['read:user', 'update:own'],
      status: 'ACTIVE',
      createdBy: 'system',
    },
    {
      id: 'role-guest',
      name: '访客',
      code: 'guest',
      description: '访客用户，只有查看权限',
      permissions: ['read:public'],
      status: 'ACTIVE',
      createdBy: 'system',
    },
  ];

  for (const role of roles) {
    await prisma.role.create({
      data: {
        ...role,
        permissions: role.permissions,
      },
    });
  }

  console.log(`✅ Created ${roles.length} roles`);

  // 创建示例用户
  const users = [
    {
      id: 'user-admin',
      username: 'admin',
      email: 'admin@example.com',
      firstName: '管理员',
      lastName: '系统',
      status: 'ACTIVE',
      roleIds: ['role-admin'],
      createdBy: 'system',
    },
    {
      id: 'user-john',
      username: 'john',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      status: 'ACTIVE',
      roleIds: ['role-user'],
      createdBy: 'system',
    },
    {
      id: 'user-jane',
      username: 'jane',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'ACTIVE',
      roleIds: ['role-user'],
      createdBy: 'system',
    },
    {
      id: 'user-guest',
      username: 'guest',
      email: 'guest@example.com',
      firstName: '访客',
      lastName: '用户',
      status: 'ACTIVE',
      roleIds: ['role-guest'],
      createdBy: 'system',
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        roleIds: user.roleIds,
      },
    });
  }

  console.log(`✅ Created ${users.length} users`);

  // 创建测试用户数据（用于演示CRUD功能）
  const testUsers = [
    {
      id: 'test-user-1',
      name: '张三',
      email: 'zhangsan@test.com',
      phone: '13800138001',
      age: 25,
      city: '北京',
      department: '技术部',
      position: '前端工程师',
      salary: 15000,
      status: 'ACTIVE',
      tags: ['JavaScript', 'Vue', 'React'],
      createdBy: 'system',
    },
    {
      id: 'test-user-2',
      name: '李四',
      email: 'lisi@test.com',
      phone: '13800138002',
      age: 28,
      city: '上海',
      department: '技术部',
      position: '后端工程师',
      salary: 18000,
      status: 'ACTIVE',
      tags: ['Java', 'Spring', 'MySQL'],
      createdBy: 'system',
    },
    {
      id: 'test-user-3',
      name: '王五',
      email: 'wangwu@test.com',
      phone: '13800138003',
      age: 30,
      city: '深圳',
      department: '产品部',
      position: '产品经理',
      salary: 20000,
      status: 'ACTIVE',
      tags: ['Product', 'Axure', 'PRD'],
      createdBy: 'system',
    },
    {
      id: 'test-user-4',
      name: '赵六',
      email: 'zhaoliu@test.com',
      phone: '13800138004',
      age: 26,
      city: '杭州',
      department: '设计部',
      position: 'UI设计师',
      salary: 14000,
      status: 'ACTIVE',
      tags: ['UI', 'Sketch', 'Figma'],
      createdBy: 'system',
    },
    {
      id: 'test-user-5',
      name: '孙七',
      email: 'sunqi@test.com',
      phone: '13800138005',
      age: 32,
      city: '广州',
      department: '运营部',
      position: '运营专员',
      salary: 12000,
      status: 'INACTIVE',
      tags: ['Marketing', 'Data Analysis'],
      createdBy: 'system',
    },
    {
      id: 'test-user-6',
      name: '周八',
      email: 'zhouba@test.com',
      phone: '13800138006',
      age: 24,
      city: '成都',
      department: '技术部',
      position: '测试工程师',
      salary: 13000,
      status: 'ACTIVE',
      tags: ['Testing', 'Automation', 'Selenium'],
      createdBy: 'system',
    },
    {
      id: 'test-user-7',
      name: '吴九',
      email: 'wujiu@test.com',
      phone: '13800138007',
      age: 29,
      city: '西安',
      department: '技术部',
      position: '架构师',
      salary: 25000,
      status: 'ACTIVE',
      tags: ['Architecture', 'Microservices', 'Docker'],
      createdBy: 'system',
    },
    {
      id: 'test-user-8',
      name: '郑十',
      email: 'zhengshi@test.com',
      phone: '13800138008',
      age: 27,
      city: '南京',
      department: '技术部',
      position: 'DevOps工程师',
      salary: 16000,
      status: 'ACTIVE',
      tags: ['DevOps', 'Kubernetes', 'CI/CD'],
      createdBy: 'system',
    },
    {
      id: 'test-user-9',
      name: '钱十一',
      email: 'qianshiyi@test.com',
      phone: '13800138009',
      age: 31,
      city: '武汉',
      department: '销售部',
      position: '销售经理',
      salary: 17000,
      status: 'ACTIVE',
      tags: ['Sales', 'CRM', 'B2B'],
      createdBy: 'system',
    },
    {
      id: 'test-user-10',
      name: '刘十二',
      email: 'liushier@test.com',
      phone: '13800138010',
      age: 23,
      city: '青岛',
      department: '人事部',
      position: 'HR专员',
      salary: 11000,
      status: 'ACTIVE',
      tags: ['HR', 'Recruitment', 'Training'],
      createdBy: 'system',
    },
  ];

  for (const testUser of testUsers) {
    await prisma.testUser.create({
      data: {
        ...testUser,
        tags: testUser.tags,
      },
    });
  }

  console.log(`✅ Created ${testUsers.length} test users`);

  console.log('🎉 Amis seed completed successfully!');
  console.log(`
📊 Summary:
- Roles: ${roles.length}
- Users: ${users.length}
- Test Users: ${testUsers.length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Amis seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });