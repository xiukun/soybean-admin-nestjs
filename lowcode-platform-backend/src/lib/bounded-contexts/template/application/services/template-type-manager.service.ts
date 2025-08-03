import { Injectable } from '@nestjs/common';

export interface TemplateType {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  framework: string;
  fileExtension: string;
  defaultVariables: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
  }>;
  outputPath: string;
  dependencies?: string[];
  tags: string[];
}

@Injectable()
export class TemplateTypeManagerService {
  private readonly templateTypes: Map<string, TemplateType> = new Map();

  constructor() {
    this.initializeDefaultTemplateTypes();
  }

  private initializeDefaultTemplateTypes(): void {
    // NestJS Templates
    this.registerTemplateType({
      id: 'nestjs-entity',
      name: 'NestJS Entity',
      description: 'Prisma schema model for NestJS',
      category: 'entity',
      language: 'prisma',
      framework: 'nestjs',
      fileExtension: '.prisma',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity class name', required: true },
        { name: 'tableName', type: 'string', description: 'Database table name', required: true },
        { name: 'fields', type: 'array', description: 'Entity fields', required: true },
        { name: 'relations', type: 'array', description: 'Entity relations', required: false, defaultValue: [] },
        { name: 'enableTenancy', type: 'boolean', description: 'Enable multi-tenancy', required: false, defaultValue: false },
        { name: 'enableAudit', type: 'boolean', description: 'Enable audit fields', required: false, defaultValue: true },
        { name: 'enableSoftDelete', type: 'boolean', description: 'Enable soft delete', required: false, defaultValue: true },
        { name: 'enableStatus', type: 'boolean', description: 'Enable status field', required: false, defaultValue: true },
        { name: 'enableVersioning', type: 'boolean', description: 'Enable version field', required: false, defaultValue: false },
      ],
      outputPath: 'src/entities',
      dependencies: ['prisma', '@prisma/client'],
      tags: ['entity', 'prisma', 'database'],
    });

