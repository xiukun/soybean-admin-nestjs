#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 路径别名映射
const pathAliases = {
  // 主要别名
  'src/': '@src/',
  'src/app/': '@app/',
  'src/api/': '@api/',
  'src/lib/': '@lib/',
  'src/infra/': '@infra/',
  'src/views/': '@views/',
  'src/resources/': '@resources/',
  
  // 业务上下文别名
  'src/lib/bounded-contexts/entity/': '@entity/',
  'src/lib/bounded-contexts/api/': '@api-context/',
  'src/lib/bounded-contexts/codegen/': '@codegen/',
  'src/lib/bounded-contexts/project/': '@project/',
  'src/lib/code-generation/': '@code-generation/',
  
  // 共享模块别名
  'src/lib/shared/': '@shared/',
  'src/lib/config/': '@config/',
  'src/lib/utils/': '@utils/',
  'src/lib/shared/controllers/': '@controllers/',
  'src/lib/shared/services/': '@services/',
  'src/lib/shared/middleware/': '@middleware/',
  'src/lib/shared/decorators/': '@decorators/',
  'src/lib/shared/interceptors/': '@interceptors/',
  'src/lib/shared/dto/': '@dto/',
  'src/lib/shared/prisma/': '@prisma/',
  
  // 测试别名
  'test/': '@test/',
  'test/utils/': '@test-utils/',
};

// 获取所有 TypeScript 文件
function getAllTsFiles() {
  const patterns = [
    'src/**/*.ts',
    'test/**/*.ts',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**'
  ];
  
  let files = [];
  patterns.forEach(pattern => {
    if (pattern.startsWith('!')) {
      // 排除模式暂时忽略，glob 会自动处理
      return;
    }
    const matches = glob.sync(pattern, { ignore: ['node_modules/**', 'dist/**', 'coverage/**'] });
    files = files.concat(matches);
  });
  
  return [...new Set(files)]; // 去重
}

// 转换相对路径为绝对路径
function resolveRelativePath(currentFile, importPath) {
  if (!importPath.startsWith('.')) {
    return importPath; // 不是相对路径
  }
  
  const currentDir = path.dirname(currentFile);
  const absolutePath = path.resolve(currentDir, importPath);
  const relativePath = path.relative(process.cwd(), absolutePath);
  
  return relativePath.replace(/\\/g, '/'); // 统一使用正斜杠
}

// 应用路径别名
function applyPathAlias(importPath) {
  // 按长度排序，优先匹配更具体的路径
  const sortedAliases = Object.keys(pathAliases).sort((a, b) => b.length - a.length);
  
  for (const originalPath of sortedAliases) {
    if (importPath.startsWith(originalPath)) {
      return importPath.replace(originalPath, pathAliases[originalPath]);
    }
  }
  
  return importPath;
}

// 更新文件中的导入语句
function updateImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let hasChanges = false;
  
  // 匹配 import 语句的正则表达式
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  
  updatedContent = updatedContent.replace(importRegex, (match, importPath) => {
    // 解析相对路径
    const resolvedPath = resolveRelativePath(filePath, importPath);
    
    // 应用路径别名
    const aliasedPath = applyPathAlias(resolvedPath);
    
    if (aliasedPath !== importPath) {
      hasChanges = true;
      console.log(`  ${importPath} -> ${aliasedPath}`);
      return match.replace(importPath, aliasedPath);
    }
    
    return match;
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    return true;
  }
  
  return false;
}

// 主函数
function main() {
  console.log('🔄 开始更新导入路径...\n');
  
  const tsFiles = getAllTsFiles();
  let updatedFiles = 0;
  
  tsFiles.forEach(file => {
    console.log(`📁 处理文件: ${file}`);
    const hasChanges = updateImportsInFile(file);
    
    if (hasChanges) {
      updatedFiles++;
      console.log(`  ✅ 已更新`);
    } else {
      console.log(`  ⏭️  无需更新`);
    }
    console.log('');
  });
  
  console.log(`\n🎉 完成！共处理 ${tsFiles.length} 个文件，更新了 ${updatedFiles} 个文件。`);
  
  if (updatedFiles > 0) {
    console.log('\n📝 建议：');
    console.log('1. 检查更新后的导入路径是否正确');
    console.log('2. 运行 npm run build 确保编译通过');
    console.log('3. 运行 npm test 确保测试通过');
    console.log('4. 提交更改前请仔细检查 git diff');
  }
}

// 检查是否安装了 glob
try {
  require('glob');
} catch (error) {
  console.error('❌ 错误: 需要安装 glob 包');
  console.log('请运行: npm install --save-dev glob');
  process.exit(1);
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  pathAliases,
  updateImportsInFile,
  applyPathAlias,
};
