import { Injectable } from '@nestjs/common';
import { CodeTemplate } from '../interfaces/code-template.interface';

@Injectable()
export class BaseBizArchitectureTemplate {
  
  /**
   * Generate base directory structure for generated code
   */
  generateBaseStructure(projectName: string, entities: any[]): CodeTemplate[] {
    const templates: CodeTemplate[] = [];

    // Base directory structure
    templates.push({
      path: `${projectName}/base/README.md`,
      content: this.generateBaseReadme(projectName),
      type: 'documentation'
    });

    // Generate base models
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/base/models/${entity.code}.base.ts`,
        content: this.generateBaseModel(entity),
        type: 'model'
      });
    });

    // Generate base services
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/base/services/${entity.code}.base.service.ts`,
        content: this.generateBaseService(entity),
        type: 'service'
      });
    });

    // Generate base controllers
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/base/controllers/${entity.code}.base.controller.ts`,
        content: this.generateBaseController(entity),
        type: 'controller'
      });
    });

    // Generate base DTOs
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/base/dto/${entity.code}.base.dto.ts`,
        content: this.generateBaseDto(entity),
        type: 'dto'
      });
    });

    return templates;
  }

  /**
   * Generate biz directory structure for business customizations
   */
  generateBizStructure(projectName: string, entities: any[]): CodeTemplate[] {
    const templates: CodeTemplate[] = [];

    // Biz directory structure
    templates.push({
      path: `${projectName}/biz/README.md`,
      content: this.generateBizReadme(projectName),
      type: 'documentation'
    });

    // Generate biz services (extending base)
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/biz/services/${entity.code}.service.ts`,
        content: this.generateBizService(entity),
        type: 'service'
      });
    });

    // Generate biz controllers (extending base)
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/biz/controllers/${entity.code}.controller.ts`,
        content: this.generateBizController(entity),
        type: 'controller'
      });
    });

    // Generate biz DTOs (extending base)
    entities.forEach(entity => {
      templates.push({
        path: `${projectName}/biz/dto/${entity.code}.dto.ts`,
        content: this.generateBizDto(entity),
        type: 'dto'
      });
    });

    // Generate module files
    templates.push({
      path: `${projectName}/biz/${projectName}.module.ts`,
      content: this.generateBizModule(projectName, entities),
      type: 'module'
    });

    return templates;
  }

  private generateBaseReadme(projectName: string): string {
    return `# Base Directory - ${projectName}

## ⚠️ IMPORTANT WARNING ⚠️

**DO NOT MODIFY FILES IN THIS DIRECTORY**

This directory contains auto-generated base code that will be **OVERWRITTEN** 
every time the code generation process runs.

## What's in this directory?

- **Models**: Base entity definitions with core fields and relationships
- **Services**: Base service classes with standard CRUD operations
- **Controllers**: Base controller classes with standard REST endpoints
- **DTOs**: Base Data Transfer Objects for API requests/responses

## How to customize?

All customizations should be made in the \`../biz/\` directory, which contains:
- Extended services that inherit from base services
- Extended controllers that inherit from base controllers
- Custom DTOs that extend base DTOs
- Business logic implementations

## Architecture Pattern

This follows the **Base/Biz Architecture Pattern**:

\`\`\`
base/           <- Auto-generated, DO NOT MODIFY
├── models/
├── services/
├── controllers/
└── dto/

biz/            <- Your customizations go here
├── services/   <- Extend base services
├── controllers/← Extend base controllers
├── dto/        <- Extend base DTOs
└── custom/     <- Your custom business logic
\`\`\`

## Benefits

1. **Separation of Concerns**: Generated code vs. business logic
2. **Upgrade Safety**: Regenerate base code without losing customizations
3. **Maintainability**: Clear distinction between auto-generated and custom code
4. **Extensibility**: Easy to extend base functionality in biz layer

## Example Usage

\`\`\`typescript
// ❌ DON'T: Modify base service directly
// base/services/user.base.service.ts

// ✅ DO: Extend in biz layer
// biz/services/user.service.ts
import { UserBaseService } from '@lib/base/services/user.base.service';

@Injectable()
export class UserService extends UserBaseService {
  // Add your custom methods here
  async findActiveUsers() {
    return this.findAll({ where: { status: 'ACTIVE' } });
  }
}
\`\`\`
`;
  }

  private generateBizReadme(projectName: string): string {
    return `# Business Logic Directory - ${projectName}

## 🎯 Your Customizations Go Here

This directory is for your business logic customizations and extensions.
Files in this directory are **SAFE FROM REGENERATION**.

## Directory Structure

\`\`\`
biz/
├── services/       <- Extend base services with business logic
├── controllers/    <- Extend base controllers with custom endpoints
├── dto/           <- Extend base DTOs with additional fields
├── custom/        <- Your completely custom business logic
├── utils/         <- Utility functions and helpers
├── validators/    <- Custom validation logic
├── decorators/    <- Custom decorators
└── interfaces/    <- Custom interfaces and types
\`\`\`

## How to Extend Base Classes

### Extending Services

\`\`\`typescript
import { Injectable } from '@nestjs/common';
import { UserBaseService } from '@lib/base/services/user.base.service';

@Injectable()
export class UserService extends UserBaseService {
  // Override base methods if needed
  async create(createUserDto: CreateUserDto) {
    // Add custom validation
    await this.validateBusinessRules(createUserDto);
    
    // Call base implementation
    return super.create(createUserDto);
  }

  // Add custom methods
  async findActiveUsers() {
    return this.findAll({ where: { status: 'ACTIVE' } });
  }

  private async validateBusinessRules(dto: CreateUserDto) {
    // Your custom validation logic
  }
}
\`\`\`

### Extending Controllers

\`\`\`typescript
import { Controller, Get, Post } from '@nestjs/common';
import { UserBaseController } from '@lib/base/controllers/user.base.controller';
import { UserService } from '@code-generation/services/user.service';

@Controller('users')
export class UserController extends UserBaseController {
  constructor(
    protected readonly userService: UserService
  ) {
    super(userService);
  }

  // Add custom endpoints
  @Get('active')
  async getActiveUsers() {
    return this.userService.findActiveUsers();
  }

  @Post('bulk-import')
  async bulkImport(@Body() data: BulkImportDto) {
    // Your custom bulk import logic
  }
}
\`\`\`

### Extending DTOs

\`\`\`typescript
import { IsOptional, IsString } from 'class-validator';
import { CreateUserBaseDto } from '@lib/base/dto/user.base.dto';

export class CreateUserDto extends CreateUserBaseDto {
  @IsOptional()
  @IsString()
  customField?: string;

  @IsOptional()
  @IsString()
  businessSpecificProperty?: string;
}
\`\`\`

## Best Practices

1. **Always extend base classes** instead of creating from scratch
2. **Use dependency injection** for services
3. **Add proper validation** for custom fields
4. **Document your customizations** with comments
5. **Follow naming conventions** (same as base but without .base suffix)
6. **Test your customizations** thoroughly

## Custom Business Logic

For completely custom business logic that doesn't extend base classes:

\`\`\`
biz/custom/
├── analytics/          <- Custom analytics services
├── integrations/       <- Third-party integrations
├── workflows/          <- Business workflow implementations
├── notifications/      <- Custom notification logic
└── reports/           <- Custom reporting logic
\`\`\`

## Module Configuration

The main module file (\`${projectName}.module.ts\`) automatically:
- Imports all base modules
- Registers biz services and controllers
- Configures dependency injection
- Sets up middleware and guards

## Hot Reload Support

This architecture supports hot reloading:
- Base code regeneration won't affect running application
- Biz layer changes trigger automatic reload
- Database schema updates are handled gracefully

## Need Help?

- Check the base classes for available methods and properties
- Look at generated examples in the base directory
- Refer to the main project documentation
- Use TypeScript IntelliSense for auto-completion
`;
  }

  private generateBaseModel(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);
    const fields = entity.fields || [];

    return `// AUTO-GENERATED FILE - DO NOT MODIFY
// This file will be overwritten on next code generation
// Prisma schema for ${pascalName}

model ${pascalName} {
  id String @id @default(cuid())
${fields.map(field => this.generatePrismaFieldDefinition(field)).join('\n')}

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Soft delete support
  deletedAt DateTime? @map("deleted_at")
  createdBy String? @map("created_by")
  updatedBy String? @map("updated_by")

  @@map("${entity.tableName}")
}
`;
  }

  private generateBaseService(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);
    const camelName = this.toCamelCase(entity.code);

    return `// AUTO-GENERATED FILE - DO NOT MODIFY
// This file will be overwritten on next code generation

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ${pascalName} } from '@prisma/client';
import { Create${pascalName}BaseDto, Update${pascalName}BaseDto, ${pascalName}QueryBaseDto } from '../dto/${entity.code}.base.dto';

@Injectable()
export class ${pascalName}BaseService {
  constructor(
    protected readonly prisma: PrismaService,
  ) {}

  async findAll(query: ${pascalName}QueryBaseDto = {}): Promise<{
    records: ${pascalName}[];
    total: number;
    current: number;
    size: number;
  }> {
    const { current = 1, size = 10, ...filters } = query;
    const skip = (current - 1) * size;

    const where = this.buildWhereClause(filters);
    
    const [records, total] = await Promise.all([
      this.prisma.${camelName}.findMany({
        skip,
        take: size,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.${camelName}.count({ where }),
    ]);

    return {
      records,
      total,
      current,
      size,
    };
  }

  async findOne(id: string): Promise<${pascalName}> {
    const ${camelName} = await this.prisma.${camelName}.findFirst({
      where: { 
        id, 
        deletedAt: null 
      },
    });

    if (!${camelName}) {
      throw new NotFoundException(\`${pascalName} with ID \${id} not found\`);
    }

    return ${camelName};
  }

  async create(createDto: Create${pascalName}BaseDto, userId?: string): Promise<${pascalName}> {
    return this.prisma.${camelName}.create({
      data: {
        ...createDto,
        createdBy: userId,
      },
    });
  }

  async update(id: string, updateDto: Update${pascalName}BaseDto, userId?: string): Promise<${pascalName}> {
    await this.findOne(id); // Ensure entity exists

    return this.prisma.${camelName}.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId?: string): Promise<void> {
    await this.findOne(id); // Ensure entity exists

    // Soft delete
    await this.prisma.${camelName}.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async restore(id: string, userId?: string): Promise<${pascalName}> {
    await this.prisma.${camelName}.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedBy: userId,
      },
    });

    return this.findOne(id);
  }

  protected buildWhereClause(filters: any): any {
    const where: any = { deletedAt: null };

    // Add dynamic filters based on entity fields
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        where[key] = filters[key];
      }
    });

    return where;
  }

  // Utility methods for subclasses
  protected async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  protected async count(filters: any = {}): Promise<number> {
    return this.repository.count({
      where: this.buildWhereClause(filters),
    });
  }
}
`;
  }

  private generateBaseController(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);
    const kebabName = this.toKebabCase(entity.code);

    return `// AUTO-GENERATED FILE - DO NOT MODIFY
// This file will be overwritten on next code generation

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@decorators/current-user.decorator';
import { ${pascalName}BaseService } from '../services/${entity.code}.base.service';
import {
  Create${pascalName}BaseDto,
  Update${pascalName}BaseDto,
  ${pascalName}QueryBaseDto,
  ${pascalName}ResponseDto,
} from '../dto/${entity.code}.base.dto';

@Controller('${kebabName}s')
@ApiTags('${pascalName} Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ${pascalName}BaseController {
  constructor(
    protected readonly ${this.toCamelCase(entity.code)}Service: ${pascalName}BaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved ${entity.name} list',
    type: [${pascalName}ResponseDto],
  })
  @ApiQuery({ name: 'current', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async findAll(@Query() query: ${pascalName}QueryBaseDto) {
    return this.${this.toCamelCase(entity.code)}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${entity.name} by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved ${entity.name}',
    type: ${pascalName}ResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '${pascalName} not found',
  })
  async findOne(@Param('id') id: string) {
    return this.${this.toCamelCase(entity.code)}Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '${pascalName} created successfully',
    type: ${pascalName}ResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createDto: Create${pascalName}BaseDto,
    @CurrentUser() user: any,
  ) {
    return this.${this.toCamelCase(entity.code)}Service.create(createDto, user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '${pascalName} updated successfully',
    type: ${pascalName}ResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '${pascalName} not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Update${pascalName}BaseDto,
    @CurrentUser() user: any,
  ) {
    return this.${this.toCamelCase(entity.code)}Service.update(id, updateDto, user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '${pascalName} deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '${pascalName} not found',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.${this.toCamelCase(entity.code)}Service.remove(id, user?.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '${pascalName} restored successfully',
    type: ${pascalName}ResponseDto,
  })
  async restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.${this.toCamelCase(entity.code)}Service.restore(id, user?.id);
  }
}
`;
  }

  private generateBaseDto(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);
    const fields = entity.fields || [];

    return `// AUTO-GENERATED FILE - DO NOT MODIFY
// This file will be overwritten on next code generation

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class Create${pascalName}BaseDto {
${fields.filter(f => !f.primaryKey && f.code !== 'createdAt' && f.code !== 'updatedAt')
  .map(field => this.generateDtoField(field, false)).join('\n')}
}

export class Update${pascalName}BaseDto extends PartialType(Create${pascalName}BaseDto) {}

export class ${pascalName}QueryBaseDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  current?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  size?: number = 10;

${fields.filter(f => this.isFilterableField(f))
  .map(field => this.generateDtoField(field, true)).join('\n')}
}

export class ${pascalName}ResponseDto {
  @ApiProperty()
  id: string;

${fields.map(field => this.generateResponseField(field)).join('\n')}

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  updatedBy?: string;
}
`;
  }

  // Helper methods for code generation
  private generateFieldDefinition(field: any): string {
    const decorators = [];
    
    if (field.primaryKey) {
      decorators.push('@PrimaryGeneratedColumn("uuid")');
    } else {
      const columnOptions = [];
      
      if (field.type === 'VARCHAR' && field.length) {
        columnOptions.push(`length: ${field.length}`);
      }
      if (field.nullable) {
        columnOptions.push('nullable: true');
      }
      if (field.unique) {
        columnOptions.push('unique: true');
      }
      if (field.defaultValue) {
        columnOptions.push(`default: '${field.defaultValue}'`);
      }

      const optionsStr = columnOptions.length > 0 ? `{ ${columnOptions.join(', ')} }` : '';
      decorators.push(`@Column(${optionsStr})`);
    }

    const typeMapping = {
      'UUID': 'string',
      'VARCHAR': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'Date',
      'TIME': 'string',
      'TIMESTAMP': 'Date',
      'BIGINT': 'number'
    };

    const tsType = typeMapping[field.type] || 'string';
    const optional = field.nullable ? '?' : '';

    return `  ${decorators.join('\n  ')}\n  ${field.code}${optional}: ${tsType};`;
  }

  private generatePrismaFieldDefinition(field: any): string {
    if (field.isPrimaryKey) {
      return '';
    }

    const typeMapping = {
      'UUID': 'String',
      'VARCHAR': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'DECIMAL': 'Float',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'TIME': 'String',
      'TIMESTAMP': 'DateTime',
      'BIGINT': 'BigInt'
    };

    const prismaType = typeMapping[field.type] || 'String';
    const optional = field.nullable ? '?' : '';
    const attributes = [];

    if (field.unique) {
      attributes.push('@unique');
    }
    if (field.defaultValue) {
      const defaultVal = field.type === 'VARCHAR' || field.type === 'TEXT' ? `"${field.defaultValue}"` : field.defaultValue;
      attributes.push(`@default(${defaultVal})`);
    }
    attributes.push(`@map("${field.code}")`);

    const attributeStr = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
    return `  ${field.code} ${prismaType}${optional}${attributeStr}`;
  }

  private generateDtoField(field: any, isOptional: boolean): string {
    const validators = [];
    const apiDecorator = isOptional ? '@ApiPropertyOptional' : '@ApiProperty';
    
    if (isOptional) {
      validators.push('@IsOptional()');
    }

    switch (field.type) {
      case 'UUID':
        validators.push('@IsUUID()');
        break;
      case 'VARCHAR':
      case 'TEXT':
        validators.push('@IsString()');
        break;
      case 'INTEGER':
      case 'DECIMAL':
      case 'BIGINT':
        validators.push('@IsNumber()');
        break;
      case 'BOOLEAN':
        validators.push('@IsBoolean()');
        break;
      case 'DATE':
      case 'TIMESTAMP':
        validators.push('@IsDateString()');
        break;
    }

    const optional = isOptional || field.nullable ? '?' : '';
    const typeMapping = {
      'UUID': 'string',
      'VARCHAR': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'string',
      'TIME': 'string',
      'TIMESTAMP': 'string',
      'BIGINT': 'number'
    };

    const tsType = typeMapping[field.type] || 'string';

    return `  ${apiDecorator}({ description: '${field.comment || field.name}' })
  ${validators.join('\n  ')}
  ${field.code}${optional}: ${tsType};`;
  }

  private generateResponseField(field: any): string {
    const apiDecorator = field.nullable ? '@ApiPropertyOptional' : '@ApiProperty';
    const optional = field.nullable ? '?' : '';
    
    const typeMapping = {
      'UUID': 'string',
      'VARCHAR': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'Date',
      'TIME': 'string',
      'TIMESTAMP': 'Date',
      'BIGINT': 'number'
    };

    const tsType = typeMapping[field.type] || 'string';

    return `  ${apiDecorator}({ description: '${field.comment || field.name}' })
  ${field.code}${optional}: ${tsType};`;
  }

  private generateBizService(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);

    return `import { Injectable } from '@nestjs/common';
import { ${pascalName}BaseService } from '../../base/services/${entity.code}.base.service';

@Injectable()
export class ${pascalName}Service extends ${pascalName}BaseService {
  // Add your custom business logic here
  
  // Example: Override base method with custom logic
  // async create(createDto: Create${pascalName}Dto, userId?: string) {
  //   // Add custom validation or processing
  //   await this.validateBusinessRules(createDto);
  //   
  //   // Call base implementation
  //   return super.create(createDto, userId);
  // }

  // Example: Add custom method
  // async findActive() {
  //   return this.findAll({ status: 'ACTIVE' });
  // }

  // private async validateBusinessRules(dto: any) {
  //   // Your custom validation logic
  // }
}
`;
  }

  private generateBizController(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);
    const kebabName = this.toKebabCase(entity.code);

    return `import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${pascalName}BaseController } from '../../base/controllers/${entity.code}.base.controller';
import { ${pascalName}Service } from '../services/${entity.code}.service';

@Controller('${kebabName}s')
@ApiTags('${pascalName} Management')
export class ${pascalName}Controller extends ${pascalName}BaseController {
  constructor(
    protected readonly ${this.toCamelCase(entity.code)}Service: ${pascalName}Service,
  ) {
    super(${this.toCamelCase(entity.code)}Service);
  }

  // Add your custom endpoints here
  
  // Example: Custom endpoint
  // @Get('active')
  // @ApiOperation({ summary: 'Get active ${entity.name}' })
  // async getActive() {
  //   return this.${this.toCamelCase(entity.code)}Service.findActive();
  // }
}
`;
  }

  private generateBizDto(entity: any): string {
    const pascalName = this.toPascalCase(entity.code);

    return `import { Create${pascalName}BaseDto, Update${pascalName}BaseDto, ${pascalName}QueryBaseDto } from '../../base/dto/${entity.code}.base.dto';

// Extend base DTOs with your custom fields
export class Create${pascalName}Dto extends Create${pascalName}BaseDto {
  // Add your custom fields here
  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsString()
  // customField?: string;
}

export class Update${pascalName}Dto extends Update${pascalName}BaseDto {
  // Add your custom fields here
}

export class ${pascalName}QueryDto extends ${pascalName}QueryBaseDto {
  // Add your custom query parameters here
}

// Re-export base response DTO or extend it
export { ${pascalName}ResponseDto } from '../../base/dto/${entity.code}.base.dto';
`;
  }

  private generateBizModule(projectName: string, entities: any[]): string {
    const pascalProjectName = this.toPascalCase(projectName);
    
    return `import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Import biz services
${entities.map(entity => 
  `import { ${this.toPascalCase(entity.code)}Service } from './services/${entity.code}.service';`
).join('\n')}

// Import biz controllers
${entities.map(entity => 
  `import { ${this.toPascalCase(entity.code)}Controller } from './controllers/${entity.code}.controller';`
).join('\n')}

@Module({
  imports: [
  ],
  controllers: [
${entities.map(entity => `    ${this.toPascalCase(entity.code)}Controller,`).join('\n')}
  ],
  providers: [
    PrismaService,
${entities.map(entity => `    ${this.toPascalCase(entity.code)}Service,`).join('\n')}
  ],
  exports: [
    PrismaService,
${entities.map(entity => `    ${this.toPascalCase(entity.code)}Service,`).join('\n')}
  ],
})
export class ${pascalProjectName}Module {}
`;
  }

  private isFilterableField(field: any): boolean {
    return ['VARCHAR', 'TEXT', 'INTEGER', 'BOOLEAN', 'DATE'].includes(field.type) && 
           !field.primaryKey;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toKebabCase(str: string): string {
    return str.replace(/_/g, '-').toLowerCase();
  }
}
