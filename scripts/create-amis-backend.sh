#!/bin/bash

# 创建Amis低代码业务后端项目脚本
# 用于在soybean-admin-nestjs目录下创建amis-lowcode-backend项目

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AMIS_BACKEND_DIR="$PROJECT_ROOT/amis-lowcode-backend"

echo -e "${BLUE}🚀 创建Amis低代码业务后端项目${NC}"
echo -e "${BLUE}项目位置: $AMIS_BACKEND_DIR${NC}"

# 检查目录是否存在
if [ -d "$AMIS_BACKEND_DIR" ]; then
    echo -e "${YELLOW}⚠️  目录已存在，是否覆盖? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf "$AMIS_BACKEND_DIR"
        echo -e "${GREEN}✓ 已删除现有目录${NC}"
    else
        echo -e "${RED}❌ 操作已取消${NC}"
        exit 1
    fi
fi

# 创建项目目录
mkdir -p "$AMIS_BACKEND_DIR"
cd "$AMIS_BACKEND_DIR"

echo -e "${GREEN}📁 创建项目目录结构...${NC}"

# 创建目录结构
mkdir -p src/{base,biz,shared,config}
mkdir -p src/base/{controllers,services,dto,entities,interfaces}
mkdir -p src/biz/{controllers,services,modules}
mkdir -p src/shared/{guards,interceptors,decorators,filters,services,utils}
mkdir -p prisma/{migrations,seeds}
mkdir -p test logs docs

# 创建.gitkeep文件
touch src/base/controllers/.gitkeep
touch src/base/services/.gitkeep
touch src/base/dto/.gitkeep
touch src/base/entities/.gitkeep
touch src/base/interfaces/.gitkeep
touch logs/.gitkeep

echo -e "${GREEN}📦 创建package.json...${NC}"

# 创建package.json
cat > package.json << 'EOF'
{
  "name": "amis-lowcode-backend",
  "version": "1.0.0",
  "description": "Amis compatible lowcode business backend service",
  "author": "Lowcode Platform Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "restart:dev": "pkill -f 'nest start' || true && npm run start:dev",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node -r tsconfig-paths/register prisma/seeds",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.12",
    "@nestjs/core": "^11.0.12",
    "@nestjs/platform-fastify": "^11.0.12",
    "@nestjs/config": "^4.0.2",
    "@nestjs/swagger": "^11.1.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.5",
    "@prisma/client": "^6.5.0",
    "fastify": "^5.2.2",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^3.0.2",
    "ulid": "^3.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/schematics": "^11.0.2",
    "@nestjs/testing": "^11.0.12",
    "@types/bcryptjs": "^2.4.6",
    "@types/jest": "29.5.14",
    "@types/node": "22.13.5",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.3",
    "@typescript-eslint/eslint-plugin": "^8.29.0",
    "@typescript-eslint/parser": "^8.29.0",
    "eslint": "^9.23.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.5",
    "jest": "29.7.0",
    "prettier": "^3.5.3",
    "prisma": "^6.5.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.1.0",
    "ts-jest": "^29.3.1",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "4.2.0",
    "typescript": "^5.8.2"
  }
}
EOF

echo -e "${GREEN}⚙️  创建TypeScript配置...${NC}"

# 创建tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@base/*": ["src/base/*"],
      "@biz/*": ["src/biz/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@dto/*": ["src/base/dto/*"],
      "@entities/*": ["src/base/entities/*"],
      "@interfaces/*": ["src/base/interfaces/*"],
      "@controllers/*": ["src/biz/controllers/*"],
      "@services/*": ["src/biz/services/*"],
      "@modules/*": ["src/biz/modules/*"],
      "@guards/*": ["src/shared/guards/*"],
      "@interceptors/*": ["src/shared/interceptors/*"],
      "@decorators/*": ["src/shared/decorators/*"],
      "@filters/*": ["src/shared/filters/*"],
      "@utils/*": ["src/shared/utils/*"]
    }
  }
}
EOF

# 创建tsconfig.build.json
cat > tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
EOF

# 创建nest-cli.json
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.build.json"
  }
}
EOF

echo -e "${GREEN}🔧 创建核心应用文件...${NC}"

# 创建src/main.ts
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // 设置全局前缀
  app.setGlobalPrefix('api/v1');

  // 启用CORS
  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Amis Lowcode Business API')
    .setDescription('Auto-generated business API compatible with Amis framework')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 9521;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Amis Lowcode Backend is running on http://localhost:${port}/api/v1`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});
EOF

# 创建src/app.module.ts
cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  // 这个模块会被代码生成器动态更新
  // 生成的业务模块会自动注册到这里
}
EOF

