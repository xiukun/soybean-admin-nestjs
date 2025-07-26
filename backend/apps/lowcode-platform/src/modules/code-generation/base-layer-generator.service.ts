import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';

export interface BaseLayerConfig {
  framework: 'nestjs' | 'spring-boot' | 'express' | 'django';
  database: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  orm: 'typeorm' | 'prisma' | 'sequelize' | 'mongoose';
  features: {
    swagger: boolean;
    validation: boolean;
    authentication: boolean;
    authorization: boolean;
    caching: boolean;
    logging: boolean;
    testing: boolean;
    pagination: boolean;
    filtering: boolean;
    sorting: boolean;
  };
  naming: {
    convention: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase';
    prefix: string;
    suffix: string;
  };
  output: {
    baseDir: string;
    entityDir: string;
    dtoDir: string;
    serviceDir: string;
    controllerDir: string;
    moduleDir: string;
  };
}

export interface GeneratedBaseFile {
  path: string;
  content: string;
  type: 'entity' | 'dto' | 'service' | 'controller' | 'module' | 'test' | 'config';
  framework: string;
  overwritable: boolean;
}

@Injectable()
export class BaseLayerGeneratorService {
  private readonly logger = new Logger(BaseLayerGeneratorService.name);

  async generateBaseLayer(
    entity: any,
    relations: any[],
    config: BaseLayerConfig,
    user: AuthenticatedUser
  ): Promise<GeneratedBaseFile[]> {
    this.logger.log(`Generating base layer for entity: ${entity.name} with framework: ${config.framework}`);

    const files: GeneratedBaseFile[] = [];

    try {
      // 生成实体文件
      const entityFile = await this.generateEntity(entity, relations, config);
      files.push(entityFile);

      // 生成DTO文件
      const dtoFiles = await this.generateDTOs(entity, config);
      files.push(...dtoFiles);

      // 生成服务文件
      const serviceFile = await this.generateService(entity, relations, config);
      files.push(serviceFile);

      // 生成控制器文件
      const controllerFile = await this.generateController(entity, config);
      files.push(controllerFile);

      // 生成模块文件
      const moduleFile = await this.generateModule(entity, config);
      files.push(moduleFile);

      // 生成测试文件
      if (config.features.testing) {
        const testFiles = await this.generateTests(entity, config);
        files.push(...testFiles);
      }

      // 生成配置文件
      const configFiles = await this.generateConfigs(entity, config);
      files.push(...configFiles);

      this.logger.log(`Generated ${files.length} base layer files for entity: ${entity.name}`);
      return files;

    } catch (error) {
      this.logger.error(`Base layer generation failed: ${error.message}`);
      throw BusinessException.internalServerError('Base layer generation failed', error.message);
    }
  }

  private async generateEntity(entity: any, relations: any[], config: BaseLayerConfig): Promise<GeneratedBaseFile> {
    const entityName = this.formatName(entity.name, config.naming.convention);
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    let content = '';

    switch (config.framework) {
      case 'nestjs':
        content = this.generateNestJSEntity(entity, relations, config);
        break;
      case 'spring-boot':
        content = this.generateSpringBootEntity(entity, relations, config);
        break;
      case 'express':
        content = this.generateExpressEntity(entity, relations, config);
        break;
      case 'django':
        content = this.generateDjangoEntity(entity, relations, config);
        break;
    }

    return {
      path: `${config.output.entityDir}/${this.toKebabCase(entityName)}.entity.${this.getFileExtension(config.framework)}`,
      content,
      type: 'entity',
      framework: config.framework,
      overwritable: true,
    };
  }

