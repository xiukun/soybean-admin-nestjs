import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';
import * as fs from 'fs';
import * as path from 'path';

export interface BizLayerConfig {
  framework: 'nestjs' | 'spring-boot' | 'express' | 'django';
  features: {
    customValidation: boolean;
    businessRules: boolean;
    eventHandling: boolean;
    caching: boolean;
    logging: boolean;
    metrics: boolean;
    workflow: boolean;
    notification: boolean;
  };
  naming: {
    convention: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase';
    prefix: string;
    suffix: string;
  };
  output: {
    bizDir: string;
    serviceDir: string;
    controllerDir: string;
    handlerDir: string;
    validatorDir: string;
    ruleDir: string;
  };
  protection: {
    overwriteExisting: boolean;
    backupExisting: boolean;
    mergeStrategy: 'preserve' | 'merge' | 'replace';
  };
}

export interface GeneratedBizFile {
  path: string;
  content: string;
  type: 'service' | 'controller' | 'handler' | 'validator' | 'rule' | 'config';
  framework: string;
  protected: boolean;
  exists: boolean;
}

@Injectable()
export class BizLayerGeneratorService {
  private readonly logger = new Logger(BizLayerGeneratorService.name);

  async generateBizLayer(
    entity: any,
    relations: any[],
    config: BizLayerConfig,
    user: AuthenticatedUser
  ): Promise<GeneratedBizFile[]> {
    this.logger.log(`Generating biz layer for entity: ${entity.name} with framework: ${config.framework}`);

    const files: GeneratedBizFile[] = [];

    try {
      // 生成业务服务文件
      const bizServiceFile = await this.generateBizService(entity, relations, config);
      files.push(bizServiceFile);

      // 生成业务控制器文件
      const bizControllerFile = await this.generateBizController(entity, config);
      files.push(bizControllerFile);

      // 生成自定义验证器
      if (config.features.customValidation) {
        const validatorFiles = await this.generateValidators(entity, config);
        files.push(...validatorFiles);
      }

      // 生成业务规则
      if (config.features.businessRules) {
        const ruleFiles = await this.generateBusinessRules(entity, config);
        files.push(...ruleFiles);
      }

      // 生成事件处理器
      if (config.features.eventHandling) {
        const handlerFiles = await this.generateEventHandlers(entity, config);
        files.push(...handlerFiles);
      }

      // 生成工作流
      if (config.features.workflow) {
        const workflowFiles = await this.generateWorkflow(entity, config);
        files.push(...workflowFiles);
      }

      // 处理文件保护策略
      const protectedFiles = await this.applyProtectionStrategy(files, config);

      this.logger.log(`Generated ${protectedFiles.length} biz layer files for entity: ${entity.name}`);
      return protectedFiles;

    } catch (error) {
      this.logger.error(`Biz layer generation failed: ${error.message}`);
      throw BusinessException.internalServerError('Biz layer generation failed', error.message);
    }
  }

  private async generateBizService(entity: any, relations: any[], config: BizLayerConfig): Promise<GeneratedBizFile> {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const filePath = `${config.output.serviceDir}/${this.toKebabCase(entity.name)}.service.${this.getFileExtension(config.framework)}`;

    let content = '';

    switch (config.framework) {
      case 'nestjs':
        content = this.generateNestJSBizService(entity, relations, config);
        break;
      case 'spring-boot':
        content = this.generateSpringBootBizService(entity, relations, config);
        break;
      default:
        content = `// ${entityName}Service for ${config.framework}`;
    }

    return {
      path: filePath,
      content,
      type: 'service',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    };
  }

