import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { EnhancedTemplateEngineService } from '../../infrastructure/enhanced-template-engine.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CodeGenerationRequest {
  templateId: string;
  variables: Record<string, any>;
  outputPath: string;
  projectType: 'amis-lowcode' | 'nestjs' | 'vue' | 'react';
  generateOptions?: {
    includeBase?: boolean;
    includeBiz?: boolean;
    overwriteExisting?: boolean;
    createDirectories?: boolean;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'base' | 'biz' | 'config' | 'test';
  language: string;
}

export interface CodeGenerationResult {
  success: boolean;
  message: string;
  generatedFiles: GeneratedFile[];
  errors: string[];
  warnings: string[];
}

/**
 * 代码生成服务
 * 负责根据模板生成完整的业务代码
 */
@Injectable()
export class CodeGenerationService {
  private readonly logger = new Logger(CodeGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: EnhancedTemplateEngineService,
  ) {}

  /**
   * 生成代码
   * @param request 代码生成请求
   * @returns 生成结果
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    try {
      this.logger.log(`Starting code generation for template: ${request.templateId}`);

      // 获取模板信息
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id: request.templateId },
      });

      if (!template) {
        return {
          success: false,
          message: 'Template not found',
          generatedFiles: [],
          errors: ['Template not found'],
          warnings: [],
        };
      }

      // 验证模板
      const validation = this.templateEngine.validate(template.template);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Template validation failed',
          generatedFiles: [],
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      const generatedFiles: GeneratedFile[] = [];
      const errors: string[] = [];
      const warnings: string[] = validation.warnings;

      // 根据项目类型生成不同的文件结构
      switch (request.projectType) {
        case 'amis-lowcode':
          await this.generateAmisLowcodeFiles(template, request, generatedFiles, errors);
          break;
        case 'nestjs':
          await this.generateNestJSFiles(template, request, generatedFiles, errors);
          break;
        default:
          await this.generateGenericFiles(template, request, generatedFiles, errors);
      }

      // 写入文件到磁盘
      if (request.generateOptions?.createDirectories) {
        await this.writeFilesToDisk(generatedFiles, request.outputPath, errors);
      }

      const success = errors.length === 0;
      this.logger.log(`Code generation ${success ? 'completed successfully' : 'failed'} for template: ${request.templateId}`);

      return {
        success,
        message: success ? 'Code generation completed successfully' : 'Code generation failed',
        generatedFiles,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Code generation failed:', error);
      return {
        success: false,
        message: `Code generation failed: ${error.message}`,
        generatedFiles: [],
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * 生成Amis低代码项目文件
   */
  private async generateAmisLowcodeFiles(
    template: any,
    request: CodeGenerationRequest,
    generatedFiles: GeneratedFile[],
    errors: string[],
  ): Promise<void> {
    try {
      const { variables } = request;
      const entityName = variables.entityName || 'Entity';
      const entityNameLower = entityName.toLowerCase();
      const entityNamePlural = this.pluralize(entityNameLower);

      // 生成基础文件结构
      if (request.generateOptions?.includeBase !== false) {
        // 生成Controller
        const controllerContent = this.templateEngine.render(template.template, {
          ...variables,
          entityNameLower,
          entityNamePlural,
          controllerName: `${entityName}Controller`,
          serviceName: `${entityName}Service`,
          dtoName: `${entityName}Dto`,
        });

        generatedFiles.push({
          path: `src/controllers/${entityNameLower}.controller.ts`,
          content: controllerContent,
          type: 'base',
          language: 'typescript',
        });

        // 生成Service
        const serviceTemplate = this.getAmisServiceTemplate();
        const serviceContent = this.templateEngine.render(serviceTemplate, {
          ...variables,
          entityName,
          entityNameLower,
          entityNamePlural,
          serviceName: `${entityName}Service`,
          repositoryName: `${entityName}Repository`,
        });

        generatedFiles.push({
          path: `src/services/${entityNameLower}.service.ts`,
          content: serviceContent,
          type: 'base',
          language: 'typescript',
        });

        // 生成DTO
        const dtoTemplate = this.getAmisDtoTemplate();
        const dtoContent = this.templateEngine.render(dtoTemplate, {
          ...variables,
          entityName,
          dtoName: `${entityName}Dto`,
          createDtoName: `Create${entityName}Dto`,
          updateDtoName: `Update${entityName}Dto`,
        });

        generatedFiles.push({
          path: `src/dto/${entityNameLower}.dto.ts`,
          content: dtoContent,
          type: 'base',
          language: 'typescript',
        });

        // 生成Repository
        const repositoryTemplate = this.getAmisRepositoryTemplate();
        const repositoryContent = this.templateEngine.render(repositoryTemplate, {
          ...variables,
          entityName,
          entityNameLower,
          repositoryName: `${entityName}Repository`,
        });

        generatedFiles.push({
          path: `src/repositories/${entityNameLower}.repository.ts`,
          content: repositoryContent,
          type: 'base',
          language: 'typescript',
        });
      }

      // 生成业务逻辑文件
      if (request.generateOptions?.includeBiz !== false) {
        // 生成业务逻辑扩展文件
        const bizServiceTemplate = this.getAmisBizServiceTemplate();
        const bizServiceContent = this.templateEngine.render(bizServiceTemplate, {
          ...variables,
          entityName,
          entityNameLower,
          bizServiceName: `${entityName}BizService`,
          baseServiceName: `${entityName}Service`,
        });

        generatedFiles.push({
          path: `src/biz/${entityNameLower}.biz.service.ts`,
          content: bizServiceContent,
          type: 'biz',
          language: 'typescript',
        });
      }

      // 生成配置文件
      const moduleTemplate = this.getAmisModuleTemplate();
      const moduleContent = this.templateEngine.render(moduleTemplate, {
        ...variables,
        entityName,
        moduleName: `${entityName}Module`,
        controllerName: `${entityName}Controller`,
        serviceName: `${entityName}Service`,
        repositoryName: `${entityName}Repository`,
      });

      generatedFiles.push({
        path: `src/modules/${entityNameLower}.module.ts`,
        content: moduleContent,
        type: 'config',
        language: 'typescript',
      });

    } catch (error) {
      errors.push(`Failed to generate Amis lowcode files: ${error.message}`);
    }
  }

