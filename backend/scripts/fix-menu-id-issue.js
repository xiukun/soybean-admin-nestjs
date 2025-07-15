const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMenuIdIssue() {
  console.log('🔧 修复菜单ID冲突问题...');

  try {
    // 1. 检查是否存在ID为0的菜单记录
    console.log('📋 检查现有菜单记录...');
    
    const menuWithZeroId = await prisma.sysMenu.findUnique({
      where: { id: 0 }
    });

    if (menuWithZeroId) {
      console.log('⚠️  发现ID为0的菜单记录:', menuWithZeroId.menuName);
      
      // 删除ID为0的记录（如果它不是重要的记录）
      console.log('🗑️  删除ID为0的菜单记录...');
      await prisma.sysMenu.delete({
        where: { id: 0 }
      });
      console.log('✅ ID为0的菜单记录已删除');
    } else {
      console.log('✅ 没有发现ID为0的菜单记录');
    }

    // 2. 检查自增序列的当前值
    console.log('\n📊 检查菜单表的自增序列状态...');
    
    const maxId = await prisma.sysMenu.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });

    if (maxId) {
      console.log(`📈 当前最大菜单ID: ${maxId.id}`);
      
      // 重置自增序列到正确的值
      const nextId = maxId.id + 1;
      console.log(`🔄 重置自增序列到: ${nextId}`);
      
      await prisma.$executeRaw`SELECT setval('sys_menu_id_seq', ${nextId}, false)`;
      console.log('✅ 自增序列已重置');
    }

    // 3. 测试创建一个菜单记录
    console.log('\n🧪 测试菜单创建...');
    
    const testMenu = {
      menuType: 'directory',
      menuName: '测试菜单_' + Date.now(),
      routeName: 'test-menu-' + Date.now(),
      routePath: '/test-menu',
      component: 'layout.base',
      status: 'ENABLED',
      pid: 0,
      order: 999,
      constant: false,
      createdBy: 'system',
      createdAt: new Date(),
    };

    const createdMenu = await prisma.sysMenu.create({
      data: testMenu
    });

    console.log('✅ 测试菜单创建成功，ID:', createdMenu.id);

    // 清理测试菜单
    await prisma.sysMenu.delete({
      where: { id: createdMenu.id }
    });
    console.log('🧹 测试菜单已清理');

    // 4. 显示当前菜单统计
    const menuCount = await prisma.sysMenu.count();
    console.log(`\n📊 当前菜单总数: ${menuCount}`);

    console.log('\n🎉 菜单ID冲突问题修复完成！');
    console.log('\n📋 修复内容:');
    console.log('- 清理了可能存在的ID为0的菜单记录');
    console.log('- 重置了自增序列到正确的值');
    console.log('- 验证了菜单创建功能正常');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    
    if (error.code === 'P2002') {
      console.log('\n💡 这是唯一约束冲突错误，可能的解决方案:');
      console.log('1. 检查是否有重复的 routeName');
      console.log('2. 检查数据库中是否有孤立的记录');
      console.log('3. 手动清理冲突的数据');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixMenuIdIssue()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixMenuIdIssue };
