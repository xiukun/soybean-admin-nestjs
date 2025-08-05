import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { EntityTemplateField } from './entity-template.service';

export interface CodeGenerationRequest {
  entityName: string;
  entityCode: string;
  fields: EntityTemplateField[];
  projectId: string;
  options: {
    generateBackend: boolean;
    generateFrontend: boolean;
    generateDatabase: boolean;
    generateTests: boolean;
    framework: 'nestjs' | 'express';
    frontendFramework: 'vue' | 'react' | 'angular';
    databaseType: 'postgresql' | 'mysql' | 'sqlite';
  };
}

export interface GeneratedCode {
  backend: {
    entity: string;
    dto: string;
    service: string;
    controller: string;
    module: string;
  };
  frontend: {
    listPage: string;
    formPage: string;
    detailPage: string;
    api: string;
    types: string;
  };
  database: {
    migration: string;
    schema: string;
  };
  tests: {
    unitTests: string;
    e2eTests: string;
  };
}

@Injectable()
export class EntityCodeGeneratorService {
  /**
   * 生成完整的实体代码
   */
  generateEntityCode(request: CodeGenerationRequest): GeneratedCode {
    const result: GeneratedCode = {
      backend: {
        entity: '',
        dto: '',
        service: '',
        controller: '',
        module: '',
      },
      frontend: {
        listPage: '',
        formPage: '',
        detailPage: '',
        api: '',
        types: '',
      },
      database: {
        migration: '',
        schema: '',
      },
      tests: {
        unitTests: '',
        e2eTests: '',
      },
    };

    if (request.options.generateBackend) {
      result.backend = this.generateBackendCode(request);
    }

    if (request.options.generateFrontend) {
      result.frontend = this.generateFrontendCode(request);
    }

    if (request.options.generateDatabase) {
      result.database = this.generateDatabaseCode(request);
    }

    if (request.options.generateTests) {
      result.tests = this.generateTestCode(request);
    }

    return result;
  }

  /**
   * 生成后端代码
   */
  private generateBackendCode(request: CodeGenerationRequest) {
    const { entityName, entityCode, fields } = request;

    return {
      entity: this.generateEntityClass(entityName, entityCode, fields),
      dto: this.generateDTOClasses(entityName, entityCode, fields),
      service: this.generateServiceClass(entityName, entityCode, fields),
      controller: this.generateControllerClass(entityName, entityCode, fields),
      module: this.generateModuleClass(entityName, entityCode),
    };
  }

