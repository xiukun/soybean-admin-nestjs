# 低代码平台架构与代码生成器完整方案

## 🏗️ 项目架构概览

### 整体架构图
```
soybean-admin-nestjs/
├── backend/                           # 主后端服务 (端口: 9527)
│   ├── apps/                         # 应用模块
│   ├── libs/                         # 共享库
│   └── prisma/                       # 数据库配置
├── lowcode-platform-backend/         # 低代码平台后端 (端口: 9521)
│   ├── src/                          # 源代码
│   │   ├── api/                      # API控制器
│   │   ├── lib/                      # 业务逻辑库
│   │   └── shared/                   # 共享模块
│   └── prisma/                       # 低代码平台数据库
├── amis-lowcode-backend/             # Amis低代码业务后端 (端口: 9521)
│   ├── src/                          # 生成的代码目标目录
│   │   ├── base/                     # 基础代码层 (代码生成器生成)
│   │   ├── biz/                      # 业务代码层 (开发者自定义)
│   │   └── shared/                   # 共享模块
│   └── prisma/                       # 业务数据库
└── frontend/                         # 前端应用 (端口: 9527)
    ├── src/                          # 前端源码
    └── views/lowcode/                # 低代码相关页面
```

### 服务职责划分

#### 1. backend/ - 主后端服务 (端口: 9527)
- **职责**: 系统管理、用户认证、权限控制
- **技术栈**: NestJS + Express + PostgreSQL
- **主要功能**:
  - 用户管理和认证
  - 角色权限控制
  - 系统配置管理
  - 文件上传下载

#### 2. lowcode-platform-backend/ - 低代码平台后端 (端口: 9521)
- **职责**: 低代码平台核心功能，包括代码生成器
- **技术栈**: NestJS + Fastify + PostgreSQL
- **主要功能**:
  - 项目管理
  - 实体管理
  - 模板管理
  - **代码生成器** (核心功能)
  - API配置管理
  - 查询构建器

#### 3. amis-lowcode-backend/ - Amis低代码业务后端 (端口: 9521)
- **职责**: 运行生成的业务代码，提供Amis兼容的API
- **技术栈**: NestJS + Fastify + PostgreSQL
- **主要功能**:
  - 运行代码生成器生成的业务API
  - 提供Amis框架兼容的数据格式
  - 支持base/biz分层架构
  - 业务数据的CRUD操作

#### 4. frontend/ - 前端应用 (端口: 9527)
- **职责**: 用户界面和低代码平台管理界面
- **技术栈**: Vue 3 + Naive UI + Amis
- **主要功能**:
  - 低代码平台管理界面
  - 代码生成器操作界面
  - 实体和模板管理
  - 生成结果预览

## 🎯 代码生成器架构设计

### 代码生成流程
```mermaid
graph TD
    A[前端代码生成页面] --> B[lowcode-platform-backend]
    B --> C[代码生成器引擎]
    C --> D[模板引擎处理]
    D --> E[元数据聚合]
    E --> F[代码文件生成]
    F --> G[写入amis-lowcode-backend]
    G --> H[自动重启服务]
    H --> I[生成的API可用]
```

### 代码生成器实现位置

#### 在 lowcode-platform-backend/ 中实现
```
lowcode-platform-backend/src/
├── api/lowcode/
│   ├── code-generation.controller.ts     # 代码生成API控制器
│   └── dto/code-generation.dto.ts        # 代码生成DTO
├── lib/bounded-contexts/
│   ├── code-generation/                  # 代码生成领域
│   │   ├── application/
│   │   │   ├── handlers/
│   │   │   │   ├── generate-code.handler.ts
│   │   │   │   └── get-generation-progress.handler.ts
│   │   │   └── services/
│   │   │       ├── intelligent-code-generator.service.ts
│   │   │       ├── file-system-manager.service.ts
│   │   │       └── amis-backend-manager.service.ts
│   │   ├── domain/
│   │   │   ├── code-generation.model.ts
│   │   │   └── generation-task.model.ts
│   │   └── infrastructure/
│   │       ├── file-writer.service.ts
│   │       └── template-processor.service.ts
│   ├── metadata/                         # 元数据聚合
│   │   └── application/services/
│   │       └── metadata-aggregator.service.ts
│   └── template/                         # 模板管理
│       └── application/services/
│           └── template-engine.service.ts
```

