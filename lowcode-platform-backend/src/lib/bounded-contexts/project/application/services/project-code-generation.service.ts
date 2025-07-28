import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { IntelligentCodeGeneratorService } from '@code-generation/application/services/intelligent-code-generator.service';
import { ProjectRepository } from '@project/domain/project.repository';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ProjectCodeGenerationResult {
  success: boolean;
  generatedFiles: string[];
  errors: string[];
  warnings: string[];
  outputPath: string;
  generationTime: number;
}

@Injectable()
export class ProjectCodeGenerationService {
  private readonly logger = new Logger(ProjectCodeGenerationService.name);

  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
    private readonly prisma: PrismaService,
    private readonly codeGenerator: IntelligentCodeGeneratorService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 为项目生成完整的代码
   */
  async generateProjectCode(projectId: string): Promise<ProjectCodeGenerationResult> {
    const startTime = Date.now();
    const result: ProjectCodeGenerationResult = {
      success: false,
      generatedFiles: [],
      errors: [],
      warnings: [],
      outputPath: '',
      generationTime: 0,
    };

    try {
      this.logger.log(`Starting code generation for project: ${projectId}`);

      // 1. 获取项目信息
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new Error(`Project with id '${projectId}' not found`);
      }

      // 2. 获取项目的实体列表
      const entities = await this.getProjectEntities(projectId);
      if (entities.length === 0) {
        result.warnings.push('No entities found for this project');
      }

      // 3. 获取项目的API列表
      const apis = await this.getProjectApis(projectId);

      // 4. 设置输出路径
      const outputPath = this.getOutputPath(projectId, project.code!);
      result.outputPath = outputPath;

      // 5. 确保输出目录存在
      await fs.ensureDir(outputPath);

      // 6. 生成代码
      const generationRequest = {
        projectId,
        templateIds: await this.getTemplateIds(),
        entityIds: entities.map(e => e.id),
        outputPath,
        variables: {
          project: {
            id: project.id,
            name: project.name,
            code: project.code,
            description: project.description,
            version: project.version,
            config: project.config,
          },
          entities,
          apis,
          timestamp: new Date().toISOString(),
        },
        options: {
          overwriteExisting: true,
          generateTests: true,
          generateDocs: true,
          architecture: 'base-biz' as const,
          framework: 'nestjs' as const,
        },
      };

      const generatedFiles = await this.codeGenerator.generateFiles(generationRequest);
      result.generatedFiles = generatedFiles.map(f => f.path);

      // 7. 生成 Prisma schema
      await this.generatePrismaSchema(projectId, entities, outputPath);
      result.generatedFiles.push(path.join(outputPath, 'prisma', 'schema.prisma'));

      // 8. 生成 package.json
      await this.generatePackageJson(project, outputPath);
      result.generatedFiles.push(path.join(outputPath, 'package.json'));

      // 9. 生成 README.md
      await this.generateReadme(project, outputPath);
      result.generatedFiles.push(path.join(outputPath, 'README.md'));

      result.success = true;
      result.generationTime = Date.now() - startTime;

      this.logger.log(`Code generation completed for project ${projectId} in ${result.generationTime}ms`);
      this.logger.log(`Generated ${result.generatedFiles.length} files`);

    } catch (error) {
      this.logger.error(`Code generation failed for project ${projectId}:`, error);
      result.errors.push(error.message);
      result.generationTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 获取项目的实体列表
   */
  private async getProjectEntities(projectId: string) {
    return await this.prisma.entity.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  /**
   * 获取项目的API列表
   */
  private async getProjectApis(projectId: string) {
    return await this.prisma.api.findMany({
      where: { projectId }
    });
  }

  /**
   * 获取模板ID列表
   */
  private async getTemplateIds(): Promise<string[]> {
    const templates = await this.prisma.codeTemplate.findMany({
      where: {
        status: 'ACTIVE',
        framework: 'nestjs'
      },
      select: { id: true }
    });
    return templates.map(t => t.id);
  }

  /**
   * 获取输出路径
   */
  private getOutputPath(projectId: string, projectCode: string): string {
    const baseOutputPath = this.configService.get<string>('CODE_GENERATION_OUTPUT_PATH') || 
                          path.join(process.cwd(), 'generated');
    return path.join(baseOutputPath, projectCode);
  }

  /**
   * 生成 Prisma schema
   */
  private async generatePrismaSchema(projectId: string, entities: any[], outputPath: string): Promise<void> {
    const schemaPath = path.join(outputPath, 'prisma', 'schema.prisma');
    await fs.ensureDir(path.dirname(schemaPath));

    const schemaContent = this.generatePrismaSchemaContent(entities);
    await fs.writeFile(schemaPath, schemaContent, 'utf-8');
  }

  /**
   * 生成 Prisma schema 内容
   */
  private generatePrismaSchemaContent(entities: any[]): string {
    const header = `// Auto-generated Prisma schema
// Generated at: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["amis"]
}

`;

    const models = entities.map(entity => {
      const fields = entity.fields.map((field: any) => {
        const fieldType = this.mapFieldTypeToPrisma(field.type);
        const nullable = field.nullable ? '?' : '';
        const attributes = [];
        
        if (field.primaryKey) {
          attributes.push('@id');
          if (field.autoIncrement) {
            attributes.push('@default(autoincrement())');
          } else if (field.type === 'STRING') {
            attributes.push('@default(dbgenerated("(gen_random_uuid())::text"))');
          }
        }
        
        if (field.uniqueConstraint) {
          attributes.push('@unique');
        }
        
        if (field.defaultValue && !field.primaryKey) {
          attributes.push(`@default(${this.formatDefaultValue(field.defaultValue, field.type)})`);
        }

        return `  ${field.code} ${fieldType}${nullable}${attributes.length ? ' ' + attributes.join(' ') : ''}`;
      }).join('\n');

      return `model ${entity.code} {
${fields}
  
  // 系统字段
  createdBy String   @map("created_by") @db.VarChar(36)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedBy String?  @map("updated_by") @db.VarChar(36)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)

  @@map("${entity.tableName}")
  @@schema("amis")
}`;
    }).join('\n\n');

    return header + models;
  }

  /**
   * 映射字段类型到 Prisma 类型
   */
  private mapFieldTypeToPrisma(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'String',
      'INTEGER': 'Int',
      'FLOAT': 'Float',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'JSON': 'Json',
      'UUID': 'String',
      'TEXT': 'String',
    };
    return typeMap[fieldType] || 'String';
  }

  /**
   * 格式化默认值
   */
  private formatDefaultValue(value: any, type: string): string {
    if (type === 'STRING') {
      return `"${value}"`;
    }
    if (type === 'BOOLEAN') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  /**
   * 生成 package.json
   */
  private async generatePackageJson(project: any, outputPath: string): Promise<void> {
    const packageJson = {
      name: project.code,
      version: project.version || '1.0.0',
      description: project.description || '',
      main: 'dist/main.js',
      scripts: {
        'build': 'nest build',
        'format': 'prettier --write "src/**/*.ts" "test/**/*.ts"',
        'start': 'nest start',
        'start:dev': 'nest start --watch',
        'start:debug': 'nest start --debug --watch',
        'start:prod': 'node dist/main',
        'lint': 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
        'test': 'jest',
        'test:watch': 'jest --watch',
        'test:cov': 'jest --coverage',
        'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
        'test:e2e': 'jest --config ./test/jest-e2e.json',
        'prisma:generate': 'prisma generate',
        'prisma:migrate': 'prisma migrate dev',
        'prisma:studio': 'prisma studio'
      },
      dependencies: {
        '@nestjs/common': '^10.0.0',
        '@nestjs/core': '^10.0.0',
        '@nestjs/platform-fastify': '^10.0.0',
        '@nestjs/swagger': '^7.0.0',
        '@prisma/client': '^5.0.0',
        'class-transformer': '^0.5.1',
        'class-validator': '^0.14.0',
        'fastify': '^4.0.0',
        'prisma': '^5.0.0',
        'reflect-metadata': '^0.1.13',
        'rxjs': '^7.8.1'
      },
      devDependencies: {
        '@nestjs/cli': '^10.0.0',
        '@nestjs/schematics': '^10.0.0',
        '@nestjs/testing': '^10.0.0',
        '@types/jest': '^29.5.2',
        '@types/node': '^20.3.1',
        '@types/supertest': '^2.0.12',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.42.0',
        'eslint-config-prettier': '^9.0.0',
        'eslint-plugin-prettier': '^5.0.0',
        'jest': '^29.5.0',
        'prettier': '^3.0.0',
        'source-map-support': '^0.5.21',
        'supertest': '^6.3.3',
        'ts-jest': '^29.1.0',
        'ts-loader': '^9.4.3',
        'ts-node': '^10.9.1',
        'tsconfig-paths': '^4.2.0',
        'typescript': '^5.1.3'
      }
    };

    const packageJsonPath = path.join(outputPath, 'package.json');
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }

  /**
   * 生成 README.md
   */
  private async generateReadme(project: any, outputPath: string): Promise<void> {
    const readmeContent = `# ${project.name}

${project.description || 'Generated by Low-code Platform'}

## Version
${project.version || '1.0.0'}

## Generated at
${new Date().toISOString()}

## Quick Start

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup environment
\`\`\`bash
cp .env.example .env
# Edit .env file with your database configuration
\`\`\`

### 3. Initialize database
\`\`\`bash
npm run prisma:generate
npm run prisma:migrate
\`\`\`

### 4. Start the application
\`\`\`bash
npm run start:dev
\`\`\`

### 5. Access the application
- API: http://localhost:3000/api/v1
- API Documentation: http://localhost:3000/api/v1/docs
- Health Check: http://localhost:3000/api/v1/health

## Project Structure

\`\`\`
src/
├── base/          # Generated base code (do not modify)
├── biz/           # Business customization code
├── shared/        # Shared modules
├── config/        # Configuration files
├── app.module.ts  # Application module
└── main.ts        # Application entry point
\`\`\`

## Development Notes

- Files in \`src/base/\` are auto-generated and should not be modified
- Use \`src/biz/\` for custom business logic
- All API responses follow Amis framework format
`;

    const readmePath = path.join(outputPath, 'README.md');
    await fs.writeFile(readmePath, readmeContent, 'utf-8');
  }
}