  private generateNestJSEntity(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    const imports = [
      "import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';",
    ];

    if (config.features.swagger) {
      imports.push("import { ApiProperty } from '@nestjs/swagger';");
    }

    if (relations.length > 0) {
      imports.push("import { OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';");
    }

    const fields = entity.fields?.map((field: any) => {
      let fieldCode = '';
      
      if (config.features.swagger) {
        fieldCode += `  @ApiProperty({ description: '${field.description || field.name}' })\n`;
      }

      if (field.isPrimary) {
        fieldCode += `  @PrimaryGeneratedColumn('uuid')\n`;
      } else {
        const columnOptions = [];
        if (field.length) columnOptions.push(`length: ${field.length}`);
        if (field.isUnique) columnOptions.push(`unique: true`);
        if (!field.isRequired) columnOptions.push(`nullable: true`);
        if (field.defaultValue) columnOptions.push(`default: '${field.defaultValue}'`);

        const optionsStr = columnOptions.length > 0 ? `{ ${columnOptions.join(', ')} }` : '';
        fieldCode += `  @Column(${optionsStr})\n`;
      }

      fieldCode += `  ${field.name}${field.isRequired ? '' : '?'}: ${this.mapFieldType(field.type, 'typescript')};`;
      return fieldCode;
    }).join('\n\n') || '';

    const relationFields = relations.map(rel => {
      // 这里应该根据关系类型生成相应的装饰器和字段
      return `  // Relation: ${rel.name}`;
    }).join('\n');

    return `${imports.join('\n')}

@Entity('${tableName}')
export class ${entityName} {
${fields}

${relationFields}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`;
  }

  private generateSpringBootEntity(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    const imports = [
      'import javax.persistence.*;',
      'import java.time.LocalDateTime;',
      'import java.util.UUID;',
    ];

    if (config.features.validation) {
      imports.push('import javax.validation.constraints.*;');
    }

    const fields = entity.fields?.map((field: any) => {
      let fieldCode = '';
      
      if (field.isPrimary) {
        fieldCode += '    @Id\n    @GeneratedValue(strategy = GenerationType.AUTO)\n';
      } else {
        const columnOptions = [];
        if (field.length) columnOptions.push(`length = ${field.length}`);
        if (field.isUnique) columnOptions.push(`unique = true`);
        if (!field.isRequired) columnOptions.push(`nullable = true`);

        const optionsStr = columnOptions.length > 0 ? `(${columnOptions.join(', ')})` : '';
        fieldCode += `    @Column${optionsStr}\n`;
      }

      if (config.features.validation && field.isRequired) {
        fieldCode += '    @NotNull\n';
      }

      fieldCode += `    private ${this.mapFieldType(field.type, 'java')} ${field.name};`;
      return fieldCode;
    }).join('\n\n') || '';

    return `${imports.join('\n')}

@Entity
@Table(name = "${tableName}")
public class ${entityName} {
${fields}

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors, getters, and setters
    public ${entityName}() {}

    // Getters and setters would be generated here
}`;
  }

  private generateExpressEntity(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    if (config.orm === 'sequelize') {
      return this.generateSequelizeModel(entity, relations, config);
    } else if (config.orm === 'mongoose') {
      return this.generateMongooseModel(entity, relations, config);
    }

    return `// ${entityName} model for ${config.orm}`;
  }

  private generateDjangoEntity(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    const fields = entity.fields?.map((field: any) => {
      if (field.isPrimary) {
        return `    ${field.name} = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`;
      }

      const fieldType = this.mapFieldType(field.type, 'python');
      const options = [];
      
      if (field.length) options.push(`max_length=${field.length}`);
      if (!field.isRequired) options.push('null=True, blank=True');
      if (field.defaultValue) options.push(`default='${field.defaultValue}'`);

      const optionsStr = options.length > 0 ? `, ${options.join(', ')}` : '';
      return `    ${field.name} = models.${fieldType}(${optionsStr})`;
    }).join('\n') || '';

    return `import uuid
from django.db import models

class ${entityName}(models.Model):
${fields}
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '${tableName}'
        
    def __str__(self):
        return f"${entityName}({self.id})"`;
  }

  private async generateDTOs(entity: any, config: BaseLayerConfig): Promise<GeneratedBaseFile[]> {
    const files: GeneratedBaseFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');

    // Create DTO
    const createDto = this.generateCreateDTO(entity, config);
    files.push({
      path: `${config.output.dtoDir}/create-${this.toKebabCase(entity.name)}.dto.${this.getFileExtension(config.framework)}`,
      content: createDto,
      type: 'dto',
      framework: config.framework,
      overwritable: true,
    });

    // Update DTO
    const updateDto = this.generateUpdateDTO(entity, config);
    files.push({
      path: `${config.output.dtoDir}/update-${this.toKebabCase(entity.name)}.dto.${this.getFileExtension(config.framework)}`,
      content: updateDto,
      type: 'dto',
      framework: config.framework,
      overwritable: true,
    });

    // Query DTO
    const queryDto = this.generateQueryDTO(entity, config);
    files.push({
      path: `${config.output.dtoDir}/query-${this.toKebabCase(entity.name)}.dto.${this.getFileExtension(config.framework)}`,
      content: queryDto,
      type: 'dto',
      framework: config.framework,
      overwritable: true,
    });

    return files;
  }

