import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
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
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();