import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';

export interface GenerationStrategy {
  name: string;
  description: string;
  framework: string;
  layers: string[];
  features: string[];
  fileStructure: FileStructureConfig;
  namingConventions: NamingConventions;
  dependencies: DependencyConfig[];
  templates: TemplateMapping[];
}

export interface FileStructureConfig {
  baseDir: string;
  directories: {
    entities: string;
    services: string;
    controllers: string;
    dtos: string;
    modules: string;
    tests: string;
    configs: string;
  };
  fileNaming: {
    pattern: string;
    casing: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase';
    extensions: Record<string, string>;
  };
}

export interface NamingConventions {
  entity: {
    className: string;
    fileName: string;
    tableName: string;
  };
  service: {
    className: string;
    fileName: string;
  };
  controller: {
    className: string;
    fileName: string;
    routePath: string;
  };
  dto: {
    createClassName: string;
    updateClassName: string;
    queryClassName: string;
    fileName: string;
  };
}

export interface DependencyConfig {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  framework: string;
  optional: boolean;
  description: string;
}

export interface TemplateMapping {
  templateId: string;
  outputPath: string;
  layer: 'base' | 'biz';
  priority: number;
  conditions?: string[];
}

export interface GenerationContext {
  strategy: GenerationStrategy;
  entities: any[];
  relations: any[];
  project: any;
  options: GenerationOptions;
}

export interface GenerationOptions {
  outputDir: string;
  overwriteBase: boolean;
  overwriteBiz: boolean;
  generateTests: boolean;
  generateDocs: boolean;
  optimizeImports: boolean;
  formatCode: boolean;
  validateCode: boolean;
}

export interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
  warnings: string[];
  metrics: GenerationMetrics;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'base' | 'biz' | 'test' | 'doc' | 'config';
  size: number;
  checksum: string;
  dependencies: string[];
}

export interface GenerationMetrics {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  generationTime: number;
  templateUsage: Record<string, number>;
  layerDistribution: Record<string, number>;
}

@Injectable()
export class GenerationStrategyService {
  private readonly logger = new Logger(GenerationStrategyService.name);
  private strategies: Map<string, GenerationStrategy> = new Map();

  constructor() {
    this.initializeBuiltinStrategies();
  }