  private generateNestJSBizService(entity: any, relations: any[], config: BizLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    const imports = [
      "import { Injectable, Logger } from '@nestjs/common';",
      `import { ${entityName}BaseService } from './${this.toKebabCase(entity.name)}-base.service';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';`,
      `import { Query${entityName}Dto } from '../dto/query-${this.toKebabCase(entity.name)}.dto';`,
      `import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';`,
    ];

    if (config.features.eventHandling) {
      imports.push("import { EventEmitter2 } from '@nestjs/event-emitter';");
    }

    if (config.features.customValidation) {
      imports.push(`import { ${entityName}Validator } from '../validators/${this.toKebabCase(entity.name)}.validator';`);
    }

    if (config.features.businessRules) {
      imports.push(`import { ${entityName}BusinessRules } from '../rules/${this.toKebabCase(entity.name)}.rules';`);
    }

    const constructorParams = [`private readonly ${entityNameLower}BaseService: ${entityName}BaseService`];
    
    if (config.features.eventHandling) {
      constructorParams.push('private readonly eventEmitter: EventEmitter2');
    }
    
    if (config.features.customValidation) {
      constructorParams.push(`private readonly ${entityNameLower}Validator: ${entityName}Validator`);
    }
    
    if (config.features.businessRules) {
      constructorParams.push(`private readonly ${entityNameLower}BusinessRules: ${entityName}BusinessRules`);
    }

    return `${imports.join('\n')}

/**
 * ${entityName} Business Service
 * 
 * This service contains business logic for ${entityName} entity.
 * It extends the base service with custom business rules and validations.
 * 
 * @extends ${entityName}BaseService
 */
@Injectable()
export class ${entityName}Service {
  private readonly logger = new Logger(${entityName}Service.name);

  constructor(
    ${constructorParams.join(',\n    ')},
  ) {}

  /**
   * Create a new ${entityNameLower} with business validation
   */
  async create(create${entityName}Dto: Create${entityName}Dto): Promise<${entityName}> {
    this.logger.log(\`Creating ${entityNameLower} with business logic: \${JSON.stringify(create${entityName}Dto)}\`);

    ${config.features.customValidation ? `// Apply custom business validation
    await this.${entityNameLower}Validator.validateCreate(create${entityName}Dto);` : ''}

    ${config.features.businessRules ? `// Apply business rules
    await this.${entityNameLower}BusinessRules.beforeCreate(create${entityName}Dto);` : ''}

    // Call base service to create the entity
    const created${entityName} = await this.${entityNameLower}BaseService.create(create${entityName}Dto);

    ${config.features.businessRules ? `// Apply post-creation business rules
    await this.${entityNameLower}BusinessRules.afterCreate(created${entityName});` : ''}

    ${config.features.eventHandling ? `// Emit creation event
    this.eventEmitter.emit('${entityNameLower}.created', {
      ${entityNameLower}: created${entityName},
      user: 'current-user', // TODO: Get from context
      timestamp: new Date(),
    });` : ''}

    return created${entityName};
  }

  /**
   * Find all ${entityNameLower}s with business filtering
   */
  async findAll(query${entityName}Dto: Query${entityName}Dto): Promise<{ data: ${entityName}[]; total: number }> {
    this.logger.log(\`Finding all ${entityNameLower}s with business logic: \${JSON.stringify(query${entityName}Dto)}\`);

    ${config.features.businessRules ? `// Apply business rules for querying
    await this.${entityNameLower}BusinessRules.beforeQuery(query${entityName}Dto);` : ''}

    // Call base service
    const result = await this.${entityNameLower}BaseService.findAll(query${entityName}Dto);

    ${config.features.businessRules ? `// Apply post-query business rules
    result.data = await this.${entityNameLower}BusinessRules.afterQuery(result.data);` : ''}

    return result;
  }

  /**
   * Find one ${entityNameLower} by id with business logic
   */
  async findOne(id: string): Promise<${entityName}> {
    this.logger.log(\`Finding ${entityNameLower} by id with business logic: \${id}\`);

    ${config.features.businessRules ? `// Apply business rules for single entity retrieval
    await this.${entityNameLower}BusinessRules.beforeFindOne(id);` : ''}

    const ${entityNameLower} = await this.${entityNameLower}BaseService.findOne(id);

    if (!${entityNameLower}) {
      throw new Error(\`${entityName} with id \${id} not found\`);
    }

    ${config.features.businessRules ? `// Apply post-retrieval business rules
    return await this.${entityNameLower}BusinessRules.afterFindOne(${entityNameLower});` : ''}

    return ${entityNameLower};
  }

  /**
   * Update ${entityNameLower} with business validation
   */
  async update(id: string, update${entityName}Dto: Update${entityName}Dto): Promise<${entityName}> {
    this.logger.log(\`Updating ${entityNameLower} with business logic: \${id}, \${JSON.stringify(update${entityName}Dto)}\`);

    // Get existing entity
    const existing${entityName} = await this.findOne(id);

    ${config.features.customValidation ? `// Apply custom business validation
    await this.${entityNameLower}Validator.validateUpdate(id, update${entityName}Dto, existing${entityName});` : ''}

    ${config.features.businessRules ? `// Apply business rules
    await this.${entityNameLower}BusinessRules.beforeUpdate(id, update${entityName}Dto, existing${entityName});` : ''}

    // Call base service to update
    const updated${entityName} = await this.${entityNameLower}BaseService.update(id, update${entityName}Dto);

    ${config.features.businessRules ? `// Apply post-update business rules
    await this.${entityNameLower}BusinessRules.afterUpdate(updated${entityName}, existing${entityName});` : ''}

    ${config.features.eventHandling ? `// Emit update event
    this.eventEmitter.emit('${entityNameLower}.updated', {
      ${entityNameLower}: updated${entityName},
      previous: existing${entityName},
      changes: update${entityName}Dto,
      user: 'current-user', // TODO: Get from context
      timestamp: new Date(),
    });` : ''}

    return updated${entityName};
  }

  /**
   * Remove ${entityNameLower} with business validation
   */
  async remove(id: string): Promise<void> {
    this.logger.log(\`Removing ${entityNameLower} with business logic: \${id}\`);

    // Get existing entity
    const existing${entityName} = await this.findOne(id);

    ${config.features.businessRules ? `// Apply business rules
    await this.${entityNameLower}BusinessRules.beforeDelete(id, existing${entityName});` : ''}

    // Call base service to remove
    await this.${entityNameLower}BaseService.remove(id);

    ${config.features.businessRules ? `// Apply post-deletion business rules
    await this.${entityNameLower}BusinessRules.afterDelete(existing${entityName});` : ''}

    ${config.features.eventHandling ? `// Emit deletion event
    this.eventEmitter.emit('${entityNameLower}.deleted', {
      ${entityNameLower}: existing${entityName},
      user: 'current-user', // TODO: Get from context
      timestamp: new Date(),
    });` : ''}
  }

  // TODO: Add your custom business methods here
  // Example:
  // async customBusinessMethod(param: any): Promise<any> {
  //   // Your custom business logic here
  // }
}`;
  }

