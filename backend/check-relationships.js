const { PrismaClient } = require('@prisma/client');

async function checkData() {
  let prisma;
  try {
    console.log('🔍 初始化Prisma客户端...');
    
    // 初始化Prisma客户端
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('✅ Prisma客户端初始化成功');
    console.log('🔍 检查数据库中的数据...');
    
    // 检查项目
    const project = await prisma.project.findUnique({
      where: { id: 'demo-project-1' }
    });
    console.log('📋 项目:', project ? `${project.name} (${project.id})` : '未找到');
    
    // 检查实体
    const entities = await prisma.entity.findMany({
      where: { projectId: 'demo-project-1' }
    });
    console.log('🏗️ 实体数量:', entities.length);
    entities.forEach(entity => {
      console.log(`   - ${entity.name} (${entity.id})`);
    });
    
    // 检查关系
    const relations = await prisma.relation.findMany({
      where: { projectId: 'demo-project-1' },
      include: {
        sourceEntity: true,
        targetEntity: true
      }
    });
    console.log('🔗 关系数量:', relations.length);
    relations.forEach(rel => {
      console.log(`   - ${rel.name}: ${rel.sourceEntity?.name} → ${rel.targetEntity?.name} (${rel.type})`);
    });
    
    // 检查字段
    const fields = await prisma.field.findMany({
      where: { 
        entity: { 
          projectId: 'demo-project-1' 
        } 
      }
    });
    console.log('📝 字段数量:', fields.length);
    
    // 测试API查询逻辑
    console.log('\n🔍 测试API查询逻辑...');
    const apiResult = await prisma.relation.findMany({
      where: { projectId: 'demo-project-1' },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceEntity: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        targetEntity: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        sourceField: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        targetField: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });
    
    console.log('📊 API查询结果数量:', apiResult.length);
    if (apiResult.length > 0) {
      console.log('📊 第一个关系示例:', JSON.stringify(apiResult[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

checkData();