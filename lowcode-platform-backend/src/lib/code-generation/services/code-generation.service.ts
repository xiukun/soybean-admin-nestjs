import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { PrismaService } from '@prisma/prisma.service';
import { CodeTemplate, TemplateContext, TemplateGenerator } from '../interfaces/code-template.interface';
import { GitIntegrationService, GitCommitResult } from './git-integration.service';

export interface CodeGenerationOptions {
  targetProject: string;
  outputPath: string;
  overwrite?: boolean;
  createDirectories?: boolean;
  format?: boolean;
  dryRun?: boolean;
  git?: {
    enabled: boolean;
    autoCommit?: boolean;
    createBranch?: boolean;
    branchName?: string;
    commitMessage?: string;
    author?: {
      name: string;
      email: string;
    };
    push?: boolean;
  };
}

export interface GenerationResult {
  success: boolean;
  generatedFiles: string[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalFiles: number;
    totalLines: number;
    generationTime: number;
    timestamp: Date;
  };
  git?: {
    enabled: boolean;
    committed: boolean;
    commitResult?: GitCommitResult;
  };
}

export interface EntityDefinition {
  id: string;
  code: string;
  name: string;
  tableName: string;
  description?: string;
  fields: FieldDefinition[];
  relationships?: RelationshipDefinition[];
  indexes?: IndexDefinition[];
  uniqueConstraints?: UniqueConstraintDefinition[];
}

export interface FieldDefinition {
  id: string;
  code: string;
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  comment?: string;
  validation?: any;
}

export interface RelationshipDefinition {
  id: string;
  type: string;
  sourceField: string;
  targetEntity: string;
  targetField: string;
}

export interface IndexDefinition {
  name: string;
  fields: string[];
  unique?: boolean;
}

export interface UniqueConstraintDefinition {
  name: string;
  fields: string[];
}

