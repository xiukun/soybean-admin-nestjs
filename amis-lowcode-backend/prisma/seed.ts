import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
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