  async generateCode(context: GenerationContext, user: AuthenticatedUser): Promise<GenerationResult> {
    this.logger.log(`Starting code generation with strategy: ${context.strategy.name}`);
    
    const startTime = Date.now();
    const result: GenerationResult = {
      success: false,
      files: [],
      errors: [],
      warnings: [],
      metrics: {
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0,
        generationTime: 0,
        templateUsage: {},
        layerDistribution: {}
      }
    };

    try {
      // 验证生成上下文
      await this.validateGenerationContext(context);

      // 预处理实体和关系
      const processedEntities = await this.preprocessEntities(context.entities, context.relations);

      // 生成文件
      for (const entity of processedEntities) {
        const entityFiles = await this.generateEntityFiles(entity, context);
        result.files.push(...entityFiles);
      }

      // 生成项目级文件
      const projectFiles = await this.generateProjectFiles(context);
      result.files.push(...projectFiles);

      // 优化生成的代码
      if (context.options.optimizeImports) {
        await this.optimizeImports(result.files);
      }

      if (context.options.formatCode) {
        await this.formatCode(result.files);
      }

      if (context.options.validateCode) {
        const validationErrors = await this.validateCode(result.files);
        result.errors.push(...validationErrors);
      }

      // 计算指标
      result.metrics = this.calculateMetrics(result.files, startTime);
      result.success = result.errors.length === 0;

      this.logger.log(`Code generation completed. Generated ${result.files.length} files in ${result.metrics.generationTime}ms`);
      return result;

    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`);
      result.errors.push(error.message);
      result.metrics.generationTime = Date.now() - startTime;
      return result;
    }
  }

  async getStrategy(name: string): Promise<GenerationStrategy> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw BusinessException.notFound('Generation strategy', name);
    }
    return strategy;
  }

  async getAllStrategies(): Promise<GenerationStrategy[]> {
    return Array.from(this.strategies.values());
  }

  async createStrategy(strategy: GenerationStrategy, user: AuthenticatedUser): Promise<void> {
    this.logger.log(`Creating generation strategy: ${strategy.name} by user: ${user.username}`);
    
    // 验证策略配置
    await this.validateStrategy(strategy);
    
    this.strategies.set(strategy.name, strategy);
  }

  async updateStrategy(name: string, updates: Partial<GenerationStrategy>, user: AuthenticatedUser): Promise<void> {
    this.logger.log(`Updating generation strategy: ${name} by user: ${user.username}`);
    
    const strategy = await this.getStrategy(name);
    const updatedStrategy = { ...strategy, ...updates };
    
    await this.validateStrategy(updatedStrategy);
    this.strategies.set(name, updatedStrategy);
  }

  async deleteStrategy(name: string, user: AuthenticatedUser): Promise<void> {
    this.logger.log(`Deleting generation strategy: ${name} by user: ${user.username}`);
    
    if (!this.strategies.has(name)) {
      throw BusinessException.notFound('Generation strategy', name);
    }
    
    this.strategies.delete(name);
  }

  private initializeBuiltinStrategies(): void {
    // NestJS 策略
    const nestjsStrategy: GenerationStrategy = {
      name: 'nestjs-standard',
      description: 'Standard NestJS application with TypeORM',
      framework: 'nestjs',
      layers: ['base', 'biz'],
      features: ['swagger', 'validation', 'testing', 'caching'],
      fileStructure: {
        baseDir: 'src',
        directories: {
          entities: 'entities',
          services: 'services',
          controllers: 'controllers',
          dtos: 'dto',
          modules: 'modules',
          tests: '__tests__',
          configs: 'config'
        },
        fileNaming: {
          pattern: '{name}.{type}.{ext}',
          casing: 'kebabCase',
          extensions: {
            entity: 'ts',
            service: 'ts',
            controller: 'ts',
            dto: 'ts',
            module: 'ts',
            test: 'spec.ts'
          }
        }
      },
      namingConventions: {
        entity: {
          className: '{EntityName}',
          fileName: '{entity-name}.entity',
          tableName: '{entity_names}'
        },
        service: {
          className: '{EntityName}Service',
          fileName: '{entity-name}.service'
        },
        controller: {
          className: '{EntityName}Controller',
          fileName: '{entity-name}.controller',
          routePath: '{entity-names}'
        },
        dto: {
          createClassName: 'Create{EntityName}Dto',
          updateClassName: 'Update{EntityName}Dto',
          queryClassName: 'Query{EntityName}Dto',
          fileName: '{entity-name}.dto'
        }
      },
      dependencies: [
        { name: '@nestjs/common', version: '^10.0.0', type: 'dependency', framework: 'nestjs', optional: false, description: 'NestJS core' },
        { name: '@nestjs/typeorm', version: '^10.0.0', type: 'dependency', framework: 'nestjs', optional: false, description: 'TypeORM integration' },
        { name: 'typeorm', version: '^0.3.0', type: 'dependency', framework: 'nestjs', optional: false, description: 'TypeORM ORM' },
        { name: '@nestjs/swagger', version: '^7.0.0', type: 'dependency', framework: 'nestjs', optional: true, description: 'Swagger integration' },
        { name: 'class-validator', version: '^0.14.0', type: 'dependency', framework: 'nestjs', optional: true, description: 'Validation decorators' },
        { name: 'class-transformer', version: '^0.5.0', type: 'dependency', framework: 'nestjs', optional: true, description: 'Object transformation' }
      ],
      templates: [
        { templateId: 'nestjs-entity', outputPath: 'entities/{entity-name}.entity.ts', layer: 'base', priority: 1 },
        { templateId: 'nestjs-base-service', outputPath: 'services/{entity-name}-base.service.ts', layer: 'base', priority: 2 },
        { templateId: 'nestjs-service', outputPath: 'services/{entity-name}.service.ts', layer: 'biz', priority: 3 },
        { templateId: 'nestjs-base-controller', outputPath: 'controllers/{entity-name}-base.controller.ts', layer: 'base', priority: 4 },
        { templateId: 'nestjs-controller', outputPath: 'controllers/{entity-name}.controller.ts', layer: 'biz', priority: 5 },
        { templateId: 'nestjs-dto', outputPath: 'dto/{entity-name}.dto.ts', layer: 'base', priority: 6 },
        { templateId: 'nestjs-module', outputPath: 'modules/{entity-name}.module.ts', layer: 'base', priority: 7 }
      ]
    };

    // Spring Boot 策略
    const springBootStrategy: GenerationStrategy = {
      name: 'spring-boot-standard',
      description: 'Standard Spring Boot application with JPA',
      framework: 'spring-boot',
      layers: ['base', 'biz'],
      features: ['swagger', 'validation', 'testing', 'caching'],
      fileStructure: {
        baseDir: 'src/main/java',
        directories: {
          entities: 'entity',
          services: 'service',
          controllers: 'controller',
          dtos: 'dto',
          modules: 'config',
          tests: 'src/test/java',
          configs: 'config'
        },
        fileNaming: {
          pattern: '{Name}.java',
          casing: 'pascalCase',
          extensions: {
            entity: 'java',
            service: 'java',
            controller: 'java',
            dto: 'java',
            module: 'java',
            test: 'java'
          }
        }
      },
      namingConventions: {
        entity: {
          className: '{EntityName}',
          fileName: '{EntityName}',
          tableName: '{entity_names}'
        },
        service: {
          className: '{EntityName}Service',
          fileName: '{EntityName}Service'
        },
        controller: {
          className: '{EntityName}Controller',
          fileName: '{EntityName}Controller',
          routePath: '/api/{entity-names}'
        },
        dto: {
          createClassName: 'Create{EntityName}Request',
          updateClassName: 'Update{EntityName}Request',
          queryClassName: '{EntityName}Query',
          fileName: '{EntityName}DTO'
        }
      },
      dependencies: [
        { name: 'spring-boot-starter-web', version: '3.1.0', type: 'dependency', framework: 'spring-boot', optional: false, description: 'Spring Boot Web Starter' },
        { name: 'spring-boot-starter-data-jpa', version: '3.1.0', type: 'dependency', framework: 'spring-boot', optional: false, description: 'Spring Data JPA' },
        { name: 'spring-boot-starter-validation', version: '3.1.0', type: 'dependency', framework: 'spring-boot', optional: true, description: 'Validation support' },
        { name: 'springdoc-openapi-starter-webmvc-ui', version: '2.1.0', type: 'dependency', framework: 'spring-boot', optional: true, description: 'OpenAPI documentation' }
      ],
      templates: [
        { templateId: 'spring-entity', outputPath: 'entity/{EntityName}.java', layer: 'base', priority: 1 },
        { templateId: 'spring-repository', outputPath: 'repository/{EntityName}Repository.java', layer: 'base', priority: 2 },
        { templateId: 'spring-base-service', outputPath: 'service/{EntityName}BaseService.java', layer: 'base', priority: 3 },
        { templateId: 'spring-service', outputPath: 'service/{EntityName}Service.java', layer: 'biz', priority: 4 },
        { templateId: 'spring-base-controller', outputPath: 'controller/{EntityName}BaseController.java', layer: 'base', priority: 5 },
        { templateId: 'spring-controller', outputPath: 'controller/{EntityName}Controller.java', layer: 'biz', priority: 6 },
        { templateId: 'spring-dto', outputPath: 'dto/{EntityName}DTO.java', layer: 'base', priority: 7 }
      ]
    };

    this.strategies.set(nestjsStrategy.name, nestjsStrategy);
    this.strategies.set(springBootStrategy.name, springBootStrategy);
  }

  private async validateGenerationContext(context: GenerationContext): Promise<void> {
    if (!context.strategy) {
      throw BusinessException.badRequest('Generation strategy is required');
    }

    if (!context.entities || context.entities.length === 0) {
      throw BusinessException.badRequest('At least one entity is required');
    }

    if (!context.options.outputDir) {
      throw BusinessException.badRequest('Output directory is required');
    }
  }

  private async validateStrategy(strategy: GenerationStrategy): Promise<void> {
    if (!strategy.name) {
      throw BusinessException.badRequest('Strategy name is required');
    }

    if (!strategy.framework) {
      throw BusinessException.badRequest('Framework is required');
    }

    if (!strategy.templates || strategy.templates.length === 0) {
      throw BusinessException.badRequest('At least one template mapping is required');
    }
  }

  private async preprocessEntities(entities: any[], relations: any[]): Promise<any[]> {
    return entities.map(entity => ({
      ...entity,
      relations: relations.filter(r => 
        r.sourceEntityId === entity.id || r.targetEntityId === entity.id
      )
    }));
  }

  private async generateEntityFiles(entity: any, context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    for (const templateMapping of context.strategy.templates) {
      // 根据层级和选项决定是否生成
      if (templateMapping.layer === 'biz' && !context.options.overwriteBiz) {
        const outputPath = this.resolveOutputPath(templateMapping.outputPath, entity, context);
        if (await this.fileExists(outputPath)) {
          continue; // 跳过已存在的Biz层文件
        }
      }

      const file = await this.generateFileFromTemplate(templateMapping, entity, context);
      if (file) {
        files.push(file);
      }
    }

    return files;
  }

  private async generateProjectFiles(context: GenerationContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // 生成项目配置文件
    if (context.strategy.framework === 'nestjs') {
      // 生成 package.json, tsconfig.json 等
    } else if (context.strategy.framework === 'spring-boot') {
      // 生成 pom.xml, application.yml 等
    }

    return files;
  }

  private async generateFileFromTemplate(
    templateMapping: TemplateMapping,
    entity: any,
    context: GenerationContext
  ): Promise<GeneratedFile | null> {
    try {
      // 这里应该调用模板引擎服务
      const templateContent = await this.getTemplateContent(templateMapping.templateId);
      const renderedContent = await this.renderTemplate(templateContent, entity, context);
      
      const outputPath = this.resolveOutputPath(templateMapping.outputPath, entity, context);
      
      return {
        path: outputPath,
        content: renderedContent,
        type: templateMapping.layer,
        size: Buffer.byteLength(renderedContent, 'utf8'),
        checksum: this.calculateChecksum(renderedContent),
        dependencies: this.extractDependencies(renderedContent)
      };
    } catch (error) {
      this.logger.error(`Failed to generate file from template ${templateMapping.templateId}: ${error.message}`);
      return null;
    }
  }

  private resolveOutputPath(pathTemplate: string, entity: any, context: GenerationContext): string {
    const baseDir = context.options.outputDir;
    const strategy = context.strategy;
    
    let resolvedPath = pathTemplate
      .replace(/{entity-name}/g, this.toKebabCase(entity.name))
      .replace(/{EntityName}/g, this.toPascalCase(entity.name))
      .replace(/{entity_name}/g, this.toSnakeCase(entity.name))
      .replace(/{entity_names}/g, this.toSnakeCase(this.pluralize(entity.name)));

    return `${baseDir}/${strategy.fileStructure.baseDir}/${resolvedPath}`;
  }

  private async getTemplateContent(templateId: string): Promise<string> {
    // 这里应该从模板服务获取模板内容
    return `// Template: ${templateId}\n// Generated content`;
  }

  private async renderTemplate(template: string, entity: any, context: GenerationContext): Promise<string> {
    // 这里应该调用模板引擎进行渲染
    return template.replace(/{{entityName}}/g, entity.name);
  }

  private async optimizeImports(files: GeneratedFile[]): Promise<void> {
    // 优化导入语句
    for (const file of files) {
      file.content = this.optimizeFileImports(file.content);
    }
  }

  private optimizeFileImports(content: string): string {
    // 简单的导入优化逻辑
    const lines = content.split('\n');
    const imports: string[] = [];
    const otherLines: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('import ')) {
        imports.push(line);
      } else {
        otherLines.push(line);
      }
    });

    // 排序和去重导入
    const uniqueImports = Array.from(new Set(imports)).sort();
    
    return [...uniqueImports, '', ...otherLines].join('\n');
  }

  private async formatCode(files: GeneratedFile[]): Promise<void> {
    // 代码格式化
    for (const file of files) {
      file.content = this.formatFileContent(file.content, file.path);
    }
  }

  private formatFileContent(content: string, filePath: string): string {
    // 根据文件类型进行格式化
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      return this.formatTypeScript(content);
    } else if (filePath.endsWith('.java')) {
      return this.formatJava(content);
    }
    return content;
  }

  private formatTypeScript(content: string): string {
    // 简单的TypeScript格式化
    return content
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  private formatJava(content: string): string {
    // 简单的Java格式化
    return content
      .replace(/\s*{\s*/g, ' {\n    ')
      .replace(/;\s*/g, ';\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  private async validateCode(files: GeneratedFile[]): Promise<string[]> {
    const errors: string[] = [];
    
    for (const file of files) {
      const fileErrors = await this.validateFileContent(file);
      errors.push(...fileErrors);
    }
    
    return errors;
  }

  private async validateFileContent(file: GeneratedFile): Promise<string[]> {
    const errors: string[] = [];
    
    // 基本语法检查
    if (file.path.endsWith('.ts')) {
      errors.push(...this.validateTypeScript(file.content));
    } else if (file.path.endsWith('.java')) {
      errors.push(...this.validateJava(file.content));
    }
    
    return errors;
  }

  private validateTypeScript(content: string): string[] {
    const errors: string[] = [];
    
    // 检查基本语法错误
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('{{') && line.includes('}}')) {
        errors.push(`Line ${index + 1}: Unresolved template variable in ${line.trim()}`);
      }
    });
    
    return errors;
  }

  private validateJava(content: string): string[] {
    const errors: string[] = [];
    
    // 检查基本语法错误
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('{{') && line.includes('}}')) {
        errors.push(`Line ${index + 1}: Unresolved template variable in ${line.trim()}`);
      }
    });
    
    return errors;
  }

  private calculateMetrics(files: GeneratedFile[], startTime: number): GenerationMetrics {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const generationTime = Date.now() - startTime;

    const templateUsage: Record<string, number> = {};
    const layerDistribution: Record<string, number> = {};

    files.forEach(file => {
      layerDistribution[file.type] = (layerDistribution[file.type] || 0) + 1;
    });

    return {
      totalFiles,
      totalLines,
      totalSize,
      generationTime,
      templateUsage,
      layerDistribution
    };
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // 工具方法
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

  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch')) {
      return str + 'es';
    } else {
      return str + 's';
    }
  }
}