  /**
   * 生成实体类
   */
  private generateEntityClass(entityName: string, entityCode: string, fields: EntityTemplateField[]): string {
    const fieldDefinitions = fields
      .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.code))
      .map(field => this.generateEntityField(field))
      .join('\n\n  ');

    return `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * ${entityName}实体
 */
@Entity('${entityCode.toLowerCase()}')
export class ${entityCode} {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  ${fieldDefinitions}

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
`;
  }

  /**
   * 生成实体字段定义
   */
  private generateEntityField(field: EntityTemplateField): string {
    const columnOptions = [];

    // 字段注释
    if (field.description) {
      columnOptions.push(`comment: '${field.description}'`);
    }

    // 数据类型和长度
    switch (field.dataType) {
      case FieldDataType.STRING:
        columnOptions.push(`type: 'varchar'`);
        if (field.length) {
          columnOptions.push(`length: ${field.length}`);
        }
        break;
      case FieldDataType.TEXT:
        columnOptions.push(`type: 'text'`);
        break;
      case FieldDataType.INTEGER:
        columnOptions.push(`type: 'int'`);
        break;
      case FieldDataType.DECIMAL:
        columnOptions.push(`type: 'decimal'`);
        if (field.precision) {
          columnOptions.push(`precision: ${field.precision}`);
          columnOptions.push(`scale: 2`);
        }
        break;
      case FieldDataType.BOOLEAN:
        columnOptions.push(`type: 'boolean'`);
        break;
      case FieldDataType.DATE:
        columnOptions.push(`type: 'date'`);
        break;
      case FieldDataType.DATETIME:
        columnOptions.push(`type: 'timestamp'`);
        break;
      case FieldDataType.JSON:
        columnOptions.push(`type: 'json'`);
        break;
    }

    // 必填
    if (!field.required) {
      columnOptions.push(`nullable: true`);
    }

    // 默认值
    if (field.defaultValue) {
      if (field.dataType === FieldDataType.STRING) {
        columnOptions.push(`default: '${field.defaultValue}'`);
      } else {
        columnOptions.push(`default: ${field.defaultValue}`);
      }
    }

    // 唯一约束
    if (field.unique) {
      columnOptions.push(`unique: true`);
    }

    const typeMapping = {
      [FieldDataType.STRING]: 'string',
      [FieldDataType.TEXT]: 'string',
      [FieldDataType.INTEGER]: 'number',
      [FieldDataType.DECIMAL]: 'number',
      [FieldDataType.BOOLEAN]: 'boolean',
      [FieldDataType.DATE]: 'Date',
      [FieldDataType.DATETIME]: 'Date',
      [FieldDataType.JSON]: 'any',
    };

    const tsType = typeMapping[field.dataType] || 'any';
    const nullable = field.required ? '' : ' | null';

    return `  /**
   * ${field.description || field.name}
   */
  @Column({ ${columnOptions.join(', ')} })
  ${field.code}: ${tsType}${nullable};`;
  }

  /**
   * 生成DTO类
   */
  private generateDTOClasses(entityName: string, entityCode: string, fields: EntityTemplateField[]): string {
    const businessFields = fields.filter(f => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(f.code));
    
    const createDtoFields = businessFields
      .map(field => this.generateDtoField(field, 'create'))
      .join('\n\n  ');

    const updateDtoFields = businessFields
      .map(field => this.generateDtoField(field, 'update'))
      .join('\n\n  ');

    return `import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 创建${entityName}DTO
 */
export class Create${entityCode}Dto {
  ${createDtoFields}
}

/**
 * 更新${entityName}DTO
 */
export class Update${entityCode}Dto {
  ${updateDtoFields}
}
`;
  }

  /**
   * 生成DTO字段
   */
  private generateDtoField(field: EntityTemplateField, type: 'create' | 'update'): string {
    const decorators = [];
    const isRequired = type === 'create' ? field.required : false;
    const isOptional = !isRequired;

    // API文档装饰器
    if (isOptional) {
      decorators.push(`@ApiPropertyOptional({ description: '${field.description || field.name}' })`);
    } else {
      decorators.push(`@ApiProperty({ description: '${field.description || field.name}' })`);
    }

    // 验证装饰器
    if (isOptional) {
      decorators.push('@IsOptional()');
    }

    switch (field.dataType) {
      case FieldDataType.STRING:
        if (!isOptional) {
          decorators.push('@IsNotEmpty()');
        }
        decorators.push('@IsString()');
        break;
      case FieldDataType.INTEGER:
      case FieldDataType.DECIMAL:
        decorators.push('@Type(() => Number)');
        decorators.push('@IsNumber()');
        break;
      case FieldDataType.BOOLEAN:
        decorators.push('@IsBoolean()');
        break;
    }

    const typeMapping = {
      [FieldDataType.STRING]: 'string',
      [FieldDataType.TEXT]: 'string',
      [FieldDataType.INTEGER]: 'number',
      [FieldDataType.DECIMAL]: 'number',
      [FieldDataType.BOOLEAN]: 'boolean',
      [FieldDataType.DATE]: 'string',
      [FieldDataType.DATETIME]: 'string',
      [FieldDataType.JSON]: 'any',
    };

    const tsType = typeMapping[field.dataType] || 'any';
    const nullable = isOptional ? '?' : '';

    return `  /**
   * ${field.description || field.name}
   */
  ${decorators.join('\n  ')}
  ${field.code}${nullable}: ${tsType};`;
  }

  /**
   * 生成服务类
   */
  private generateServiceClass(entityName: string, entityCode: string, fields: EntityTemplateField[]): string {
    const lowerEntityName = entityCode.toLowerCase();
    
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${entityCode} } from './${lowerEntityName}.entity';
import { Create${entityCode}Dto, Update${entityCode}Dto } from './${lowerEntityName}.dto';

/**
 * ${entityName}服务
 */
@Injectable()
export class ${entityCode}Service {
  constructor(
    @InjectRepository(${entityCode})
    private readonly ${lowerEntityName}Repository: Repository<${entityCode}>,
  ) {}

