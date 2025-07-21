-- 更新现有模板为Prisma兼容版本
-- 执行时间: 2024-01-01

-- 删除旧的TypeORM模板
DELETE FROM lowcode_code_templates WHERE code IN (
  'nestjs-entity-model',
  'nestjs-service',
  'nestjs-controller'
);

-- 插入新的Prisma兼容模板
INSERT INTO lowcode_code_templates (id, name, code, type, language, framework, description, template, variables, created_by) VALUES

-- Prisma Schema 模板
('tpl-prisma-schema', 'Prisma Schema模型', 'prisma-schema', 'ENTITY_MODEL', 'TYPESCRIPT', 'NESTJS', 'Prisma Schema模型定义',
'// {{entityName}} model for {{projectName}}
model {{entityName}} {
  id        String   @id @default(cuid())
{{#each businessFields}}
  {{this.code}}{{#if this.nullable}}?{{/if}}     {{this.prismaType}}{{#if this.isUnique}} @unique{{/if}}{{#if this.comment}} // {{this.comment}}{{/if}}
{{/each}}
  
  // System fields
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
{{#if settings.enableAudit}}
  createdBy String?  @map("created_by")
  updatedBy String?  @map("updated_by")
{{/if}}
{{#if settings.enableSoftDelete}}
  deletedAt DateTime? @map("deleted_at")
{{/if}}
{{#if settings.enableVersioning}}
  version   Int      @default(1)
{{/if}}
{{#if settings.enableTenancy}}
  tenantId  String?  @map("tenant_id")
{{/if}}
{{#if settings.enableStatus}}
  status    String   @default("ACTIVE")
{{/if}}

{{#each relationships}}
  // {{this.description}}
  {{this.relationshipName}} {{this.targetEntityName}}{{#if (eq this.relationType "oneToMany")}}[]{{/if}}{{#unless this.isRequired}}?{{/unless}}
{{/each}}

  @@map("{{tableName}}")
}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"tableName","type":"string","description":"数据库表名"},{"name":"businessFields","type":"array","description":"业务字段列表"},{"name":"relationships","type":"array","description":"关系列表"},{"name":"settings","type":"object","description":"项目设置"}]',
'system'),

-- TypeScript 接口模板
('tpl-ts-interface', 'TypeScript接口', 'ts-interface', 'ENTITY_DTO', 'TYPESCRIPT', 'NESTJS', 'TypeScript实体接口定义',
'/**
 * {{entityDescription}}
 * Generated on {{currentDate}}
 */
export interface {{entityName}} {
  id: string;
{{#each businessFields}}
  {{this.code}}: {{this.tsType}}{{#if this.nullable}} | null{{/if}};{{#if this.comment}} // {{this.comment}}{{/if}}
{{/each}}
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
{{#if settings.enableAudit}}
  createdBy: string | null;
  updatedBy: string | null;
{{/if}}
{{#if settings.enableSoftDelete}}
  deletedAt: Date | null;
{{/if}}
{{#if settings.enableVersioning}}
  version: number;
{{/if}}
{{#if settings.enableTenancy}}
  tenantId: string | null;
{{/if}}
{{#if settings.enableStatus}}
  status: string;
{{/if}}
}

/**
 * Create input for {{entityName}}
 */
export interface Create{{entityName}}Input {
{{#each businessFields}}
{{#unless this.nullable}}
  {{this.code}}: {{this.tsType}};{{#if this.comment}} // {{this.comment}}{{/if}}
{{/unless}}
{{/each}}
{{#each businessFields}}
{{#if this.nullable}}
  {{this.code}}?: {{this.tsType}} | null;{{#if this.comment}} // {{this.comment}}{{/if}}
{{/if}}
{{/each}}
}

/**
 * Update input for {{entityName}}
 */
export interface Update{{entityName}}Input {
{{#each businessFields}}
  {{this.code}}?: {{this.tsType}}{{#if this.nullable}} | null{{/if}};{{#if this.comment}} // {{this.comment}}{{/if}}
{{/each}}
}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"businessFields","type":"array","description":"业务字段列表"},{"name":"settings","type":"object","description":"项目设置"},{"name":"currentDate","type":"string","description":"当前日期"}]',
'system'),

-- NestJS Prisma Service 模板
('tpl-nestjs-prisma-service', 'NestJS Prisma服务', 'nestjs-prisma-service', 'ENTITY_SERVICE', 'TYPESCRIPT', 'NESTJS', 'NestJS Prisma服务类',
'import { Injectable, NotFoundException, BadRequestException } from ''@nestjs/common'';
import { PrismaService } from ''../prisma/prisma.service'';
import { {{entityName}}, Create{{entityName}}Input, Update{{entityName}}Input } from ''./interfaces/{{kebabCase entityName}}.interface'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto } from ''./dto/{{kebabCase entityName}}.dto'';
import { Prisma } from ''@prisma/client'';

/**
 * {{entityDescription}} Service
 * Generated on {{currentDate}}
 */
@Injectable()
export class {{entityName}}Service {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建{{entityDescription}}
   */
  async create(create{{entityName}}Dto: Create{{entityName}}Dto, userId?: string): Promise<{{entityName}}ResponseDto> {
    try {
      const data: Prisma.{{entityName}}CreateInput = {
        ...create{{entityName}}Dto,
{{#if settings.enableAudit}}
        createdBy: userId,
        updatedBy: userId,
{{/if}}
      };

      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.create({
        data,
      });

      return this.mapToResponseDto({{camelCase entityName}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === ''P2002'') {
          throw new BadRequestException(''{{entityName}} with this data already exists'');
        }
      }
      throw error;
    }
  }

  /**
   * 获取{{entityDescription}}列表
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.{{entityName}}WhereUniqueInput;
    where?: Prisma.{{entityName}}WhereInput;
    orderBy?: Prisma.{{entityName}}OrderByWithRelationInput;
  }): Promise<{{entityName}}ResponseDto[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    
    const {{camelCase entityName}}s = await this.prisma.{{camelCase entityName}}.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
{{#if settings.enableSoftDelete}}
        deletedAt: null, // 排除软删除的记录
{{/if}}
      },
      orderBy: orderBy || { createdAt: ''desc'' },
    });

    return {{camelCase entityName}}s.map(this.mapToResponseDto);
  }

  /**
   * 根据ID获取{{entityDescription}}
   */
  async findOne(id: string): Promise<{{entityName}}ResponseDto> {
    const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.findUnique({
      where: { 
        id,
{{#if settings.enableSoftDelete}}
        deletedAt: null,
{{/if}}
      },
    });

    if (!{{camelCase entityName}}) {
      throw new NotFoundException(`{{entityName}} with ID ${id} not found`);
    }

    return this.mapToResponseDto({{camelCase entityName}});
  }

  /**
   * 更新{{entityDescription}}
   */
  async update(id: string, update{{entityName}}Dto: Update{{entityName}}Dto, userId?: string): Promise<{{entityName}}ResponseDto> {
    await this.findOne(id); // 检查是否存在

    try {
      const data: Prisma.{{entityName}}UpdateInput = {
        ...update{{entityName}}Dto,
{{#if settings.enableAudit}}
        updatedBy: userId,
{{/if}}
      };

      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.update({
        where: { id },
        data,
      });

      return this.mapToResponseDto({{camelCase entityName}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === ''P2002'') {
          throw new BadRequestException(''{{entityName}} with this data already exists'');
        }
      }
      throw error;
    }
  }

  /**
   * 删除{{entityDescription}}
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // 检查是否存在

{{#if settings.enableSoftDelete}}
    // 软删除
    await this.prisma.{{camelCase entityName}}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
{{else}}
    // 硬删除
    await this.prisma.{{camelCase entityName}}.delete({
      where: { id },
    });
{{/if}}
  }

  /**
   * 统计{{entityDescription}}数量
   */
  async count(where?: Prisma.{{entityName}}WhereInput): Promise<number> {
    return this.prisma.{{camelCase entityName}}.count({ 
      where: {
        ...where,
{{#if settings.enableSoftDelete}}
        deletedAt: null,
{{/if}}
      }
    });
  }

  /**
   * 映射到响应DTO
   */
  private mapToResponseDto({{camelCase entityName}}: any): {{entityName}}ResponseDto {
    return {
      id: {{camelCase entityName}}.id,
{{#each businessFields}}
      {{this.code}}: {{camelCase ../entityName}}.{{this.code}},
{{/each}}
      createdAt: {{camelCase entityName}}.createdAt,
      updatedAt: {{camelCase entityName}}.updatedAt,
{{#if settings.enableAudit}}
      createdBy: {{camelCase entityName}}.createdBy,
      updatedBy: {{camelCase entityName}}.updatedBy,
{{/if}}
{{#if settings.enableSoftDelete}}
      deletedAt: {{camelCase entityName}}.deletedAt,
{{/if}}
{{#if settings.enableVersioning}}
      version: {{camelCase entityName}}.version,
{{/if}}
{{#if settings.enableTenancy}}
      tenantId: {{camelCase entityName}}.tenantId,
{{/if}}
{{#if settings.enableStatus}}
      status: {{camelCase entityName}}.status,
{{/if}}
    };
  }
}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"businessFields","type":"array","description":"业务字段列表"},{"name":"settings","type":"object","description":"项目设置"},{"name":"currentDate","type":"string","description":"当前日期"}]',
'system'),

-- NestJS Controller 模板
('tpl-nestjs-prisma-controller', 'NestJS Prisma控制器', 'nestjs-prisma-controller', 'ENTITY_CONTROLLER', 'TYPESCRIPT', 'NESTJS', 'NestJS Prisma控制器',
'import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards, Req } from ''@nestjs/common'';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from ''@nestjs/swagger'';
import { {{entityName}}Service } from ''./{{kebabCase entityName}}.service'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto, {{entityName}}ListResponseDto } from ''./dto/{{kebabCase entityName}}.dto'';
{{#if settings.enableAuth}}
import { JwtAuthGuard } from ''../auth/guards/jwt-auth.guard'';
{{/if}}
import { ApiPaginatedResponse } from ''../common/decorators/api-paginated-response.decorator'';
import { PaginationDto } from ''../common/dto/pagination.dto'';
import { ApiStandardResponse } from ''../common/decorators/api-standard-response.decorator'';
import { StandardResponse } from ''../common/interfaces/standard-response.interface'';
import { Request } from ''express'';

/**
 * {{entityDescription}} Controller
 * Generated on {{currentDate}}
 */
@ApiTags(''{{entityName}}'')
{{#if settings.enableAuth}}
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
{{/if}}
@Controller(''{{kebabCase entityName}}'')
export class {{entityName}}Controller {
  constructor(private readonly {{camelCase entityName}}Service: {{entityName}}Service) {}

  @Post()
  @ApiOperation({ summary: ''创建{{entityDescription}}'' })
  @ApiStandardResponse(201, ''创建成功'', {{entityName}}ResponseDto)
  async create(
    @Body() create{{entityName}}Dto: Create{{entityName}}Dto,
{{#if settings.enableAuth}}
    @Req() req: Request
{{/if}}
  ): Promise<StandardResponse<{{entityName}}ResponseDto>> {
{{#if settings.enableAuth}}
    const userId = req.user?.id;
{{/if}}
    const data = await this.{{camelCase entityName}}Service.create(create{{entityName}}Dto{{#if settings.enableAuth}}, userId{{/if}});
    return {
      status: 0,
      msg: ''success'',
      data
    };
  }

  @Get()
  @ApiOperation({ summary: ''获取{{entityDescription}}列表'' })
  @ApiQuery({ name: ''current'', required: false, description: ''当前页码'' })
  @ApiQuery({ name: ''size'', required: false, description: ''每页数量'' })
  @ApiPaginatedResponse({{entityName}}ResponseDto)
  async findAll(
    @Query() paginationDto: PaginationDto
  ): Promise<StandardResponse<{{entityName}}ListResponseDto>> {
    const { current = 1, size = 10 } = paginationDto;
    const skip = (current - 1) * size;
    const take = size;

    const [data, total] = await Promise.all([
      this.{{camelCase entityName}}Service.findAll({ skip, take }),
      this.{{camelCase entityName}}Service.count()
    ]);

    return {
      status: 0,
      msg: ''success'',
      data: {
        records: data,
        meta: {
          current,
          size,
          total,
          pages: Math.ceil(total / size)
        }
      }
    };
  }

  @Get('':id'')
  @ApiOperation({ summary: ''获取{{entityDescription}}详情'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiStandardResponse(200, ''获取成功'', {{entityName}}ResponseDto)
  async findOne(@Param(''id'') id: string): Promise<StandardResponse<{{entityName}}ResponseDto>> {
    const data = await this.{{camelCase entityName}}Service.findOne(id);
    return {
      status: 0,
      msg: ''success'',
      data
    };
  }

  @Patch('':id'')
  @ApiOperation({ summary: ''更新{{entityDescription}}'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiStandardResponse(200, ''更新成功'', {{entityName}}ResponseDto)
  async update(
    @Param(''id'') id: string, 
    @Body() update{{entityName}}Dto: Update{{entityName}}Dto,
{{#if settings.enableAuth}}
    @Req() req: Request
{{/if}}
  ): Promise<StandardResponse<{{entityName}}ResponseDto>> {
{{#if settings.enableAuth}}
    const userId = req.user?.id;
{{/if}}
    const data = await this.{{camelCase entityName}}Service.update(id, update{{entityName}}Dto{{#if settings.enableAuth}}, userId{{/if}});
    return {
      status: 0,
      msg: ''success'',
      data
    };
  }

  @Delete('':id'')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: ''删除{{entityDescription}}'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiStandardResponse(200, ''删除成功'')
  async remove(@Param(''id'') id: string): Promise<StandardResponse<null>> {
    await this.{{camelCase entityName}}Service.remove(id);
    return {
      status: 0,
      msg: ''success'',
      data: null
    };
  }
}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"settings","type":"object","description":"项目设置"},{"name":"currentDate","type":"string","description":"当前日期"}]',
'system'),

-- NestJS Module 模板
('tpl-nestjs-prisma-module', 'NestJS Prisma模块', 'nestjs-prisma-module', 'API_CONTROLLER', 'TYPESCRIPT', 'NESTJS', 'NestJS Prisma模块',
'import { Module } from ''@nestjs/common'';
import { {{entityName}}Service } from ''./{{kebabCase entityName}}.service'';
import { {{entityName}}Controller } from ''./{{kebabCase entityName}}.controller'';
import { PrismaModule } from ''../prisma/prisma.module'';

/**
 * {{entityDescription}} Module
 * Generated on {{currentDate}}
 */
@Module({
  imports: [PrismaModule],
  controllers: [{{entityName}}Controller],
  providers: [{{entityName}}Service],
  exports: [{{entityName}}Service],
})
export class {{entityName}}Module {}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"currentDate","type":"string","description":"当前日期"}]',
'system');

-- 更新模板状态为已发布
UPDATE lowcode_code_templates SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
WHERE code IN (
  'prisma-schema',
  'ts-interface',
  'nestjs-prisma-service',
  'nestjs-prisma-controller',
  'nestjs-prisma-module'
);