### 代码生成目标位置

#### 生成到 amis-lowcode-backend/ 中
```
amis-lowcode-backend/src/
├── base/                                 # 基础代码层 (代码生成器生成)
│   ├── controllers/
│   │   ├── user.base.controller.ts       # 生成的基础控制器
│   │   └── role.base.controller.ts
│   ├── services/
│   │   ├── user.base.service.ts          # 生成的基础服务
│   │   └── role.base.service.ts
│   ├── dto/
│   │   ├── user.dto.ts                   # 生成的DTO
│   │   └── role.dto.ts
│   ├── entities/
│   │   ├── user.entity.ts                # 生成的实体
│   │   └── role.entity.ts
│   └── interfaces/
│       ├── user.interface.ts             # 生成的接口
│       └── role.interface.ts
├── biz/                                  # 业务代码层 (开发者自定义)
│   ├── controllers/
│   │   ├── user.controller.ts            # 继承base层的业务控制器
│   │   └── role.controller.ts
│   ├── services/
│   │   ├── user.service.ts               # 继承base层的业务服务
│   │   └── role.service.ts
│   └── modules/
│       ├── user.module.ts                # 业务模块
│       └── role.module.ts
├── shared/                               # 共享模块 (预置)
│   ├── guards/
│   ├── interceptors/
│   ├── decorators/
│   └── services/
├── config/                               # 配置文件 (预置)
├── app.module.ts                         # 应用模块 (动态更新)
└── main.ts                               # 应用入口 (预置)
```

## 🔧 代码生成器核心实现

### 1. 代码生成控制器
```typescript
// lowcode-platform-backend/src/api/lowcode/code-generation.controller.ts
@Controller({ path: 'code-generation', version: '1' })
@ApiTags('code-generation')
export class CodeGenerationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('generate')
  async generateCode(@Body() generateCodeDto: GenerateCodeDto) {
    const command = new GenerateCodeCommand(
      generateCodeDto.projectId,
      generateCodeDto.templateIds,
      generateCodeDto.entityIds,
      '../amis-lowcode-backend/src', // 生成目标路径
      generateCodeDto.variables,
      generateCodeDto.options,
    );

    const result = await this.commandBus.execute(command);
    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('progress/:taskId')
  async getProgress(@Param('taskId') taskId: string) {
    const query = new GetGenerationProgressQuery(taskId);
    const progress = await this.queryBus.execute(query);
    return {
      status: 0,
      msg: 'success',
      data: progress,
    };
  }
}
```

### 2. Amis后端管理服务
```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/code-generation/application/services/amis-backend-manager.service.ts
@Injectable()
export class AmisBackendManagerService {
  private readonly amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
  private readonly logger = new Logger(AmisBackendManagerService.name);

  async writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(this.amisBackendPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content);
      this.logger.log(`Generated file: ${file.path}`);
    }
  }

  async updateAppModule(entities: EntityMetadata[]): Promise<void> {
    const appModulePath = path.join(this.amisBackendPath, 'src/app.module.ts');
    const moduleImports = entities.map(entity => 
      `import { ${entity.name}Module } from '@modules/${entity.code}.module';`
    ).join('\n');

    const moduleList = entities.map(entity => `${entity.name}Module`).join(',\n    ');

    const appModuleContent = `${moduleImports}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ${moduleList}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}`;

    await fs.writeFile(appModulePath, appModuleContent);
    this.logger.log('Updated app.module.ts');
  }

  async restartAmisBackend(): Promise<void> {
    try {
      // 发送重启信号到amis-lowcode-backend服务
      const restartCommand = `cd ${this.amisBackendPath} && npm run restart:dev`;
      await exec(restartCommand);
      this.logger.log('Amis backend service restarted');
    } catch (error) {
      this.logger.error('Failed to restart amis backend service', error);
    }
  }

  async generatePrismaSchema(metadata: ProjectMetadata): Promise<void> {
    const schemaPath = path.join(this.amisBackendPath, 'prisma/schema.prisma');
    const schemaContent = this.buildPrismaSchema(metadata);
    
    await fs.writeFile(schemaPath, schemaContent);
    
    // 生成Prisma客户端
    const generateCommand = `cd ${this.amisBackendPath} && npx prisma generate`;
    await exec(generateCommand);
    
    this.logger.log('Generated Prisma schema and client');
  }

  private buildPrismaSchema(metadata: ProjectMetadata): string {
    let schema = `// Auto-generated Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // 生成实体模型
    for (const entity of metadata.entities) {
      schema += this.generatePrismaModel(entity);
      schema += '\n';
    }

    return schema;
  }

  private generatePrismaModel(entity: EntityMetadata): string {
    let model = `model ${entity.name} {\n`;
    
    // 生成字段
    for (const field of entity.fields) {
      const fieldType = this.mapFieldTypeToPrisma(field);
      const attributes = this.buildFieldAttributes(field);
      model += `  ${field.code} ${fieldType}${attributes}\n`;
    }

    // 生成关系
    for (const relation of entity.relationships.outgoing) {
      model += `  ${relation.relationshipName} ${relation.targetEntityName}${relation.relationType === 'oneToMany' ? '[]' : '?'}\n`;
    }

    model += `\n  @@map("${entity.tableName}")\n`;
    model += '}';

    return model;
  }
}
```

### 3. 文件系统管理器
```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/code-generation/application/services/file-system-manager.service.ts
@Injectable()
export class FileSystemManagerService {
  private readonly logger = new Logger(FileSystemManagerService.name);

  async ensureAmisBackendStructure(): Promise<void> {
    const amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
    
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
      'src/shared/services',
      'src/config',
      'prisma',
      'test',
      'logs'
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(amisBackendPath, dir));
    }

    this.logger.log('Amis backend directory structure ensured');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
    const fullPath = path.join(amisBackendPath, filePath);
    
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content);
    
    this.logger.log(`File written: ${filePath}`);
  }

  async readFile(filePath: string): Promise<string> {
    const amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
    const fullPath = path.join(amisBackendPath, filePath);
    
    if (await fs.pathExists(fullPath)) {
      return await fs.readFile(fullPath, 'utf-8');
    }
    
    return '';
  }

  async deleteFile(filePath: string): Promise<void> {
    const amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
    const fullPath = path.join(amisBackendPath, filePath);
    
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      this.logger.log(`File deleted: ${filePath}`);
    }
  }

  async getFileTree(basePath: string = 'src'): Promise<FileTreeNode[]> {
    const amisBackendPath = path.resolve(__dirname, '../../../../../amis-lowcode-backend');
    const fullPath = path.join(amisBackendPath, basePath);
    
    return await this.buildFileTree(fullPath, basePath);
  }

  private async buildFileTree(dirPath: string, relativePath: string): Promise<FileTreeNode[]> {
    const items: FileTreeNode[] = [];
    
    if (await fs.pathExists(dirPath)) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const itemPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          const children = await this.buildFileTree(
            path.join(dirPath, entry.name),
            itemPath
          );
          
          items.push({
            name: entry.name,
            path: itemPath,
            type: 'directory',
            children
          });
        } else {
          const stats = await fs.stat(path.join(dirPath, entry.name));
          
          items.push({
            name: entry.name,
            path: itemPath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }
    }
    
    return items;
  }
}

## 🚀 Amis低代码业务后端实现

### 项目结构创建
```bash
# 在soybean-admin-nestjs目录下创建amis-lowcode-backend
mkdir -p amis-lowcode-backend
cd amis-lowcode-backend

# 初始化项目
npm init -y

# 安装依赖 (基于backend/package.json的配置)
npm install @nestjs/common@^11.0.12 @nestjs/core@^11.0.12 @nestjs/platform-fastify@^11.0.12
npm install @nestjs/config@^4.0.2 @nestjs/swagger@^11.1.0 @nestjs/jwt@^11.0.0
npm install @prisma/client@^6.5.0 fastify@^5.2.2 class-validator@^0.14.1
npm install -D @nestjs/cli@^10.4.9 typescript@^5.8.2 prisma@^6.5.0
```

### package.json配置
```json
{
  "name": "amis-lowcode-backend",
  "version": "1.0.0",
  "description": "Amis compatible lowcode business backend service",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "restart:dev": "pkill -f 'nest start' && npm run start:dev"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.12",
    "@nestjs/core": "^11.0.12",
    "@nestjs/platform-fastify": "^11.0.12",
    "@nestjs/config": "^4.0.2",
    "@nestjs/swagger": "^11.1.0",
    "@nestjs/jwt": "^11.0.0",
    "@prisma/client": "^6.5.0",
    "fastify": "^5.2.2",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/schematics": "^11.0.2",
    "typescript": "^5.8.2",
    "prisma": "^6.5.0",
    "@types/node": "22.13.5"
  }
}
```

### 基础配置文件

#### tsconfig.json
```json
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
      "@modules/*": ["src/biz/modules/*"]
    }
  }
}
```

#### nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.json"
  }
}
```

### 核心应用文件

#### src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
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
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(9521, '0.0.0.0');
  console.log('🚀 Amis Lowcode Backend is running on http://localhost:9521/api/v1');
  console.log('📚 API Documentation: http://localhost:9521/api/v1/docs');
}

bootstrap();
```

#### src/app.module.ts (初始版本)
```typescript
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
export class AppModule {}
```

#### src/app.controller.ts
```typescript
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
  getHealth() {
    return {
      status: 0,
      msg: 'success',
      data: this.appService.getHealth(),
    };
  }
}
```

#### src/app.service.ts
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Amis Lowcode Business API',
      version: '1.0.0',
      description: 'Auto-generated business API compatible with Amis framework',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### 共享模块

#### src/shared/services/prisma.service.ts
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

#### src/shared/decorators/amis-response.decorator.ts
```typescript
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

export function AmisResponse() {
  return applyDecorators(UseInterceptors(ResponseInterceptor));
}
```

#### src/shared/interceptors/response.interceptor.ts
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
```

### 环境配置

#### .env.example
```bash
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/amis_lowcode_db"

# 应用配置
PORT=9521
NODE_ENV=development

# JWT配置
JWT_SECRET="amis-lowcode-jwt-secret"
JWT_EXPIRES_IN="7d"
```

### Prisma配置

#### prisma/schema.prisma (初始版本)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 这个文件会被代码生成器动态更新
// 初始状态为空，等待代码生成器写入实体模型
```

## 🔄 代码生成流程详解

### 1. 用户操作流程
```
1. 用户在frontend访问代码生成页面
2. 选择项目、模板、实体等参数
3. 点击"生成代码"按钮
4. 前端发送请求到lowcode-platform-backend
5. 代码生成器开始工作
6. 生成的代码写入amis-lowcode-backend
7. 自动重启amis-lowcode-backend服务
8. 用户可以访问生成的API
```

### 2. 代码生成器工作流程
```typescript
// 在lowcode-platform-backend中的实现
export class GenerateCodeHandler implements ICommandHandler<GenerateCodeCommand> {
  async execute(command: GenerateCodeCommand): Promise<GenerationResult> {
    // 1. 获取项目元数据
    const metadata = await this.metadataService.getProjectMetadata(command.projectId);

    // 2. 获取模板
    const templates = await this.templateService.getTemplates(command.templateIds);

    // 3. 生成代码文件
    const generatedFiles = await this.codeGenerator.generateFiles(templates, metadata);

    // 4. 写入amis-lowcode-backend
    await this.fileSystemManager.writeFiles(generatedFiles);

    // 5. 更新Prisma schema
    await this.amisBackendManager.generatePrismaSchema(metadata);

    // 6. 更新app.module.ts
    await this.amisBackendManager.updateAppModule(metadata.entities);

    // 7. 重启amis-lowcode-backend服务
    await this.amisBackendManager.restartAmisBackend();

    return {
      success: true,
      filesGenerated: generatedFiles.length,
      // ... 其他结果信息
    };
  }
}
```

### 3. 生成的代码示例

#### 生成的基础控制器 (amis-lowcode-backend/src/base/controllers/user.base.controller.ts)
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserBaseService } from '../services/user.base.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto/user.dto';
import { AmisResponse } from '@shared/decorators/amis-response.decorator';

@Controller('users')
@ApiTags('User Management')
export class UserBaseController {
  constructor(protected readonly userService: UserBaseService) {}

  @Get()
  @AmisResponse()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.userService.findAll(query);
    return {
      items: result.items,
      total: result.total,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
    };
  }

  @Get(':id')
  @AmisResponse()
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Post()
  @AmisResponse()
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() createDto: CreateUserDto) {
    return await this.userService.create(createDto);
  }

  @Put(':id')
  @AmisResponse()
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return await this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @AmisResponse()
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
```

#### 业务控制器 (amis-lowcode-backend/src/biz/controllers/user.controller.ts)
```typescript
import { Controller } from '@nestjs/common';
import { UserBaseController } from '@base/controllers/user.base.controller';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController extends UserBaseController {
  constructor(userService: UserService) {
    super(userService);
  }

  // 可以在这里添加自定义的业务方法
  // 或者覆盖基础方法以实现特定的业务逻辑
}
```

## 📊 部署和运行

### 1. 创建amis-lowcode-backend项目
```bash
cd soybean-admin-nestjs
mkdir amis-lowcode-backend
cd amis-lowcode-backend

# 复制基础配置文件
cp ../docs/lowcode-backend-scaffold.md ./README.md

# 初始化项目结构
mkdir -p src/{base,biz,shared,config}
mkdir -p src/base/{controllers,services,dto,entities,interfaces}
mkdir -p src/biz/{controllers,services,modules}
mkdir -p src/shared/{guards,interceptors,decorators,filters,services}
mkdir -p prisma test logs

# 创建基础文件
touch src/main.ts src/app.module.ts src/app.controller.ts src/app.service.ts
touch .env.example tsconfig.json nest-cli.json package.json
```

### 2. 启动服务
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件配置数据库连接

# 启动开发服务器
npm run start:dev
```

### 3. 验证部署
- 访问 http://localhost:9521/api/v1 查看应用信息
- 访问 http://localhost:9521/api/v1/docs 查看API文档
- 访问 http://localhost:9521/api/v1/health 查看健康状态

## 🎯 总结

这个架构设计实现了：

1. **清晰的职责分离**: 代码生成器在lowcode-platform-backend中实现，生成的代码运行在amis-lowcode-backend中
2. **完整的生成流程**: 从模板选择到代码生成，再到服务重启的完整自动化流程
3. **Amis框架兼容**: 生成的API完全符合Amis框架的数据格式要求
4. **Base-Biz分层**: 支持基础代码自动生成和业务代码自定义扩展
5. **企业级特性**: 包含完整的配置、文档、测试和部署支持

通过这个架构，您的低代码平台将具备强大的代码生成能力，能够快速生成高质量的业务API服务。
```
