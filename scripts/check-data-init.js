#!/usr/bin/env node

/**
 * 数据初始化状态检查脚本
 * Data Initialization Status Check Script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查数据初始化状态...');
console.log('🔍 Checking Data Initialization Status...');

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${filePath}`);
  return exists;
}

// 检查目录是否存在
function checkDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${dirPath}`);
  return exists;
}

// 检查package.json中的seed配置
function checkSeedConfig(packageJsonPath, serviceName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasSeedConfig = packageJson.prisma && packageJson.prisma.seed;
    const status = hasSeedConfig ? '✅' : '❌';
    console.log(`${status} ${serviceName} Seed配置: ${hasSeedConfig ? packageJson.prisma.seed : '未配置'}`);
    return hasSeedConfig;
  } catch (error) {
    console.log(`❌ ${serviceName} package.json读取失败: ${error.message}`);
    return false;
  }
}

console.log('\n📋 低代码平台后端 (Low-code Platform Backend)');
console.log('=' .repeat(60));

const lowcodePlatformBase = path.join(__dirname, '../lowcode-platform-backend');
checkDirectoryExists(lowcodePlatformBase, '低代码平台目录');
checkFileExists(path.join(lowcodePlatformBase, 'prisma/schema.prisma'), 'Prisma Schema');
checkFileExists(path.join(lowcodePlatformBase, 'prisma/seed.ts'), '种子文件');
checkFileExists(path.join(lowcodePlatformBase, 'src/infra/database/database-init.service.ts'), '数据库初始化服务');
checkFileExists(path.join(lowcodePlatformBase, 'scripts/dev-init.sh'), '开发环境初始化脚本');
checkFileExists(path.join(lowcodePlatformBase, 'docker-entrypoint.sh'), 'Docker启动脚本');
checkSeedConfig(path.join(lowcodePlatformBase, 'package.json'), '低代码平台');

console.log('\n📋 Amis低代码后端 (Amis Low-code Backend)');
console.log('=' .repeat(60));

const amisLowcodeBase = path.join(__dirname, '../amis-lowcode-backend');
checkDirectoryExists(amisLowcodeBase, 'Amis低代码目录');
checkFileExists(path.join(amisLowcodeBase, 'prisma/schema.prisma'), 'Prisma Schema');
checkFileExists(path.join(amisLowcodeBase, 'prisma/seed.ts'), '种子文件');
checkFileExists(path.join(amisLowcodeBase, 'src/shared/database/database-init.service.ts'), '数据库初始化服务');
checkFileExists(path.join(amisLowcodeBase, 'scripts/dev-init.sh'), '开发环境初始化脚本');
checkFileExists(path.join(amisLowcodeBase, 'docker/startup.sh'), 'Docker启动脚本');
checkSeedConfig(path.join(amisLowcodeBase, 'package.json'), 'Amis低代码');

console.log('\n📋 部署配置 (Deployment Configuration)');
console.log('=' .repeat(60));

const deployBase = path.join(__dirname, '../deploy');
checkDirectoryExists(deployBase, '部署目录');
checkFileExists(path.join(deployBase, 'postgres/11_lowcode_platform_data.sql'), '低代码平台数据SQL');
checkFileExists(path.join(deployBase, 'postgres/12_lowcode_queries_init.sql'), '查询初始化SQL');
checkFileExists(path.join(deployBase, 'postgres/13_prisma_templates_update.sql'), 'Prisma模板更新SQL');

console.log('\n📊 统一数据初始化方案检查完成');
console.log('📊 Unified Data Initialization Plan Check Complete');

console.log('\n🚀 使用说明:');
console.log('🚀 Usage Instructions:');
console.log('');
console.log('开发环境 (Development):');
console.log('  cd lowcode-platform-backend && ./scripts/dev-init.sh');
console.log('  cd amis-lowcode-backend && ./scripts/dev-init.sh');
console.log('');
console.log('Docker环境 (Docker):');
console.log('  设置环境变量: AUTO_INIT_DATA=true DOCKER_ENV=true');
console.log('  Set environment variables: AUTO_INIT_DATA=true DOCKER_ENV=true');
console.log('');
console.log('手动初始化 (Manual):');
console.log('  npx prisma db push && npx prisma db seed');
console.log('');
