const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('Testing Prisma connection...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=lowcode",
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });

    console.log('Prisma client created successfully');
    
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    const projects = await prisma.project.findMany();
    console.log('Projects found:', projects.length);
    
    await prisma.$disconnect();
    console.log('Disconnected from database');
    
  } catch (error) {
    console.error('Error testing Prisma:', error);
  }
}

testPrisma();
