-- Lowcode Platform Schema Tables
SET search_path TO lowcode, backend, public;

-- 低代码平台初始数据
-- Low-code Platform Initial Data
-- 执行时间: 2024-07-21

-- 插入默认代码模板
INSERT INTO
    lowcode.lowcode_code_templates (
        id,
        name,
        code,
        type,
        language,
        framework,
        description,
        template,
        variables,
        created_by
    )
VALUES
    -- NestJS Prisma Entity Model 模板
    (
        'tpl-nestjs-entity-model',
        'NestJS Prisma实体模型',
        'nestjs-prisma-entity-model',
        'ENTITY_MODEL',
        'TYPESCRIPT',
        'NESTJS',
        'NestJS Prisma实体模型代码模板',
        '// Prisma Schema Model for {{entityName}}
// This will be added to schema.prisma file

model {{entityName}} {
  id        String   @id @default(cuid())
{{#each fields}}
{{#unless this.isSystemField}}
  {{this.code}}{{#if this.nullable}}?{{/if}}     {{this.prismaType}}{{#if this.unique}} @unique{{/if}}{{#if this.comment}} // {{this.comment}}{{/if}}
{{/unless}}
{{/each}}

  // System fields
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  createdBy String?  @map("created_by")
  updatedBy String?  @map("updated_by")

  @@map("{{tableName}}")
}

// TypeScript interface for {{entityName}}
export interface {{entityName}} {
  id: string;
{{#each fields}}
{{#unless this.isSystemField}}
  {{this.code}}: {{this.tsType}}{{#if this.nullable}} | null{{/if}};
{{/unless}}
{{/each}}
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Create input type
export interface Create{{entityName}}Input {
{{#each fields}}
{{#unless this.isSystemField}}
{{#unless this.nullable}}
  {{this.code}}: {{this.tsType}};
{{/unless}}
{{/unless}}
{{/each}}
{{#each fields}}
{{#unless this.isSystemField}}
{{#if this.nullable}}
  {{this.code}}?: {{this.tsType}} | null;
{{/if}}
{{/unless}}
{{/each}}
}

// Update input type
export interface Update{{entityName}}Input {
{{#each fields}}
{{#unless this.isSystemField}}
  {{this.code}}?: {{this.tsType}}{{#if this.nullable}} | null{{/if}};
{{/unless}}
{{/each}}
}',
        '[{"name":"entityName","type":"string","description":"实体类名"},{"name":"tableName","type":"string","description":"数据库表名"},{"name":"fields","type":"array","description":"字段列表"}]',
        'system'
    ),

-- NestJS DTO 模板
(
    'tpl-nestjs-dto',
    'NestJS数据传输对象',
    'nestjs-dto',
    'ENTITY_DTO',
    'TYPESCRIPT',
    'NESTJS',
    'NestJS DTO代码模板',
    'import { IsString, IsOptional, IsBoolean, IsNumber, IsDate } from ''class-validator'';
import { ApiProperty, ApiPropertyOptional } from ''@nestjs/swagger'';

export class Create{{entityName}}Dto {
{{#each fields}}
{{#unless this.primaryKey}}
  @ApiProperty{{#if this.nullable}}Optional{{/if}}({ description: ''{{this.comment}}'' })
  @Is{{this.validationType}}()
  {{#if this.nullable}}@IsOptional(){{/if}}
  {{this.name}}: {{this.tsType}};

{{/unless}}
{{/each}}
}

export class Update{{entityName}}Dto {
{{#each fields}}
{{#unless this.primaryKey}}
  @ApiPropertyOptional({ description: ''{{this.comment}}'' })
  @Is{{this.validationType}}()
  @IsOptional()
  {{this.name}}?: {{this.tsType}};

{{/unless}}
{{/each}}
}

export class {{entityName}}ResponseDto {
{{#each fields}}
  @ApiProperty({ description: ''{{this.comment}}'' })
  {{this.name}}: {{this.tsType}};

{{/each}}
  @ApiProperty({ description: ''创建时间'' })
  createdAt: Date;

  @ApiProperty({ description: ''更新时间'' })
  updatedAt: Date;
}',
    '[{"name":"entityName","type":"string","description":"实体类名"},{"name":"fields","type":"array","description":"字段列表"}]',
    'system'
),

-- NestJS Prisma Service 模板
(
    'tpl-nestjs-service',
    'NestJS Prisma服务类',
    'nestjs-prisma-service',
    'ENTITY_SERVICE',
    'TYPESCRIPT',
    'NESTJS',
    'NestJS Prisma服务类代码模板',
    'import { Injectable, NotFoundException, BadRequestException } from ''@nestjs/common'';
import { PrismaService } from ''../prisma/prisma.service'';
import { {{entityName}}, Create{{entityName}}Input, Update{{entityName}}Input } from ''./interfaces/{{entityName.toLowerCase()}}.interface'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto } from ''./dto/{{entityName.toLowerCase()}}.dto'';
import { Prisma } from ''@prisma/client'';

@Injectable()
export class {{entityName}}Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(create{{entityName}}Dto: Create{{entityName}}Dto, userId?: string): Promise<{{entityName}}ResponseDto> {
    try {
      const data: Prisma.{{entityName}}CreateInput = {
        ...create{{entityName}}Dto,
        createdBy: userId,
        updatedBy: userId,
      };

      const {{entityName.toLowerCase()}} = await this.prisma.{{entityName.toLowerCase()}}.create({
        data,
      });

      return this.mapToResponseDto({{entityName.toLowerCase()}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === ''P2002'') {
          throw new BadRequestException(''{{entityName}} with this data already exists'');
        }
      }
      throw error;
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.{{entityName}}WhereUniqueInput;
    where?: Prisma.{{entityName}}WhereInput;
    orderBy?: Prisma.{{entityName}}OrderByWithRelationInput;
  }): Promise<{{entityName}}ResponseDto[]> {
    const { skip, take, cursor, where, orderBy } = params || {};

    const {{entityName.toLowerCase()}}s = await this.prisma.{{entityName.toLowerCase()}}.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { createdAt: ''desc'' },
    });

    return {{entityName.toLowerCase()}}s.map(this.mapToResponseDto);
  }

  async findOne(id: string): Promise<{{entityName}}ResponseDto> {
    const {{entityName.toLowerCase()}} = await this.prisma.{{entityName.toLowerCase()}}.findUnique({
      where: { id },
    });

    if (!{{entityName.toLowerCase()}}) {
      throw new NotFoundException(`{{entityName}} with ID ${id} not found`);
    }

    return this.mapToResponseDto({{entityName.toLowerCase()}});
  }

  async update(id: string, update{{entityName}}Dto: Update{{entityName}}Dto, userId?: string): Promise<{{entityName}}ResponseDto> {
    await this.findOne(id); // Check if exists

    try {
      const data: Prisma.{{entityName}}UpdateInput = {
        ...update{{entityName}}Dto,
        updatedBy: userId,
      };

      const {{entityName.toLowerCase()}} = await this.prisma.{{entityName.toLowerCase()}}.update({
        where: { id },
        data,
      });

      return this.mapToResponseDto({{entityName.toLowerCase()}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === ''P2002'') {
          throw new BadRequestException(''{{entityName}} with this data already exists'');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.{{entityName.toLowerCase()}}.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.{{entityName}}WhereInput): Promise<number> {
    return this.prisma.{{entityName.toLowerCase()}}.count({ where });
  }

  private mapToResponseDto({{entityName.toLowerCase()}}: any): {{entityName}}ResponseDto {
    return {
      id: {{entityName.toLowerCase()}}.id,
{{#each fields}}
{{#unless this.isSystemField}}
      {{this.code}}: {{entityName.toLowerCase()}}.{{this.code}},
{{/unless}}
{{/each}}
      createdAt: {{entityName.toLowerCase()}}.createdAt,
      updatedAt: {{entityName.toLowerCase()}}.updatedAt,
      createdBy: {{entityName.toLowerCase()}}.createdBy,
      updatedBy: {{entityName.toLowerCase()}}.updatedBy,
    };
  }
}',
    '[{"name":"entityName","type":"string","description":"实体类名"},{"name":"fields","type":"array","description":"字段列表"}]',
    'system'
),

-- NestJS Prisma Controller 模板
(
    'tpl-nestjs-controller',
    'NestJS Prisma控制器',
    'nestjs-prisma-controller',
    'ENTITY_CONTROLLER',
    'TYPESCRIPT',
    'NESTJS',
    'NestJS Prisma控制器代码模板',
    'import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards, Req } from ''@nestjs/common'';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from ''@nestjs/swagger'';
import { {{entityName}}Service } from ''./{{entityName.toLowerCase()}}.service'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto, {{entityName}}ListResponseDto } from ''./dto/{{entityName.toLowerCase()}}.dto'';
import { JwtAuthGuard } from ''../auth/guards/jwt-auth.guard'';
import { ApiPaginatedResponse } from ''../common/decorators/api-paginated-response.decorator'';
import { PaginationDto } from ''../common/dto/pagination.dto'';
import { ApiStandardResponse } from ''../common/decorators/api-standard-response.decorator'';
import { StandardResponse } from ''../common/interfaces/standard-response.interface'';
import { Request } from ''express'';

@ApiTags(''{{entityName}}'')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(''{{controllerPath}}'')
export class {{entityName}}Controller {
  constructor(private readonly {{entityName.toLowerCase()}}Service: {{entityName}}Service) {}

  @Post()
  @ApiOperation({ summary: ''创建{{entityDescription}}'' })
  @ApiStandardResponse(201, ''创建成功'', {{entityName}}ResponseDto)
  async create(
    @Body() create{{entityName}}Dto: Create{{entityName}}Dto,
    @Req() req: Request
  ): Promise<StandardResponse<{{entityName}}ResponseDto>> {
    const userId = req.user?.id;
    const data = await this.{{entityName.toLowerCase()}}Service.create(create{{entityName}}Dto, userId);
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
      this.{{entityName.toLowerCase()}}Service.findAll({ skip, take }),
      this.{{entityName.toLowerCase()}}Service.count()
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
    const data = await this.{{entityName.toLowerCase()}}Service.findOne(id);
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
    @Req() req: Request
  ): Promise<StandardResponse<{{entityName}}ResponseDto>> {
    const userId = req.user?.id;
    const data = await this.{{entityName.toLowerCase()}}Service.update(id, update{{entityName}}Dto, userId);
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
    await this.{{entityName.toLowerCase()}}Service.remove(id);
    return {
      status: 0,
      msg: ''success'',
      data: null
    };
  }
}',
    '[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"controllerPath","type":"string","description":"控制器路径"}]',
    'system'
),

-- NestJS Prisma Module 模板
(
    'tpl-nestjs-module',
    'NestJS Prisma模块',
    'nestjs-prisma-module',
    'API_CONTROLLER',
    'TYPESCRIPT',
    'NESTJS',
    'NestJS Prisma模块代码模板',
    'import { Module } from ''@nestjs/common'';
import { {{entityName}}Service } from ''./{{entityName.toLowerCase()}}.service'';
import { {{entityName}}Controller } from ''./{{entityName.toLowerCase()}}.controller'';
import { PrismaModule } from ''../prisma/prisma.module'';

@Module({
  imports: [PrismaModule],
  controllers: [{{entityName}}Controller],
  providers: [{{entityName}}Service],
  exports: [{{entityName}}Service],
})
export class {{entityName}}Module {}',
    '[{"name":"entityName","type":"string","description":"实体类名"}]',
    'system'
),

-- Prisma Repository 模板
(
    'tpl-prisma-repository',
    'Prisma仓储类',
    'prisma-repository',
    'ENTITY_REPOSITORY',
    'TYPESCRIPT',
    'NESTJS',
    'Prisma仓储类代码模板',
    'import { Injectable } from ''@nestjs/common'';
import { PrismaService } from ''../prisma/prisma.service'';
import { Prisma, {{entityName}} } from ''@prisma/client'';

@Injectable()
export class {{entityName}}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.{{entityName}}CreateInput): Promise<{{entityName}}> {
    return this.prisma.{{entityName.toLowerCase()}}.create({ data });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.{{entityName}}WhereUniqueInput;
    where?: Prisma.{{entityName}}WhereInput;
    orderBy?: Prisma.{{entityName}}OrderByWithRelationInput;
    include?: Prisma.{{entityName}}Include;
  }): Promise<{{entityName}}[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.{{entityName.toLowerCase()}}.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  async findUnique(where: Prisma.{{entityName}}WhereUniqueInput, include?: Prisma.{{entityName}}Include): Promise<{{entityName}} | null> {
    return this.prisma.{{entityName.toLowerCase()}}.findUnique({
      where,
      include,
    });
  }

  async update(params: {
    where: Prisma.{{entityName}}WhereUniqueInput;
    data: Prisma.{{entityName}}UpdateInput;
    include?: Prisma.{{entityName}}Include;
  }): Promise<{{entityName}}> {
    const { where, data, include } = params;
    return this.prisma.{{entityName.toLowerCase()}}.update({
      data,
      where,
      include,
    });
  }

  async delete(where: Prisma.{{entityName}}WhereUniqueInput): Promise<{{entityName}}> {
    return this.prisma.{{entityName.toLowerCase()}}.delete({ where });
  }

  async count(where?: Prisma.{{entityName}}WhereInput): Promise<number> {
    return this.prisma.{{entityName.toLowerCase()}}.count({ where });
  }

  async aggregate(params: {
    where?: Prisma.{{entityName}}WhereInput;
    orderBy?: Prisma.{{entityName}}OrderByWithRelationInput;
    cursor?: Prisma.{{entityName}}WhereUniqueInput;
    take?: number;
    skip?: number;
  }): Promise<any> {
    const { where, orderBy, cursor, take, skip } = params;
    return this.prisma.{{entityName.toLowerCase()}}.aggregate({
      where,
      orderBy,
      cursor,
      take,
      skip,
      _count: true,
    });
  }
}',
    '[{"name":"entityName","type":"string","description":"实体类名"}]',
    'system'
);

-- 插入Mock数据中的项目
INSERT INTO
    lowcode.lowcode_projects (
        id,
        name,
        code,
        description,
        version,
        config,
        status,
        created_by,
        created_at,
        updated_at
    )
VALUES (
        '1',
        'E-commerce Platform',
        'ecommerce',
        '电商平台低代码项目，包含商品管理、订单处理、用户管理等核心功能',
        '1.0.0',
        '{"framework":"nestjs","architecture":"base-biz","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}',
        'ACTIVE',
        'admin',
        '2024-01-01 00:00:00',
        '2024-01-15 00:00:00'
    ),
    (
        '2',
        'CRM System',
        'crm',
        '客户关系管理系统，帮助企业管理客户信息、销售流程和客户服务',
        '1.2.0',
        '{"framework":"nestjs","architecture":"ddd","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}',
        'ACTIVE',
        'admin',
        '2024-01-10 00:00:00',
        '2024-01-20 00:00:00'
    ),
    (
        '3',
        'Blog Management System',
        'blog',
        '博客管理系统，支持文章发布、分类管理、评论系统等功能',
        '1.0.0',
        '{"framework":"express","architecture":"clean","language":"javascript","database":"mysql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}',
        'INACTIVE',
        'user1',
        '2024-02-01 00:00:00',
        '2024-02-05 00:00:00'
    ),
    (
        '4',
        'Inventory Management',
        'inventory',
        '库存管理系统，实现商品入库、出库、盘点等库存管理功能',
        '2.1.0',
        '{"framework":"nestjs","architecture":"hexagonal","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}',
        'ACTIVE',
        'manager',
        '2024-01-20 00:00:00',
        '2024-02-10 00:00:00'
    ),
    (
        '5',
        'HR Management Portal',
        'hr-portal',
        '人力资源管理门户，包含员工信息管理、考勤管理、薪资管理等模块',
        '1.5.0',
        '{"framework":"nestjs","architecture":"base-biz","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}',
        'ARCHIVED',
        'hr-admin',
        '2023-12-01 00:00:00',
        '2024-01-30 00:00:00'
    ),

-- 保留原有的示例项目
(
    'demo-project-1',
    '示例项目',
    'demo-project',
    '这是一个演示低代码平台功能的示例项目',
    '1.0.0',
    '{"database":{"type":"postgresql","host":"localhost","port":5432},"api":{"baseUrl":"/api/v1","prefix":"demo"}}',
    'ACTIVE',
    'system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入示例实体
INSERT INTO
    lowcode.lowcode_entities (
        id,
        project_id,
        name,
        code,
        table_name,
        description,
        category,
        config,
        created_by
    )
VALUES (
        'demo-entity-user',
        'demo-project-1',
        '用户',
        'User',
        'demo_users',
        '用户实体，包含基本的用户信息',
        '用户管理',
        '{"displayName":"用户","icon":"user","color":"#1890ff"}',
        'system'
    ),
    (
        'demo-entity-role',
        'demo-project-1',
        '角色',
        'Role',
        'demo_roles',
        '角色实体，用于权限管理',
        '权限管理',
        '{"displayName":"角色","icon":"crown","color":"#52c41a"}',
        'system'
    ),
    -- E-commerce Platform 实体
    (
        'entity-ecommerce-product',
        '1',
        '商品',
        'Product',
        'ecommerce_products',
        '电商平台商品实体，包含商品基本信息',
        '商品管理',
        '{"displayName":"商品","icon":"shopping","color":"#1890ff"}',
        'admin'
    ),
    (
        'entity-ecommerce-order',
        '1',
        '订单',
        'Order',
        'ecommerce_orders',
        '电商平台订单实体，管理用户订单信息',
        '订单管理',
        '{"displayName":"订单","icon":"file-text","color":"#52c41a"}',
        'admin'
    ),
    -- CRM System 实体
    (
        'entity-crm-customer',
        '2',
        '客户',
        'Customer',
        'crm_customers',
        'CRM系统客户实体，管理客户基本信息',
        '客户管理',
        '{"displayName":"客户","icon":"user","color":"#722ed1"}',
        'admin'
    ),
    (
        'entity-crm-lead',
        '2',
        '销售线索',
        'Lead',
        'crm_leads',
        'CRM系统销售线索实体，跟踪销售机会',
        '销售管理',
        '{"displayName":"销售线索","icon":"target","color":"#fa8c16"}',
        'admin'
    ),
    -- Blog Management System 实体
    (
        'entity-blog-post',
        '3',
        '文章',
        'Post',
        'blog_posts',
        '博客系统文章实体，管理博客文章',
        '内容管理',
        '{"displayName":"文章","icon":"edit","color":"#13c2c2"}',
        'user1'
    ),
    -- Inventory Management 实体
    (
        'entity-inventory-item',
        '4',
        '库存商品',
        'InventoryItem',
        'inventory_items',
        '库存管理系统商品实体，跟踪库存信息',
        '库存管理',
        '{"displayName":"库存商品","icon":"database","color":"#eb2f96"}',
        'manager'
    ),
    -- HR Management Portal 实体
    (
        'entity-hr-employee',
        '5',
        '员工',
        'Employee',
        'hr_employees',
        'HR系统员工实体，管理员工基本信息',
        '人员管理',
        '{"displayName":"员工","icon":"team","color":"#f5222d"}',
        'hr-admin'
    );

-- 插入示例字段
INSERT INTO
    lowcode.lowcode_fields (
        id,
        entity_id,
        name,
        code,
        type,
        length,
        nullable,
        unique_constraint,
        primary_key,
        comment,
        sort_order,
        created_by
    )
VALUES
    -- 用户实体字段
    (
        'field-user-id',
        'demo-entity-user',
        'ID',
        'id',
        'UUID',
        NULL,
        false,
        true,
        true,
        '用户唯一标识',
        1,
        'system'
    ),
    (
        'field-user-username',
        'demo-entity-user',
        '用户名',
        'username',
        'STRING',
        50,
        false,
        true,
        false,
        '用户登录名',
        2,
        'system'
    ),
    (
        'field-user-email',
        'demo-entity-user',
        '邮箱',
        'email',
        'STRING',
        100,
        false,
        true,
        false,
        '用户邮箱地址',
        3,
        'system'
    ),
    (
        'field-user-password',
        'demo-entity-user',
        '密码',
        'password',
        'STRING',
        255,
        false,
        false,
        false,
        '用户密码（加密存储）',
        4,
        'system'
    ),
    (
        'field-user-nickname',
        'demo-entity-user',
        '昵称',
        'nickname',
        'STRING',
        50,
        true,
        false,
        false,
        '用户昵称',
        5,
        'system'
    ),
    (
        'field-user-avatar',
        'demo-entity-user',
        '头像',
        'avatar',
        'STRING',
        500,
        true,
        false,
        false,
        '用户头像URL',
        6,
        'system'
    ),
    (
        'field-user-status',
        'demo-entity-user',
        '状态',
        'status',
        'STRING',
        20,
        false,
        false,
        false,
        '用户状态：ACTIVE, INACTIVE, BANNED',
        7,
        'system'
    ),
    -- 角色实体字段
    (
        'field-role-id',
        'demo-entity-role',
        'ID',
        'id',
        'UUID',
        NULL,
        false,
        true,
        true,
        '角色唯一标识',
        1,
        'system'
    ),
    (
        'field-role-name',
        'demo-entity-role',
        '角色名',
        'name',
        'STRING',
        50,
        false,
        true,
        false,
        '角色名称',
        2,
        'system'
    ),
    (
        'field-role-code',
        'demo-entity-role',
        '角色编码',
        'code',
        'STRING',
        50,
        false,
        true,
        false,
        '角色编码',
        3,
        'system'
    ),
    (
        'field-role-description',
        'demo-entity-role',
        '描述',
        'description',
        'TEXT',
        NULL,
        true,
        false,
        false,
        '角色描述',
        4,
        'system'
    ),
    (
        'field-role-status',
        'demo-entity-role',
        '状态',
        'status',
        'STRING',
        20,
        false,
        false,
        false,
        '角色状态：ACTIVE, INACTIVE',
        5,
        'system'
    ),
    -- E-commerce Product 字段
    (
        'field-product-id',
        'entity-ecommerce-product',
        'ID',
        'id',
        'UUID',
        NULL,
        false,
        true,
        true,
        '商品唯一标识',
        1,
        'admin'
    ),
    (
        'field-product-name',
        'entity-ecommerce-product',
        '商品名称',
        'name',
        'STRING',
        100,
        false,
        false,
        false,
        '商品名称',
        2,
        'admin'
    ),
    (
        'field-product-price',
        'entity-ecommerce-product',
        '价格',
        'price',
        'DECIMAL',
        NULL,
        false,
        false,
        false,
        '商品价格',
        3,
        'admin'
    ),
    (
        'field-product-stock',
        'entity-ecommerce-product',
        '库存',
        'stock',
        'INTEGER',
        NULL,
        true,
        false,
        false,
        '库存数量',
        4,
        'admin'
    ),
    -- E-commerce Order 字段
    (
        'field-order-id',
        'entity-ecommerce-order',
        'ID',
        'id',
        'UUID',
        NULL,
        false,
        true,
        true,
        '订单唯一标识',
        1,
        'admin'
    ),
    (
        'field-order-user-id',
        'entity-ecommerce-order',
        '用户ID',
        'user_id',
        'UUID',
        NULL,
        false,
        false,
        false,
        '下单用户ID',
        2,
        'admin'
    ),
    (
        'field-order-total',
        'entity-ecommerce-order',
        '订单总额',
        'total_amount',
        'DECIMAL',
        NULL,
        false,
        false,
        false,
        '订单总金额',
        3,
        'admin'
    ),
    (
        'field-order-status',
        'entity-ecommerce-order',
        '订单状态',
        'status',
        'STRING',
        20,
        false,
        false,
        false,
        '订单状态：PENDING, PAID, SHIPPED, DELIVERED, CANCELLED',
        4,
        'admin'
    ),
    -- CRM Customer 字段
    (
        'field-customer-id',
        'entity-crm-customer',
        'ID',
        'id',
        'UUID',
        NULL,
        false,
        true,
        true,
        '客户唯一标识',
        1,
        'admin'
    ),
    (
        'field-customer-name',
        'entity-crm-customer',
        '客户姓名',
        'name',
        'STRING',
        100,
        false,
        false,
        false,
        '客户姓名',
        2,
        'admin'
    ),
    (
        'field-customer-email',
        'entity-crm-customer',
        '邮箱',
        'email',
        'STRING',
        100,
        true,
        true,
        false,
        '客户邮箱',
        3,
        'admin'
    ),
    (
        'field-customer-phone',
        'entity-crm-customer',
        '电话',
        'phone',
        'STRING',
        20,
        true,
        false,
        false,
        '客户电话',
        4,
        'admin'
    ),
    (
        'field-customer-company',
        'entity-crm-customer',
        '公司',
        'company',
        'STRING',
        100,
        true,
        false,
        false,
        '客户公司',
        5,
        'admin'
    );

-- 插入示例关系
INSERT INTO
    lowcode.lowcode_relations (
        id,
        project_id,
        name,
        code,
        description,
        type,
        source_entity_id,
        target_entity_id,
        config,
        created_by
    )
VALUES (
        'rel-user-role',
        'demo-project-1',
        '用户角色关系',
        'user-roles',
        '用户与角色的多对多关系',
        'MANY_TO_MANY',
        'demo-entity-user',
        'demo-entity-role',
        '{"joinTable":"demo_user_roles","sourceColumn":"user_id","targetColumn":"role_id"}',
        'system'
    );

-- 插入示例API配置
INSERT INTO
    lowcode.lowcode_api_configs (
        id,
        project_id,
        name,
        code,
        description,
        method,
        path,
        entity_id,
        parameters,
        responses,
        created_by
    )
VALUES (
        'api-user-list',
        'demo-project-1',
        '获取用户列表',
        'get-users',
        '获取用户列表API',
        'GET',
        '/users',
        'demo-entity-user',
        '[{"name":"page","type":"number","description":"页码","required":false},{"name":"limit","type":"number","description":"每页数量","required":false}]',
        '[{"status":200,"description":"成功","schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}]',
        'system'
    ),
    (
        'api-user-create',
        'demo-project-1',
        '创建用户',
        'create-user',
        '创建新用户API',
        'POST',
        '/users',
        'demo-entity-user',
        '[{"name":"body","type":"object","description":"用户信息","required":true,"schema":{"$ref":"#/components/schemas/CreateUserDto"}}]',
        '[{"status":201,"description":"创建成功","schema":{"$ref":"#/components/schemas/User"}}]',
        'system'
    );

-- 插入示例查询
INSERT INTO
    lowcode.lowcode_queries (
        id,
        project_id,
        name,
        description,
        base_entity_id,
        base_entity_alias,
        fields,
        filters,
        sorting,
        status,
        created_by
    )
VALUES (
        'query-active-users',
        'demo-project-1',
        '活跃用户查询',
        '查询所有状态为活跃的用户',
        'demo-entity-user',
        'user',
        '[{"field":"id","alias":"用户ID","type":"UUID"},{"field":"username","alias":"用户名","type":"STRING"},{"field":"email","alias":"邮箱","type":"STRING"},{"field":"nickname","alias":"昵称","type":"STRING"},{"field":"status","alias":"状态","type":"STRING"}]',
        '[{"field":"status","operator":"eq","value":"ACTIVE","type":"STRING"}]',
        '[{"field":"username","direction":"ASC"}]',
        'PUBLISHED',
        'system'
    ),
    (
        'query-user-roles',
        'demo-project-1',
        '用户角色查询',
        '查询用户及其关联的角色信息',
        'demo-entity-user',
        'user',
        '[{"field":"user.id","alias":"用户ID","type":"UUID"},{"field":"user.username","alias":"用户名","type":"STRING"},{"field":"user.email","alias":"邮箱","type":"STRING"},{"field":"role.name","alias":"角色名","type":"STRING"},{"field":"role.code","alias":"角色编码","type":"STRING"}]',
        '[]',
        '[{"field":"user.username","direction":"ASC"},{"field":"role.name","direction":"ASC"}]',
        'PUBLISHED',
        'system'
    ),
    (
        'query-user-statistics',
        'demo-project-1',
        '用户统计查询',
        '按状态统计用户数量',
        'demo-entity-user',
        'user',
        '[{"field":"status","alias":"状态","type":"STRING"},{"field":"COUNT(*)","alias":"用户数量","type":"INTEGER"}]',
        '[]',
        '[{"field":"status","direction":"ASC"}]',
        'PUBLISHED',
        'system'
    );

-- 为低代码平台菜单添加权限（ID从100开始）
INSERT INTO
    backend.sys_menu (
        id,
        menu_type,
        menu_name,
        icon_type,
        icon,
        route_name,
        route_path,
        component,
        path_param,
        status,
        active_menu,
        hide_in_menu,
        pid,
        sequence,
        i18n_key,
        keep_alive,
        constant,
        href,
        multi_tab,
        lowcode_page_id,
        created_at,
        created_by,
        updated_at,
        updated_by
    )
VALUES (
        100,
        'directory',
        'lowcode',
        1,
        'carbon:application-web',
        'lowcode',
        '/lowcode',
        'layout.base',
        null,
        'ENABLED',
        null,
        false,
        0,
        6,
        'route.lowcode',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        101,
        'menu',
        'lowcode_project',
        1,
        'carbon:folder-details',
        'lowcode_project',
        '/lowcode/project',
        'view.lowcode_project',
        null,
        'ENABLED',
        null,
        false,
        100,
        1,
        'route.lowcode_project',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        102,
        'menu',
        'lowcode_entity',
        1,
        'carbon:data-table',
        'lowcode_entity',
        '/lowcode/entity',
        'view.lowcode_entity',
        null,
        'ENABLED',
        null,
        false,
        100,
        2,
        'route.lowcode_entity',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        103,
        'menu',
        'lowcode_field',
        1,
        'carbon:text-column',
        'lowcode_field',
        '/lowcode/field',
        'view.lowcode_field',
        null,
        'ENABLED',
        null,
        false,
        100,
        3,
        'route.lowcode_field',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        104,
        'menu',
        'lowcode_relationship',
        1,
        'carbon:connect',
        'lowcode_relationship',
        '/lowcode/relationship',
        'view.lowcode_relationship',
        null,
        'ENABLED',
        null,
        false,
        100,
        4,
        'route.lowcode_relationship',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        105,
        'menu',
        'lowcode_query',
        1,
        'carbon:search',
        'lowcode_query',
        '/lowcode/query',
        'view.lowcode_query',
        null,
        'ENABLED',
        null,
        false,
        100,
        5,
        'route.lowcode_query',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        106,
        'menu',
        'lowcode_api-config',
        1,
        'carbon:api',
        'lowcode_api-config',
        '/lowcode/api-config',
        'view.lowcode_api-config',
        null,
        'ENABLED',
        null,
        false,
        100,
        6,
        'route.lowcode_api-config',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        107,
        'menu',
        'lowcode_api-test',
        1,
        'carbon:test-tool',
        'lowcode_api-test',
        '/lowcode/api-test',
        'view.lowcode_api-test',
        null,
        'ENABLED',
        null,
        false,
        100,
        7,
        'route.lowcode_api-test',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        108,
        'menu',
        'lowcode_template',
        1,
        'carbon:template',
        'lowcode_template',
        '/lowcode/template',
        'view.lowcode_template',
        null,
        'ENABLED',
        null,
        false,
        100,
        8,
        'route.lowcode_template',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    ),
    (
        109,
        'menu',
        'lowcode_code-generation',
        1,
        'carbon:code',
        'lowcode_code-generation',
        '/lowcode/code-generation',
        'view.lowcode_code-generation',
        null,
        'ENABLED',
        null,
        false,
        100,
        9,
        'route.lowcode_code-generation',
        false,
        false,
        null,
        false,
        null,
        '2024-07-18 00:00:00.000',
        'system',
        null,
        null
    );

-- 为管理员角色添加低代码平台菜单权限
INSERT INTO
    backend.sys_role_menu (role_id, menu_id, domain)
VALUES ('1', 100, 'built-in'),
    ('1', 101, 'built-in'),
    ('1', 102, 'built-in'),
    ('1', 103, 'built-in'),
    ('1', 104, 'built-in'),
    ('1', 105, 'built-in'),
    ('1', 106, 'built-in'),
    ('1', 107, 'built-in'),
    ('1', 108, 'built-in'),
    ('1', 109, 'built-in');