  private generateCreateDTO(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    
    if (config.framework === 'nestjs') {
      const imports = ["import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';"];
      
      if (config.features.validation) {
        imports.push("import { IsString, IsOptional, IsNumber, IsBoolean, IsDate } from 'class-validator';");
      }

      const fields = entity.fields?.filter((field: any) => !field.isPrimary && field.name !== 'createdAt' && field.name !== 'updatedAt')
        .map((field: any) => {
          let fieldCode = '';
          
          if (field.isRequired) {
            fieldCode += `  @ApiProperty({ description: '${field.description || field.name}' })\n`;
          } else {
            fieldCode += `  @ApiPropertyOptional({ description: '${field.description || field.name}' })\n`;
          }

          if (config.features.validation) {
            if (field.isRequired) {
              fieldCode += `  @Is${this.getValidationType(field.type)}()\n`;
            } else {
              fieldCode += `  @IsOptional()\n  @Is${this.getValidationType(field.type)}()\n`;
            }
          }

          fieldCode += `  ${field.name}${field.isRequired ? '' : '?'}: ${this.mapFieldType(field.type, 'typescript')};`;
          return fieldCode;
        }).join('\n\n') || '';

      return `${imports.join('\n')}

export class Create${entityName}Dto {
${fields}
}`;
    }

    return `// Create${entityName}Dto for ${config.framework}`;
  }

  private generateUpdateDTO(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    
    if (config.framework === 'nestjs') {
      return `import { PartialType } from '@nestjs/swagger';
import { Create${entityName}Dto } from './create-${this.toKebabCase(entity.name)}.dto';

export class Update${entityName}Dto extends PartialType(Create${entityName}Dto) {}`;
    }

    return `// Update${entityName}Dto for ${config.framework}`;
  }

  private generateQueryDTO(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    
    if (config.framework === 'nestjs') {
      const imports = ["import { ApiPropertyOptional } from '@nestjs/swagger';"];
      
      if (config.features.validation) {
        imports.push("import { IsOptional, IsString, IsNumber } from 'class-validator';");
      }

      let fields = '';
      
      if (config.features.filtering) {
        fields += `  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

`;
      }

      if (config.features.pagination) {
        fields += `  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 20;

`;
      }

      if (config.features.sorting) {
        fields += `  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'] })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';`;
      }

      return `${imports.join('\n')}

export class Query${entityName}Dto {
${fields}
}`;
    }

    return `// Query${entityName}Dto for ${config.framework}`;
  }

  private async generateService(entity: any, relations: any[], config: BaseLayerConfig): Promise<GeneratedBaseFile> {
    const entityName = this.formatName(entity.name, 'pascalCase');
    let content = '';

    switch (config.framework) {
      case 'nestjs':
        content = this.generateNestJSService(entity, relations, config);
        break;
      case 'spring-boot':
        content = this.generateSpringBootService(entity, relations, config);
        break;
      default:
        content = `// ${entityName}Service for ${config.framework}`;
    }

    return {
      path: `${config.output.serviceDir}/${this.toKebabCase(entity.name)}-base.service.${this.getFileExtension(config.framework)}`,
      content,
      type: 'service',
      framework: config.framework,
      overwritable: true,
    };
  }

