/*
 * @Description: 双层代码生成器服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:30:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { TemplatePreviewService } from '@lib/bounded-contexts/template/application/services/template-preview.service';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface GenerationConfig {
  projectId: string;
  entityIds: string[];
  templateIds: string[];
  outputPath: string;
  baseConfig: {
    generateAuth: boolean;
    generateValidation: boolean;
    generateSwagger: boolean;
    generateTests: boolean;
    outputFormat: 'typescript' | 'javascript';
  };
  bizConfig: {
    allowCustomization: boolean;
    preserveCustomCode: boolean;
    generateInterfaces: boolean;
  };
}

export interface GenerationResult {
  success: boolean;
  generatedFiles: GeneratedFile[];
  errors: string[];
  warnings: string[];
  summary: {
    totalFiles: number;
    baseFiles: number;
    bizFiles: number;
    skippedFiles: number;
  };
}

export interface GeneratedFile {
  path: string;
  type: 'base' | 'biz';
  content: string;
  templateId: string;
  entityId: string;
  overwritten: boolean;
}

@Injectable()
export class DualLayerGeneratorService {
  private readonly logger = new Logger(DualLayerGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templatePreviewService: TemplatePreviewService,
  ) {}

  /**
   * 生成双层代码
   */
  async generateCode(config: GenerationConfig): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      generatedFiles: [],
      errors: [],
      warnings: [],
      summary: {
        totalFiles: 0,
        baseFiles: 0,
        bizFiles: 0,
        skippedFiles: 0,
      },
    };

    try {
      this.logger.log(`开始生成代码，项目ID: ${config.projectId}`);

      // 1. 获取项目信息
      const project = await this.getProject(config.projectId);
      if (!project) {
        result.errors.push(`项目不存在: ${config.projectId}`);
        return result;
      }

      // 2. 获取实体信息
      const entities = await this.getEntities(config.entityIds);
      if (entities.length === 0) {
        result.errors.push('没有找到有效的实体');
        return result;
      }

      // 3. 获取模板信息
      const templates = await this.getTemplates(config.templateIds);
      if (templates.length === 0) {
        result.errors.push('没有找到有效的模板');
        return result;
      }

      // 4. 确保输出目录存在
      await this.ensureOutputDirectory(config.outputPath);

      // 5. 为每个实体生成代码
      for (const entity of entities) {
        const entityResult = await this.generateEntityCode(
          entity,
          templates,
          project,
          config,
        );
        
        result.generatedFiles.push(...entityResult.files);
        result.errors.push(...entityResult.errors);
        result.warnings.push(...entityResult.warnings);
      }

      // 6. 更新统计信息
      this.updateSummary(result);

      result.success = result.errors.length === 0;
      this.logger.log(`代码生成完成，成功: ${result.success}`);

    } catch (error) {
      this.logger.error('代码生成失败', error);
      result.errors.push(`代码生成失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 为单个实体生成代码
   */
  private async generateEntityCode(
    entity: any,
    templates: any[],
    project: any,
    config: GenerationConfig,
  ): Promise<{ files: GeneratedFile[]; errors: string[]; warnings: string[] }> {
    const files: GeneratedFile[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // 准备模板变量
    const templateVariables = this.prepareTemplateVariables(entity, project, config);

    for (const template of templates) {
      try {
        // 生成Base层代码
        const baseFile = await this.generateBaseFile(
          entity,
          template,
          templateVariables,
          config,
        );
        if (baseFile) {
          files.push(baseFile);
        }

        // 生成Biz层代码（如果不存在）
        const bizFile = await this.generateBizFile(
          entity,
          template,
          templateVariables,
          config,
        );
        if (bizFile) {
          files.push(bizFile);
        }

      } catch (error) {
        errors.push(`模板 ${template.name} 生成失败: ${error.message}`);
      }
    }

    return { files, errors, warnings };
  }

  /**
   * 生成Base层文件
   */
  private async generateBaseFile(
    entity: any,
    template: any,
    variables: any,
    config: GenerationConfig,
  ): Promise<GeneratedFile | null> {
    try {
      // 使用模板预览服务生成内容
      const previewResult = this.templatePreviewService.previewTemplate(
        template.content,
        variables,
      );

      if (!previewResult.success) {
        throw new Error(`模板渲染失败: ${previewResult.errors.join(', ')}`);
      }

      // 确定文件路径
      const filePath = this.getBaseFilePath(entity, template, config);
      
      // 写入文件
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, previewResult.output, 'utf8');

      return {
        path: filePath,
        type: 'base',
        content: previewResult.output,
        templateId: template.id,
        entityId: entity.id,
        overwritten: true, // Base层总是覆盖
      };

    } catch (error) {
      this.logger.error(`生成Base文件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 生成Biz层文件
   */
  private async generateBizFile(
    entity: any,
    template: any,
    variables: any,
    config: GenerationConfig,
  ): Promise<GeneratedFile | null> {
    try {
      const filePath = this.getBizFilePath(entity, template, config);
      
      // 检查Biz文件是否已存在
      const exists = await fs.pathExists(filePath);
      
      if (exists && config.bizConfig.preserveCustomCode) {
        // 如果文件存在且配置为保护自定义代码，则跳过
        return {
          path: filePath,
          type: 'biz',
          content: '',
          templateId: template.id,
          entityId: entity.id,
          overwritten: false,
        };
      }

      // 生成Biz层模板内容（继承Base层）
      const bizContent = this.generateBizTemplate(entity, template, variables, config);
      
      // 写入文件
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, bizContent, 'utf8');

      return {
        path: filePath,
        type: 'biz',
        content: bizContent,
        templateId: template.id,
        entityId: entity.id,
        overwritten: !exists,
      };

    } catch (error) {
      this.logger.error(`生成Biz文件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 生成Biz层模板内容
   */
  private generateBizTemplate(
    entity: any,
    template: any,
    variables: any,
    config: GenerationConfig,
  ): string {
    const entityName = this.pascalCase(entity.code);
    const baseClassName = `${entityName}Base${this.getClassSuffix(template.category)}`;
    const bizClassName = `${entityName}${this.getClassSuffix(template.category)}`;

    switch (template.category) {
      case 'CONTROLLER':
        return this.generateBizController(entityName, baseClassName, bizClassName, variables);
      case 'SERVICE':
        return this.generateBizService(entityName, baseClassName, bizClassName, variables);
      case 'DTO':
        return this.generateBizDto(entityName, baseClassName, bizClassName, variables);
      default:
        return this.generateGenericBizClass(entityName, baseClassName, bizClassName, variables);
    }
  }

  /**
   * 生成Biz层控制器
   */
  private generateBizController(
    entityName: string,
    baseClassName: string,
    bizClassName: string,
    variables: any,
  ): string {
    return `import { Controller } from '@nestjs/common';
import { ${baseClassName} } from '../base/${this.kebabCase(entityName)}.base.controller';

/**
 * ${variables.entity.description}控制器
 * 继承自Base控制器，可以在此添加自定义业务逻辑
 */
@Controller('${this.kebabCase(entityName)}')
export class ${bizClassName} extends ${baseClassName} {
  // 在此添加自定义方法
  
  // 示例：重写父类方法
  // async findAll(query: any) {
  //   // 自定义逻辑
  //   return super.findAll(query);
  // }
  
  // 示例：添加新方法
  // @Get('custom')
  // async customMethod() {
  //   return { message: 'Custom method' };
  // }
}
`;
  }

  /**
   * 生成Biz层服务
   */
  private generateBizService(
    entityName: string,
    baseClassName: string,
    bizClassName: string,
    variables: any,
  ): string {
    return `import { Injectable } from '@nestjs/common';
import { ${baseClassName} } from '../base/${this.kebabCase(entityName)}.base.service';

/**
 * ${variables.entity.description}服务
 * 继承自Base服务，可以在此添加自定义业务逻辑
 */
@Injectable()
export class ${bizClassName} extends ${baseClassName} {
  // 在此添加自定义方法
  
  // 示例：重写父类方法
  // async findAll(query: any) {
  //   // 自定义逻辑处理
  //   const result = await super.findAll(query);
  //   // 后处理
  //   return result;
  // }
  
  // 示例：添加新方法
  // async customBusinessLogic(data: any) {
  //   // 自定义业务逻辑
  //   return data;
  // }
}
`;
  }

  /**
   * 生成Biz层DTO
   */
  private generateBizDto(
    entityName: string,
    baseClassName: string,
    bizClassName: string,
    variables: any,
  ): string {
    return `import { ${baseClassName} } from '../base/${this.kebabCase(entityName)}.base.dto';

/**
 * ${variables.entity.description}DTO
 * 继承自Base DTO，可以在此添加自定义字段和验证
 */
export class ${bizClassName} extends ${baseClassName} {
  // 在此添加自定义字段
  
  // 示例：添加自定义字段
  // @ApiPropertyOptional({ description: '自定义字段' })
  // @IsOptional()
  // @IsString()
  // customField?: string;
}

// 导出其他相关DTO
export class Create${entityName}Dto extends ${bizClassName} {}
export class Update${entityName}Dto extends ${bizClassName} {}
`;
  }

  /**
   * 生成通用Biz层类
   */
  private generateGenericBizClass(
    entityName: string,
    baseClassName: string,
    bizClassName: string,
    variables: any,
  ): string {
    return `import { ${baseClassName} } from '../base/${this.kebabCase(entityName)}.base';

/**
 * ${variables.entity.description}
 * 继承自Base类，可以在此添加自定义逻辑
 */
export class ${bizClassName} extends ${baseClassName} {
  // 在此添加自定义属性和方法
}
`;
  }

  // 辅助方法
  private async getProject(projectId: string) {
    return (this.prisma as any).lowcodeProject.findUnique({
      where: { id: projectId },
    });
  }

  private async getEntities(entityIds: string[]) {
    return (this.prisma as any).lowcodeEntity.findMany({
      where: { id: { in: entityIds } },
      include: {
        fields: true,
        relations: true,
      },
    });
  }

  private async getTemplates(templateIds: string[]) {
    return (this.prisma as any).codeTemplate.findMany({
      where: { id: { in: templateIds } },
    });
  }

  private async ensureOutputDirectory(outputPath: string) {
    await fs.ensureDir(outputPath);
    await fs.ensureDir(path.join(outputPath, 'base'));
    await fs.ensureDir(path.join(outputPath, 'biz'));
  }

  private prepareTemplateVariables(entity: any, project: any, config: GenerationConfig) {
    return {
      entity: {
        ...entity,
        name: entity.name,
        code: entity.code,
        description: entity.description || entity.name,
        hasAuth: config.baseConfig.generateAuth,
        hasValidation: config.baseConfig.generateValidation,
        hasSwagger: config.baseConfig.generateSwagger,
        fields: entity.fields || [],
        relations: entity.relations || [],
      },
      project: {
        ...project,
        name: project.name,
        code: project.code,
        namespace: project.code,
      },
      config: config.baseConfig,
    };
  }

  private getBaseFilePath(entity: any, template: any, config: GenerationConfig): string {
    const fileName = `${this.kebabCase(entity.code)}.base.${this.getFileExtension(template.category)}`;
    return path.join(config.outputPath, 'base', fileName);
  }

  private getBizFilePath(entity: any, template: any, config: GenerationConfig): string {
    const fileName = `${this.kebabCase(entity.code)}.${this.getFileExtension(template.category)}`;
    return path.join(config.outputPath, 'biz', fileName);
  }

  private getFileExtension(category: string): string {
    const extensions: Record<string, string> = {
      CONTROLLER: 'controller.ts',
      SERVICE: 'service.ts',
      DTO: 'dto.ts',
      ENTITY: 'entity.ts',
      CONFIG: 'config.ts',
    };
    return extensions[category] || 'ts';
  }

  private getClassSuffix(category: string): string {
    const suffixes: Record<string, string> = {
      CONTROLLER: 'Controller',
      SERVICE: 'Service',
      DTO: 'Dto',
      ENTITY: 'Entity',
      CONFIG: 'Config',
    };
    return suffixes[category] || '';
  }

  private updateSummary(result: GenerationResult) {
    result.summary.totalFiles = result.generatedFiles.length;
    result.summary.baseFiles = result.generatedFiles.filter(f => f.type === 'base').length;
    result.summary.bizFiles = result.generatedFiles.filter(f => f.type === 'biz').length;
    result.summary.skippedFiles = result.generatedFiles.filter(f => !f.overwritten).length;
  }

  // 字符串处理辅助方法
  private pascalCase(str: string): string {
    return str.replace(/(?:^|[\s-_]+)(\w)/g, (match, letter) => letter.toUpperCase());
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[\s_]+/g, '-');
  }
}
