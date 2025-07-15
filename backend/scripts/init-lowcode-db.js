const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initLowcodeDatabase() {
  console.log('🚀 初始化低代码数据库...');

  try {
    // 1. 检查并创建低代码页面表（如果不存在）
    console.log('📋 检查数据库表结构...');
    
    // 使用原生SQL检查表是否存在
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sys_lowcode_page', 'sys_lowcode_page_version')
    `;
    
    console.log('现有表:', tablesResult);

    // 2. 检查菜单表是否有lowcode_page_id字段
    const menuColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sys_menu' 
      AND column_name = 'lowcode_page_id'
    `;

    if (menuColumns.length === 0) {
      console.log('📝 为菜单表添加lowcode_page_id字段...');
      await prisma.$executeRaw`
        ALTER TABLE sys_menu ADD COLUMN IF NOT EXISTS lowcode_page_id VARCHAR(36)
      `;
      console.log('✅ 菜单表字段添加成功');
    } else {
      console.log('✅ 菜单表已包含lowcode_page_id字段');
    }

    // 3. 创建低代码页面表（如果不存在）
    const lowcodePageExists = tablesResult.some(row => row.table_name === 'sys_lowcode_page');
    if (!lowcodePageExists) {
      console.log('📝 创建低代码页面表...');
      await prisma.$executeRaw`
        CREATE TABLE sys_lowcode_page (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          title VARCHAR(100) NOT NULL,
          code VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          schema JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'ENABLED',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP,
          updated_by VARCHAR(255)
        )
      `;
      console.log('✅ 低代码页面表创建成功');
    } else {
      console.log('✅ 低代码页面表已存在');
    }

    // 4. 创建低代码页面版本表（如果不存在）
    const lowcodeVersionExists = tablesResult.some(row => row.table_name === 'sys_lowcode_page_version');
    if (!lowcodeVersionExists) {
      console.log('📝 创建低代码页面版本表...');
      await prisma.$executeRaw`
        CREATE TABLE sys_lowcode_page_version (
          id VARCHAR(36) PRIMARY KEY,
          page_id VARCHAR(36) NOT NULL,
          version VARCHAR(20) NOT NULL,
          schema JSONB NOT NULL,
          changelog TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          FOREIGN KEY (page_id) REFERENCES sys_lowcode_page(id) ON DELETE CASCADE
        )
      `;
      console.log('✅ 低代码页面版本表创建成功');
    } else {
      console.log('✅ 低代码页面版本表已存在');
    }

    // 5. 插入示例数据
    console.log('📝 插入示例数据...');
    
    // 检查是否已有示例数据
    const existingPages = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sys_lowcode_page WHERE code IN ('demo-user-management', 'demo-dashboard')
    `;

    if (existingPages[0].count == 0) {
      // 插入示例页面
      await prisma.$executeRaw`
        INSERT INTO sys_lowcode_page (id, name, title, code, description, schema, status, created_by) VALUES
        ('demo-page-1', '用户管理页面', '用户管理', 'demo-user-management', '演示用户管理功能的低代码页面', 
         '{"type":"page","title":"用户管理","body":[{"type":"crud","api":"/api/users","columns":[{"name":"id","label":"ID","type":"text"},{"name":"username","label":"用户名","type":"text"},{"name":"email","label":"邮箱","type":"text"},{"name":"status","label":"状态","type":"status"}]}]}', 
         'ENABLED', 'system'),
        ('demo-page-2', '数据仪表板', '仪表板', 'demo-dashboard', '演示数据展示的仪表板页面',
         '{"type":"page","title":"数据仪表板","body":[{"type":"grid","columns":[{"type":"panel","title":"用户统计","body":[{"type":"tpl","tpl":"<div class=\\"text-center\\"><h2 class=\\"text-info\\">1,234</h2><p>总用户数</p></div>"}]},{"type":"panel","title":"订单统计","body":[{"type":"tpl","tpl":"<div class=\\"text-center\\"><h2 class=\\"text-success\\">5,678</h2><p>总订单数</p></div>"}]}]}]}',
         'ENABLED', 'system')
      `;

      // 插入版本数据
      await prisma.$executeRaw`
        INSERT INTO sys_lowcode_page_version (id, page_id, version, schema, changelog, created_by) VALUES
        ('demo-version-1', 'demo-page-1', '1.0.0', 
         '{"type":"page","title":"用户管理","body":[{"type":"crud","api":"/api/users","columns":[{"name":"id","label":"ID","type":"text"},{"name":"username","label":"用户名","type":"text"},{"name":"email","label":"邮箱","type":"text"},{"name":"status","label":"状态","type":"status"}]}]}',
         '初始版本', 'system'),
        ('demo-version-2', 'demo-page-2', '1.0.0',
         '{"type":"page","title":"数据仪表板","body":[{"type":"grid","columns":[{"type":"panel","title":"用户统计","body":[{"type":"tpl","tpl":"<div class=\\"text-center\\"><h2 class=\\"text-info\\">1,234</h2><p>总用户数</p></div>"}]}]}]}',
         '初始版本', 'system')
      `;

      console.log('✅ 示例数据插入成功');
    } else {
      console.log('✅ 示例数据已存在');
    }

    // 6. 验证数据
    const pageCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sys_lowcode_page`;
    const versionCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sys_lowcode_page_version`;

    console.log('\n📊 数据库状态:');
    console.log(`- 低代码页面数量: ${pageCount[0].count}`);
    console.log(`- 页面版本数量: ${versionCount[0].count}`);

    console.log('\n🎉 低代码数据库初始化完成！');
    console.log('\n📋 可用的测试端点:');
    console.log('- 完整版API: /lowcode-pages');
    console.log('- 简化版API: /simple-lowcode-pages');
    console.log('- 设计器API: /designer');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initLowcodeDatabase()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initLowcodeDatabase };