  private generateSpringBootBizService(entity: any, relations: any[], config: BizLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    return `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ${entityName} Business Service
 * 
 * This service contains business logic for ${entityName} entity.
 * It extends the base service with custom business rules and validations.
 */
@Service
@Transactional
public class ${entityName}Service {
    
    private static final Logger logger = LoggerFactory.getLogger(${entityName}Service.class);
    
    @Autowired
    private ${entityName}BaseService ${entityNameLower}BaseService;
    
    ${config.features.customValidation ? `@Autowired
    private ${entityName}Validator ${entityNameLower}Validator;` : ''}
    
    ${config.features.businessRules ? `@Autowired
    private ${entityName}BusinessRules ${entityNameLower}BusinessRules;` : ''}
    
    /**
     * Create a new ${entityNameLower} with business validation
     */
    public ${entityName} create(${entityName} ${entityNameLower}) {
        logger.info("Creating ${entityNameLower} with business logic: {}", ${entityNameLower});
        
        ${config.features.customValidation ? `// Apply custom business validation
        ${entityNameLower}Validator.validateCreate(${entityNameLower});` : ''}
        
        ${config.features.businessRules ? `// Apply business rules
        ${entityNameLower}BusinessRules.beforeCreate(${entityNameLower});` : ''}
        
        // Call base service to create the entity
        ${entityName} created${entityName} = ${entityNameLower}BaseService.create(${entityNameLower});
        
        ${config.features.businessRules ? `// Apply post-creation business rules
        ${entityNameLower}BusinessRules.afterCreate(created${entityName});` : ''}
        
        return created${entityName};
    }
    
    // TODO: Add your custom business methods here
}`;
  }

  private async generateBizController(entity: any, config: BizLayerConfig): Promise<GeneratedBizFile> {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const filePath = `${config.output.controllerDir}/${this.toKebabCase(entity.name)}.controller.${this.getFileExtension(config.framework)}`;

    let content = '';

    switch (config.framework) {
      case 'nestjs':
        content = this.generateNestJSBizController(entity, config);
        break;
      case 'spring-boot':
        content = this.generateSpringBootBizController(entity, config);
        break;
      default:
        content = `// ${entityName}Controller for ${config.framework}`;
    }

    return {
      path: filePath,
      content,
      type: 'controller',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    };
  }

