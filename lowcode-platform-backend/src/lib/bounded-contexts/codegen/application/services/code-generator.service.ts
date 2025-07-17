import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { Entity } from '../../../entity/domain/entity.model';
import { Field } from '../../../entity/domain/field.model';
import { Api } from '../../../api/domain/api.model';
import { CodeTemplate } from '../../domain/code-template.model';
import { CodegenTask, CodegenTaskType, CodegenTaskStatus } from '../../domain/codegen-task.model';

export interface CodeGenerationConfig {
  outputPath: string;
  templates: string[];
  entityIds?: string[];
  apiIds?: string[];
  projectId: string;
  generateBase?: boolean;
  generateBiz?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'base' | 'biz';
}

@Injectable()
export class CodeGeneratorService {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: any,
    @Inject('ApiRepository')
    private readonly apiRepository: any,
    @Inject('CodeTemplateRepository')
    private readonly templateRepository: any,
    @Inject('CodegenTaskRepository')
    private readonly taskRepository: any,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.registerHandlebarsHelpers();
  }

  async generateCode(task: CodegenTask): Promise<GeneratedFile[]> {
    try {
      await this.updateTaskStatus(task, CodegenTaskStatus.RUNNING, 0);

      const config = task.config as CodeGenerationConfig;
      const generatedFiles: GeneratedFile[] = [];

      switch (task.type) {
        case CodegenTaskType.ENTITY:
          const entityFiles = await this.generateEntityCode(config);
          generatedFiles.push(...entityFiles);
          break;
        
        case CodegenTaskType.API:
          const apiFiles = await this.generateApiCode(config);
          generatedFiles.push(...apiFiles);
          break;
        
        case CodegenTaskType.FULL_PROJECT:
          const projectFiles = await this.generateFullProjectCode(config);
          generatedFiles.push(...projectFiles);
          break;
      }

      await this.updateTaskStatus(task, CodegenTaskStatus.RUNNING, 80);

      // 写入文件
      await this.writeGeneratedFiles(generatedFiles, config.outputPath);

      await this.updateTaskStatus(task, CodegenTaskStatus.RUNNING, 100);

      // 完成任务
      await this.completeTask(task, {
        filesGenerated: generatedFiles.length,
        outputPath: config.outputPath,
        files: generatedFiles.map(f => ({ path: f.path, type: f.type })),
      });

      return generatedFiles;
    } catch (error) {
      await this.failTask(task, error.message);
      throw error;
    }
  }

  private async generateEntityCode(config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    if (!config.entityIds || config.entityIds.length === 0) {
      throw new Error('Entity IDs are required for entity code generation');
    }

    for (const entityId of config.entityIds) {
      const entityWithFields = await this.entityRepository.findEntityWithFields(entityId);
      if (!entityWithFields) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }

      const { entity, fields } = entityWithFields;
      
      // 生成基础代码
      if (config.generateBase !== false) {
        const baseFiles = await this.generateEntityBaseCode(entity, fields, config);
        files.push(...baseFiles);
      }

      // 生成业务扩展代码
      if (config.generateBiz === true) {
        const bizFiles = await this.generateEntityBizCode(entity, fields, config);
        files.push(...bizFiles);
      }
    }

    return files;
  }

  private async generateEntityBaseCode(entity: Entity, fields: Field[], config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const templates = await this.getTemplatesByType(['ENTITY_MODEL', 'ENTITY_DTO', 'ENTITY_SERVICE', 'ENTITY_CONTROLLER', 'ENTITY_REPOSITORY']);

    const templateData = {
      entity: {
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        description: entity.description,
        className: this.toPascalCase(entity.code),
        variableName: this.toCamelCase(entity.code),
      },
      fields: fields.map(field => ({
        name: field.name,
        code: field.code,
        type: field.type,
        nullable: field.nullable,
        primaryKey: field.primaryKey,
        propertyName: this.toCamelCase(field.code),
        typescriptType: this.mapFieldTypeToTypescript(field.type),
      })),
      timestamp: new Date().toISOString(),
    };

    for (const template of templates) {
      const content = this.renderTemplate(template.template, templateData);
      const fileName = this.generateFileName(template, entity);
      const filePath = path.join('base', entity.code, fileName);
      
      files.push({
        path: filePath,
        content,
        type: 'base',
      });
    }

    return files;
  }

  private async generateEntityBizCode(entity: Entity, fields: Field[], config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // 生成业务扩展模板
    const bizServiceTemplate = `import { Injectable } from '@nestjs/common';
import { ${this.toPascalCase(entity.code)}BaseService } from '../base/${entity.code}.base.service';

@Injectable()
export class ${this.toPascalCase(entity.code)}Service extends ${this.toPascalCase(entity.code)}BaseService {
  // 在这里添加业务逻辑扩展
  
  // 示例：自定义查询方法
  async findByCustomCriteria(criteria: any) {
    // 实现自定义查询逻辑
    return this.findAll(); // 调用基础服务方法
  }
}`;

    const bizControllerTemplate = `import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${this.toPascalCase(entity.code)}BaseController } from '../base/${entity.code}.base.controller';
import { ${this.toPascalCase(entity.code)}Service } from './${entity.code}.service';

@ApiTags('${entity.code}')
@Controller('${entity.code}')
export class ${this.toPascalCase(entity.code)}Controller extends ${this.toPascalCase(entity.code)}BaseController {
  constructor(
    protected readonly ${this.toCamelCase(entity.code)}Service: ${this.toPascalCase(entity.code)}Service,
  ) {
    super(${this.toCamelCase(entity.code)}Service);
  }

  // 在这里添加自定义API端点
}`;

    files.push(
      {
        path: path.join('biz', entity.code, `${entity.code}.service.ts`),
        content: bizServiceTemplate,
        type: 'biz',
      },
      {
        path: path.join('biz', entity.code, `${entity.code}.controller.ts`),
        content: bizControllerTemplate,
        type: 'biz',
      }
    );

    return files;
  }

  private async generateApiCode(config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    if (!config.apiIds || config.apiIds.length === 0) {
      throw new Error('API IDs are required for API code generation');
    }

    for (const apiId of config.apiIds) {
      const api = await this.apiRepository.findById(apiId);
      if (!api) {
        throw new Error(`API with ID ${apiId} not found`);
      }

      const apiFiles = await this.generateSingleApiCode(api, config);
      files.push(...apiFiles);
    }

    return files;
  }

  private async generateSingleApiCode(api: Api, config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const templates = await this.getTemplatesByType(['API_CONTROLLER', 'API_SERVICE']);

    const templateData = {
      api: {
        name: api.name,
        code: api.code,
        path: api.path,
        method: api.method,
        description: api.description,
        className: this.toPascalCase(api.code),
        methodName: this.toCamelCase(api.code),
      },
      requestConfig: api.requestConfig,
      responseConfig: api.responseConfig,
      queryConfig: api.queryConfig,
      timestamp: new Date().toISOString(),
    };

    for (const template of templates) {
      const content = this.renderTemplate(template.template, templateData);
      const fileName = this.generateApiFileName(template, api);
      const filePath = path.join('base', 'apis', fileName);
      
      files.push({
        path: filePath,
        content,
        type: 'base',
      });
    }

    return files;
  }

  private async generateFullProjectCode(config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // 获取项目所有实体
    const entities = await this.entityRepository.findByProjectId(config.projectId);
    
    // 获取项目所有API
    const apis = await this.apiRepository.findByProjectId(config.projectId);

    // 生成实体代码
    for (const entity of entities) {
      const entityWithFields = await this.entityRepository.findEntityWithFields(entity.id);
      if (entityWithFields) {
        const entityFiles = await this.generateEntityBaseCode(entityWithFields.entity, entityWithFields.fields, config);
        files.push(...entityFiles);
        
        if (config.generateBiz === true) {
          const bizFiles = await this.generateEntityBizCode(entityWithFields.entity, entityWithFields.fields, config);
          files.push(...bizFiles);
        }
      }
    }

    // 生成API代码
    for (const api of apis) {
      const apiFiles = await this.generateSingleApiCode(api, config);
      files.push(...apiFiles);
    }

    // 生成模块文件
    const moduleFiles = await this.generateModuleFiles(entities, apis, config);
    files.push(...moduleFiles);

    return files;
  }

  private async generateModuleFiles(entities: Entity[], apis: Api[], config: CodeGenerationConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // 生成主模块文件
    const moduleTemplate = `import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
{{#each entities}}
import { {{pascalCase code}}Module } from './{{code}}/{{code}}.module';
{{/each}}

@Module({
  imports: [
    CqrsModule,
{{#each entities}}
    {{pascalCase code}}Module,
{{/each}}
  ],
  exports: [
{{#each entities}}
    {{pascalCase code}}Module,
{{/each}}
  ],
})
export class BusinessSystemModule {}`;

    const templateData = {
      entities: entities.map(entity => ({
        code: entity.code,
        name: entity.name,
        pascalCase: this.toPascalCase(entity.code),
      })),
      apis: apis.map(api => ({
        code: api.code,
        name: api.name,
        pascalCase: this.toPascalCase(api.code),
      })),
    };

    const content = this.renderTemplate(moduleTemplate, templateData);
    files.push({
      path: 'base/business-system.module.ts',
      content,
      type: 'base',
    });

    return files;
  }

  private async getTemplatesByType(types: string[]): Promise<CodeTemplate[]> {
    const templates: CodeTemplate[] = [];
    for (const type of types) {
      const template = await this.templateRepository.findByType(type);
      if (template) {
        templates.push(template);
      }
    }
    return templates;
  }

  private renderTemplate(template: string, data: any): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  }

  private generateFileName(template: CodeTemplate, entity: Entity): string {
    const extension = template.language === 'TYPESCRIPT' ? '.ts' : '.js';
    
    switch (template.type) {
      case 'ENTITY_MODEL':
        return `${entity.code}.model${extension}`;
      case 'ENTITY_DTO':
        return `${entity.code}.dto${extension}`;
      case 'ENTITY_SERVICE':
        return `${entity.code}.base.service${extension}`;
      case 'ENTITY_CONTROLLER':
        return `${entity.code}.base.controller${extension}`;
      case 'ENTITY_REPOSITORY':
        return `${entity.code}.repository${extension}`;
      default:
        return `${entity.code}.${template.type.toLowerCase()}${extension}`;
    }
  }

  private generateApiFileName(template: CodeTemplate, api: Api): string {
    const extension = template.language === 'TYPESCRIPT' ? '.ts' : '.js';
    
    switch (template.type) {
      case 'API_CONTROLLER':
        return `${api.code}.controller${extension}`;
      case 'API_SERVICE':
        return `${api.code}.service${extension}`;
      default:
        return `${api.code}.${template.type.toLowerCase()}${extension}`;
    }
  }

  private async writeGeneratedFiles(files: GeneratedFile[], outputPath: string): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(outputPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
    }
  }

  private async updateTaskStatus(task: CodegenTask, status: CodegenTaskStatus, progress: number): Promise<void> {
    task.update({ status, progress });
    await this.taskRepository.update(task);
    
    this.eventEmitter.emit('codegen.task.progress', {
      taskId: task.id,
      status,
      progress,
    });
  }

  private async completeTask(task: CodegenTask, result: any): Promise<void> {
    task.complete(result);
    await this.taskRepository.update(task);
    
    this.eventEmitter.emit('codegen.task.completed', {
      taskId: task.id,
      result,
    });
  }

  private async failTask(task: CodegenTask, errorMsg: string): Promise<void> {
    task.fail(errorMsg);
    await this.taskRepository.update(task);
    
    this.eventEmitter.emit('codegen.task.failed', {
      taskId: task.id,
      error: errorMsg,
    });
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper('pascalCase', (str: string) => this.toPascalCase(str));
    Handlebars.registerHelper('camelCase', (str: string) => this.toCamelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => this.toKebabCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => this.toSnakeCase(str));
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private mapFieldTypeToTypescript(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'Date',
      'DATETIME': 'Date',
      'TIME': 'string',
      'UUID': 'string',
      'JSON': 'any',
    };
    
    return typeMap[fieldType] || 'any';
  }
}
