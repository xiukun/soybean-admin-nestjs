const { PrismaClient } = require('./node_modules/.prisma/client');

async function testPrisma() {
  console.log('Testing Prisma Client...');
  
  try {
    const prisma = new PrismaClient();
    console.log('PrismaClient created successfully');
    
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    const projectCount = await prisma.project.count();
    console.log(`Project count: ${projectCount}`);
    
    const projects = await prisma.project.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        code: true,
        status: true
      }
    });
    console.log('Projects:', JSON.stringify(projects, null, 2));
    
    await prisma.$disconnect();
    console.log('Disconnected successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPrisma();