    this.registerTemplateType({
      id: 'nestjs-dto',
      name: 'NestJS DTO',
      description: 'Data Transfer Objects for NestJS',
      category: 'dto',
      language: 'typescript',
      framework: 'nestjs',
      fileExtension: '.dto.ts',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity name', required: true },
        { name: 'fields', type: 'array', description: 'Entity fields', required: true },
        { name: 'relations', type: 'array', description: 'Entity relations', required: false, defaultValue: [] },
        { name: 'searchableFields', type: 'array', description: 'Searchable fields', required: false, defaultValue: [] },
        { name: 'filterableFields', type: 'array', description: 'Filterable fields', required: false, defaultValue: [] },
        { name: 'enableStatus', type: 'boolean', description: 'Enable status filtering', required: false, defaultValue: true },
        { name: 'enableSoftDelete', type: 'boolean', description: 'Enable soft delete filtering', required: false, defaultValue: true },
      ],
      outputPath: 'src/dto',
      dependencies: ['class-validator', 'class-transformer', '@nestjs/swagger'],
      tags: ['dto', 'validation', 'swagger'],
    });

    this.registerTemplateType({
      id: 'nestjs-service',
      name: 'NestJS Service',
      description: 'Business logic service for NestJS',
      category: 'service',
      language: 'typescript',
      framework: 'nestjs',
      fileExtension: '.service.ts',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity name', required: true },
        { name: 'fields', type: 'array', description: 'Entity fields', required: true },
        { name: 'relations', type: 'array', description: 'Entity relations', required: false, defaultValue: [] },
        { name: 'enableCache', type: 'boolean', description: 'Enable caching', required: false, defaultValue: false },
        { name: 'enableEvents', type: 'boolean', description: 'Enable domain events', required: false, defaultValue: false },
        { name: 'enableValidation', type: 'boolean', description: 'Enable business validation', required: false, defaultValue: true },
      ],
      outputPath: 'src/services',
      dependencies: ['@nestjs/common', '@prisma/client'],
      tags: ['service', 'business-logic'],
    });

    this.registerTemplateType({
      id: 'nestjs-controller',
      name: 'NestJS Controller',
      description: 'REST API controller for NestJS',
      category: 'controller',
      language: 'typescript',
      framework: 'nestjs',
      fileExtension: '.controller.ts',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity name', required: true },
        { name: 'routePath', type: 'string', description: 'API route path', required: true },
        { name: 'enableAuth', type: 'boolean', description: 'Enable authentication', required: false, defaultValue: true },
        { name: 'enableRateLimit', type: 'boolean', description: 'Enable rate limiting', required: false, defaultValue: false },
        { name: 'enableValidation', type: 'boolean', description: 'Enable request validation', required: false, defaultValue: true },
        { name: 'enableSwagger', type: 'boolean', description: 'Enable Swagger documentation', required: false, defaultValue: true },
      ],
      outputPath: 'src/controllers',
      dependencies: ['@nestjs/common', '@nestjs/swagger'],
      tags: ['controller', 'api', 'rest'],
    });

    this.registerTemplateType({
      id: 'nestjs-service',
      name: 'NestJS Service with Prisma',
      description: 'Business service with Prisma data access for NestJS',
      category: 'service',
      language: 'typescript',
      framework: 'nestjs',
      fileExtension: '.service.ts',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity name', required: true },
        { name: 'fields', type: 'array', description: 'Entity fields', required: true },
        { name: 'enableSoftDelete', type: 'boolean', description: 'Enable soft delete queries', required: false, defaultValue: true },
        { name: 'enableCache', type: 'boolean', description: 'Enable query caching', required: false, defaultValue: false },
        { name: 'enablePagination', type: 'boolean', description: 'Enable pagination support', required: false, defaultValue: true },
      ],
      outputPath: 'src/services',
      dependencies: ['@nestjs/common', '@prisma/client'],
      tags: ['service', 'prisma', 'data-access'],
    });

    this.registerTemplateType({
      id: 'nestjs-module',
      name: 'NestJS Module',
      description: 'Feature module for NestJS',
      category: 'module',
      language: 'typescript',
      framework: 'nestjs',
      fileExtension: '.module.ts',
      defaultVariables: [
        { name: 'moduleName', type: 'string', description: 'Module name', required: true },
        { name: 'entities', type: 'array', description: 'Module entities', required: true },
        { name: 'useRedis', type: 'boolean', description: 'Use Redis caching', required: false, defaultValue: false },
        { name: 'useQueue', type: 'boolean', description: 'Use Bull queue', required: false, defaultValue: false },
        { name: 'hasEventHandlers', type: 'boolean', description: 'Has event handlers', required: false, defaultValue: false },
        { name: 'hasMiddleware', type: 'boolean', description: 'Has middleware', required: false, defaultValue: false },
        { name: 'hasGuards', type: 'boolean', description: 'Has guards', required: false, defaultValue: false },
        { name: 'hasInterceptors', type: 'boolean', description: 'Has interceptors', required: false, defaultValue: false },
      ],
      outputPath: 'src/modules',
      dependencies: ['@nestjs/common', '@nestjs/typeorm'],
      tags: ['module', 'feature'],
    });

    // Add more template types for other frameworks
    this.addExpressTemplateTypes();
    this.addSpringBootTemplateTypes();
  }

  private addExpressTemplateTypes(): void {
    this.registerTemplateType({
      id: 'express-route',
      name: 'Express Route',
      description: 'Express.js route handler',
      category: 'route',
      language: 'typescript',
      framework: 'express',
      fileExtension: '.route.ts',
      defaultVariables: [
        { name: 'routeName', type: 'string', description: 'Route name', required: true },
        { name: 'routePath', type: 'string', description: 'Route path', required: true },
        { name: 'methods', type: 'array', description: 'HTTP methods', required: true, defaultValue: ['GET', 'POST'] },
        { name: 'enableAuth', type: 'boolean', description: 'Enable authentication', required: false, defaultValue: true },
        { name: 'enableValidation', type: 'boolean', description: 'Enable validation', required: false, defaultValue: true },
      ],
      outputPath: 'src/routes',
      dependencies: ['express', 'express-validator'],
      tags: ['route', 'express', 'api'],
    });

    this.registerTemplateType({
      id: 'express-middleware',
      name: 'Express Middleware',
      description: 'Express.js middleware function',
      category: 'middleware',
      language: 'typescript',
      framework: 'express',
      fileExtension: '.middleware.ts',
      defaultVariables: [
        { name: 'middlewareName', type: 'string', description: 'Middleware name', required: true },
        { name: 'description', type: 'string', description: 'Middleware description', required: false },
        { name: 'async', type: 'boolean', description: 'Async middleware', required: false, defaultValue: false },
      ],
      outputPath: 'src/middleware',
      dependencies: ['express'],
      tags: ['middleware', 'express'],
    });
  }

  private addSpringBootTemplateTypes(): void {
    this.registerTemplateType({
      id: 'spring-entity',
      name: 'Spring Boot Entity',
      description: 'JPA entity class for Spring Boot',
      category: 'entity',
      language: 'java',
      framework: 'spring-boot',
      fileExtension: '.java',
      defaultVariables: [
        { name: 'entityName', type: 'string', description: 'Entity class name', required: true },
        { name: 'tableName', type: 'string', description: 'Database table name', required: true },
        { name: 'packageName', type: 'string', description: 'Java package name', required: true },
        { name: 'fields', type: 'array', description: 'Entity fields', required: true },
      ],
      outputPath: 'src/main/java/entities',
      dependencies: ['spring-boot-starter-data-jpa'],
      tags: ['entity', 'jpa', 'spring'],
    });

    this.registerTemplateType({
      id: 'spring-controller',
      name: 'Spring Boot Controller',
      description: 'REST controller for Spring Boot',
      category: 'controller',
      language: 'java',
      framework: 'spring-boot',
      fileExtension: '.java',
      defaultVariables: [
        { name: 'controllerName', type: 'string', description: 'Controller class name', required: true },
        { name: 'entityName', type: 'string', description: 'Entity name', required: true },
        { name: 'packageName', type: 'string', description: 'Java package name', required: true },
        { name: 'basePath', type: 'string', description: 'API base path', required: true },
      ],
      outputPath: 'src/main/java/controllers',
      dependencies: ['spring-boot-starter-web'],
      tags: ['controller', 'rest', 'spring'],
    });
  }

  registerTemplateType(templateType: TemplateType): void {
    this.templateTypes.set(templateType.id, templateType);
  }

  getTemplateType(id: string): TemplateType | undefined {
    return this.templateTypes.get(id);
  }

  getAllTemplateTypes(): TemplateType[] {
    return Array.from(this.templateTypes.values());
  }

  getTemplateTypesByCategory(category: string): TemplateType[] {
    return Array.from(this.templateTypes.values()).filter(t => t.category === category);
  }

  getTemplateTypesByFramework(framework: string): TemplateType[] {
    return Array.from(this.templateTypes.values()).filter(t => t.framework === framework);
  }

  getTemplateTypesByLanguage(language: string): TemplateType[] {
    return Array.from(this.templateTypes.values()).filter(t => t.language === language);
  }

  getSupportedCategories(): string[] {
    const categories = new Set<string>();
    this.templateTypes.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }

  getSupportedFrameworks(): string[] {
    const frameworks = new Set<string>();
    this.templateTypes.forEach(t => frameworks.add(t.framework));
    return Array.from(frameworks);
  }

  getSupportedLanguages(): string[] {
    const languages = new Set<string>();
    this.templateTypes.forEach(t => languages.add(t.language));
    return Array.from(languages);
  }
}