@Injectable()
export class CodeGenerationService {
  private readonly logger = new Logger(CodeGenerationService.name);
  private handlebars: typeof Handlebars;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly gitIntegrationService: GitIntegrationService,
  ) {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Generate code for entities
   */
  async generateCode(
    entities: EntityDefinition[],
    options: CodeGenerationOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: false,
      generatedFiles: [],
      errors: [],
      warnings: [],
      metadata: {
        totalFiles: 0,
        totalLines: 0,
        generationTime: 0,
        timestamp: new Date(),
      },
    };

    try {
      this.logger.log(`Starting code generation for ${entities.length} entities`);

      // Emit generation start event
      this.eventEmitter.emit('code-generation.started', {
        entities: entities.map(e => ({ id: e.id, code: e.code })),
        options,
        timestamp: new Date(),
      });

      // Generate code for each entity
      for (const entity of entities) {
        try {
          const entityResult = await this.generateEntityCode(entity, options);
          result.generatedFiles.push(...entityResult.generatedFiles);
          result.warnings.push(...entityResult.warnings);
          result.metadata.totalFiles += entityResult.metadata.totalFiles;
          result.metadata.totalLines += entityResult.metadata.totalLines;
        } catch (error) {
          const errorMessage = `Failed to generate code for entity ${entity.code}: ${error.message}`;
          result.errors.push(errorMessage);
          this.logger.error(errorMessage, error.stack);
        }
      }

      // Update Prisma schema if needed
      if (entities.length > 0) {
        try {
          await this.updatePrismaSchema(entities, options);
          result.generatedFiles.push('prisma/schema.prisma');
        } catch (error) {
          result.warnings.push(`Failed to update Prisma schema: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      result.metadata.generationTime = Date.now() - startTime;

      // Handle Git integration if enabled and generation was successful
      if (options.git?.enabled && result.success && !options.dryRun) {
        try {
          const gitResult = await this.handleGitIntegration(entities, result, options);
          result.git = gitResult;
        } catch (error) {
          result.warnings.push(`Git integration failed: ${error.message}`);
          result.git = {
            enabled: true,
            committed: false,
          };
        }
      }

      // Emit generation complete event
      this.eventEmitter.emit('code-generation.completed', {
        result,
        timestamp: new Date(),
      });

      this.logger.log(`Code generation completed in ${result.metadata.generationTime}ms`);
      return result;

    } catch (error) {
      result.errors.push(`Code generation failed: ${error.message}`);
      result.metadata.generationTime = Date.now() - startTime;
      
      this.eventEmitter.emit('code-generation.failed', {
        error: error.message,
        result,
        timestamp: new Date(),
      });

      this.logger.error('Code generation failed:', error);
      return result;
    }
  }

  /**
   * Generate code for a single entity
   */
  private async generateEntityCode(
    entity: EntityDefinition,
    options: CodeGenerationOptions
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      generatedFiles: [],
      errors: [],
      warnings: [],
      metadata: {
        totalFiles: 0,
        totalLines: 0,
        generationTime: 0,
        timestamp: new Date(),
      },
    };

    const templates = [
      'entity-base-controller.hbs',
      'entity-base-service.hbs',
      'entity-controller.hbs',
      'entity-module.hbs',
      'amis-page.hbs',
    ];

    for (const templateName of templates) {
      try {
        const generatedFile = await this.generateFromTemplate(
          templateName,
          entity,
          options
        );
        
        if (generatedFile) {
          result.generatedFiles.push(generatedFile.path);
          result.metadata.totalFiles++;
          result.metadata.totalLines += generatedFile.content.split('\n').length;
        }
      } catch (error) {
        result.errors.push(`Failed to generate ${templateName} for ${entity.code}: ${error.message}`);
      }
    }

    // Generate DTO separately
    try {
      const dtoFile = await this.generateDto(entity, options);
      if (dtoFile) {
        result.generatedFiles.push(dtoFile.path);
        result.metadata.totalFiles++;
        result.metadata.totalLines += dtoFile.content.split('\n').length;
      }
    } catch (error) {
      result.errors.push(`Failed to generate DTO for ${entity.code}: ${error.message}`);
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Generate code from template
   */
  private async generateFromTemplate(
    templateName: string,
    entity: EntityDefinition,
    options: CodeGenerationOptions
  ): Promise<CodeTemplate | null> {
    const templatePath = path.join(
      __dirname,
      '../../../resources/templates',
      templateName
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    // Get or compile template
    let template = this.templateCache.get(templateName);
    if (!template) {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      template = this.handlebars.compile(templateContent);
      this.templateCache.set(templateName, template);
    }

    // Prepare template data
    const templateData = this.prepareTemplateData(entity);

    // Generate content
    const content = template(templateData);

    // Determine output path
    const outputPath = this.getOutputPath(templateName, entity, options);

    // Write file if not dry run
    if (!options.dryRun) {
      await this.writeFile(outputPath, content, options);
    }

    return {
      path: outputPath,
      content,
      type: 'typescript',
      overwrite: options.overwrite,
      metadata: {
        templateName,
        generatedAt: new Date(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Generate DTO file
   */
  private async generateDto(
    entity: EntityDefinition,
    options: CodeGenerationOptions
  ): Promise<CodeTemplate | null> {
    const content = this.generateDtoContent(entity);
    const outputPath = path.join(
      options.outputPath,
      'src/base/dto',
      `${this.kebabCase(entity.code)}.dto.ts`
    );

    if (!options.dryRun) {
      await this.writeFile(outputPath, content, options);
    }

    return {
      path: outputPath,
      content,
      type: 'typescript',
      overwrite: options.overwrite,
    };
  }

  /**
   * Update Prisma schema
   */
  private async updatePrismaSchema(
    entities: EntityDefinition[],
    options: CodeGenerationOptions
  ): Promise<void> {
    const schemaPath = path.join(options.outputPath, 'prisma/schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      this.logger.warn(`Prisma schema not found at ${schemaPath}`);
      return;
    }

    let existingSchema = fs.readFileSync(schemaPath, 'utf-8');

    for (const entity of entities) {
      const modelContent = this.generatePrismaModel(entity);
      const modelRegex = new RegExp(`model\\s+${entity.code}\\s*{[^}]*}`, 'gs');
      
      if (modelRegex.test(existingSchema)) {
        // Replace existing model
        existingSchema = existingSchema.replace(modelRegex, modelContent.trim());
        this.logger.log(`Updated existing Prisma model: ${entity.code}`);
      } else {
        // Add new model
        existingSchema = existingSchema.trim() + '\n\n' + modelContent.trim() + '\n';
        this.logger.log(`Added new Prisma model: ${entity.code}`);
      }
    }

    if (!options.dryRun) {
      fs.writeFileSync(schemaPath, existingSchema, 'utf-8');
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // String transformation helpers
    this.handlebars.registerHelper('camelCase', (str) => {
      if (!str) return '';
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('pascalCase', (str) => {
      if (!str) return '';
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('kebabCase', (str) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
    });

    // Type mapping helpers
    this.handlebars.registerHelper('typescriptType', (type) => {
      const typeMap = {
        'STRING': 'string', 'TEXT': 'string', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'boolean', 'DATE': 'Date',
        'DATETIME': 'Date', 'TIME': 'Date', 'UUID': 'string', 'JSON': 'any'
      };
      return typeMap[type] || 'any';
    });

    this.handlebars.registerHelper('prismaType', (type) => {
      const typeMap = {
        'STRING': 'String', 'TEXT': 'String', 'INTEGER': 'Int',
        'DECIMAL': 'Float', 'BOOLEAN': 'Boolean', 'DATE': 'DateTime',
        'DATETIME': 'DateTime', 'TIME': 'DateTime', 'UUID': 'String', 'JSON': 'Json'
      };
      return typeMap[type] || 'String';
    });

    this.handlebars.registerHelper('amisFormType', (type) => {
      const typeMap = {
        'STRING': 'text', 'TEXT': 'textarea', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'switch', 'DATE': 'date',
        'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    this.handlebars.registerHelper('amisColumnType', (type) => {
      const typeMap = {
        'STRING': 'text', 'TEXT': 'text', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'status', 'DATE': 'date',
        'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('ne', (a, b) => a !== b);
    this.handlebars.registerHelper('or', (a, b) => a || b);
    this.handlebars.registerHelper('and', (a, b) => a && b);
    this.handlebars.registerHelper('json', (obj) => JSON.stringify(obj));

    // Default value formatting helper
    this.handlebars.registerHelper('formatDefaultValue', (value, type) => {
      if (value === null || value === undefined) return 'null';
      switch (type) {
        case 'STRING': case 'TEXT': case 'UUID': return `"${value}"`;
        case 'BOOLEAN': return value ? 'true' : 'false';
        case 'INTEGER': case 'DECIMAL': return value.toString();
        case 'DATE': case 'DATETIME': case 'TIMESTAMP': return `"${value}"`;
        case 'JSON': return JSON.stringify(value);
        default: return `"${value}"`;
      }
    });
  }

  /**
   * Prepare template data for rendering
   */
  private prepareTemplateData(entity: EntityDefinition): any {
    return {
      entity: {
        ...entity,
        fields: entity.fields.map(field => ({
          ...field,
          typescriptType: this.getTypescriptType(field.type),
          prismaType: this.getPrismaType(field.type),
          amisFormType: this.getAmisFormType(field.type),
          amisColumnType: this.getAmisColumnType(field.type)
        }))
      },
      fields: entity.fields,
      relationships: entity.relationships || [],
      indexes: entity.indexes || [],
      uniqueConstraints: entity.uniqueConstraints || [],
      entities: [entity]
    };
  }

  /**
   * Get output path for generated file
   */
  private getOutputPath(
    templateName: string,
    entity: EntityDefinition,
    options: CodeGenerationOptions
  ): string {
    const entityCode = this.kebabCase(entity.code);
    const basePath = options.outputPath;

    switch (templateName) {
      case 'entity-base-controller.hbs':
        return path.join(basePath, 'src/base/controllers', `${entityCode}.base.controller.ts`);
      case 'entity-base-service.hbs':
        return path.join(basePath, 'src/base/services', `${entityCode}.base.service.ts`);
      case 'entity-controller.hbs':
        return path.join(basePath, 'src/biz/controllers', `${entityCode}.controller.ts`);
      case 'entity-module.hbs':
        return path.join(basePath, 'src/biz/modules', `${entityCode}.module.ts`);
      case 'amis-page.hbs':
        return path.join(basePath, 'src/config/pages', `${entityCode}-page.json`);
      default:
        return path.join(basePath, 'generated', `${entityCode}.${templateName.replace('.hbs', '')}`);
    }
  }

  /**
   * Write file to disk
   */
  private async writeFile(
    filePath: string,
    content: string,
    options: CodeGenerationOptions
  ): Promise<void> {
    if (options.createDirectories !== false) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Check if file exists and overwrite is disabled
    if (fs.existsSync(filePath) && !options.overwrite) {
      throw new Error(`File already exists and overwrite is disabled: ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    this.logger.debug(`Generated file: ${filePath}`);
  }

  /**
   * Generate DTO content
   */
  private generateDtoContent(entity: EntityDefinition): string {
    const fields = entity.fields.filter(f => f.code !== 'id');

    return `import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

/**
 * 创建${entity.name}DTO
 */
export class Create${entity.code}Dto {
${fields.map(field => {
  const isOptional = field.nullable;
  const decorator = isOptional ? '@ApiPropertyOptional' : '@ApiProperty';
  const validation = this.getValidationDecorator(field);

  return `  ${decorator}({ description: '${field.comment || field.name}' })
  ${validation}
  ${isOptional ? '@IsOptional()' : ''}
  ${field.code}${isOptional ? '?' : ''}: ${this.getTypescriptType(field.type)};`;
}).join('\n\n')}
}

/**
 * 更新${entity.name}DTO
 */
export class Update${entity.code}Dto extends PartialType(Create${entity.code}Dto) {}

/**
 * ${entity.name}查询DTO
 */
export class ${entity.code}QueryDto {
  @ApiPropertyOptional({ description: '当前页码', example: 1 })
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional({ description: '每页大小', example: 10 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: '排序字段', example: 'createdAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}
`;
  }

  /**
   * Generate Prisma model content
   */
  private generatePrismaModel(entity: EntityDefinition): string {
    const fields = entity.fields.map(field => {
      const prismaType = this.getPrismaType(field.type);
      const nullable = field.nullable ? '?' : '';
      const defaultValue = field.defaultValue ? ` @default(${this.formatPrismaDefault(field.defaultValue, field.type)})` : '';
      const comment = field.comment ? ` // ${field.comment}` : '';

      return `  ${field.code} ${prismaType}${nullable}${defaultValue}${comment}`;
    }).join('\n');

    const indexes = entity.indexes?.map(index => {
      const unique = index.unique ? ', unique: true' : '';
      return `  @@index([${index.fields.map(f => `"${f}"`).join(', ')}], name: "${index.name}"${unique})`;
    }).join('\n') || '';

    const uniqueConstraints = entity.uniqueConstraints?.map(constraint => {
      return `  @@unique([${constraint.fields.map(f => `"${f}"`).join(', ')}], name: "${constraint.name}")`;
    }).join('\n') || '';

    return `model ${entity.code} {
${fields}

${indexes}
${uniqueConstraints}

  @@map("${entity.tableName}")
}`;
  }

  // Helper methods
  private kebabCase(str: string): string {
    if (!str) return '';
    return str.replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  private getTypescriptType(fieldType: string): string {
    const typeMap = {
      'STRING': 'string', 'TEXT': 'string', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'boolean', 'DATE': 'Date',
      'DATETIME': 'Date', 'TIME': 'Date', 'UUID': 'string', 'JSON': 'any'
    };
    return typeMap[fieldType] || 'any';
  }

  private getPrismaType(fieldType: string): string {
    const typeMap = {
      'STRING': 'String', 'TEXT': 'String', 'INTEGER': 'Int',
      'DECIMAL': 'Float', 'BOOLEAN': 'Boolean', 'DATE': 'DateTime',
      'DATETIME': 'DateTime', 'TIME': 'DateTime', 'UUID': 'String', 'JSON': 'Json'
    };
    return typeMap[fieldType] || 'String';
  }

  private getAmisFormType(fieldType: string): string {
    const typeMap = {
      'STRING': 'text', 'TEXT': 'textarea', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'switch', 'DATE': 'date',
      'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  private getAmisColumnType(fieldType: string): string {
    const typeMap = {
      'STRING': 'text', 'TEXT': 'text', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'status', 'DATE': 'date',
      'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  private getValidationDecorator(field: FieldDefinition): string {
    switch (field.type) {
      case 'STRING':
      case 'TEXT':
        if (field.code === 'email') return '@IsEmail()';
        return '@IsString()';
      case 'INTEGER':
      case 'DECIMAL':
        return '@IsNumber()';
      case 'BOOLEAN':
        return '@IsBoolean()';
      case 'DATE':
      case 'DATETIME':
        return '@IsDateString()';
      default:
        return '@IsString()';
    }
  }

  private formatPrismaDefault(value: any, type: string): string {
    if (value === null || value === undefined) return 'null';
    switch (type) {
      case 'STRING': case 'TEXT': case 'UUID': return `"${value}"`;
      case 'BOOLEAN': return value ? 'true' : 'false';
      case 'INTEGER': case 'DECIMAL': return value.toString();
      case 'DATE': case 'DATETIME': case 'TIMESTAMP': return `"${value}"`;
      case 'JSON': return JSON.stringify(value);
      default: return `"${value}"`;
    }
  }

  /**
   * Clear template cache
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Handle Git integration for generated code
   */
  private async handleGitIntegration(
    entities: EntityDefinition[],
    result: GenerationResult,
    options: CodeGenerationOptions
  ): Promise<{ enabled: boolean; committed: boolean; commitResult?: GitCommitResult }> {
    const gitOptions = options.git!;

    // Check if Git is available
    const isGitAvailable = await this.gitIntegrationService.isGitAvailable();
    if (!isGitAvailable) {
      throw new Error('Git is not available on this system');
    }

    // Check if target directory is a Git repository
    const isRepo = await this.gitIntegrationService.isGitRepository(options.outputPath);
    if (!isRepo) {
      this.logger.warn(`Target directory is not a Git repository: ${options.outputPath}`);
      // Optionally initialize repository
      // await this.gitIntegrationService.initRepository(options.outputPath);
    }

    if (gitOptions.autoCommit) {
      const entityNames = entities.map(e => e.name);

      const commitResult = await this.gitIntegrationService.commitGeneratedCode(
        options.outputPath,
        entityNames,
        result.generatedFiles,
        {
          author: gitOptions.author,
          createBranch: gitOptions.createBranch,
          branchName: gitOptions.branchName,
          push: gitOptions.push,
        }
      );

      return {
        enabled: true,
        committed: commitResult.success,
        commitResult,
      };
    }

    return {
      enabled: true,
      committed: false,
    };
  }

  /**
   * Get generation statistics
   */
  async getStatistics(): Promise<any> {
    // This could be enhanced to track generation history
    return {
      templatesCached: this.templateCache.size,
      // Add more statistics as needed
    };
  }
}