  private generateNestJSBizController(entity: any, config: BizLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const entityNamePlural = this.pluralize(entityNameLower);

    const imports = [
      "import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';",
      "import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';",
      `import { ${entityName}Service } from '../services/${this.toKebabCase(entity.name)}.service';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';`,
      `import { Query${entityName}Dto } from '../dto/query-${this.toKebabCase(entity.name)}.dto';`,
    ];

    return `${imports.join('\n')}

/**
 * ${entityName} Business Controller
 * 
 * This controller handles HTTP requests for ${entityName} entity
 * with custom business logic and validation.
 */
@ApiTags('${entityNamePlural}')
@Controller('${entityNamePlural}')
export class ${entityName}Controller {
  constructor(private readonly ${entityNameLower}Service: ${entityName}Service) {}

  @ApiOperation({ summary: 'Create ${entityNameLower}' })
  @ApiResponse({ status: 201, description: 'The ${entityNameLower} has been successfully created.' })
  @Post()
  create(@Body() create${entityName}Dto: Create${entityName}Dto) {
    return this.${entityNameLower}Service.create(create${entityName}Dto);
  }

  @ApiOperation({ summary: 'Get all ${entityNamePlural}' })
  @ApiResponse({ status: 200, description: 'Return all ${entityNamePlural}.' })
  @Get()
  findAll(@Query() query${entityName}Dto: Query${entityName}Dto) {
    return this.${entityNameLower}Service.findAll(query${entityName}Dto);
  }

  @ApiOperation({ summary: 'Get ${entityNameLower} by id' })
  @ApiResponse({ status: 200, description: 'Return the ${entityNameLower}.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${entityNameLower}Service.findOne(id);
  }

  @ApiOperation({ summary: 'Update ${entityNameLower}' })
  @ApiResponse({ status: 200, description: 'The ${entityNameLower} has been successfully updated.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() update${entityName}Dto: Update${entityName}Dto) {
    return this.${entityNameLower}Service.update(id, update${entityName}Dto);
  }

  @ApiOperation({ summary: 'Delete ${entityNameLower}' })
  @ApiResponse({ status: 200, description: 'The ${entityNameLower} has been successfully deleted.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${entityNameLower}Service.remove(id);
  }

  // TODO: Add your custom endpoints here
  // Example:
  // @ApiOperation({ summary: 'Custom business operation' })
  // @Post(':id/custom-operation')
  // customOperation(@Param('id') id: string, @Body() data: any) {
  //   return this.${entityNameLower}Service.customBusinessMethod(data);
  // }
}`;
  }

  private generateSpringBootBizController(entity: any, config: BizLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const entityNamePlural = this.pluralize(entityNameLower);

    return `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * ${entityName} Business Controller
 * 
 * This controller handles HTTP requests for ${entityName} entity
 * with custom business logic and validation.
 */
@RestController
@RequestMapping("/api/${entityNamePlural}")
@Tag(name = "${entityNamePlural}", description = "${entityName} management")
public class ${entityName}Controller {
    
    @Autowired
    private ${entityName}Service ${entityNameLower}Service;
    
    @Operation(summary = "Create ${entityNameLower}")
    @PostMapping
    public ResponseEntity<${entityName}> create(@RequestBody ${entityName} ${entityNameLower}) {
        ${entityName} created = ${entityNameLower}Service.create(${entityNameLower});
        return ResponseEntity.ok(created);
    }
    
    // TODO: Add your custom endpoints here
}`;
  }

  private async generateValidators(entity: any, config: BizLayerConfig): Promise<GeneratedBizFile[]> {
    const files: GeneratedBizFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');
    const filePath = `${config.output.validatorDir}/${this.toKebabCase(entity.name)}.validator.${this.getFileExtension(config.framework)}`;

    let content = '';

    if (config.framework === 'nestjs') {
      content = `import { Injectable } from '@nestjs/common';
import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';
import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';
import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';

/**
 * ${entityName} Custom Validator
 * 
 * Contains custom business validation logic that goes beyond
 * basic field validation.
 */
@Injectable()
export class ${entityName}Validator {

  /**
   * Validate entity creation
   */
  async validateCreate(create${entityName}Dto: Create${entityName}Dto): Promise<void> {
    // TODO: Add your custom creation validation logic here
    // Example:
    // if (create${entityName}Dto.someField === 'invalid') {
    //   throw new Error('Invalid value for someField');
    // }
  }

  /**
   * Validate entity update
   */
  async validateUpdate(
    id: string,
    update${entityName}Dto: Update${entityName}Dto,
    existing${entityName}: ${entityName}
  ): Promise<void> {
    // TODO: Add your custom update validation logic here
    // Example:
    // if (existing${entityName}.status === 'locked' && update${entityName}Dto.someField) {
    //   throw new Error('Cannot update locked entity');
    // }
  }

  /**
   * Validate entity deletion
   */
  async validateDelete(id: string, existing${entityName}: ${entityName}): Promise<void> {
    // TODO: Add your custom deletion validation logic here
    // Example:
    // if (existing${entityName}.hasRelatedData) {
    //   throw new Error('Cannot delete entity with related data');
    // }
  }
}`;
    }

    files.push({
      path: filePath,
      content,
      type: 'validator',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    });

    return files;
  }

