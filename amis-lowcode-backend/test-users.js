const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@6.12.0_prisma@6.12.0_typescript@5.8.3__typescript@5.8.3/node_modules/@prisma/client');

async function testUsers() {
  console.log('Testing Prisma Client with demo_users...');
  
  try {
    const prisma = new PrismaClient();
    console.log('PrismaClient created successfully');
    
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        status: true,
        tenantId: true,
        createdAt: true
      }
    });
    console.log('Users:', JSON.stringify(users, null, 2));
    
    await prisma.$disconnect();
    console.log('Disconnected successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUsers();
