#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 从 tsconfig.json 读取路径别名配置
function loadPathAliases() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const paths = tsconfig.compilerOptions?.paths || {};
  const baseUrl = tsconfig.compilerOptions?.baseUrl || './';
  
  return { paths, baseUrl };
}

// 验证路径别名是否指向实际存在的目录
function validateAliasDirectories(paths, baseUrl) {
  console.log('🔍 验证路径别名目录...\n');
  
  const issues = [];
  
  Object.entries(paths).forEach(([alias, targets]) => {
    const cleanAlias = alias.replace('/*', '');
    
    targets.forEach(target => {
      const cleanTarget = target.replace('/*', '');
      const fullPath = path.resolve(baseUrl, cleanTarget);
      
      if (!fs.existsSync(fullPath)) {
        issues.push({
          type: 'missing_directory',
          alias: cleanAlias,
          target: cleanTarget,
          fullPath,
        });
      } else {
        console.log(`✅ ${cleanAlias} -> ${cleanTarget}`);
      }
    });
  });
  
  if (issues.length > 0) {
    console.log('\n❌ 发现问题：');
    issues.forEach(issue => {
      console.log(`  - 别名 "${issue.alias}" 指向不存在的目录: ${issue.target}`);
    });
  }
  
  return issues;
}

// 查找所有使用路径别名的文件
function findFilesUsingAliases(paths) {
  console.log('\n🔍 查找使用路径别名的文件...\n');
  
  const tsFiles = glob.sync('src/**/*.ts', { ignore: ['node_modules/**', 'dist/**'] });
  const testFiles = glob.sync('test/**/*.ts', { ignore: ['node_modules/**', 'dist/**'] });
  const allFiles = [...tsFiles, ...testFiles];
  
  const aliasUsage = {};
  const issues = [];
  
  // 初始化别名使用统计
  Object.keys(paths).forEach(alias => {
    const cleanAlias = alias.replace('/*', '');
    aliasUsage[cleanAlias] = 0;
  });
  
  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // 检查是否使用了路径别名
      Object.keys(paths).forEach(alias => {
        const cleanAlias = alias.replace('/*', '');
        if (importPath.startsWith(cleanAlias)) {
          aliasUsage[cleanAlias]++;
        }
      });
      
      // 检查是否还有复杂的相对路径
      if (importPath.includes('../../../')) {
        issues.push({
          type: 'complex_relative_path',
          file: filePath,
          importPath,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }
  });
  
  // 显示别名使用统计
  console.log('📊 路径别名使用统计：');
  Object.entries(aliasUsage)
    .sort(([,a], [,b]) => b - a)
    .forEach(([alias, count]) => {
      const status = count > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${alias}: ${count} 次使用`);
    });
  
  // 显示复杂相对路径问题
  if (issues.length > 0) {
    console.log('\n⚠️ 发现复杂相对路径（建议使用路径别名）：');
    issues.forEach(issue => {
      console.log(`  - ${issue.file}:${issue.line} -> ${issue.importPath}`);
    });
  }
  
  return { aliasUsage, issues };
}

// 检查循环依赖
async function checkCircularDependencies() {
  console.log('\n🔄 检查循环依赖...\n');
  
  try {
    const { execSync } = require('child_process');
    const result = execSync('npx madge --circular --extensions ts src/', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.trim()) {
      console.log('❌ 发现循环依赖：');
      console.log(result);
      return false;
    } else {
      console.log('✅ 未发现循环依赖');
      return true;
    }
  } catch (error) {
    if (error.stdout && error.stdout.includes('No circular dependency found!')) {
      console.log('✅ 未发现循环依赖');
      return true;
    } else {
      console.log('⚠️ 无法检查循环依赖（可能需要安装 madge）');
      console.log('运行: npm install --save-dev madge');
      return null;
    }
  }
}

// 验证 Jest 配置是否与 tsconfig 同步
function validateJestConfig(paths) {
  console.log('\n🧪 验证 Jest 配置...\n');
  
  const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
  
  if (!fs.existsSync(jestConfigPath)) {
    console.log('⚠️ jest.config.js 不存在');
    return false;
  }
  
  const jestConfigContent = fs.readFileSync(jestConfigPath, 'utf8');
  const issues = [];
  
  Object.keys(paths).forEach(alias => {
    const cleanAlias = alias.replace('/*', '');
    const expectedMapping = `'^${cleanAlias.replace('@', '\\@')}/(.*)$'`;
    
    if (!jestConfigContent.includes(expectedMapping)) {
      issues.push({
        type: 'missing_jest_mapping',
        alias: cleanAlias,
        expectedMapping,
      });
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ Jest 配置与 tsconfig.json 同步');
    return true;
  } else {
    console.log('❌ Jest 配置问题：');
    issues.forEach(issue => {
      console.log(`  - 缺少别名映射: ${issue.alias}`);
    });
    return false;
  }
}

// 生成路径别名使用报告
function generateReport(aliasUsage, directoryIssues, pathIssues) {
  const reportPath = path.join(process.cwd(), 'path-aliases-report.md');
  
  const report = `# 路径别名验证报告

生成时间: ${new Date().toLocaleString()}

## 📊 别名使用统计

| 别名 | 使用次数 | 状态 |
|------|----------|------|
${Object.entries(aliasUsage)
  .sort(([,a], [,b]) => b - a)
  .map(([alias, count]) => `| \`${alias}\` | ${count} | ${count > 0 ? '✅ 使用中' : '⚠️ 未使用'} |`)
  .join('\n')}

## 🔍 目录验证结果

${directoryIssues.length === 0 
  ? '✅ 所有路径别名都指向有效目录' 
  : `❌ 发现 ${directoryIssues.length} 个目录问题：\n\n${directoryIssues.map(issue => `- \`${issue.alias}\` -> \`${issue.target}\` (目录不存在)`).join('\n')}`
}

## ⚠️ 需要优化的导入路径

${pathIssues.length === 0
  ? '✅ 未发现复杂相对路径'
  : `发现 ${pathIssues.length} 个复杂相对路径，建议使用路径别名：\n\n${pathIssues.map(issue => `- \`${issue.file}\` 第 ${issue.line} 行: \`${issue.importPath}\``).join('\n')}`
}

## 🛠️ 建议

1. **未使用的别名**: 考虑移除未使用的路径别名以简化配置
2. **复杂相对路径**: 运行 \`npm run update-imports\` 自动转换为路径别名
3. **循环依赖**: 定期运行 \`npx madge --circular --extensions ts src/\` 检查
4. **配置同步**: 确保 Jest 配置与 tsconfig.json 保持同步

## 📝 相关命令

\`\`\`bash
# 自动更新导入路径
npm run update-imports

# 检查 TypeScript 编译
npm run check-imports

# 检测循环依赖
npx madge --circular --extensions ts src/

# 重新验证路径别名
npm run validate-aliases
\`\`\`
`;

  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n📄 报告已生成: ${reportPath}`);
}

// 主函数
async function main() {
  console.log('🚀 开始验证路径别名配置...\n');
  
  try {
    // 1. 加载路径别名配置
    const { paths, baseUrl } = loadPathAliases();
    console.log(`📁 基础路径: ${baseUrl}`);
    console.log(`🔗 配置了 ${Object.keys(paths).length} 个路径别名\n`);
    
    // 2. 验证目录存在性
    const directoryIssues = validateAliasDirectories(paths, baseUrl);
    
    // 3. 分析别名使用情况
    const { aliasUsage, issues: pathIssues } = findFilesUsingAliases(paths);
    
    // 4. 检查循环依赖
    const circularDepsOk = await checkCircularDependencies();
    
    // 5. 验证 Jest 配置
    const jestConfigOk = validateJestConfig(paths);
    
    // 6. 生成报告
    generateReport(aliasUsage, directoryIssues, pathIssues);
    
    // 7. 总结
    console.log('\n📋 验证总结：');
    console.log(`  - 目录验证: ${directoryIssues.length === 0 ? '✅ 通过' : `❌ ${directoryIssues.length} 个问题`}`);
    console.log(`  - 复杂相对路径: ${pathIssues.length === 0 ? '✅ 无' : `⚠️ ${pathIssues.length} 个`}`);
    console.log(`  - 循环依赖: ${circularDepsOk === true ? '✅ 无' : circularDepsOk === false ? '❌ 有' : '⚠️ 未检查'}`);
    console.log(`  - Jest 配置: ${jestConfigOk ? '✅ 同步' : '❌ 不同步'}`);
    
    const hasIssues = directoryIssues.length > 0 || pathIssues.length > 0 || !jestConfigOk || circularDepsOk === false;
    
    if (hasIssues) {
      console.log('\n⚠️ 发现问题，请查看报告并进行修复');
      process.exit(1);
    } else {
      console.log('\n🎉 路径别名配置验证通过！');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 检查依赖
const requiredPackages = ['glob'];
const missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require(pkg);
  } catch (error) {
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.error('❌ 缺少必要的依赖包:');
  missingPackages.forEach(pkg => console.error(`  - ${pkg}`));
  console.log('\n请运行: npm install --save-dev ' + missingPackages.join(' '));
  process.exit(1);
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  loadPathAliases,
  validateAliasDirectories,
  findFilesUsingAliases,
  checkCircularDependencies,
  validateJestConfig,
};