  private generateNestJSService(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    const imports = [
      "import { Injectable, Logger } from '@nestjs/common';",
      "import { InjectRepository } from '@nestjs/typeorm';",
      "import { Repository } from 'typeorm';",
      `import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';`,
      `import { Query${entityName}Dto } from '../dto/query-${this.toKebabCase(entity.name)}.dto';`,
    ];

    if (config.features.caching) {
      imports.push("import { CACHE_MANAGER, Inject } from '@nestjs/common';", "import { Cache } from 'cache-manager';");
    }

    return `${imports.join('\n')}

@Injectable()
export class ${entityName}BaseService {
  private readonly logger = new Logger(${entityName}BaseService.name);

  constructor(
    @InjectRepository(${entityName})
    private readonly ${entityNameLower}Repository: Repository<${entityName}>,${config.features.caching ? '\n    @Inject(CACHE_MANAGER)\n    private cacheManager: Cache,' : ''}
  ) {}

  async create(create${entityName}Dto: Create${entityName}Dto): Promise<${entityName}> {
    this.logger.log(\`Creating ${entityNameLower}: \${JSON.stringify(create${entityName}Dto)}\`);
    
    const ${entityNameLower} = this.${entityNameLower}Repository.create(create${entityName}Dto);
    const saved${entityName} = await this.${entityNameLower}Repository.save(${entityNameLower});
    
    ${config.features.caching ? `await this.cacheManager.del('${entityNameLower}s:*');` : ''}
    
    return saved${entityName};
  }

  async findAll(query${entityName}Dto: Query${entityName}Dto): Promise<{ data: ${entityName}[]; total: number }> {
    this.logger.log(\`Finding all ${entityNameLower}s with query: \${JSON.stringify(query${entityName}Dto)}\`);
    
    ${config.features.caching ? `const cacheKey = \`${entityNameLower}s:\${JSON.stringify(query${entityName}Dto)}\`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as { data: ${entityName}[]; total: number };
    }` : ''}

    const queryBuilder = this.${entityNameLower}Repository.createQueryBuilder('${entityNameLower}');

    ${config.features.filtering ? `if (query${entityName}Dto.search) {
      queryBuilder.where('${entityNameLower}.name ILIKE :search', { search: \`%\${query${entityName}Dto.search}%\` });
    }` : ''}

    ${config.features.sorting ? `if (query${entityName}Dto.sortBy) {
      queryBuilder.orderBy(\`${entityNameLower}.\${query${entityName}Dto.sortBy}\`, query${entityName}Dto.sortOrder || 'ASC');
    }` : ''}

    ${config.features.pagination ? `const page = query${entityName}Dto.page || 1;
    const pageSize = query${entityName}Dto.pageSize || 20;
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);` : ''}

    const [data, total] = await queryBuilder.getManyAndCount();
    
    const result = { data, total };
    ${config.features.caching ? `await this.cacheManager.set(cacheKey, result, 300);` : ''}
    