# 创建src/app.controller.ts
cat > src/app.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application info' })
  @ApiResponse({
    status: 200,
    description: 'Application information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Amis Lowcode Business API' },
            version: { type: 'string', example: '1.0.0' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  getAppInfo() {
    return {
      status: 0,
      msg: 'success',
      data: this.appService.getAppInfo(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Health status',
  })
  getHealth() {
    return {
      status: 0,
      msg: 'success',
      data: this.appService.getHealth(),
    };
  }
}
EOF

# 创建src/app.service.ts
cat > src/app.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Amis Lowcode Business API',
      version: '1.0.0',
      description: 'Auto-generated business API compatible with Amis framework',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
EOF

echo -e "${GREEN}🛡️  创建共享模块...${NC}"

# 创建共享服务
cat > src/shared/services/prisma.service.ts << 'EOF'
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
EOF

# 创建Amis响应装饰器
cat > src/shared/decorators/amis-response.decorator.ts << 'EOF'
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

/**
 * Amis响应格式装饰器
 * 自动将响应包装为Amis标准格式: { status: number, msg: string, data?: any }
 */
export function AmisResponse() {
  return applyDecorators(UseInterceptors(ResponseInterceptor));
}
EOF

# 创建响应拦截器
cat > src/shared/interceptors/response.interceptor.ts << 'EOF'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AmisResponse<T> {
  status: number;
  msg: string;
  data?: T;
}

/**
 * 响应拦截器
 * 将所有响应包装为Amis标准格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, AmisResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AmisResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是Amis格式，直接返回
        if (data && typeof data === 'object' && 'status' in data && 'msg' in data) {
          return data;
        }

        // 包装为Amis格式
        return {
          status: 0,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
EOF

echo -e "${GREEN}🗄️  创建数据库配置...${NC}"

# 创建Prisma schema
cat > prisma/schema.prisma << 'EOF'
// Auto-generated Prisma schema for Amis Lowcode Backend
// This file will be dynamically updated by the code generator

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Generated models will be added here by the code generator
// Initial state: empty, waiting for code generation
EOF

# 创建环境变量示例
cat > .env.example << 'EOF'
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/amis_lowcode_db"

# 应用配置
PORT=9521
NODE_ENV=development

# JWT配置
JWT_SECRET="amis-lowcode-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# 日志配置
LOG_LEVEL="info"
EOF

# 创建.gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local

# Logs
logs/
*.log

# Database
*.sqlite
*.db

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Prisma
/prisma/migrations/dev.db*

# Coverage
coverage/
EOF

# 创建README.md
cat > README.md << 'EOF'
# Amis Lowcode Business Backend

基于NestJS + Fastify构建的Amis兼容低代码业务后端服务。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境
```bash
cp .env.example .env
# 编辑.env文件配置数据库连接
```

### 3. 初始化数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动服务
```bash
npm run start:dev
```

### 5. 访问应用
- API地址: http://localhost:9521/api/v1
- API文档: http://localhost:9521/api/v1/docs
- 健康检查: http://localhost:9521/api/v1/health

## 📁 项目结构

```
src/
├── base/          # 基础代码层（代码生成器生成）
├── biz/           # 业务代码层（开发者自定义）
├── shared/        # 共享模块
├── config/        # 配置文件
├── app.module.ts  # 应用模块
└── main.ts        # 应用入口
```

## 🔧 开发说明

- `src/base/` 目录中的文件由代码生成器自动生成，请勿手动修改
- `src/biz/` 目录用于存放自定义业务代码，可以继承和扩展base层的功能
- 所有API接口自动符合Amis框架的响应格式规范

## 📝 API规范

所有接口都遵循Amis标准响应格式：

```json
{
  "status": 0,
  "msg": "success",
  "data": { ... }
}
```

## 🛠️ 脚本命令

- `npm run start:dev` - 启动开发服务器
- `npm run build` - 构建项目
- `npm run start:prod` - 启动生产服务器
- `npm run prisma:generate` - 生成Prisma客户端
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开Prisma Studio
EOF

echo -e "${GREEN}📦 安装依赖包...${NC}"
npm install

echo -e "${GREEN}🎉 项目创建完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步操作:${NC}"
echo -e "${YELLOW}  1. cd amis-lowcode-backend${NC}"
echo -e "${YELLOW}  2. cp .env.example .env${NC}"
echo -e "${YELLOW}  3. 编辑 .env 文件配置数据库连接${NC}"
echo -e "${YELLOW}  4. npm run prisma:generate${NC}"
echo -e "${YELLOW}  5. npm run start:dev${NC}"
echo ""
echo -e "${BLUE}🌐 访问地址:${NC}"
echo -e "${YELLOW}  应用地址: http://localhost:9521/api/v1${NC}"
echo -e "${YELLOW}  API文档: http://localhost:9521/api/v1/docs${NC}"
echo -e "${YELLOW}  健康检查: http://localhost:9521/api/v1/health${NC}"
echo ""
echo -e "${GREEN}✨ Amis低代码业务后端项目已准备就绪！${NC}"
