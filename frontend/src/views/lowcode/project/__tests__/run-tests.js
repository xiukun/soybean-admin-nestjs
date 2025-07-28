#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 开始运行低代码项目管理模块测试...\n');

const testFiles = [
  'project-management.test.ts',
  'project-performance.test.ts', 
  'virtual-list.test.ts',
  'project-api.test.ts'
];

const testDir = path.join(__dirname);

testFiles.forEach((testFile, index) => {
  console.log(`📋 运行测试 ${index + 1}/${testFiles.length}: ${testFile}`);
  
  try {
    const command = `npx vitest run ${path.join(testDir, testFile)}`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../../..')
    });
    console.log(`✅ ${testFile} 测试通过\n`);
  } catch (error) {
    console.log(`❌ ${testFile} 测试失败\n`);
    console.error(error.message);
  }
});

console.log('🎉 所有测试运行完成！');