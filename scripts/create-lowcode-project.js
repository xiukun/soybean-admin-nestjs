#!/usr/bin/env node

/**
 * 低代码后端项目脚手架生成器
 * 基于 NestJS 11.x + Fastify 5.x
 * 支持 Amis 框架数据格式规范
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');

class LowcodeProjectGenerator {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates/lowcode-backend');
    this.questions = [
      {
        type: 'input',
        name: 'projectName',
        message: '项目名称:',
        default: 'my-lowcode-backend',
        validate: (input) => {
          if (!/^[a-z0-9-]+$/.test(input)) {
            return '项目名称只能包含小写字母、数字和连字符';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: '项目描述:',
        default: 'Low-code backend project generated with NestJS and Fastify'
      },
      {
        type: 'input',
        name: 'authorName',
        message: '作者姓名:',
        default: 'Developer'
      },
      {
        type: 'input',
        name: 'authorEmail',
        message: '作者邮箱:',
        default: 'developer@example.com'
      },
      {
        type: 'input',
        name: 'port',
        message: '服务端口:',
        default: '3000',
        validate: (input) => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1000 || port > 65535) {
            return '请输入有效的端口号 (1000-65535)';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'includeDocker',
        message: '是否包含 Docker 配置?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeAuth',
        message: '是否包含 JWT 认证模块?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeRedis',
        message: '是否包含 Redis 缓存?',
        default: true
      }
    ];
  }

  async generate() {
    console.log(chalk.blue.bold('\n🚀 低代码后端项目脚手架生成器\n'));

    try {
      // 获取用户输入
      const answers = await inquirer.prompt(this.questions);
      const projectPath = path.join(process.cwd(), answers.projectName);

      // 检查目录是否存在
      if (await fs.pathExists(projectPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `目录 ${answers.projectName} 已存在，是否覆盖?`,
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('操作已取消'));
          return;
        }

        await fs.remove(projectPath);
      }

      // 创建项目目录
      await fs.ensureDir(projectPath);

      console.log(chalk.green(`\n📁 创建项目目录: ${projectPath}`));

      // 生成项目文件
      await this.generateProjectFiles(projectPath, answers);

      // 安装依赖
      console.log(chalk.blue('\n📦 安装依赖包...'));
      process.chdir(projectPath);
      execSync('npm install', { stdio: 'inherit' });

      // 初始化 Git
      console.log(chalk.blue('\n🔧 初始化 Git 仓库...'));
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Initial commit: lowcode backend scaffold"', { stdio: 'inherit' });

      // 生成 Prisma 客户端
      console.log(chalk.blue('\n🗄️ 生成 Prisma 客户端...'));
      execSync('npx prisma generate', { stdio: 'inherit' });

      // 完成提示
      this.showCompletionMessage(answers);

    } catch (error) {
      console.error(chalk.red('\n❌ 生成项目失败:'), error.message);
      process.exit(1);
    }
  }

  async generateProjectFiles(projectPath, config) {
    const templates = {
      // 基础配置文件
      'package.json': this.generatePackageJson(config),
      'tsconfig.json': this.generateTsConfig(),
      'tsconfig.build.json': this.generateTsBuildConfig(),
      'nest-cli.json': this.generateNestCliConfig(),
      '.eslintrc.js': this.generateEslintConfig(),
      '.prettierrc': this.generatePrettierConfig(),
      '.gitignore': this.generateGitignore(),
      '.env.example': this.generateEnvExample(config),
      'README.md': this.generateReadme(config),

      // 源代码文件
      'src/main.ts': this.generateMainFile(config),
      'src/app.module.ts': this.generateAppModule(config),
      'src/app.controller.ts': this.generateAppController(),
      'src/app.service.ts': this.generateAppService(),

      // 配置文件
      'src/config/app.config.ts': this.generateAppConfig(),
      'src/config/database.config.ts': this.generateDatabaseConfig(),
      'src/config/jwt.config.ts': this.generateJwtConfig(),
      'src/config/redis.config.ts': this.generateRedisConfig(),

      // 共享模块
      'src/shared/decorators/amis-response.decorator.ts': this.generateAmisResponseDecorator(),
      'src/shared/decorators/public.decorator.ts': this.generatePublicDecorator(),
      'src/shared/interceptors/response.interceptor.ts': this.generateResponseInterceptor(),
      'src/shared/interceptors/logging.interceptor.ts': this.generateLoggingInterceptor(),
      'src/shared/filters/http-exception.filter.ts': this.generateHttpExceptionFilter(),
      'src/shared/guards/jwt-auth.guard.ts': this.generateJwtAuthGuard(),
      'src/shared/services/prisma.service.ts': this.generatePrismaService(),
      'src/shared/services/redis.service.ts': this.generateRedisService(),

      // Prisma 配置
      'prisma/schema.prisma': this.generatePrismaSchema(),
      'prisma/seeds/index.ts': this.generatePrismaSeeds(),

      // 测试文件
      'test/app.e2e-spec.ts': this.generateE2ETest(),
      'test/jest-e2e.json': this.generateJestE2EConfig(),

      // Jest 配置
      'jest.config.js': this.generateJestConfig(),
    };

    // 可选的 Docker 文件
    if (config.includeDocker) {
      templates['Dockerfile'] = this.generateDockerfile();
      templates['docker-compose.yml'] = this.generateDockerCompose(config);
      templates['.dockerignore'] = this.generateDockerignore();
    }

    // 创建目录结构
    const directories = [
      'src/base/controllers',
      'src/base/services',
      'src/base/dto',
      'src/base/entities',
      'src/base/interfaces',
      'src/biz/controllers',
      'src/biz/services',
      'src/biz/modules',
      'src/shared/guards',
      'src/shared/interceptors',
      'src/shared/decorators',
      'src/shared/filters',
      'src/shared/pipes',
      'src/shared/services',
      'src/shared/utils',
      'src/config',
      'prisma/migrations',
      'prisma/seeds',
      'test',
      'docs',
      'logs'
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // 生成文件
    for (const [filePath, content] of Object.entries(templates)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
      console.log(chalk.gray(`  ✓ ${filePath}`));
    }

    // 创建空的 .gitkeep 文件
    const gitkeepDirs = [
      'src/base/controllers',
      'src/base/services',
      'src/base/dto',
      'src/base/entities',
      'src/base/interfaces',
      'logs'
    ];

    for (const dir of gitkeepDirs) {
      await fs.writeFile(path.join(projectPath, dir, '.gitkeep'), '');
    }
  }

  generatePackageJson(config) {
    return JSON.stringify({
      name: config.projectName,
      version: '1.0.0',
      description: config.projectDescription,
      author: {
        name: config.authorName,
        email: config.authorEmail
      },
      private: true,
      license: 'MIT',
      scripts: {
        build: 'nest build',
        format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
        start: 'nest start',
        'start:dev': 'cross-env NODE_ENV=development nest start --watch',
        'start:debug': 'cross-env NODE_ENV=development nest start --debug --watch',
        'start:prod': 'cross-env NODE_ENV=production node dist/main',
        lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:cov': 'jest --coverage',
        'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
        'test:e2e': 'jest --config ./test/jest-e2e.json',
        'prisma:generate': 'prisma generate',
        'prisma:migrate': 'prisma migrate dev',
        'prisma:migrate:deploy': 'prisma migrate deploy',
        'prisma:seed': 'ts-node -r tsconfig-paths/register prisma/seeds',
        'prisma:studio': 'prisma studio',
        prepare: 'husky install'
      },
      dependencies: {
        '@fastify/compress': '^8.0.1',
        '@fastify/csrf-protection': '^7.1.0',
        '@fastify/helmet': '^13.0.1',
        '@fastify/multipart': '^9.0.3',
        '@fastify/static': '^8.1.1',
        '@keyv/redis': '^4.3.2',
        '@nest-lab/throttler-storage-redis': '^1.1.0',
        '@nestjs/axios': '^4.0.0',
        '@nestjs/cache-manager': '^3.0.1',
        '@nestjs/common': '^11.0.12',
        '@nestjs/config': '^4.0.2',
        '@nestjs/core': '^11.0.12',
        '@nestjs/cqrs': '^11.0.3',
        '@nestjs/event-emitter': '^3.0.1',
        '@nestjs/jwt': '^11.0.0',
        '@nestjs/passport': '^11.0.5',
        '@nestjs/platform-fastify': '^11.0.12',
        '@nestjs/schedule': '^5.0.1',
        '@nestjs/swagger': '^11.1.0',
        '@nestjs/terminus': '^11.0.0',
        '@nestjs/throttler': '^6.4.0',
        '@prisma/client': '^6.5.0',
        bcryptjs: '^3.0.2',
        'cache-manager': '^6.4.1',
        'class-transformer': '^0.5.1',
        'class-validator': '^0.14.1',
        'crypto-js': '^4.2.0',
        dotenv: '^16.4.7',
        fastify: '^5.2.2',
        ioredis: '^5.6.0',
        'nest-winston': '^1.10.2',
        passport: '^0.7.0',
        'passport-jwt': '^4.0.1',
        'reflect-metadata': '^0.2.2',
        rxjs: '^7.8.2',
        ulid: '^3.0.0',
        winston: '^3.17.0',
        'winston-daily-rotate-file': '^5.0.0'
      },
      devDependencies: {
        '@nestjs/cli': '^10.4.9',
        '@nestjs/schematics': '^11.0.2',
        '@nestjs/testing': '^11.0.12',
        '@types/bcryptjs': '^2.4.6',
        '@types/crypto-js': '^4.2.2',
        '@types/jest': '29.5.14',
        '@types/node': '22.13.5',
        '@types/passport-jwt': '^4.0.1',
        '@types/supertest': '^6.0.3',
        '@typescript-eslint/eslint-plugin': '^8.29.0',
        '@typescript-eslint/parser': '^8.29.0',
        'cross-env': '^7.0.3',
        eslint: '^9.23.0',
        'eslint-config-prettier': '^10.1.1',
        'eslint-plugin-prettier': '^5.2.5',
        husky: '^9.1.7',
        jest: '29.7.0',
        'lint-staged': '^15.2.10',
        prettier: '^3.5.3',
        prisma: '^6.5.0',
        'source-map-support': '^0.5.21',
        supertest: '^7.1.0',
        'ts-jest': '^29.3.1',
        'ts-loader': '^9.5.2',
        'ts-node': '^10.9.2',
        'tsconfig-paths': '4.2.0',
        typescript: '^5.8.2'
      }
    }, null, 2);
  }

  showCompletionMessage(config) {
    console.log(chalk.green.bold('\n🎉 项目创建成功!\n'));
    
    console.log(chalk.blue('📋 下一步操作:'));
    console.log(chalk.gray(`  cd ${config.projectName}`));
    console.log(chalk.gray('  cp .env.example .env'));
    console.log(chalk.gray('  # 编辑 .env 文件配置数据库连接'));
    console.log(chalk.gray('  npm run prisma:migrate'));
    console.log(chalk.gray('  npm run prisma:seed'));
    console.log(chalk.gray('  npm run start:dev'));
    
    console.log(chalk.blue('\n🌐 访问地址:'));
    console.log(chalk.gray(`  应用地址: http://localhost:${config.port}/api/v1`));
    console.log(chalk.gray(`  API文档: http://localhost:${config.port}/api/v1/docs`));
    console.log(chalk.gray(`  健康检查: http://localhost:${config.port}/api/v1/health`));
    
    console.log(chalk.blue('\n👤 默认账号:'));
    console.log(chalk.gray('  用户名: admin'));
    console.log(chalk.gray('  密码: admin123'));
    
    console.log(chalk.yellow('\n⚠️  请记得修改 .env 文件中的数据库连接和JWT密钥!'));
  }

  // 其他生成方法的简化版本，实际实现中需要完整的模板内容
  generateTsConfig() {
    return JSON.stringify({
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2022',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: false,
        noImplicitAny: false,
        strictBindCallApply: false,
        forceConsistentCasingInFileNames: false,
        noFallthroughCasesInSwitch: false,
        paths: {
          '@/*': ['src/*'],
          '@base/*': ['src/base/*'],
          '@biz/*': ['src/biz/*'],
          '@shared/*': ['src/shared/*'],
          '@config/*': ['src/config/*'],
          '@dto/*': ['src/base/dto/*'],
          '@entities/*': ['src/base/entities/*'],
          '@interfaces/*': ['src/base/interfaces/*'],
          '@controllers/*': ['src/biz/controllers/*'],
          '@services/*': ['src/biz/services/*'],
          '@modules/*': ['src/biz/modules/*'],
          '@guards/*': ['src/shared/guards/*'],
          '@interceptors/*': ['src/shared/interceptors/*'],
          '@decorators/*': ['src/shared/decorators/*'],
          '@filters/*': ['src/shared/filters/*'],
          '@pipes/*': ['src/shared/pipes/*'],
          '@utils/*': ['src/shared/utils/*']
        }
      }
    }, null, 2);
  }

  // 其他方法的占位符，实际实现中需要完整内容
  generateTsBuildConfig() { return '{"extends": "./tsconfig.json", "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]}'; }
  generateNestCliConfig() { return '{"$schema": "https://json.schemastore.org/nest-cli", "collection": "@nestjs/schematics", "sourceRoot": "src"}'; }
  generateEslintConfig() { return 'module.exports = { /* ESLint config */ };'; }
  generatePrettierConfig() { return '{"singleQuote": true, "trailingComma": "all"}'; }
  generateGitignore() { return 'node_modules/\ndist/\n.env\nlogs/\n*.log'; }
  generateEnvExample() { return 'PORT=3000\nDATABASE_URL="postgresql://..."'; }
  generateReadme() { return '# Low-code Backend Project\n\nGenerated with lowcode scaffold.'; }
  generateMainFile() { return '// Main application file'; }
  generateAppModule() { return '// App module'; }
  generateAppController() { return '// App controller'; }
  generateAppService() { return '// App service'; }
  generateAppConfig() { return '// App config'; }
  generateDatabaseConfig() { return '// Database config'; }
  generateJwtConfig() { return '// JWT config'; }
  generateRedisConfig() { return '// Redis config'; }
  generateAmisResponseDecorator() { return '// Amis response decorator'; }
  generatePublicDecorator() { return '// Public decorator'; }
  generateResponseInterceptor() { return '// Response interceptor'; }
  generateLoggingInterceptor() { return '// Logging interceptor'; }
  generateHttpExceptionFilter() { return '// HTTP exception filter'; }
  generateJwtAuthGuard() { return '// JWT auth guard'; }
  generatePrismaService() { return '// Prisma service'; }
  generateRedisService() { return '// Redis service'; }
  generatePrismaSchema() { return '// Prisma schema'; }
  generatePrismaSeeds() { return '// Prisma seeds'; }
  generateE2ETest() { return '// E2E test'; }
  generateJestE2EConfig() { return '{}'; }
  generateJestConfig() { return 'module.exports = {};'; }
  generateDockerfile() { return '# Dockerfile'; }
  generateDockerCompose() { return '# Docker compose'; }
  generateDockerignore() { return 'node_modules'; }
}

// 运行生成器
if (require.main === module) {
  const generator = new LowcodeProjectGenerator();
  generator.generate().catch(console.error);
}

module.exports = LowcodeProjectGenerator;
