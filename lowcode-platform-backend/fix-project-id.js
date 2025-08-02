const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProjectId() {
  try {
    console.log('🔧 修复关系数据的project_id...');
    
    // 更新所有关系的project_id为demo-project-1
    const result = await prisma.relation.updateMany({
      data: {
        projectId: 'demo-project-1'
      }
    });
    
    console.log(`✅ 已更新 ${result.count} 个关系的project_id`);
    
    // 验证更新结果
    const relations = await prisma.relation.findMany({
      where: {
        projectId: 'demo-project-1'
      },
      select: {
        id: true,
        name: true,
        projectId: true
      }
    });
    
    console.log(`📊 项目 demo-project-1 现在有 ${relations.length} 个关系:`);
    relations.forEach((rel, index) => {
      console.log(`   ${index + 1}. ${rel.name} (ID: ${rel.id})`);
    });
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectId();