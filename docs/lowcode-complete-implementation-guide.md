# 低代码平台完整实施指南

## 🎯 项目架构总览

### 服务架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                    Soybean Admin NestJS                        │
├─────────────────────────────────────────────────────────────────┤
│  frontend/          │  backend/           │  lowcode-platform-  │
│  (端口: 9527)       │  (端口: 9527)       │  backend/           │
│  ┌─────────────────┐│  ┌─────────────────┐│  (端口: 3000)       │
│  │ Vue 3 + Naive  ││  │ NestJS + Fastify││  ┌─────────────────┐│
│  │ UI + Amis      ││  │ + PostgreSQL    ││  │ NestJS + Fastify││
│  │                ││  │                 ││  │ + PostgreSQL    ││
│  │ - 系统管理界面  ││  │ - 用户认证      ││  │ - 项目管理      ││
│  │ - 低代码管理    ││  │ - 权限控制      ││  │ - 实体管理      ││
│  │ - 代码生成界面  ││  │ - 系统配置      ││  │ - 模板管理      ││
│  └─────────────────┘│  └─────────────────┘│  │ - 代码生成器    ││
│                     │                     │  └─────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    amis-lowcode-backend/                        │
│                        (端口: 9521)                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              NestJS + Fastify + PostgreSQL                 ││
│  │                                                            ││
│  │  src/base/     │  src/biz/      │  src/shared/            ││
│  │  (生成的代码)   │  (自定义代码)   │  (共享模块)             ││
│  │  - controllers │  - controllers │  - guards               ││
│  │  - services    │  - services    │  - interceptors         ││
│  │  - dto         │  - modules     │  - decorators           ││
│  │  - entities    │                │  - services             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 数据流向图
```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   前端界面   │───▶│ lowcode-platform │───▶│  amis-lowcode-     │
│  代码生成    │    │    -backend      │    │     backend        │
│             │    │   (代码生成器)    │    │   (生成的API)      │
└─────────────┘    └──────────────────┘    └─────────────────────┘
       │                     │                        │
       │                     ▼                        │
       │            ┌─────────────────┐               │
       │            │   模板引擎      │               │
       │            │   元数据聚合    │               │
       │            │   文件生成      │               │
       │            └─────────────────┘               │
       │                     │                        │
       └─────────────────────┼────────────────────────┘
                             ▼
                    ┌─────────────────┐
                    │   Amis前端      │
                    │   数据展示      │
                    └─────────────────┘
```

## 🚀 完整实施步骤

### 第一步：创建Amis低代码业务后端

#### 1.1 运行创建脚本
```bash
cd soybean-admin-nestjs
chmod +x scripts/create-amis-backend.sh
./scripts/create-amis-backend.sh
```

#### 1.2 配置环境
```bash
cd amis-lowcode-backend
cp .env.example .env

# 编辑.env文件
vim .env
```

配置内容：
```bash
# 数据库配置 (使用独立的数据库)
DATABASE_URL="postgresql://postgres:password@localhost:5432/amis_lowcode_db"

# 应用配置
PORT=9521
NODE_ENV=development

# JWT配置
JWT_SECRET="amis-lowcode-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"
```

#### 1.3 初始化数据库
```bash
# 生成Prisma客户端
npm run prisma:generate

# 创建数据库 (如果不存在)
createdb amis_lowcode_db

# 启动服务验证
npm run start:dev
```

验证访问：
- http://localhost:9521/api/v1 - 应用信息
- http://localhost:9521/api/v1/docs - API文档
- http://localhost:9521/api/v1/health - 健康检查

### 第二步：在lowcode-platform-backend中实现代码生成器

#### 2.1 创建代码生成控制器
```bash
cd ../lowcode-platform-backend/src/api/lowcode
```

创建 `code-generation.controller.ts`：
```typescript
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenerateCodeCommand, GetGenerationProgressQuery } from './commands-queries';
import { GenerateCodeDto } from './dto/code-generation.dto';

@Controller({ path: 'code-generation', version: '1' })
@ApiTags('code-generation')
export class CodeGenerationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate code from templates' })
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
  @ApiOperation({ summary: 'Get generation progress' })
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

#### 2.2 创建代码生成DTO
创建 `dto/code-generation.dto.ts`：
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsOptional, IsEnum } from 'class-validator';

export enum GenerationArchitecture {
  BASE_BIZ = 'base-biz',
  STANDARD = 'standard',
}

export enum GenerationFramework {
  NESTJS = 'nestjs',
  EXPRESS = 'express',
}

export class GenerationOptionsDto {
  @ApiProperty({ description: 'Overwrite existing files' })
  overwriteExisting: boolean;

  @ApiProperty({ description: 'Generate test files' })
  generateTests: boolean;

  @ApiProperty({ description: 'Generate documentation' })
  generateDocs: boolean;

  @ApiProperty({ description: 'Architecture pattern', enum: GenerationArchitecture })
  @IsEnum(GenerationArchitecture)
  architecture: GenerationArchitecture;

  @ApiProperty({ description: 'Target framework', enum: GenerationFramework })
  @IsEnum(GenerationFramework)
  framework: GenerationFramework;
}

export class GenerateCodeDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Template IDs' })
  @IsArray()
  @IsString({ each: true })
  templateIds: string[];

  @ApiPropertyOptional({ description: 'Entity IDs to generate for' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityIds?: string[];

  @ApiProperty({ description: 'Template variables' })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({ description: 'Generation options', type: GenerationOptionsDto })
  @IsObject()
  options: GenerationOptionsDto;
}
```

#### 2.3 实现代码生成命令处理器
创建 `lib/bounded-contexts/code-generation/application/handlers/generate-code.handler.ts`：
```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { GenerateCodeCommand } from '../commands/generate-code.command';
import { IntelligentCodeGeneratorService } from '../services/intelligent-code-generator.service';
import { AmisBackendManagerService } from '../services/amis-backend-manager.service';
import { MetadataAggregatorService } from '@lib/bounded-contexts/metadata/application/services/metadata-aggregator.service';

@Injectable()
@CommandHandler(GenerateCodeCommand)
export class GenerateCodeHandler implements ICommandHandler<GenerateCodeCommand> {
  private readonly logger = new Logger(GenerateCodeHandler.name);

  constructor(
    private readonly codeGenerator: IntelligentCodeGeneratorService,
    private readonly amisBackendManager: AmisBackendManagerService,
    private readonly metadataService: MetadataAggregatorService,
  ) {}

  async execute(command: GenerateCodeCommand): Promise<any> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    try {
      this.logger.log(`Starting code generation for project: ${command.projectId}`);

      // 1. 获取项目元数据
      const metadata = await this.metadataService.getProjectMetadata(command.projectId);
      this.logger.log(`Retrieved metadata for ${metadata.entities.length} entities`);

      // 2. 生成代码文件
      const generatedFiles = await this.codeGenerator.generateFiles({
        projectId: command.projectId,
        templateIds: command.templateIds,
        entityIds: command.entityIds,
        outputPath: command.outputPath,
        variables: command.variables,
        options: command.options,
      });

      this.logger.log(`Generated ${generatedFiles.length} files`);

      // 3. 写入amis-lowcode-backend
      await this.amisBackendManager.writeGeneratedFiles(generatedFiles);

      // 4. 更新Prisma schema
      await this.amisBackendManager.generatePrismaSchema(metadata);

      // 5. 更新app.module.ts
      await this.amisBackendManager.updateAppModule(metadata.entities);

      // 6. 重启amis-lowcode-backend服务
      await this.amisBackendManager.restartAmisBackend();

      const duration = Date.now() - startTime;
      this.logger.log(`Code generation completed in ${duration}ms`);

      return {
        success: true,
        taskId,
        filesGenerated: generatedFiles.length,
        outputPath: command.outputPath,
        errors: [],
        warnings: [],
        metadata: {
          projectId: command.projectId,
          templatesUsed: command.templateIds,
          entitiesProcessed: command.entityIds || [],
          generatedAt: new Date(),
          duration,
        },
      };

    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        taskId,
        filesGenerated: 0,
        outputPath: command.outputPath,
        errors: [error.message],
        warnings: [],
        metadata: {
          projectId: command.projectId,
          templatesUsed: command.templateIds,
          entitiesProcessed: command.entityIds || [],
          generatedAt: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private generateTaskId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.4 实现Amis后端管理服务
创建 `lib/bounded-contexts/code-generation/application/services/amis-backend-manager.service.ts`：
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectMetadata, EntityMetadata } from '@lib/bounded-contexts/metadata/domain/metadata.model';
import { GeneratedFile } from '../domain/generation-result.model';

const execAsync = promisify(exec);

@Injectable()
export class AmisBackendManagerService {
  private readonly amisBackendPath = path.resolve(__dirname, '../../../../../../amis-lowcode-backend');
  private readonly logger = new Logger(AmisBackendManagerService.name);

  async writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
    this.logger.log(`Writing ${files.length} generated files to amis-lowcode-backend`);

    for (const file of files) {
      const fullPath = path.join(this.amisBackendPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content);
      this.logger.debug(`Generated file: ${file.path}`);
    }

    this.logger.log('All files written successfully');
  }

  async updateAppModule(entities: EntityMetadata[]): Promise<void> {
    const appModulePath = path.join(this.amisBackendPath, 'src/app.module.ts');
    
    const moduleImports = entities.map(entity => 
      `import { ${entity.name}Module } from '@modules/${entity.code}.module';`
    ).join('\n');

    const moduleList = entities.map(entity => `${entity.name}Module`).join(',\n    ');

    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
${moduleImports}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ${moduleList}
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  // This module is dynamically updated by the code generator
}`;

    await fs.writeFile(appModulePath, appModuleContent);
    this.logger.log('Updated app.module.ts with generated modules');
  }

  async generatePrismaSchema(metadata: ProjectMetadata): Promise<void> {
    const schemaPath = path.join(this.amisBackendPath, 'prisma/schema.prisma');
    const schemaContent = this.buildPrismaSchema(metadata);
    
    await fs.writeFile(schemaPath, schemaContent);
    this.logger.log('Generated Prisma schema');
    
    try {
      // 生成Prisma客户端
      const generateCommand = `cd ${this.amisBackendPath} && npx prisma generate`;
      await execAsync(generateCommand);
      this.logger.log('Generated Prisma client');
    } catch (error) {
      this.logger.error('Failed to generate Prisma client', error);
      throw error;
    }
  }

  async restartAmisBackend(): Promise<void> {
    try {
      this.logger.log('Restarting amis-lowcode-backend service...');
      
      // 发送重启信号
      const restartCommand = `cd ${this.amisBackendPath} && npm run restart:dev`;
      await execAsync(restartCommand);
      
      this.logger.log('Amis backend service restarted successfully');
    } catch (error) {
      this.logger.warn('Failed to restart amis backend service automatically', error.message);
      // 不抛出错误，因为重启失败不应该影响代码生成的成功状态
    }
  }

  private buildPrismaSchema(metadata: ProjectMetadata): string {
    let schema = `// Auto-generated Prisma schema for ${metadata.project.name}
// Generated at: ${new Date().toISOString()}

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
      const relationType = relation.relationType === 'oneToMany' ? '[]' : 
                          relation.relationType === 'manyToOne' ? '?' : '';
      model += `  ${relation.relationshipName} ${relation.targetEntityName}${relationType}\n`;
    }

    model += `\n  @@map("${entity.tableName}")\n`;
    model += '}';

    return model;
  }

  private mapFieldTypeToPrisma(field: any): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'text': 'String',
      'integer': 'Int',
      'bigint': 'BigInt',
      'decimal': 'Decimal',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'timestamp': 'DateTime',
      'json': 'Json',
      'uuid': 'String',
    };

    return typeMap[field.type] || 'String';
  }

  private buildFieldAttributes(field: any): string {
    let attributes = '';
    
    if (field.isPrimaryKey) {
      attributes += ' @id';
      if (field.type === 'string') {
        attributes += ' @default(cuid())';
      }
    }
    
    if (field.isUnique && !field.isPrimaryKey) {
      attributes += ' @unique';
    }
    
    if (!field.nullable && !field.isPrimaryKey) {
      // Prisma默认字段为必填，只有可空字段需要标记
    } else if (field.nullable) {
      attributes += '?';
    }
    
    if (field.defaultValue && !field.isPrimaryKey) {
      if (field.type === 'datetime' && field.defaultValue === 'now()') {
        attributes += ' @default(now())';
      } else if (field.type === 'datetime' && field.code === 'updatedAt') {
        attributes += ' @updatedAt';
      } else {
        attributes += ` @default(${field.defaultValue})`;
      }
    }
    
    if (field.length && (field.type === 'string' || field.type === 'text')) {
      attributes += ` @db.VarChar(${field.length})`;
    }

    return attributes;
  }
}
```

### 第三步：注册代码生成模块

#### 3.1 在lowcode-platform-backend中注册模块
编辑 `src/app.module.ts`，添加代码生成模块：
```typescript
import { CodeGenerationModule } from '@lib/bounded-contexts/code-generation/code-generation.module';

@Module({
  imports: [
    // ... 其他模块
    CodeGenerationModule,
  ],
  // ...
})
export class AppModule {}
```

#### 3.2 创建代码生成模块
创建 `lib/bounded-contexts/code-generation/code-generation.module.ts`：
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CodeGenerationController } from '@api/lowcode/code-generation.controller';
import { GenerateCodeHandler } from './application/handlers/generate-code.handler';
import { IntelligentCodeGeneratorService } from './application/services/intelligent-code-generator.service';
import { AmisBackendManagerService } from './application/services/amis-backend-manager.service';
import { FileSystemManagerService } from './application/services/file-system-manager.service';
import { MetadataModule } from '../metadata/metadata.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [
    CqrsModule,
    MetadataModule,
    TemplateModule,
  ],
  controllers: [CodeGenerationController],
  providers: [
    GenerateCodeHandler,
    IntelligentCodeGeneratorService,
    AmisBackendManagerService,
    FileSystemManagerService,
  ],
  exports: [
    IntelligentCodeGeneratorService,
    AmisBackendManagerService,
  ],
})
export class CodeGenerationModule {}
```

### 第四步：测试和验证

#### 4.1 启动所有服务
```bash
# 启动主后端服务
cd backend
npm run start:dev

# 启动低代码平台后端
cd ../lowcode-platform-backend
npm run start:dev

# 启动amis低代码业务后端
cd ../amis-lowcode-backend
npm run start:dev

# 启动前端
cd ../frontend
npm run dev
```

#### 4.2 验证服务状态
- 主后端: http://localhost:9527
- 低代码平台后端: http://localhost:9521
- Amis业务后端: http://localhost:9521 (与低代码平台共享端口)
- 前端: http://localhost:9527

#### 4.3 测试代码生成
1. 访问前端低代码管理界面
2. 创建项目和实体
3. 创建代码模板
4. 进入代码生成页面
5. 选择项目、模板、实体
6. 点击生成代码
7. 查看生成结果和API文档

## 🎯 成功验证标准

### 功能验证
- [ ] amis-lowcode-backend服务正常启动
- [ ] 代码生成器API正常响应
- [ ] 生成的代码写入正确目录
- [ ] Prisma schema自动更新
- [ ] 生成的API符合Amis格式规范
- [ ] 前端可以正常调用生成的API

### 性能验证
- [ ] 单个实体生成时间 < 5秒
- [ ] 完整项目生成时间 < 30秒
- [ ] 生成的API响应时间 < 2秒
- [ ] 服务重启时间 < 10秒

### 质量验证
- [ ] 生成的代码通过TypeScript编译
- [ ] 生成的API文档完整
- [ ] 错误处理机制正常
- [ ] 日志记录完整清晰

## 🚀 部署建议

### 开发环境
- 使用脚本自动创建和配置项目
- 配置热重载和自动重启
- 启用详细日志记录

### 生产环境
- 使用Docker容器化部署
- 配置负载均衡和健康检查
- 启用监控和告警
- 定期备份生成的代码

这个完整的实施指南提供了从零开始创建和配置整个低代码平台的详细步骤，确保代码生成器能够正确地在lowcode-platform-backend中实现，并将生成的代码写入amis-lowcode-backend中运行。
