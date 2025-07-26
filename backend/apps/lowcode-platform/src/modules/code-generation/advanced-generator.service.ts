import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface GenerationContext {
  project: any;
  entity: any;
  template: any;
  relations: any[];
  variables: Record<string, any>;
  options: GenerationOptions;
}

export interface GenerationOptions {
  outputPath?: string;
  fileNaming?: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase';
  includeTests?: boolean;
  includeDocumentation?: boolean;
  framework?: string;
  language?: string;
  generateBase?: boolean;
  generateBiz?: boolean;
  overwriteBase?: boolean;
  overwriteBiz?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'base' | 'biz' | 'test' | 'doc';
  language: string;
  size: number;
  checksum: string;
}

@Injectable()
export class AdvancedGeneratorService {
  private readonly logger = new Logger(AdvancedGeneratorService.name);
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async generateCode(context: GenerationContext, user: AuthenticatedUser): Promise<GeneratedFile[]> {
    this.logger.log(`Starting advanced code generation for entity: ${context.entity.name}`);

    const files: GeneratedFile[] = [];

    try {
      // 预处理上下文
      const processedContext = await this.preprocessContext(context);

      // 生成Base层代码
      if (context.options.generateBase !== false) {
        const baseFiles = await this.generateBaseLayer(processedContext);
        files.push(...baseFiles);
      }

      // 生成Biz层代码
      if (context.options.generateBiz !== false) {
        const bizFiles = await this.generateBizLayer(processedContext);
        files.push(...bizFiles);
      }

      // 生成测试代码
      if (context.options.includeTests) {
        const testFiles = await this.generateTestFiles(processedContext);
        files.push(...testFiles);
      }

      // 生成文档
      if (context.options.includeDocumentation) {
        const docFiles = await this.generateDocumentation(processedContext);
        files.push(...docFiles);
      }

      this.logger.log(`Generated ${files.length} files successfully`);
      return files;

    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`);
      throw BusinessException.internalServerError('Code generation failed', error.message);
    }
  }

  private async preprocessContext(context: GenerationContext): Promise<GenerationContext> {
    // 添加辅助变量
    const enhancedVariables = {
      ...context.variables,
      entityName: context.entity.name,
      entityNameLower: context.entity.name.toLowerCase(),
      entityNameUpper: context.entity.name.toUpperCase(),
      entityNameCamel: this.toCamelCase(context.entity.name),
      entityNamePascal: this.toPascalCase(context.entity.name),
      entityNameKebab: this.toKebabCase(context.entity.name),
      entityNameSnake: this.toSnakeCase(context.entity.name),
      tableName: context.entity.tableName,
      primaryKey: this.getPrimaryKeyField(context.entity),
      fields: context.entity.fields || [],
      relations: context.relations || [],
      timestamp: new Date().toISOString(),
      author: context.project.config?.author || 'Code Generator',
      version: context.project.config?.version || '1.0.0',
    };

    return {
      ...context,
      variables: enhancedVariables,
    };
  }

  private async generateBaseLayer(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const framework = context.options.framework || 'nestjs';

    switch (framework.toLowerCase()) {
      case 'nestjs':
        files.push(...await this.generateNestJSBaseFiles(context));
        break;
      case 'spring-boot':
        files.push(...await this.generateSpringBootBaseFiles(context));
        break;
      case 'express':
        files.push(...await this.generateExpressBaseFiles(context));
        break;
      default:
        throw BusinessException.badRequest(`Unsupported framework: ${framework}`);
    }

    return files;
  }

  private async generateBizLayer(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // Biz层只在不存在时生成，保护用户自定义代码
    const bizTemplates = [
      'biz-service.hbs',
      'biz-controller.hbs',
      'biz-dto.hbs',
    ];

    for (const templateName of bizTemplates) {
      const outputPath = this.getBizFilePath(context, templateName);
      
      // 检查文件是否已存在
      if (!context.options.overwriteBiz && await this.fileExists(outputPath)) {
        this.logger.log(`Skipping existing Biz file: ${outputPath}`);
        continue;
      }

      const content = await this.renderTemplate(templateName, context);
      files.push(this.createGeneratedFile(outputPath, content, 'biz', context.options.language || 'typescript'));
    }

    return files;
  }

  private async generateNestJSBaseFiles(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const templates = [
      { name: 'nestjs-entity.hbs', output: 'entities/{{entityNameKebab}}.entity.ts' },
      { name: 'nestjs-base-service.hbs', output: 'services/{{entityNameKebab}}-base.service.ts' },
      { name: 'nestjs-base-controller.hbs', output: 'controllers/{{entityNameKebab}}-base.controller.ts' },
      { name: 'nestjs-dto.hbs', output: 'dto/{{entityNameKebab}}.dto.ts' },
      { name: 'nestjs-module.hbs', output: '{{entityNameKebab}}.module.ts' },
    ];

    for (const template of templates) {
      const outputPath = this.renderString(template.output, context.variables);
      const content = await this.renderTemplate(template.name, context);
      files.push(this.createGeneratedFile(outputPath, content, 'base', 'typescript'));
    }

    return files;
  }

  private async generateSpringBootBaseFiles(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const templates = [
      { name: 'spring-entity.hbs', output: 'entity/{{entityNamePascal}}.java' },
      { name: 'spring-repository.hbs', output: 'repository/{{entityNamePascal}}Repository.java' },
      { name: 'spring-base-service.hbs', output: 'service/{{entityNamePascal}}BaseService.java' },
      { name: 'spring-base-controller.hbs', output: 'controller/{{entityNamePascal}}BaseController.java' },
      { name: 'spring-dto.hbs', output: 'dto/{{entityNamePascal}}DTO.java' },
    ];

    for (const template of templates) {
      const outputPath = this.renderString(template.output, context.variables);
      const content = await this.renderTemplate(template.name, context);
      files.push(this.createGeneratedFile(outputPath, content, 'base', 'java'));
    }

    return files;
  }

  private async generateExpressBaseFiles(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const templates = [
      { name: 'express-model.hbs', output: 'models/{{entityNameKebab}}.model.js' },
      { name: 'express-base-service.hbs', output: 'services/{{entityNameKebab}}-base.service.js' },
      { name: 'express-base-controller.hbs', output: 'controllers/{{entityNameKebab}}-base.controller.js' },
      { name: 'express-routes.hbs', output: 'routes/{{entityNameKebab}}.routes.js' },
    ];

    for (const template of templates) {
      const outputPath = this.renderString(template.output, context.variables);
      const content = await this.renderTemplate(template.name, context);
      files.push(this.createGeneratedFile(outputPath, content, 'base', 'javascript'));
    }

    return files;
  }

  private async generateTestFiles(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const testTemplates = [
      { name: 'unit-test.hbs', output: 'tests/{{entityNameKebab}}.test.ts' },
      { name: 'integration-test.hbs', output: 'tests/{{entityNameKebab}}.integration.test.ts' },
      { name: 'e2e-test.hbs', output: 'tests/{{entityNameKebab}}.e2e.test.ts' },
    ];

    for (const template of testTemplates) {
      const outputPath = this.renderString(template.output, context.variables);
      const content = await this.renderTemplate(template.name, context);
      files.push(this.createGeneratedFile(outputPath, content, 'test', context.options.language || 'typescript'));
    }

    return files;
  }

  private async generateDocumentation(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const docTemplates = [
      { name: 'api-doc.hbs', output: 'docs/{{entityNameKebab}}-api.md' },
      { name: 'entity-doc.hbs', output: 'docs/{{entityNameKebab}}-entity.md' },
      { name: 'readme.hbs', output: 'README.md' },
    ];

    for (const template of docTemplates) {
      const outputPath = this.renderString(template.output, context.variables);
      const content = await this.renderTemplate(template.name, context);
      files.push(this.createGeneratedFile(outputPath, content, 'doc', 'markdown'));
    }

    return files;
  }

  private async renderTemplate(templateName: string, context: GenerationContext): Promise<string> {
    // 这里应该从模板服务获取模板内容
    const templateContent = await this.getTemplateContent(templateName);
    const template = this.handlebars.compile(templateContent);
    return template(context.variables);
  }

  private renderString(template: string, variables: Record<string, any>): string {
    const compiled = this.handlebars.compile(template);
    return compiled(variables);
  }

  private async getTemplateContent(templateName: string): Promise<string> {
    // 模拟模板内容获取
    return `// Generated template: ${templateName}
// Entity: {{entityName}}
// Generated at: {{timestamp}}

export class {{entityNamePascal}} {
  // Generated code here
}`;
  }

  private createGeneratedFile(
    filePath: string,
    content: string,
    type: 'base' | 'biz' | 'test' | 'doc',
    language: string
  ): GeneratedFile {
    return {
      path: filePath,
      content,
      type,
      language,
      size: Buffer.byteLength(content, 'utf8'),
      checksum: this.calculateChecksum(content),
    };
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private getBizFilePath(context: GenerationContext, templateName: string): string {
    const entityName = context.variables.entityNameKebab;
    const baseName = templateName.replace('.hbs', '').replace('biz-', '');
    return `biz/${entityName}/${baseName}.ts`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getPrimaryKeyField(entity: any): any {
    return entity.fields?.find((field: any) => field.isPrimary) || { name: 'id', type: 'number' };
  }

  private registerHelpers(): void {
    // 注册Handlebars辅助函数
    this.handlebars.registerHelper('camelCase', (str: string) => this.toCamelCase(str));
    this.handlebars.registerHelper('pascalCase', (str: string) => this.toPascalCase(str));
    this.handlebars.registerHelper('kebabCase', (str: string) => this.toKebabCase(str));
    this.handlebars.registerHelper('snakeCase', (str: string) => this.toSnakeCase(str));
    this.handlebars.registerHelper('upperCase', (str: string) => str.toUpperCase());
    this.handlebars.registerHelper('lowerCase', (str: string) => str.toLowerCase());
    
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    
    this.handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    this.handlebars.registerHelper('date', (format?: string) => {
      const now = new Date();
      return format ? now.toLocaleDateString() : now.toISOString();
    });
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + this.toCamelCase(str).slice(1);
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
}
