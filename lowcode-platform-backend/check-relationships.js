const { PrismaClient } = require('@prisma/client');

// 初始化Prisma客户端
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 检查数据库中的数据...');
    
    // 1. 检查项目
    console.log('\n📁 检查项目数据:');
    const project = await prisma.project.findUnique({
      where: { id: 'demo-project-1' }
    });
    
    if (project) {
      console.log(`✅ 找到项目: ${project.name} (ID: ${project.id})`);
    } else {
      console.log('❌ 未找到测试项目 demo-project-1');
      return;
    }

    // 2. 检查实体
    console.log('\n🏗️ 检查实体数据:');
    const entities = await prisma.entity.findMany({
      where: { projectId: 'demo-project-1' },
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ 找到 ${entities.length} 个实体:`);
    entities.forEach((entity, index) => {
      console.log(`   ${index + 1}. ${entity.name} (ID: ${entity.id})`);
    });

    // 3. 检查字段
    console.log('\n📋 检查字段数据:');
    const fields = await prisma.field.findMany({
      where: { 
        entity: { projectId: 'demo-project-1' }
      },
      include: { entity: true },
      orderBy: [
        { entity: { name: 'asc' } },
        { name: 'asc' }
      ]
    });
    
    console.log(`✅ 找到 ${fields.length} 个字段:`);
    let currentEntity = '';
    fields.forEach((field) => {
      if (field.entity.name !== currentEntity) {
        currentEntity = field.entity.name;
        console.log(`\n   ${currentEntity}:`);
      }
      console.log(`     - ${field.name} (${field.type}) - ID: ${field.id}`);
    });

    // 4. 检查关系
    console.log('\n🔗 检查关系数据:');
    const relationships = await prisma.relation.findMany({
      where: { projectId: 'demo-project-1' },
      include: {
        sourceEntity: true,
        targetEntity: true,
        sourceField: true,
        targetField: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ 找到 ${relationships.length} 个关系:`);
    relationships.forEach((rel, index) => {
      console.log(`   ${index + 1}. ${rel.name} (${rel.type})`);
      console.log(`      从: ${rel.sourceEntity.name}.${rel.sourceField?.name || 'N/A'}`);
      console.log(`      到: ${rel.targetEntity.name}.${rel.targetField?.name || 'N/A'}`);
      console.log(`      ID: ${rel.id}`);
      console.log('');
    });

    // 5. 测试API数据格式
    console.log('\n🔍 模拟API返回数据格式:');
    const apiData = relationships.map(rel => ({
      id: rel.id,
      name: rel.name,
      type: rel.type,
      description: rel.description,
      sourceEntityId: rel.sourceEntityId,
      targetEntityId: rel.targetEntityId,
      sourceFieldId: rel.sourceFieldId,
      targetFieldId: rel.targetFieldId,
      sourceEntity: {
        id: rel.sourceEntity.id,
        name: rel.sourceEntity.name
      },
      targetEntity: {
        id: rel.targetEntity.id,
        name: rel.targetEntity.name
      },
      sourceField: rel.sourceField ? {
        id: rel.sourceField.id,
        name: rel.sourceField.name,
        type: rel.sourceField.type
      } : null,
      targetField: rel.targetField ? {
        id: rel.targetField.id,
        name: rel.targetField.name,
        type: rel.targetField.type
      } : null
    }));

    console.log('✅ API数据格式预览:');
    console.log(JSON.stringify(apiData.slice(0, 2), null, 2));

    // 6. 统计信息
    console.log('\n📊 数据统计:');
    console.log(`   项目: 1`);
    console.log(`   实体: ${entities.length}`);
    console.log(`   字段: ${fields.length}`);
    console.log(`   关系: ${relationships.length}`);

    console.log('\n✅ 数据检查完成！所有测试数据都已正确保存到数据库中。');

  } catch (error) {
    console.error('❌ 检查数据失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行检查
checkData();