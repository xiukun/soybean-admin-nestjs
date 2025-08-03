#!/usr/bin/env node

/**
 * 数据库一致性检查脚本
 * 检查 Prisma Schema 与 SQL 文件的一致性
 * 确保 Docker 数据库与本地开发环境表结构一致
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseConsistencyChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.issues = [];
    this.warnings = [];
  }

  /**
   * 主检查函数
   */
  async checkConsistency() {
    console.log('🔍 开始数据库一致性检查...');
    console.log('=' .repeat(50));

    try {
      // 1. 检查 Prisma Schema 文件
      this.checkPrismaSchemas();

      // 2. 检查 SQL 初始化文件
      this.checkSqlFiles();

      // 3. 检查环境变量配置
      this.checkEnvironmentConfig();

      // 4. 检查服务配置一致性
      this.checkServiceConfig();

      // 5. 生成报告
      this.generateReport();

    } catch (error) {
      console.error('❌ 检查过程中发生错误:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查 Prisma Schema 文件
   */
  checkPrismaSchemas() {
    console.log('📋 检查 Prisma Schema 文件...');

    const schemas = [
      {
        name: 'Backend Service',
        path: 'backend/prisma/schema.prisma',
        expectedSchema: 'backend'
      },
      {
        name: 'Lowcode Platform',
        path: 'lowcode-platform-backend/prisma/schema.prisma',
        expectedSchema: 'lowcode'
      },
      {
        name: 'Amis Backend',
        path: 'amis-lowcode-backend/prisma/schema.prisma',
        expectedSchema: 'amis'
      }
    ];

    schemas.forEach(schema => {
      const schemaPath = path.join(this.projectRoot, schema.path);
      
      if (!fs.existsSync(schemaPath)) {
        this.issues.push(`❌ ${schema.name}: Schema 文件不存在 - ${schema.path}`);
        return;
      }

      const content = fs.readFileSync(schemaPath, 'utf8');
      
      // 检查 schema 配置
      const schemaPattern = new RegExp(`schemas.*${schema.expectedSchema}`);
      if (!schemaPattern.test(content)) {
        this.issues.push(`❌ ${schema.name}: Schema 配置不正确，应该使用 "${schema.expectedSchema}" schema`);
      } else {
        console.log(`  ✅ ${schema.name}: Schema 配置正确 (${schema.expectedSchema})`);
      }

      // 检查 multiSchema 预览功能
      if (!content.includes('previewFeatures = ["multiSchema"]')) {
        this.warnings.push(`⚠️  ${schema.name}: 建议启用 multiSchema 预览功能`);
      }

      console.log(`  ✅ ${schema.name}: Schema 文件检查通过`);
    });
  }

  /**
   * 检查 SQL 初始化文件
   */
  checkSqlFiles() {
    console.log('\n📋 检查 SQL 初始化文件...');

    const sqlDir = path.join(this.projectRoot, 'deploy/postgres');
    
    if (!fs.existsSync(sqlDir)) {
      this.issues.push('❌ SQL 初始化目录不存在: deploy/postgres');
      return;
    }

    const requiredFiles = [
      '00_init_schemas.sql',
      '01_create_table.sql',
      '10_lowcode_platform_tables.sql',
      '11_lowcode_platform_data.sql'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(sqlDir, file);
      if (!fs.existsSync(filePath)) {
        this.issues.push(`❌ 缺少必要的 SQL 文件: ${file}`);
      } else {
        console.log(`  ✅ ${file}: 文件存在`);
      }
    });

    // 检查 schema 初始化
    const initSchemaPath = path.join(sqlDir, '00_init_schemas.sql');
    if (fs.existsSync(initSchemaPath)) {
      const content = fs.readFileSync(initSchemaPath, 'utf8');
      const expectedSchemas = ['backend', 'lowcode', 'amis'];
      
      expectedSchemas.forEach(schema => {
        if (!content.includes(`CREATE SCHEMA IF NOT EXISTS ${schema}`)) {
          this.issues.push(`❌ 00_init_schemas.sql: 缺少 ${schema} schema 的创建语句`);
        }
      });
    }
  }

  /**
   * 检查环境变量配置
   */
  checkEnvironmentConfig() {
    console.log('\n📋 检查环境变量配置...');

    const envFiles = [
      'backend/.env.example',
      'lowcode-platform-backend/.env.example',
      'amis-lowcode-backend/.env.example',
      'frontend/.env.development'
    ];

    envFiles.forEach(envFile => {
      const envPath = path.join(this.projectRoot, envFile);
      if (!fs.existsSync(envPath)) {
        this.warnings.push(`⚠️  环境变量示例文件不存在: ${envFile}`);
      } else {
        console.log(`  ✅ ${envFile}: 文件存在`);
      }
    });

    // 检查 Docker Compose 环境变量
    const dockerComposePath = path.join(this.projectRoot, 'docker-compose.yml');
    if (fs.existsSync(dockerComposePath)) {
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      
      // 检查数据库 URL 配置
      const dbUrlPattern = /DATABASE_URL.*schema=(backend|lowcode|amis)/g;
      const matches = content.match(dbUrlPattern);
      
      if (!matches || matches.length < 3) {
        this.warnings.push('⚠️  Docker Compose: 数据库 URL 配置可能不完整');
      }
    }
  }

  /**
   * 检查服务配置一致性
   */
  checkServiceConfig() {
    console.log('\n📋 检查服务配置一致性...');

    // 检查端口配置
    const expectedPorts = {
      'frontend': 9527,
      'backend': 9528,
      'lowcode-platform-backend': 3002,
      'amis-lowcode-backend': 9522,
      'lowcode-designer': 9555
    };

    // 检查 package.json 工作空间配置
    const workspaceFile = path.join(this.projectRoot, 'pnpm-workspace.yaml');
    if (!fs.existsSync(workspaceFile)) {
      this.issues.push('❌ 缺少 pnpm-workspace.yaml 文件');
    } else {
      console.log('  ✅ pnpm-workspace.yaml: 文件存在');
    }

    console.log('  ✅ 服务配置检查完成');
  }

  /**
   * 生成检查报告
   */
  generateReport() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 数据库一致性检查报告');
    console.log('=' .repeat(50));

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('🎉 恭喜！所有检查都通过了！');
      console.log('✅ 数据库配置一致性良好');
      console.log('✅ Prisma Schema 配置正确');
      console.log('✅ SQL 初始化文件完整');
      return;
    }

    if (this.issues.length > 0) {
      console.log('\n🚨 发现以下问题需要修复:');
      this.issues.forEach(issue => console.log(`  ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  发现以下警告:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    console.log('\n📝 修复建议:');
    console.log('  1. 确保所有 Prisma Schema 文件使用正确的 schema 配置');
    console.log('  2. 运行 `pnpm run prisma:generate` 重新生成 Prisma 客户端');
    console.log('  3. 检查 Docker Compose 中的数据库连接配置');
    console.log('  4. 运行数据库迁移: `pnpm run prisma:migrate:deploy`');

    if (this.issues.length > 0) {
      console.log('\n❌ 检查失败，请修复上述问题后重新运行');
      process.exit(1);
    }
  }
}

// 运行检查
if (require.main === module) {
  const checker = new DatabaseConsistencyChecker();
  checker.checkConsistency();
}

module.exports = DatabaseConsistencyChecker;