import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed system configuration
    console.log('📋 Seeding system configuration...');
    
    const systemConfigs = [
      {
        key: 'app.name',
        value: 'Amis Low-code Backend',
        description: 'Application name',
        category: 'general',
      },
      {
        key: 'app.version',
        value: '1.0.0',
        description: 'Application version',
        category: 'general',
      },
      {
        key: 'api.rate_limit',
        value: '1000',
        description: 'API rate limit per hour',
        category: 'api',
      },
      {
        key: 'security.jwt_expiry',
        value: '3600',
        description: 'JWT token expiry in seconds',
        category: 'security',
      },
    ];

    // Check if SystemConfig model exists
    try {
      for (const config of systemConfigs) {
        await prisma.systemConfig.upsert({
          where: { key: config.key },
          update: config,
          create: config,
        });
      }
      console.log('  ✅ System configuration seeded');
    } catch (error) {
      console.log('  ℹ️ SystemConfig model not found, skipping system config seeding');
    }

    // Seed default users
    console.log('👥 Seeding default users...');
    
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
    console.log('  ✅ Default users seeded');

    // Seed default roles
    console.log('🔐 Seeding default roles...');
    
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
    console.log('  ✅ Default roles seeded');

    // Seed API endpoints (if model exists)
    console.log('🔗 Seeding API endpoints...');
    
    try {
      const apiEndpoints = [
        {
          path: '/api/v1/health',
          method: 'GET',
          handler: 'HealthController.check',
          description: 'Health check endpoint',
        },
        {
          path: '/api/v1/users',
          method: 'GET',
          handler: 'UserController.findAll',
          description: 'Get all users',
        },
        {
          path: '/api/v1/users/:id',
          method: 'GET',
          handler: 'UserController.findOne',
          description: 'Get user by ID',
        },
        {
          path: '/api/v1/roles',
          method: 'GET',
          handler: 'RoleController.findAll',
          description: 'Get all roles',
        },
      ];

      for (const endpoint of apiEndpoints) {
        await prisma.apiEndpoint.upsert({
          where: { path: endpoint.path },
          update: endpoint,
          create: endpoint,
        });
      }
      console.log('  ✅ API endpoints seeded');
    } catch (error) {
      console.log('  ℹ️ ApiEndpoint model not found, skipping API endpoints seeding');
    }

    // Create initial health check record
    console.log('🏥 Creating initial health check...');
    
    try {
      await prisma.healthCheck.create({
        data: {
          service: 'amis-backend',
          status: 'healthy',
          message: 'Initial health check after seeding',
          responseTime: 0,
        },
      });
      console.log('  ✅ Initial health check created');
    } catch (error) {
      console.log('  ℹ️ HealthCheck model not found, skipping health check creation');
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