    return result;
  }

  async findOne(id: string): Promise<${entityName}> {
    this.logger.log(\`Finding ${entityNameLower} by id: \${id}\`);
    
    ${config.features.caching ? `const cacheKey = \`${entityNameLower}:\${id}\`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ${entityName};
    }` : ''}

    const ${entityNameLower} = await this.${entityNameLower}Repository.findOne({ where: { id } });
    
    ${config.features.caching ? `if (${entityNameLower}) {
      await this.cacheManager.set(cacheKey, ${entityNameLower}, 300);
    }` : ''}
    
    return ${entityNameLower};
  }

  async update(id: string, update${entityName}Dto: Update${entityName}Dto): Promise<${entityName}> {
    this.logger.log(\`Updating ${entityNameLower} \${id}: \${JSON.stringify(update${entityName}Dto)}\`);
    
    await this.${entityNameLower}Repository.update(id, update${entityName}Dto);
    
    ${config.features.caching ? `await this.cacheManager.del(\`${entityNameLower}:\${id}\`);
    await this.cacheManager.del('${entityNameLower}s:*');` : ''}
    
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(\`Removing ${entityNameLower}: \${id}\`);
    
    await this.${entityNameLower}Repository.delete(id);
    
    ${config.features.caching ? `await this.cacheManager.del(\`${entityNameLower}:\${id}\`);
    await this.cacheManager.del('${entityNameLower}s:*');` : ''}
  }
}`;
  }

  private generateSpringBootService(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    return `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

@Service
public class ${entityName}BaseService {
    
    @Autowired
    private ${entityName}Repository ${entityNameLower}Repository;
    
    public ${entityName} create(${entityName} ${entityNameLower}) {
        return ${entityNameLower}Repository.save(${entityNameLower});
    }
    
    public Page<${entityName}> findAll(Pageable pageable) {
        return ${entityNameLower}Repository.findAll(pageable);
    }
    
    public Optional<${entityName}> findById(UUID id) {
        return ${entityNameLower}Repository.findById(id);
    }
    
    public ${entityName} update(UUID id, ${entityName} ${entityNameLower}) {
        ${entityNameLower}.setId(id);
        return ${entityNameLower}Repository.save(${entityNameLower});
    }
    
    public void deleteById(UUID id) {
        ${entityNameLower}Repository.deleteById(id);
    }
}`;
  }

  private async generateController(entity: any, config: BaseLayerConfig): Promise<GeneratedBaseFile> {
    const entityName = this.formatName(entity.name, 'pascalCase');
    let content = '';

    switch (config.framework) {
      case 'nestjs':
        content = this.generateNestJSController(entity, config);
        break;
      case 'spring-boot':
        content = this.generateSpringBootController(entity, config);
        break;
      default:
        content = `// ${entityName}Controller for ${config.framework}`;
    }

    return {
      path: `${config.output.controllerDir}/${this.toKebabCase(entity.name)}-base.controller.${this.getFileExtension(config.framework)}`,
      content,
      type: 'controller',
      framework: config.framework,
      overwritable: true,
    };
  }

  private generateNestJSController(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const entityNamePlural = this.pluralize(entityNameLower);

    const imports = [
      "import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';",
      `import { ${entityName}BaseService } from '../services/${this.toKebabCase(entity.name)}-base.service';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entity.name)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entity.name)}.dto';`,
      `import { Query${entityName}Dto } from '../dto/query-${this.toKebabCase(entity.name)}.dto';`,
    ];

    if (config.features.swagger) {
      imports.push("import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';");
    }

    if (config.features.authentication) {
      imports.push("import { UseGuards } from '@nestjs/common';", "import { JwtAuthGuard } from '../guards/jwt-auth.guard';");
    }

    const decorators = [];
    if (config.features.swagger) {
      decorators.push(`@ApiTags('${entityNamePlural}')`);
    }
    if (config.features.authentication) {
      decorators.push('@UseGuards(JwtAuthGuard)');
    }

    return `${imports.join('\n')}

${decorators.join('\n')}
@Controller('${entityNamePlural}')
export class ${entityName}BaseController {
  constructor(private readonly ${entityNameLower}Service: ${entityName}BaseService) {}

  ${config.features.swagger ? `@ApiOperation({ summary: 'Create ${entityNameLower}' })
  @ApiResponse({ status: 201, description: 'The ${entityNameLower} has been successfully created.' })` : ''}
  @Post()
  create(@Body() create${entityName}Dto: Create${entityName}Dto) {
    return this.${entityNameLower}Service.create(create${entityName}Dto);
  }

  ${config.features.swagger ? `@ApiOperation({ summary: 'Get all ${entityNamePlural}' })
  @ApiResponse({ status: 200, description: 'Return all ${entityNamePlural}.' })` : ''}
  @Get()
  findAll(@Query() query${entityName}Dto: Query${entityName}Dto) {
    return this.${entityNameLower}Service.findAll(query${entityName}Dto);
  }

  ${config.features.swagger ? `@ApiOperation({ summary: 'Get ${entityNameLower} by id' })
  @ApiResponse({ status: 200, description: 'Return the ${entityNameLower}.' })` : ''}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${entityNameLower}Service.findOne(id);
  }

  ${config.features.swagger ? `@ApiOperation({ summary: 'Update ${entityNameLower}' })
  @ApiResponse({ status: 200, description: 'The ${entityNameLower} has been successfully updated.' })` : ''}
  @Patch(':id')
  update(@Param('id') id: string, @Body() update${entityName}Dto: Update${entityName}Dto) {
    return this.${entityNameLower}Service.update(id, update${entityName}Dto);
  }

  ${config.features.swagger ? `@ApiOperation({ summary: 'Delete ${entityNameLower}' })
  @ApiResponse({ status: 200, description: 'The ${entityNameLower} has been successfully deleted.' })` : ''}
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${entityNameLower}Service.remove(id);
  }
}`;
  }

  private generateSpringBootController(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');
    const entityNamePlural = this.pluralize(entityNameLower);

    return `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

@RestController
@RequestMapping("/api/${entityNamePlural}")
public class ${entityName}BaseController {
    
    @Autowired
    private ${entityName}BaseService ${entityNameLower}Service;
    
    @PostMapping
    public ResponseEntity<${entityName}> create(@RequestBody ${entityName} ${entityNameLower}) {
        ${entityName} created = ${entityNameLower}Service.create(${entityNameLower});
        return ResponseEntity.ok(created);
    }
    
    @GetMapping
    public ResponseEntity<Page<${entityName}>> findAll(Pageable pageable) {
        Page<${entityName}> ${entityNamePlural} = ${entityNameLower}Service.findAll(pageable);
        return ResponseEntity.ok(${entityNamePlural});
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<${entityName}> findById(@PathVariable UUID id) {
        return ${entityNameLower}Service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<${entityName}> update(@PathVariable UUID id, @RequestBody ${entityName} ${entityNameLower}) {
        ${entityName} updated = ${entityNameLower}Service.update(id, ${entityNameLower});
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        ${entityNameLower}Service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}`;
  }

  private async generateModule(entity: any, config: BaseLayerConfig): Promise<GeneratedBaseFile> {
    const entityName = this.formatName(entity.name, 'pascalCase');
    let content = '';

    if (config.framework === 'nestjs') {
      content = this.generateNestJSModule(entity, config);
    } else {
      content = `// ${entityName}Module for ${config.framework}`;
    }

    return {
      path: `${config.output.moduleDir}/${this.toKebabCase(entity.name)}.module.${this.getFileExtension(config.framework)}`,
      content,
      type: 'module',
      framework: config.framework,
      overwritable: true,
    };
  }

  private generateNestJSModule(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');

    const imports = [
      "import { Module } from '@nestjs/common';",
      "import { TypeOrmModule } from '@nestjs/typeorm';",
      `import { ${entityName} } from './entities/${this.toKebabCase(entity.name)}.entity';`,
      `import { ${entityName}BaseService } from './services/${this.toKebabCase(entity.name)}-base.service';`,
      `import { ${entityName}BaseController } from './controllers/${this.toKebabCase(entity.name)}-base.controller';`,
    ];

    if (config.features.caching) {
      imports.push("import { CacheModule } from '@nestjs/cache-manager';");
    }

    const moduleImports = [`TypeOrmModule.forFeature([${entityName}])`];
    if (config.features.caching) {
      moduleImports.push('CacheModule.register()');
    }

    return `${imports.join('\n')}

@Module({
  imports: [${moduleImports.join(', ')}],
  controllers: [${entityName}BaseController],
  providers: [${entityName}BaseService],
  exports: [${entityName}BaseService],
})
export class ${entityName}Module {}`;
  }

  private async generateTests(entity: any, config: BaseLayerConfig): Promise<GeneratedBaseFile[]> {
    const files: GeneratedBaseFile[] = [];
    const entityName = this.formatName(entity.name, 'pascalCase');

    // Service test
    const serviceTest = this.generateServiceTest(entity, config);
    files.push({
      path: `${config.output.serviceDir}/${this.toKebabCase(entity.name)}-base.service.spec.${this.getFileExtension(config.framework)}`,
      content: serviceTest,
      type: 'test',
      framework: config.framework,
      overwritable: true,
    });

    // Controller test
    const controllerTest = this.generateControllerTest(entity, config);
    files.push({
      path: `${config.output.controllerDir}/${this.toKebabCase(entity.name)}-base.controller.spec.${this.getFileExtension(config.framework)}`,
      content: controllerTest,
      type: 'test',
      framework: config.framework,
      overwritable: true,
    });

    return files;
  }

  private generateServiceTest(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    if (config.framework === 'nestjs') {
      return `import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${entityName}BaseService } from './${this.toKebabCase(entity.name)}-base.service';
import { ${entityName} } from '../entities/${this.toKebabCase(entity.name)}.entity';

describe('${entityName}BaseService', () => {
  let service: ${entityName}BaseService;
  let repository: Repository<${entityName}>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${entityName}BaseService,
        {
          provide: getRepositoryToken(${entityName}),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<${entityName}BaseService>(${entityName}BaseService);
    repository = module.get<Repository<${entityName}>>(getRepositoryToken(${entityName}));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ${entityNameLower}', async () => {
      const create${entityName}Dto = { /* test data */ };
      const ${entityNameLower} = { id: '1', ...create${entityName}Dto };

      jest.spyOn(repository, 'create').mockReturnValue(${entityNameLower} as any);
      jest.spyOn(repository, 'save').mockResolvedValue(${entityNameLower} as any);

      const result = await service.create(create${entityName}Dto);
      expect(result).toEqual(${entityNameLower});
    });
  });

  // Add more tests for other methods
});`;
    }

    return `// ${entityName}BaseService test for ${config.framework}`;
  }

  private generateControllerTest(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const entityNameLower = this.formatName(entity.name, 'camelCase');

    if (config.framework === 'nestjs') {
      return `import { Test, TestingModule } from '@nestjs/testing';
import { ${entityName}BaseController } from './${this.toKebabCase(entity.name)}-base.controller';
import { ${entityName}BaseService } from '../services/${this.toKebabCase(entity.name)}-base.service';

describe('${entityName}BaseController', () => {
  let controller: ${entityName}BaseController;
  let service: ${entityName}BaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${entityName}BaseController],
      providers: [
        {
          provide: ${entityName}BaseService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<${entityName}BaseController>(${entityName}BaseController);
    service = module.get<${entityName}BaseService>(${entityName}BaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a ${entityNameLower}', async () => {
      const create${entityName}Dto = { /* test data */ };
      const ${entityNameLower} = { id: '1', ...create${entityName}Dto };

      jest.spyOn(service, 'create').mockResolvedValue(${entityNameLower} as any);

      const result = await controller.create(create${entityName}Dto);
      expect(result).toEqual(${entityNameLower});
    });
  });

  // Add more tests for other methods
});`;
    }

    return `// ${entityName}BaseController test for ${config.framework}`;
  }

  private async generateConfigs(entity: any, config: BaseLayerConfig): Promise<GeneratedBaseFile[]> {
    const files: GeneratedBaseFile[] = [];

    // Generate repository interface for Spring Boot
    if (config.framework === 'spring-boot') {
      const repositoryInterface = this.generateSpringBootRepository(entity, config);
      files.push({
        path: `${config.output.serviceDir}/${this.formatName(entity.name, 'pascalCase')}Repository.java`,
        content: repositoryInterface,
        type: 'config',
        framework: config.framework,
        overwritable: true,
      });
    }

    return files;
  }

  private generateSpringBootRepository(entity: any, config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');

    return `import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ${entityName}Repository extends JpaRepository<${entityName}, UUID> {
    // Custom query methods can be added here
}`;
  }

  // Utility methods
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

  private mapFieldType(type: string, targetLanguage: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      typescript: {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        date: 'Date',
        datetime: 'Date',
        text: 'string',
        json: 'object',
      },
      java: {
        string: 'String',
        number: 'Long',
        boolean: 'Boolean',
        date: 'LocalDate',
        datetime: 'LocalDateTime',
        text: 'String',
        json: 'String',
      },
      python: {
        string: 'CharField',
        number: 'IntegerField',
        boolean: 'BooleanField',
        date: 'DateField',
        datetime: 'DateTimeField',
        text: 'TextField',
        json: 'JSONField',
      },
    };

    return typeMap[targetLanguage]?.[type] || 'String';
  }

  private getValidationType(type: string): string {
    const validationMap: Record<string, string> = {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      date: 'Date',
      datetime: 'Date',
      text: 'String',
      json: 'Object',
    };

    return validationMap[type] || 'String';
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

  private generateSequelizeModel(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');
    const tableName = entity.tableName || this.toSnakeCase(entity.name);

    return `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ${entityName} = sequelize.define('${entityName}', {
  // Model attributes will be defined here
}, {
  tableName: '${tableName}',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ${entityName};`;
  }

  private generateMongooseModel(entity: any, relations: any[], config: BaseLayerConfig): string {
    const entityName = this.formatName(entity.name, 'pascalCase');

    return `const mongoose = require('mongoose');

const ${entityName}Schema = new mongoose.Schema({
  // Schema definition will be here
}, {
  timestamps: true,
});

module.exports = mongoose.model('${entityName}', ${entityName}Schema);`;
  }
}
