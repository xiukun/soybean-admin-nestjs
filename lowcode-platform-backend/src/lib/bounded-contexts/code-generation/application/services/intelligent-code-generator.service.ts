import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as Handlebars from 'handlebars';
import { GeneratedFile, ProjectMetadata, EntityMetadata } from '../../../shared/types/metadata.types';

export interface GenerationRequest {
  projectId: string;
  templateIds: string[];
  entityIds?: string[];
  outputPath: string;
  variables: Record<string, any>;
  options: {
    overwriteExisting: boolean;
    generateTests: boolean;
    generateDocs: boolean;
    architecture: 'base-biz' | 'standard';
    framework: 'nestjs' | 'express' | 'spring';
  };
}

export interface TemplateMetadata {
  id: string;
  name: string;
  code: string;
  category: string;
  language: string;
  framework: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
  }>;
}

@Injectable()
export class IntelligentCodeGeneratorService {
  private readonly logger = new Logger(IntelligentCodeGeneratorService.name);
  private handlebars: typeof Handlebars;

  constructor(private readonly prisma: PrismaService) {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async generateFiles(request: GenerationRequest): Promise<GeneratedFile[]> {
    this.logger.log(`Starting code generation for project: ${request.projectId}`);

    try {
      // 获取模板
      const templates = await this.getTemplates(request.templateIds);
      this.logger.log(`Loaded ${templates.length} templates`);

      // 获取实体（如果指定了entityIds或entityName）
      let entities: EntityMetadata[] = [];

      if (request.entityIds && request.entityIds.length > 0) {
        entities = await this.getEntities(request.entityIds);
      } else if (request.variables.entityName) {
        // 根据entityName查找实体
        this.logger.log(`Looking for entity by name: ${request.variables.entityName} in project: ${request.projectId}`);
        const entity = await this.getEntityByName(request.projectId, request.variables.entityName);
        if (entity) {
          this.logger.log(`Found entity: ${entity.name} with ${entity.fields.length} fields`);
          entities = [entity];
        } else {
          this.logger.warn(`Entity not found: ${request.variables.entityName}`);
        }
      }

      const generatedFiles: GeneratedFile[] = [];

      // 为每个模板生成文件
      for (const template of templates) {
        if (entities.length > 0) {
          // 为每个实体生成文件
          for (const entity of entities) {
            const files = await this.generateFilesForEntity(template, entity, request);
            generatedFiles.push(...files);
          }
        } else {
          // 生成项目级别的文件
          const files = await this.generateProjectFiles(template, request);
          generatedFiles.push(...files);
        }
      }

      this.logger.log(`Generated ${generatedFiles.length} files`);
      return generatedFiles;

    } catch (error) {
      this.logger.error('Code generation failed:', error);
      throw error;
    }
  }

  private async getTemplates(templateIds: string[]): Promise<TemplateMetadata[]> {
    const templates = await this.prisma.codeTemplate.findMany({
      where: {
        id: { in: templateIds },
      },
    });

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      code: template.code,
      category: template.type,
      language: template.language,
      framework: template.framework,
      content: template.template,
      variables: Array.isArray(template.variables) ? template.variables.map((v: any) => ({
        name: v.name,
        type: v.type,
        description: v.description,
        required: v.required,
        defaultValue: v.defaultValue,
      })) : [],
    }));
  }

  private async getEntities(entityIds: string[]): Promise<EntityMetadata[]> {
    const entities: EntityMetadata[] = [];

    for (const entityId of entityIds) {
      try {
        const entityData = await this.prisma.$queryRaw<any[]>`
          SELECT
            e.id,
            e.name,
            e.code,
            e.table_name as "tableName",
            e.description,
            json_agg(
              json_build_object(
                'id', f.id,
                'name', f.name,
                'code', f.code,
                'type', f.type,
                'length', f.length,
                'nullable', f.nullable,
                'primaryKey', f.primary_key,
                'uniqueConstraint', f.unique_constraint,
                'defaultValue', f.default_value,
                'comment', f.comment,
                'sortOrder', f.sort_order
              ) ORDER BY f.sort_order ASC
            ) as fields
          FROM lowcode_entities e
          LEFT JOIN lowcode_fields f ON e.id = f.entity_id
          WHERE e.id = ${entityId}
          GROUP BY e.id, e.name, e.code, e.table_name, e.description
        `;

        if (entityData && entityData.length > 0) {
          const entity = entityData[0];
          entities.push({
            id: entity.id,
            name: entity.name,
            code: entity.code,
            tableName: entity.tableName,
            description: entity.description,
            fields: (entity.fields || []).map((field: any) => ({
              id: field.id,
              name: field.name,
              code: field.code,
              type: field.type,
              length: field.length,
              nullable: field.nullable,
              isPrimaryKey: field.primaryKey,
              isUnique: field.uniqueConstraint,
              defaultValue: field.defaultValue,
              description: field.comment,
              // 添加新的字段属性
              tsType: this.mapFieldTypeToTypeScript(field.type),
              prismaType: this.mapFieldTypeToPrisma(field.type, field.nullable),
              prismaAttributes: this.buildPrismaAttributes(field),
            })),
            relationships: { outgoing: [], incoming: [] },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to get entity ${entityId}:`, error);
      }
    }

    return entities;
  }

  private async getEntityByName(projectId: string, entityName: string): Promise<EntityMetadata | null> {
    try {
      const entityData = await this.prisma.$queryRaw<any[]>`
        SELECT
          e.id,
          e.name,
          e.code,
          e.table_name as "tableName",
          e.description,
          json_agg(
            json_build_object(
              'id', f.id,
              'name', f.name,
              'code', f.code,
              'type', f.type,
              'length', f.length,
              'nullable', f.nullable,
              'primaryKey', f.primary_key,
              'uniqueConstraint', f.unique_constraint,
              'defaultValue', f.default_value,
              'comment', f.comment,
              'sortOrder', f.sort_order
            ) ORDER BY f.sort_order ASC
          ) as fields
        FROM lowcode_entities e
        LEFT JOIN lowcode_fields f ON e.id = f.entity_id
        WHERE e.project_id = ${projectId} AND (e.code = ${entityName} OR e.name = ${entityName})
        GROUP BY e.id, e.name, e.code, e.table_name, e.description
      `;

      if (entityData && entityData.length > 0) {
        const entity = entityData[0];
        return {
          id: entity.id,
          name: entity.name,
          code: entity.code,
          tableName: entity.tableName,
          description: entity.description,
          fields: (entity.fields || []).map((field: any) => ({
            id: field.id,
            name: field.name,
            code: field.code,
            type: field.type,
            length: field.length,
            nullable: field.nullable,
            isPrimaryKey: field.primaryKey,
            isUnique: field.uniqueConstraint,
            defaultValue: field.defaultValue,
            description: field.comment,
            // 添加新的字段属性
            tsType: this.mapFieldTypeToTypeScript(field.type),
            prismaType: this.mapFieldTypeToPrisma(field.type, field.nullable),
            prismaAttributes: this.buildPrismaAttributes(field),
          })),
          relationships: { outgoing: [], incoming: [] },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get entity by name ${entityName}:`, error);
      return null;
    }
  }

  private async generateFilesForEntity(
    template: TemplateMetadata,
    entity: EntityMetadata,
    request: GenerationRequest
  ): Promise<GeneratedFile[]> {
    this.logger.log(`Generating files for entity: ${entity.name} with ${entity.fields.length} fields`);
    const context = this.buildTemplateContext(entity, request);
    this.logger.log(`Template context fields count: ${context.fields ? context.fields.length : 0}`);
    const compiledTemplate = this.handlebars.compile(template.content);
    const generatedContent = compiledTemplate(context);

    const filename = this.generateFilename(template, entity, request.options.architecture);
    const filePath = this.generateFilePath(template, entity, request);

    return [{
      filename,
      path: filePath,
      content: generatedContent,
      language: template.language,
      size: generatedContent.length,
    }];
  }

  private async generateProjectFiles(
    template: TemplateMetadata,
    request: GenerationRequest
  ): Promise<GeneratedFile[]> {
    const context = this.buildProjectContext(request);
    const compiledTemplate = this.handlebars.compile(template.content);
    const generatedContent = compiledTemplate(context);

    const filename = this.generateProjectFilename(template);
    const filePath = this.generateProjectFilePath(template, request);

    return [{
      filename,
      path: filePath,
      content: generatedContent,
      language: template.language,
      size: generatedContent.length,
    }];
  }

  private buildTemplateContext(entity: EntityMetadata, request: GenerationRequest): any {
    // 合并请求变量和实体数据
    const context = {
      // 实体相关
      entity,
      entityName: request.variables.entityName || entity.name,
      entityCode: entity.code,
      tableName: request.variables.tableName || entity.tableName,
      fields: entity.fields.map(field => ({
        ...field,
        tsType: field.tsType || this.mapFieldTypeToTypeScript(field.type),
        prismaType: field.prismaType || this.mapFieldTypeToPrisma(field.type, field.nullable),
        prismaAttributes: field.prismaAttributes || this.buildPrismaAttributes(field),
        columnOptions: this.buildColumnOptions(field)
      })),
      primaryKeyField: entity.fields.find(f => f.isPrimaryKey),
      nonPrimaryKeyFields: entity.fields.filter(f => !f.isPrimaryKey),
      requiredFields: entity.fields.filter(f => !f.nullable),
      optionalFields: entity.fields.filter(f => f.nullable),
      uniqueFields: entity.fields.filter(f => f.isUnique),
      systemFields: entity.fields.filter(f => this.isSystemField(f.code)),
      businessFields: entity.fields.filter(f => !this.isSystemField(f.code)),
      relationships: entity.relationships,

      // 生成选项
      options: request.options,

      // 时间戳
      timestamp: new Date().toISOString(),

      // 合并所有请求变量
      ...request.variables
    };

    return context;
  }

  private buildProjectContext(request: GenerationRequest): any {
    return {
      projectId: request.projectId,
      options: request.options,
      timestamp: new Date().toISOString(),
      // 直接展开所有变量到根级别
      ...request.variables
    };
  }

  private generateFilename(template: TemplateMetadata, entity: EntityMetadata, architecture: string): string {
    const extension = this.getFileExtension(template.language);
    const suffix = architecture === 'base-biz' ? '.base' : '';
    
    switch (template.category.toLowerCase()) {
      case 'controller':
        return `${entity.code.toLowerCase()}${suffix}.controller${extension}`;
      case 'service':
        return `${entity.code.toLowerCase()}${suffix}.service${extension}`;
      case 'dto':
        return `${entity.code.toLowerCase()}.dto${extension}`;
      case 'entity':
        return `${entity.code.toLowerCase()}.entity${extension}`;
      case 'module':
        return `${entity.code.toLowerCase()}.module${extension}`;
      default:
        return `${entity.code.toLowerCase()}${suffix}${extension}`;
    }
  }

  private generateFilePath(template: TemplateMetadata, entity: EntityMetadata, request: GenerationRequest): string {
    const layer = request.options.architecture === 'base-biz' ? 'base' : 'src';
    const category = template.category.toLowerCase();
    
    const categoryMap: Record<string, string> = {
      'controller': 'controllers',
      'service': 'services',
      'dto': 'dto',
      'entity': 'entities',
      'interface': 'interfaces',
      'module': 'modules',
    };

    const folder = categoryMap[category] || category;
    const filename = this.generateFilename(template, entity, request.options.architecture);
    
    return `${layer}/${folder}/${filename}`;
  }

  private generateProjectFilename(template: TemplateMetadata): string {
    const extension = this.getFileExtension(template.language);
    return `${template.code}${extension}`;
  }

  private generateProjectFilePath(template: TemplateMetadata, request: GenerationRequest): string {
    const filename = this.generateProjectFilename(template);
    return `src/${filename}`;
  }

  private getFileExtension(language: string): string {
    const extensionMap: Record<string, string> = {
      'typescript': '.ts',
      'javascript': '.js',
      'java': '.java',
      'python': '.py',
      'csharp': '.cs',
      'go': '.go',
      'rust': '.rs',
    };

    return extensionMap[language.toLowerCase()] || '.txt';
  }

  private mapFieldTypeToTypeScript(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'string',
      'integer': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'date': 'Date',
      'datetime': 'Date',
      'timestamp': 'Date',
      'json': 'any',
      'uuid': 'string',
    };
    return typeMap[fieldType] || 'any';
  }

  private buildColumnOptions(field: any): string {
    const options: string[] = [];

    if (field.type) {
      options.push(`type: '${field.type}'`);
    }

    if (field.nullable) {
      options.push(`nullable: ${field.nullable}`);
    }

    if (field.isUnique && !field.isPrimaryKey) {
      options.push(`unique: ${field.isUnique}`);
    }

    if (field.length && (field.type === 'string' || field.type === 'text')) {
      options.push(`length: ${field.length}`);
    }

    if (field.defaultValue) {
      options.push(`default: '${field.defaultValue}'`);
    }

    return options.length > 0 ? `{ ${options.join(', ')} }` : '';
  }

  private mapFieldTypeToPrisma(fieldType: string, nullable: boolean = false): string {
    const typeMap: Record<string, string> = {
      'STRING': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'JSON': 'Json',
      'UUID': 'String',
    };

    let prismaType = typeMap[fieldType] || 'String';

    // 处理可空字段
    if (nullable) {
      prismaType += '?';
    }

    return prismaType;
  }

  private buildPrismaAttributes(field: any): string[] {
    const attributes: string[] = [];

    // 主键
    if (field.isPrimaryKey) {
      if (field.type === 'UUID' || (field.type === 'STRING' && field.defaultValue === 'cuid()')) {
        attributes.push('@id @default(cuid())');
      } else {
        attributes.push('@id');
      }
    }

    // 唯一约束
    if (field.isUnique && !field.isPrimaryKey) {
      attributes.push('@unique');
    }

    // 默认值
    if (field.defaultValue && !field.isPrimaryKey) {
      if (field.defaultValue === 'now()') {
        attributes.push('@default(now())');
      } else if (field.defaultValue === 'cuid()') {
        attributes.push('@default(cuid())');
      } else {
        attributes.push(`@default("${field.defaultValue}")`);
      }
    }

    // 更新时间自动更新
    if (field.code === 'updatedAt') {
      attributes.push('@updatedAt');
    }

    return attributes;
  }

  private isSystemField(fieldCode: string): boolean {
    const systemFields = ['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
    return systemFields.includes(fieldCode);
  }

  private registerHelpers(): void {
    // 字符串转换辅助函数
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
    });

    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/(?:^|[-_])(\w)/g, (match, c, index) => 
        index === 0 ? c.toLowerCase() : c.toUpperCase()
      );
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    // 类型转换辅助函数
    this.handlebars.registerHelper('tsType', (fieldType: string) => {
      const typeMap: Record<string, string> = {
        'string': 'string',
        'text': 'string',
        'integer': 'number',
        'bigint': 'number',
        'decimal': 'number',
        'boolean': 'boolean',
        'date': 'Date',
        'datetime': 'Date',
        'timestamp': 'Date',
        'json': 'any',
        'uuid': 'string',
      };
      return typeMap[fieldType] || 'any';
    });

    // 导入生成辅助函数
    this.handlebars.registerHelper('generateImports', (entities: EntityMetadata[]) => {
      return entities.map(entity => 
        `import { ${entity.name} } from './${entity.code.toLowerCase()}.entity';`
      ).join('\n');
    });

    // 条件辅助函数
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    // 数组辅助函数
    this.handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return array.join(separator);
    });

    this.handlebars.registerHelper('first', (array: any[]) => {
      return array && array.length > 0 ? array[0] : null;
    });

    this.handlebars.registerHelper('last', (array: any[]) => {
      return array && array.length > 0 ? array[array.length - 1] : null;
    });

    // 日期辅助函数
    this.handlebars.registerHelper('now', () => {
      return new Date().toISOString();
    });

    this.handlebars.registerHelper('formatDate', (date: Date, format: string = 'YYYY-MM-DD') => {
      // 简单的日期格式化
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    });
  }
}