  private async generateBusinessRules(entity: any, config: BizLayerConfig): Promise<GeneratedBizFile[]> {
    const files: GeneratedBizFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');
    const filePath = `${config.output.ruleDir}/${this.toKebabCase(entity.name)}.rules.${this.getFileExtension(config.framework)}`;

    let content = '';

    if (config.framework === 'nestjs') {
      content = `import { Injectable, Logger } from '@nestjs/common';
import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';
import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';
import { Query${entityName}Dto } from '../dto/query-${this.toKebabCase(entity.name)}.dto';
import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';

/**
 * ${entityName} Business Rules
 * 
 * Contains business rules and logic that should be applied
 * during entity lifecycle operations.
 */
@Injectable()
export class ${entityName}BusinessRules {
  private readonly logger = new Logger(${entityName}BusinessRules.name);

  /**
   * Business rules to apply before creating an entity
   */
  async beforeCreate(create${entityName}Dto: Create${entityName}Dto): Promise<void> {
    this.logger.log('Applying before-create business rules');
    
    // TODO: Add your before-create business rules here
    // Example:
    // - Set default values based on business logic
    // - Apply business-specific transformations
    // - Check business constraints
  }

  /**
   * Business rules to apply after creating an entity
   */
  async afterCreate(created${entityName}: ${entityName}): Promise<void> {
    this.logger.log(\`Applying after-create business rules for: \${created${entityName}.id}\`);
    
    // TODO: Add your after-create business rules here
    // Example:
    // - Send notifications
    // - Update related entities
    // - Log business events
  }

  /**
   * Business rules to apply before querying entities
   */
  async beforeQuery(query${entityName}Dto: Query${entityName}Dto): Promise<void> {
    this.logger.log('Applying before-query business rules');
    
    // TODO: Add your before-query business rules here
    // Example:
    // - Apply user-specific filters
    // - Add security constraints
    // - Modify query parameters based on business logic
  }

  /**
   * Business rules to apply after querying entities
   */
  async afterQuery(entities: ${entityName}[]): Promise<${entityName}[]> {
    this.logger.log(\`Applying after-query business rules for \${entities.length} entities\`);
    
    // TODO: Add your after-query business rules here
    // Example:
    // - Filter results based on business rules
    // - Enrich entities with calculated fields
    // - Apply business-specific transformations
    
    return entities;
  }

  /**
   * Business rules to apply before finding a single entity
   */
  async beforeFindOne(id: string): Promise<void> {
    this.logger.log(\`Applying before-find-one business rules for: \${id}\`);
    
    // TODO: Add your before-find-one business rules here
  }

  /**
   * Business rules to apply after finding a single entity
   */
  async afterFindOne(entity: ${entityName}): Promise<${entityName}> {
    this.logger.log(\`Applying after-find-one business rules for: \${entity.id}\`);
    
    // TODO: Add your after-find-one business rules here
    
    return entity;
  }

  /**
   * Business rules to apply before updating an entity
   */
  async beforeUpdate(
    id: string,
    update${entityName}Dto: Update${entityName}Dto,
    existing${entityName}: ${entityName}
  ): Promise<void> {
    this.logger.log(\`Applying before-update business rules for: \${id}\`);
    
    // TODO: Add your before-update business rules here
    // Example:
    // - Validate business state transitions
    // - Apply business-specific transformations
    // - Check update permissions based on business rules
  }

  /**
   * Business rules to apply after updating an entity
   */
  async afterUpdate(updated${entityName}: ${entityName}, previous${entityName}: ${entityName}): Promise<void> {
    this.logger.log(\`Applying after-update business rules for: \${updated${entityName}.id}\`);
    
    // TODO: Add your after-update business rules here
    // Example:
    // - Send notifications about changes
    // - Update related entities
    // - Log business events
  }

  /**
   * Business rules to apply before deleting an entity
   */
  async beforeDelete(id: string, existing${entityName}: ${entityName}): Promise<void> {
    this.logger.log(\`Applying before-delete business rules for: \${id}\`);
    
    // TODO: Add your before-delete business rules here
    // Example:
    // - Check if deletion is allowed based on business state
    // - Validate business constraints
    // - Prepare related entities for deletion
  }

  /**
   * Business rules to apply after deleting an entity
   */
  async afterDelete(deleted${entityName}: ${entityName}): Promise<void> {
    this.logger.log(\`Applying after-delete business rules for: \${deleted${entityName}.id}\`);
    
    // TODO: Add your after-delete business rules here
    // Example:
    // - Clean up related data
    // - Send notifications
    // - Log business events
  }
}`;
    }

    files.push({
      path: filePath,
      content,
      type: 'rule',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    });

    return files;
  }

