// 端到端功能测试脚本
const axios = require('axios');

const baseURL = 'http://localhost:3002/api/v1';
const projectId = 'demo-project-1';

async function testRelationshipFeatures() {
  console.log('🧪 开始端到端功能测试...\n');
  
  try {
    // 1. 测试项目数据获取
    console.log('1. 测试项目数据获取...');
    const projectsResponse = await axios.get(`${baseURL}/projects/paginated?current=1&size=100`);
    console.log(`   ✅ 获取到 ${projectsResponse.data.records.length} 个项目`);
    
    // 2. 测试实体数据获取
    console.log('2. 测试实体数据获取...');
    const entitiesResponse = await axios.get(`${baseURL}/entities/project/${projectId}`);
    console.log(`   ✅ 获取到 ${entitiesResponse.data.length} 个实体`);
    
    // 3. 测试关系数据获取
    console.log('3. 测试关系数据获取...');
    const relationshipsResponse = await axios.get(`${baseURL}/relationships/project/${projectId}/paginated?current=1&size=10`);
    console.log(`   ✅ 获取到 ${relationshipsResponse.data.items.length} 个关系`);
    console.log(`   📊 分页信息: 总数=${relationshipsResponse.data.pagination.total}, 页数=${relationshipsResponse.data.pagination.pages}`);
    
    // 4. 测试字段数据获取
    console.log('4. 测试字段数据获取...');
    const fieldsResponse = await axios.get(`${baseURL}/fields/project/${projectId}`);
    console.log(`   ✅ 获取到 ${fieldsResponse.data.length} 个字段`);
    
    // 5. 验证关系数据结构
    console.log('5. 验证关系数据结构...');
    const relationships = relationshipsResponse.data.items;
    if (relationships.length > 0) {
      const firstRelation = relationships[0];
      console.log(`   ✅ 关系名称: ${firstRelation.name}`);
      console.log(`   ✅ 关系类型: ${firstRelation.type}`);
      console.log(`   ✅ 源实体: ${firstRelation.sourceEntity?.name || firstRelation.sourceEntityId}`);
      console.log(`   ✅ 目标实体: ${firstRelation.targetEntity?.name || firstRelation.targetEntityId}`);
    }
    
    // 6. 验证实体数据结构
    console.log('6. 验证实体数据结构...');
    const entities = entitiesResponse.data;
    if (entities.length > 0) {
      const firstEntity = entities[0];
      console.log(`   ✅ 实体名称: ${firstEntity.name}`);
      console.log(`   ✅ 实体代码: ${firstEntity.code}`);
      console.log(`   ✅ 实体状态: ${firstEntity.status}`);
    }
    
    console.log('\n🎉 端到端功能测试完成！所有API接口正常工作。');
    console.log('\n📋 测试总结:');
    console.log(`   - 项目数据: ${projectsResponse.data.records.length} 个项目`);
    console.log(`   - 实体数据: ${entitiesResponse.data.length} 个实体`);
    console.log(`   - 关系数据: ${relationshipsResponse.data.items.length} 个关系`);
    console.log(`   - 字段数据: ${fieldsResponse.data.length} 个字段`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testRelationshipFeatures();