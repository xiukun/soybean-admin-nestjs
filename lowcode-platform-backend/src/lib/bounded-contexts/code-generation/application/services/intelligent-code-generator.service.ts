import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as Handlebars from 'handlebars';
import { GeneratedFile, ProjectMetadata, EntityMetadata, FieldMetadata } from '../../../shared/types/metadata.types';
import { MetadataAggregatorService } from '../../../metadata/application/services/metadata-aggregator.service';
import { TemplateEngineService } from '../../infrastructure/template-engine.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly metadataAggregator: MetadataAggregatorService,
    private readonly templateEngine: TemplateEngineService,
  ) {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async generateFiles(request: GenerationRequest): Promise<GeneratedFile[]> {
    this.logger.log(`Starting code generation for project: ${request.projectId}`);

    try {
      // Validate project exists
      const projectMetadata = await this.metadataAggregator.getProjectMetadata(request.projectId);
      this.logger.log(`Project validated: ${projectMetadata.project.name}`);

      // Get templates
      const templates = await this.getTemplates(request.templateIds);
      this.logger.log(`Loaded ${templates.length} templates`);

      // Get entities using the improved metadata service
      let entities: EntityMetadata[] = [];

      if (request.entityIds && request.entityIds.length > 0) {
        // Get specific entities by ID
        for (const entityId of request.entityIds) {
          try {
            const entity = await this.metadataAggregator.getEntityMetadata(entityId);
            entities.push(entity);
          } catch (error) {
            this.logger.warn(`Failed to get entity ${entityId}:`, error.message);
          }
        }
      } else if (request.variables.entityName) {
        // Find entity by name in project
        const entity = projectMetadata.entities.find(e =>
          e.name === request.variables.entityName || e.code === request.variables.entityName
        );
        if (entity) {
          this.logger.log(`Found entity: ${entity.name} with ${entity.fields.length} fields`);
          entities = [entity];
        } else {
          this.logger.warn(`Entity not found: ${request.variables.entityName}`);
        }
      } else {
        // Use all entities from project if none specified
        entities = projectMetadata.entities;
        this.logger.log(`Using all ${entities.length} entities from project`);
      }

      const generatedFiles: GeneratedFile[] = [];

      // Generate files for each template
      for (const template of templates) {
        if (entities.length > 0) {
          // Generate files for each entity
          for (const entity of entities) {
            const files = await this.generateFilesForEntity(template, entity, request, projectMetadata);
            generatedFiles.push(...files);
          }
        } else {
          // Generate project-level files
          const files = await this.generateProjectFiles(template, request, projectMetadata);
          generatedFiles.push(...files);
        }
      }

      this.logger.log(`Generated ${generatedFiles.length} files`);
      return generatedFiles;

    } catch (error) {
      this.logger.error('Code generation failed:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Code generation failed: ${error.message}`);
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
    request: GenerationRequest,
    projectMetadata: ProjectMetadata
  ): Promise<GeneratedFile[]> {
    this.logger.log(`Generating files for entity: ${entity.name} with ${entity.fields.length} fields`);

    try {
      // Build enhanced template context
      const context = this.buildTemplateContext(entity, request);
      this.logger.log(`Template context built with ${context.fields ? context.fields.length : 0} fields`);

      // Add project metadata to context
      context.project = projectMetadata.project;
      context.allEntities = projectMetadata.entities;
      context.allRelationships = projectMetadata.relationships;

      // Render template using enhanced engine
      const generatedContent = await this.renderTemplate(template, context);

      const filename = this.generateFilename(template, entity, request.options.architecture);
      const filePath = this.generateFilePath(template, entity, request);

      this.logger.log(`Generated file: ${filePath} (${generatedContent.length} bytes)`);

      return [{
        filename,
        path: filePath,
        content: generatedContent,
        language: template.language,
        size: generatedContent.length,
      }];
    } catch (error) {
      this.logger.error(`Failed to generate files for entity ${entity.name}:`, error);
      throw new BadRequestException(`File generation failed for entity ${entity.name}: ${error.message}`);
    }
  }

  private async generateProjectFiles(
    template: TemplateMetadata,
    request: GenerationRequest,
    projectMetadata: ProjectMetadata
  ): Promise<GeneratedFile[]> {
    try {
      // Build project context with metadata
      const context = this.buildProjectContext(request);
      context.project = projectMetadata.project;
      context.allEntities = projectMetadata.entities;
      context.allRelationships = projectMetadata.relationships;

      // Render template using enhanced engine
      const generatedContent = await this.renderTemplate(template, context);

      const filename = this.generateProjectFilename(template);
      const filePath = this.generateProjectFilePath(template, request);

      this.logger.log(`Generated project file: ${filePath} (${generatedContent.length} bytes)`);

      return [{
        filename,
        path: filePath,
        content: generatedContent,
        language: template.language,
        size: generatedContent.length,
      }];
    } catch (error) {
      this.logger.error(`Failed to generate project files:`, error);
      throw new BadRequestException(`Project file generation failed: ${error.message}`);
    }
  }

  private buildTemplateContext(entity: EntityMetadata, request: GenerationRequest): any {
    // Enhanced field processing with better type mapping
    const processedFields = entity.fields.map(field => ({
      ...field,
      // Ensure all type mappings are present
      tsType: field.tsType || this.mapFieldTypeToTypeScript(field.type),
      prismaType: field.prismaType || this.mapFieldTypeToPrisma(field.type, field.nullable),
      prismaAttributes: field.prismaAttributes || this.buildPrismaAttributes(field),
      columnOptions: this.buildColumnOptions(field),
      // Additional metadata for templates
      isSearchable: this.isSearchableField(field),
      isFilterable: this.isFilterableField(field),
      isSortable: this.isSortableField(field),
      validationRules: this.buildValidationRules(field),
      formComponent: this.getFormComponent(field),
      displayComponent: this.getDisplayComponent(field),
    }));

    // Categorize fields for easier template usage
    const fieldCategories = {
      primaryKeyField: processedFields.find(f => f.isPrimaryKey),
      systemFields: processedFields.filter(f => this.isSystemField(f.code)),
      businessFields: processedFields.filter(f => !this.isSystemField(f.code)),
      requiredFields: processedFields.filter(f => !f.nullable && !f.isPrimaryKey),
      optionalFields: processedFields.filter(f => f.nullable),
      uniqueFields: processedFields.filter(f => f.isUnique && !f.isPrimaryKey),
      searchableFields: processedFields.filter(f => this.isSearchableField(f)),
      filterableFields: processedFields.filter(f => this.isFilterableField(f)),
      sortableFields: processedFields.filter(f => this.isSortableField(f)),
      dateFields: processedFields.filter(f => ['DATE', 'DATETIME', 'TIMESTAMP'].includes(f.type)),
      enumFields: processedFields.filter(f => f.type === 'ENUM'),
      relationFields: processedFields.filter(f => f.code.endsWith('Id') && !this.isSystemField(f.code)),
    };

    // Build comprehensive context
    const context = {
      // Entity information
      entity,
      entityName: request.variables.entityName || entity.name,
      entityCode: entity.code,
      tableName: request.variables.tableName || entity.tableName,

      // All fields with enhanced metadata
      fields: processedFields,

      // Field categories for easy template access
      ...fieldCategories,

      // Relationships
      relationships: entity.relationships,
      hasRelationships: entity.relationships.outgoing.length > 0 || entity.relationships.incoming.length > 0,

      // Generation options
      options: request.options,

      // Metadata for template logic
      hasSearchableFields: fieldCategories.searchableFields.length > 0,
      hasFilterableFields: fieldCategories.filterableFields.length > 0,
      hasDateFields: fieldCategories.dateFields.length > 0,
      hasEnumFields: fieldCategories.enumFields.length > 0,
      hasUniqueFields: fieldCategories.uniqueFields.length > 0,

      // Utility data
      timestamp: new Date().toISOString(),
      generatedBy: 'IntelligentCodeGeneratorService',

      // Merge all request variables
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

  private generateProjectFilePath(template: TemplateMetadata, _request: GenerationRequest): string {
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
      return str.replace(/(?:^|[-_])(\w)/g, (_match, c, index) =>
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

    this.handlebars.registerHelper('formatDate', (date: Date, _format: string = 'YYYY-MM-DD') => {
      // 简单的日期格式化
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    });
  }

  // Enhanced field analysis methods
  private isSearchableField(field: FieldMetadata): boolean {
    const searchableTypes = ['STRING', 'TEXT', 'UUID'];
    return searchableTypes.includes(field.type) && !this.isSystemField(field.code);
  }

  private isFilterableField(field: FieldMetadata): boolean {
    const filterableTypes = ['STRING', 'TEXT', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'UUID'];
    return filterableTypes.includes(field.type);
  }

  private isSortableField(field: FieldMetadata): boolean {
    const sortableTypes = ['STRING', 'TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'DATE', 'DATETIME', 'TIMESTAMP'];
    return sortableTypes.includes(field.type);
  }

  private buildValidationRules(field: FieldMetadata): any[] {
    const rules: any[] = [];

    if (!field.nullable && !field.isPrimaryKey) {
      rules.push({ type: 'required', message: `${field.name} is required` });
    }

    if (field.type === 'STRING' && field.length) {
      rules.push({ type: 'maxLength', value: field.length, message: `Maximum length is ${field.length}` });
    }

    if (field.code.toLowerCase().includes('email')) {
      rules.push({ type: 'email', message: 'Invalid email format' });
    }

    if (field.isUnique) {
      rules.push({ type: 'unique', message: `${field.name} must be unique` });
    }

    return rules;
  }

  private getFormComponent(field: FieldMetadata): string {
    if (field.code.toLowerCase().includes('password')) return 'input-password';
    if (field.code.toLowerCase().includes('email')) return 'input-email';
    if (field.type === 'TEXT') return 'textarea';
    if (field.type === 'BOOLEAN') return 'switch';
    if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type)) return 'input-datetime';
    if (field.type === 'INTEGER' || field.type === 'BIGINT' || field.type === 'DECIMAL') return 'input-number';
    if (field.type === 'JSON') return 'json-editor';
    return 'input-text';
  }

  private getDisplayComponent(field: FieldMetadata): string {
    if (field.type === 'BOOLEAN') return 'status';
    if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type)) return 'datetime';
    if (field.type === 'JSON') return 'json';
    if (field.code.toLowerCase().includes('avatar') || field.code.toLowerCase().includes('image')) return 'image';
    return 'text';
  }

  // Enhanced template rendering using TemplateEngineService
  private async renderTemplate(template: TemplateMetadata, context: any): Promise<string> {
    try {
      // Use the enhanced template engine if available
      if (this.templateEngine) {
        return this.templateEngine.compileTemplateFromString(template.content, context);
      }

      // Fallback to handlebars
      const compiledTemplate = this.handlebars.compile(template.content);
      return compiledTemplate(context);
    } catch (error) {
      this.logger.error(`Template rendering failed for ${template.name}:`, error);
      throw new BadRequestException(`Template rendering failed: ${error.message}`);
    }
  }

  // Method to validate template variables
  public async validateTemplateVariables(templateId: string, variables: Record<string, any>): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const template = await this.getTemplates([templateId]);
      if (template.length === 0) {
        return { isValid: false, errors: ['Template not found'] };
      }

      const templateMeta = template[0];
      const errors: string[] = [];

      // Check required variables
      for (const variable of templateMeta.variables) {
        if (variable.required && !(variable.name in variables)) {
          errors.push(`Required variable missing: ${variable.name}`);
        }
      }

      // Check variable types
      for (const [name, value] of Object.entries(variables)) {
        const variableDef = templateMeta.variables.find(v => v.name === name);
        if (variableDef && !this.validateVariableType(value, variableDef.type)) {
          errors.push(`Invalid type for variable ${name}: expected ${variableDef.type}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
      };
    }
  }

  private validateVariableType(value: any, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true; // Unknown types are considered valid
    }
  }
}