  /**
   * 创建${entityName}
   */
  async create(create${entityCode}Dto: Create${entityCode}Dto): Promise<${entityCode}> {
    const ${lowerEntityName} = this.${lowerEntityName}Repository.create(create${entityCode}Dto);
    return await this.${lowerEntityName}Repository.save(${lowerEntityName});
  }

  /**
   * 查询${entityName}列表
   */
  async findAll(): Promise<${entityCode}[]> {
    return await this.${lowerEntityName}Repository.find();
  }

  /**
   * 根据ID查询${entityName}
   */
  async findOne(id: string): Promise<${entityCode}> {
    const ${lowerEntityName} = await this.${lowerEntityName}Repository.findOne({ where: { id } });
    if (!${lowerEntityName}) {
      throw new NotFoundException('${entityName}不存在');
    }
    return ${lowerEntityName};
  }

  /**
   * 更新${entityName}
   */
  async update(id: string, update${entityCode}Dto: Update${entityCode}Dto): Promise<${entityCode}> {
    await this.findOne(id);
    await this.${lowerEntityName}Repository.update(id, update${entityCode}Dto);
    return this.findOne(id);
  }

  /**
   * 删除${entityName}
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.${lowerEntityName}Repository.delete(id);
  }
}
`;
  }

  /**
   * 生成控制器类
   */
  private generateControllerClass(entityName: string, entityCode: string, fields: EntityTemplateField[]): string {
    const lowerEntityName = entityCode.toLowerCase();
    
    return `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${entityCode}Service } from './${lowerEntityName}.service';
import { Create${entityCode}Dto, Update${entityCode}Dto } from './${lowerEntityName}.dto';
import { ${entityCode} } from './${lowerEntityName}.entity';

/**
 * ${entityName}控制器
 */
@ApiTags('${entityName}管理')
@Controller('${lowerEntityName}')
export class ${entityCode}Controller {
  constructor(private readonly ${lowerEntityName}Service: ${entityCode}Service) {}

  /**
   * 创建${entityName}
   */
  @Post()
  @ApiOperation({ summary: '创建${entityName}' })
  @ApiResponse({ status: 201, description: '创建成功', type: ${entityCode} })
  create(@Body() create${entityCode}Dto: Create${entityCode}Dto) {
    return this.${lowerEntityName}Service.create(create${entityCode}Dto);
  }

  /**
   * 查询${entityName}列表
   */
  @Get()
  @ApiOperation({ summary: '查询${entityName}列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.${lowerEntityName}Service.findAll();
  }

  /**
   * 根据ID查询${entityName}
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID查询${entityName}' })
  @ApiResponse({ status: 200, description: '查询成功', type: ${entityCode} })
  findOne(@Param('id') id: string) {
    return this.${lowerEntityName}Service.findOne(id);
  }

  /**
   * 更新${entityName}
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新${entityName}' })
  @ApiResponse({ status: 200, description: '更新成功', type: ${entityCode} })
  update(@Param('id') id: string, @Body() update${entityCode}Dto: Update${entityCode}Dto) {
    return this.${lowerEntityName}Service.update(id, update${entityCode}Dto);
  }

  /**
   * 删除${entityName}
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除${entityName}' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.${lowerEntityName}Service.remove(id);
  }
}
`;
  }

  /**
   * 生成模块类
   */
  private generateModuleClass(entityName: string, entityCode: string): string {
    const lowerEntityName = entityCode.toLowerCase();
    
    return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${entityCode}Service } from './${lowerEntityName}.service';
import { ${entityCode}Controller } from './${lowerEntityName}.controller';
import { ${entityCode} } from './${lowerEntityName}.entity';

/**
 * ${entityName}模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([${entityCode}])],
  controllers: [${entityCode}Controller],
  providers: [${entityCode}Service],
  exports: [${entityCode}Service],
})
export class ${entityCode}Module {}
`;
  }

  /**
   * 生成前端代码
   */
  private generateFrontendCode(request: CodeGenerationRequest) {
    return {
      listPage: '',
      formPage: '',
      detailPage: '',
      api: '',
      types: '',
    };
  }

  /**
   * 生成数据库代码
   */
  private generateDatabaseCode(request: CodeGenerationRequest) {
    return {
      migration: '',
      schema: '',
    };
  }

  /**
   * 生成测试代码
   */
  private generateTestCode(request: CodeGenerationRequest) {
    return {
      unitTests: '',
      e2eTests: '',
    };
  }

  /**
   * 转换为蛇形命名
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
}