  private async generateEventHandlers(entity: any, config: BizLayerConfig): Promise<GeneratedBizFile[]> {
    const files: GeneratedBizFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const filePath = `${config.output.handlerDir}/${this.toKebabCase(entity.name)}.handler.${this.getFileExtension(config.framework)}`;

    let content = '';

    if (config.framework === 'nestjs') {
      content = `import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';

/**
 * ${entityName} Event Handler
 * 
 * Handles events related to ${entityName} entity lifecycle.
 */
@Injectable()
export class ${entityName}EventHandler {
  private readonly logger = new Logger(${entityName}EventHandler.name);

  /**
   * Handle ${entityNameLower} creation event
   */
  @OnEvent('${entityNameLower}.created')
  async handleCreated(payload: { ${entityNameLower}: ${entityName}; user: string; timestamp: Date }) {
    this.logger.log(\`Handling ${entityNameLower} created event: \${payload.${entityNameLower}.id}\`);
    
    // TODO: Add your event handling logic here
    // Example:
    // - Send welcome email
    // - Create audit log
    // - Trigger workflow
    // - Update statistics
  }

  /**
   * Handle ${entityNameLower} update event
   */
  @OnEvent('${entityNameLower}.updated')
  async handleUpdated(payload: {
    ${entityNameLower}: ${entityName};
    previous: ${entityName};
    changes: any;
    user: string;
    timestamp: Date;
  }) {
    this.logger.log(\`Handling ${entityNameLower} updated event: \${payload.${entityNameLower}.id}\`);
    
    // TODO: Add your event handling logic here
    // Example:
    // - Send notification about changes
    // - Create audit log
    // - Trigger business processes
    // - Update related entities
  }

  /**
   * Handle ${entityNameLower} deletion event
   */
  @OnEvent('${entityNameLower}.deleted')
  async handleDeleted(payload: { ${entityNameLower}: ${entityName}; user: string; timestamp: Date }) {
    this.logger.log(\`Handling ${entityNameLower} deleted event: \${payload.${entityNameLower}.id}\`);
    
    // TODO: Add your event handling logic here
    // Example:
    // - Clean up related data
    // - Send notification
    // - Create audit log
    // - Update statistics
  }
}`;
    }

    files.push({
      path: filePath,
      content,
      type: 'handler',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    });

    return files;
  }