  /**
   * 生成NestJS项目文件
   */
  private async generateNestJSFiles(
    template: any,
    request: CodeGenerationRequest,
    generatedFiles: GeneratedFile[],
    errors: string[],
  ): Promise<void> {
    try {
      const content = this.templateEngine.render(template.template, request.variables);

      generatedFiles.push({
        path: `src/${request.variables.entityName?.toLowerCase() || 'entity'}.controller.ts`,
        content,
        type: 'base',
        language: 'typescript',
      });
    } catch (error) {
      errors.push(`Failed to generate NestJS files: ${error.message}`);
    }
  }

  /**
   * 生成通用文件
   */
  private async generateGenericFiles(
    template: any,
    request: CodeGenerationRequest,
    generatedFiles: GeneratedFile[],
    errors: string[],
  ): Promise<void> {
    try {
      const content = this.templateEngine.render(template.template, request.variables);

      generatedFiles.push({
        path: 'generated-file.txt',
        content,
        type: 'base',
        language: 'text',
      });
    } catch (error) {
      errors.push(`Failed to generate generic files: ${error.message}`);
    }
  }

  /**
   * 将文件写入磁盘
   */
  private async writeFilesToDisk(
    generatedFiles: GeneratedFile[],
    outputPath: string,
    errors: string[],
  ): Promise<void> {
    for (const file of generatedFiles) {
      try {
        const fullPath = path.join(outputPath, file.path);
        const dir = path.dirname(fullPath);
        
        // 创建目录
        await fs.mkdir(dir, { recursive: true });
        
        // 写入文件
        await fs.writeFile(fullPath, file.content, 'utf8');
        
        this.logger.log(`Generated file: ${fullPath}`);
      } catch (error) {
        errors.push(`Failed to write file ${file.path}: ${error.message}`);
      }
    }
  }

