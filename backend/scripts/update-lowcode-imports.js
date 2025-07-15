const fs = require('fs');
const path = require('path');

// 需要更新的文件列表
const filesToUpdate = [
  // Query handlers
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/application/query-handlers/get-lowcode-page-by-code.query.handler.ts',
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/application/query-handlers/get-lowcode-page-by-id.query.handler.ts',
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/application/query-handlers/get-lowcode-page-by-menu.query.handler.ts',
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/application/query-handlers/get-lowcode-page-versions.query.handler.ts',
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/application/query-handlers/get-lowcode-pages.query.handler.ts',
  
  // Module files
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/lowcode-page.module.ts',
  
  // Infrastructure files
  'apps/base-system/src/lib/bounded-contexts/lowcode/page/infrastructure/lowcode-page.pg.repository.ts',
];

// 导入路径映射规则
const importMappings = [
  // Commands
  {
    from: /from ['"]\.\.\/\.\.\/commands\/(.*?)['"];?/g,
    to: "from '@lowcode/page/commands/$1';"
  },
  // Queries
  {
    from: /from ['"]\.\.\/\.\.\/queries\/(.*?)['"];?/g,
    to: "from '@lowcode/page/queries/$1';"
  },
  // Domain
  {
    from: /from ['"]\.\.\/\.\.\/domain\/(.*?)['"];?/g,
    to: "from '@lowcode/page/domain/$1';"
  },
  // Infrastructure
  {
    from: /from ['"]\.\.\/\.\.\/infrastructure\/(.*?)['"];?/g,
    to: "from '@lowcode/page/infrastructure/$1';"
  },
  // Tokens
  {
    from: /from ['"]\.\.\/\.\.\/lowcode-page\.tokens['"];?/g,
    to: "from '@lowcode/page/lowcode-page.tokens';"
  },
  // Application
  {
    from: /from ['"]\.\.\/\.\.\/application\/(.*?)['"];?/g,
    to: "from '@lowcode/page/application/$1';"
  },
  // Relative imports within the same directory level
  {
    from: /from ['"]\.\.\/commands\/(.*?)['"];?/g,
    to: "from '@lowcode/page/commands/$1';"
  },
  {
    from: /from ['"]\.\.\/queries\/(.*?)['"];?/g,
    to: "from '@lowcode/page/queries/$1';"
  },
  {
    from: /from ['"]\.\.\/domain\/(.*?)['"];?/g,
    to: "from '@lowcode/page/domain/$1';"
  },
  {
    from: /from ['"]\.\.\/infrastructure\/(.*?)['"];?/g,
    to: "from '@lowcode/page/infrastructure/$1';"
  },
  {
    from: /from ['"]\.\.\/lowcode-page\.tokens['"];?/g,
    to: "from '@lowcode/page/lowcode-page.tokens';"
  },
  // Single level relative imports
  {
    from: /from ['"]\.\/commands\/(.*?)['"];?/g,
    to: "from '@lowcode/page/commands/$1';"
  },
  {
    from: /from ['"]\.\/queries\/(.*?)['"];?/g,
    to: "from '@lowcode/page/queries/$1';"
  },
  {
    from: /from ['"]\.\/domain\/(.*?)['"];?/g,
    to: "from '@lowcode/page/domain/$1';"
  },
  {
    from: /from ['"]\.\/infrastructure\/(.*?)['"];?/g,
    to: "from '@lowcode/page/infrastructure/$1';"
  },
  {
    from: /from ['"]\.\/lowcode-page\.tokens['"];?/g,
    to: "from '@lowcode/page/lowcode-page.tokens';"
  }
];

console.log('🔧 更新 Lowcode 导入路径...');

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let hasChanges = false;
      
      // 应用所有映射规则
      importMappings.forEach(mapping => {
        const originalContent = content;
        content = content.replace(mapping.from, mapping.to);
        if (content !== originalContent) {
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ 更新: ${filePath}`);
        updatedCount++;
      } else {
        console.log(`⚠️  跳过: ${filePath} (无需更新)`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${filePath} - ${error.message}`);
      errorCount++;
    }
  } else {
    console.log(`❌ 文件不存在: ${filePath}`);
    errorCount++;
  }
});

console.log('\n📊 更新统计:');
console.log(`✅ 成功更新: ${updatedCount} 个文件`);
console.log(`❌ 错误: ${errorCount} 个文件`);
console.log('🎉 导入路径更新完成！');

if (updatedCount > 0) {
  console.log('\n💡 建议:');
  console.log('1. 重新编译项目以验证更新');
  console.log('2. 运行测试确保功能正常');
  console.log('3. 检查 IDE 是否有类型错误');
}