  private async generateWorkflow(entity: any, config: BizLayerConfig): Promise<GeneratedBizFile[]> {
    const files: GeneratedBizFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');
    const filePath = `${config.output.handlerDir}/${this.toKebabCase(entity.name)}.workflow.${this.getFileExtension(config.framework)}`;

    let content = '';

    if (config.framework === 'nestjs') {
      content = `import { Injectable, Logger } from '@nestjs/common';
import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';

/**
 * ${entityName} Workflow
 * 
 * Defines business workflows and state transitions for ${entityName} entity.
 */
@Injectable()
export class ${entityName}Workflow {
  private readonly logger = new Logger(${entityName}Workflow.name);

  /**
   * Define possible states for ${entityName}
   */
  private readonly states = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };

  /**
   * Define allowed state transitions
   */
  private readonly transitions = {
    [this.states.DRAFT]: [this.states.PENDING],
    [this.states.PENDING]: [this.states.APPROVED, this.states.REJECTED],
    [this.states.APPROVED]: [this.states.ACTIVE],
    [this.states.REJECTED]: [this.states.DRAFT],
    [this.states.ACTIVE]: [this.states.INACTIVE],
    [this.states.INACTIVE]: [this.states.ACTIVE],
  };

  /**
   * Check if state transition is allowed
   */
  canTransition(from: string, to: string): boolean {
    const allowedTransitions = this.transitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Execute state transition with business logic
   */
  async executeTransition(entity: ${entityName}, newState: string): Promise<${entityName}> {
    this.logger.log(\`Executing state transition for \${entity.id}: \${entity.status} -> \${newState}\`);

    if (!this.canTransition(entity.status, newState)) {
      throw new Error(\`Invalid state transition: \${entity.status} -> \${newState}\`);
    }

    // Apply business logic based on transition
    switch (newState) {
      case this.states.PENDING:
        await this.onPending(entity);
        break;
      case this.states.APPROVED:
        await this.onApproved(entity);
        break;
      case this.states.REJECTED:
        await this.onRejected(entity);
        break;
      case this.states.ACTIVE:
        await this.onActivated(entity);
        break;
      case this.states.INACTIVE:
        await this.onDeactivated(entity);
        break;
    }

    // Update entity state
    entity.status = newState;
    return entity;
  }

  /**
   * Business logic when entity becomes pending
   */
  private async onPending(entity: ${entityName}): Promise<void> {
    this.logger.log(\`Entity \${entity.id} is now pending approval\`);
    // TODO: Add business logic for pending state
    // Example: Send notification to approvers
  }

  /**
   * Business logic when entity is approved
   */
  private async onApproved(entity: ${entityName}): Promise<void> {
    this.logger.log(\`Entity \${entity.id} has been approved\`);
    // TODO: Add business logic for approved state
    // Example: Send approval notification
  }

  /**
   * Business logic when entity is rejected
   */
  private async onRejected(entity: ${entityName}): Promise<void> {
    this.logger.log(\`Entity \${entity.id} has been rejected\`);
    // TODO: Add business logic for rejected state
    // Example: Send rejection notification with reason
  }

  /**
   * Business logic when entity is activated
   */
  private async onActivated(entity: ${entityName}): Promise<void> {
    this.logger.log(\`Entity \${entity.id} has been activated\`);
    // TODO: Add business logic for activation
    // Example: Enable related services
  }

  /**
   * Business logic when entity is deactivated
   */
  private async onDeactivated(entity: ${entityName}): Promise<void> {
    this.logger.log(\`Entity \${entity.id} has been deactivated\`);
    // TODO: Add business logic for deactivation
    // Example: Disable related services
  }
}`;
    }

    files.push({
      path: filePath,
      content,
      type: 'config',
      framework: config.framework,
      protected: true,
      exists: await this.fileExists(filePath),
    });

    return files;
  }

  private async applyProtectionStrategy(files: GeneratedBizFile[], config: BizLayerConfig): Promise<GeneratedBizFile[]> {
    const protectedFiles: GeneratedBizFile[] = [];

    for (const file of files) {
      if (file.exists && !config.protection.overwriteExisting) {
        this.logger.log(`Skipping existing protected file: ${file.path}`);
        
        if (config.protection.backupExisting) {
          // Create backup of existing file
          const backupPath = `${file.path}.backup.${Date.now()}`;
          this.logger.log(`Creating backup: ${backupPath}`);
          // TODO: Implement backup logic
        }

        if (config.protection.mergeStrategy === 'merge') {
          // TODO: Implement merge logic
          this.logger.log(`Merging changes to: ${file.path}`);
        }

        continue;
      }

      protectedFiles.push(file);
    }

    return protectedFiles;
  }

  // Utility methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private formatName(name: string, convention: string): string {
    switch (convention) {
      case 'camelCase':
        return this.toCamelCase(name);
      case 'pascalCase':
        return this.toPascalCase(name);
      case 'kebabCase':
        return this.toKebabCase(name);
      case 'snakeCase':
        return this.toSnakeCase(name);
      default:
        return name;
    }
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

  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch')) {
      return str + 'es';
    } else {
      return str + 's';
    }
  }

  private getFileExtension(framework: string): string {
    const extensionMap: Record<string, string> = {
      nestjs: 'ts',
      'spring-boot': 'java',
      express: 'js',
      django: 'py',
    };

    return extensionMap[framework] || 'ts';
  }
}