  /**
   * 复数形式转换
   */
  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es';
    } else {
      return str + 's';
    }
  }

  // 模板定义方法
  private getAmisServiceTemplate(): string {
    return `import { Injectable, Logger } from '@nestjs/common';
import { {{repositoryName}} } from '../repositories/{{entityNameLower}}.repository';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from '../dto/{{entityNameLower}}.dto';

@Injectable()
export class {{serviceName}} {
  private readonly logger = new Logger({{serviceName}}.name);

  constructor(
    private readonly {{entityNameLower}}Repository: {{repositoryName}},
  ) {}

  async findAll(query: any) {
    return this.{{entityNameLower}}Repository.findAll(query);
  }

  async findOne(id: string) {
    return this.{{entityNameLower}}Repository.findOne(id);
  }

  async create(createDto: Create{{entityName}}Dto) {
    return this.{{entityNameLower}}Repository.create(createDto);
  }

  async update(id: string, updateDto: Update{{entityName}}Dto) {
    return this.{{entityNameLower}}Repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.{{entityNameLower}}Repository.remove(id);
  }
}`;
  }

  private getAmisDtoTemplate(): string {
    return `import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{{entityName}}Dto {
  @ApiProperty({ description: '{{entityDescription}}名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '{{entityDescription}}描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class Update{{entityName}}Dto {
  @ApiProperty({ description: '{{entityDescription}}名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '{{entityDescription}}描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class {{entityName}}Dto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '{{entityDescription}}名称' })
  name: string;

  @ApiProperty({ description: '{{entityDescription}}描述' })
  description: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}`;
  }

  private getAmisRepositoryTemplate(): string {
    return `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from '../dto/{{entityNameLower}}.dto';

@Injectable()
export class {{repositoryName}} {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, pageSize = 10, ...filters } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.{{entityNameLower}}.findMany({
        skip,
        take: pageSize,
        where: filters,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.{{entityNameLower}}.count({ where: filters }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    return this.prisma.{{entityNameLower}}.findUnique({
      where: { id },
    });
  }

  async create(data: Create{{entityName}}Dto) {
    return this.prisma.{{entityNameLower}}.create({
      data,
    });
  }

  async update(id: string, data: Update{{entityName}}Dto) {
    return this.prisma.{{entityNameLower}}.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.{{entityNameLower}}.delete({
      where: { id },
    });
  }
}`;
  }

  private getAmisBizServiceTemplate(): string {
    return `import { Injectable, Logger } from '@nestjs/common';
import { {{baseServiceName}} } from './{{entityNameLower}}.service';

/**
 * {{entityDescription}}业务逻辑服务
 * 继承基础服务，可以在这里添加复杂的业务逻辑
 */
@Injectable()
export class {{bizServiceName}} extends {{baseServiceName}} {
  private readonly logger = new Logger({{bizServiceName}}.name);

  /**
   * 自定义业务方法示例
   */
  async customBusinessMethod(id: string) {
    // 在这里添加复杂的业务逻辑
    const entity = await this.findOne(id);
    
    // 执行业务逻辑
    // ...
    
    return entity;
  }

  /**
   * 批量操作示例
   */
  async batchOperation(ids: string[]) {
    const results = [];
    
    for (const id of ids) {
      try {
        const result = await this.customBusinessMethod(id);
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    return results;
  }
}`;
  }

  private getAmisModuleTemplate(): string {
    return `import { Module } from '@nestjs/common';
import { {{controllerName}} } from '../controllers/{{entityNameLower}}.controller';
import { {{serviceName}} } from '../services/{{entityNameLower}}.service';
import { {{repositoryName}} } from '../repositories/{{entityNameLower}}.repository';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [{{controllerName}}],
  providers: [{{serviceName}}, {{repositoryName}}],
  exports: [{{serviceName}}],
})
export class {{moduleName}} {}`;
  }
}
