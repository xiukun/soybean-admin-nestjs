const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateMenuTypeEnum() {
  console.log('🔧 更新 MenuType 枚举类型...');

  try {
    // 1. 检查当前枚举值
    console.log('📋 检查当前 MenuType 枚举值...');
    
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'MenuType'
      )
      ORDER BY enumsortorder;
    `;
    
    console.log('当前枚举值:', enumValues.map(v => v.enumlabel));

    // 2. 检查是否已包含 lowcode
    const hasLowcode = enumValues.some(v => v.enumlabel === 'lowcode');
    
    if (hasLowcode) {
      console.log('✅ MenuType 枚举已包含 lowcode 值');
    } else {
      console.log('📝 添加 lowcode 到 MenuType 枚举...');
      
      // 添加 lowcode 枚举值
      await prisma.$executeRaw`
        ALTER TYPE "MenuType" ADD VALUE 'lowcode';
      `;
      
      console.log('✅ lowcode 枚举值添加成功');
    }

    // 3. 验证更新后的枚举值
    const updatedEnumValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'MenuType'
      )
      ORDER BY enumsortorder;
    `;
    
    console.log('✅ 更新后的枚举值:', updatedEnumValues.map(v => v.enumlabel));

    // 4. 测试创建低代码菜单
    console.log('\n🧪 测试创建低代码菜单...');
    
    const testMenu = {
      menuType: 'lowcode',
      menuName: '测试低代码菜单_' + Date.now(),
      routeName: 'test-lowcode-menu-' + Date.now(),
      routePath: '/test-lowcode',
      component: 'view.amis-template',
      status: 'ENABLED',
      pid: 0,
      order: 999,
      constant: false,
      lowcodePageId: 'demo-page-1',
      createdBy: 'system',
      createdAt: new Date(),
    };

    const createdMenu = await prisma.sysMenu.create({
      data: testMenu
    });

    console.log('✅ 低代码菜单创建成功，ID:', createdMenu.id);

    // 清理测试菜单
    await prisma.sysMenu.delete({
      where: { id: createdMenu.id }
    });
    console.log('🧹 测试菜单已清理');

    // 5. 显示菜单统计
    const menuStats = await prisma.$queryRaw`
      SELECT menu_type, COUNT(*) as count 
      FROM sys_menu 
      GROUP BY menu_type 
      ORDER BY menu_type;
    `;
    
    console.log('\n📊 菜单类型统计:');
    menuStats.forEach(stat => {
      console.log(`  ${stat.menu_type}: ${stat.count} 个`);
    });

    console.log('\n🎉 MenuType 枚举更新完成！');
    console.log('\n📋 现在支持的菜单类型:');
    console.log('- directory: 目录菜单');
    console.log('- menu: 普通页面菜单');
    console.log('- lowcode: 低代码页面菜单');

  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error);
    
    if (error.code === '42710') {
      console.log('\n💡 枚举值已存在，这是正常的');
    } else if (error.message.includes('invalid input value for enum')) {
      console.log('\n💡 这表明数据库枚举需要更新');
      console.log('请确保运行此脚本来更新枚举类型');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateMenuTypeEnum()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { updateMenuTypeEnum };
