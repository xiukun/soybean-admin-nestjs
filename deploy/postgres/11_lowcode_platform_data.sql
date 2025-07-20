-- 低代码平台初始数据
-- Low-code Platform Initial Data

-- 插入默认代码模板
INSERT INTO lowcode_code_templates (id, name, code, type, language, framework, description, template, variables, created_by) VALUES 
-- NestJS Entity Model 模板
('tpl-nestjs-entity-model', 'NestJS实体模型', 'nestjs-entity-model', 'ENTITY_MODEL', 'TYPESCRIPT', 'NESTJS', 'NestJS实体模型代码模板', 
'import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from ''typeorm'';

@Entity(''{{tableName}}'')
export class {{entityName}} {
  @PrimaryGeneratedColumn(''uuid'')
  id: string;

{{#each fields}}
  @Column({{#if this.columnOptions}}{{this.columnOptions}}{{else}}{ type: ''{{this.type}}''{{#if this.nullable}}, nullable: {{this.nullable}}{{/if}}{{#if this.unique}}, unique: {{this.unique}}{{/if}} }{{/if}})
  {{this.name}}: {{this.tsType}};

{{/each}}
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}', 
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"tableName","type":"string","description":"数据库表名"},{"name":"fields","type":"array","description":"字段列表"}]', 
'system'),

-- NestJS DTO 模板
('tpl-nestjs-dto', 'NestJS数据传输对象', 'nestjs-dto', 'ENTITY_DTO', 'TYPESCRIPT', 'NESTJS', 'NestJS DTO代码模板',
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
'system'),

-- NestJS Service 模板
('tpl-nestjs-service', 'NestJS服务类', 'nestjs-service', 'ENTITY_SERVICE', 'TYPESCRIPT', 'NESTJS', 'NestJS服务类代码模板',
'import { Injectable, NotFoundException } from ''@nestjs/common'';
import { InjectRepository } from ''@nestjs/typeorm'';
import { Repository } from ''typeorm'';
import { {{entityName}} } from ''./entities/{{entityName.toLowerCase()}}.entity'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from ''./dto/{{entityName.toLowerCase()}}.dto'';

@Injectable()
export class {{entityName}}Service {
  constructor(
    @InjectRepository({{entityName}})
    private readonly {{entityName.toLowerCase()}}Repository: Repository<{{entityName}}>,
  ) {}

  async create(create{{entityName}}Dto: Create{{entityName}}Dto): Promise<{{entityName}}> {
    const {{entityName.toLowerCase()}} = this.{{entityName.toLowerCase()}}Repository.create(create{{entityName}}Dto);
    return await this.{{entityName.toLowerCase()}}Repository.save({{entityName.toLowerCase()}});
  }

  async findAll(): Promise<{{entityName}}[]> {
    return await this.{{entityName.toLowerCase()}}Repository.find();
  }

  async findOne(id: string): Promise<{{entityName}}> {
    const {{entityName.toLowerCase()}} = await this.{{entityName.toLowerCase()}}Repository.findOne({ where: { id } });
    if (!{{entityName.toLowerCase()}}) {
      throw new NotFoundException(`{{entityName}} with ID ${id} not found`);
    }
    return {{entityName.toLowerCase()}};
  }

  async update(id: string, update{{entityName}}Dto: Update{{entityName}}Dto): Promise<{{entityName}}> {
    const {{entityName.toLowerCase()}} = await this.findOne(id);
    Object.assign({{entityName.toLowerCase()}}, update{{entityName}}Dto);
    return await this.{{entityName.toLowerCase()}}Repository.save({{entityName.toLowerCase()}});
  }

  async remove(id: string): Promise<void> {
    const {{entityName.toLowerCase()}} = await this.findOne(id);
    await this.{{entityName.toLowerCase()}}Repository.remove({{entityName.toLowerCase()}});
  }
}',
'[{"name":"entityName","type":"string","description":"实体类名"}]',
'system'),

-- NestJS Controller 模板
('tpl-nestjs-controller', 'NestJS控制器', 'nestjs-controller', 'ENTITY_CONTROLLER', 'TYPESCRIPT', 'NESTJS', 'NestJS控制器代码模板',
'import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from ''@nestjs/common'';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from ''@nestjs/swagger'';
import { {{entityName}}Service } from ''./{{entityName.toLowerCase()}}.service'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto } from ''./dto/{{entityName.toLowerCase()}}.dto'';

@ApiTags(''{{entityName}}'')
@Controller(''{{controllerPath}}'')
export class {{entityName}}Controller {
  constructor(private readonly {{entityName.toLowerCase()}}Service: {{entityName}}Service) {}

  @Post()
  @ApiOperation({ summary: ''创建{{entityDescription}}'' })
  @ApiResponse({ status: 201, description: ''创建成功'', type: {{entityName}}ResponseDto })
  async create(@Body() create{{entityName}}Dto: Create{{entityName}}Dto): Promise<{{entityName}}ResponseDto> {
    return await this.{{entityName.toLowerCase()}}Service.create(create{{entityName}}Dto);
  }

  @Get()
  @ApiOperation({ summary: ''获取{{entityDescription}}列表'' })
  @ApiResponse({ status: 200, description: ''获取成功'', type: [{{entityName}}ResponseDto] })
  async findAll(): Promise<{{entityName}}ResponseDto[]> {
    return await this.{{entityName.toLowerCase()}}Service.findAll();
  }

  @Get('':id'')
  @ApiOperation({ summary: ''获取{{entityDescription}}详情'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiResponse({ status: 200, description: ''获取成功'', type: {{entityName}}ResponseDto })
  async findOne(@Param(''id'') id: string): Promise<{{entityName}}ResponseDto> {
    return await this.{{entityName.toLowerCase()}}Service.findOne(id);
  }

  @Patch('':id'')
  @ApiOperation({ summary: ''更新{{entityDescription}}'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiResponse({ status: 200, description: ''更新成功'', type: {{entityName}}ResponseDto })
  async update(@Param(''id'') id: string, @Body() update{{entityName}}Dto: Update{{entityName}}Dto): Promise<{{entityName}}ResponseDto> {
    return await this.{{entityName.toLowerCase()}}Service.update(id, update{{entityName}}Dto);
  }

  @Delete('':id'')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: ''删除{{entityDescription}}'' })
  @ApiParam({ name: ''id'', description: ''{{entityDescription}}ID'' })
  @ApiResponse({ status: 204, description: ''删除成功'' })
  async remove(@Param(''id'') id: string): Promise<void> {
    await this.{{entityName.toLowerCase()}}Service.remove(id);
  }
}',
'[{"name":"entityName","type":"string","description":"实体类名"},{"name":"entityDescription","type":"string","description":"实体描述"},{"name":"controllerPath","type":"string","description":"控制器路径"}]',
'system');

-- 插入示例项目
INSERT INTO lowcode_projects (id, name, code, description, config, created_by) VALUES 
('demo-project-1', '示例项目', 'demo-project', '这是一个演示低代码平台功能的示例项目', 
'{"database":{"type":"postgresql","host":"localhost","port":5432},"api":{"baseUrl":"/api/v1","prefix":"demo"}}', 
'system');

-- 插入示例实体
INSERT INTO lowcode_entities (id, project_id, name, code, table_name, description, category, config, created_by) VALUES 
('demo-entity-user', 'demo-project-1', '用户', 'User', 'demo_users', '用户实体，包含基本的用户信息', '用户管理', 
'{"displayName":"用户","icon":"user","color":"#1890ff"}', 
'system'),
('demo-entity-role', 'demo-project-1', '角色', 'Role', 'demo_roles', '角色实体，用于权限管理', '权限管理', 
'{"displayName":"角色","icon":"crown","color":"#52c41a"}', 
'system');

-- 插入示例字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, length, nullable, unique_constraint, primary_key, comment, sort_order, created_by) VALUES 
-- 用户实体字段
('field-user-id', 'demo-entity-user', 'ID', 'id', 'UUID', NULL, false, true, true, '用户唯一标识', 1, 'system'),
('field-user-username', 'demo-entity-user', '用户名', 'username', 'STRING', 50, false, true, false, '用户登录名', 2, 'system'),
('field-user-email', 'demo-entity-user', '邮箱', 'email', 'STRING', 100, false, true, false, '用户邮箱地址', 3, 'system'),
('field-user-password', 'demo-entity-user', '密码', 'password', 'STRING', 255, false, false, false, '用户密码（加密存储）', 4, 'system'),
('field-user-nickname', 'demo-entity-user', '昵称', 'nickname', 'STRING', 50, true, false, false, '用户昵称', 5, 'system'),
('field-user-avatar', 'demo-entity-user', '头像', 'avatar', 'STRING', 500, true, false, false, '用户头像URL', 6, 'system'),
('field-user-status', 'demo-entity-user', '状态', 'status', 'STRING', 20, false, false, false, '用户状态：ACTIVE, INACTIVE, BANNED', 7, 'system'),
-- 角色实体字段
('field-role-id', 'demo-entity-role', 'ID', 'id', 'UUID', NULL, false, true, true, '角色唯一标识', 1, 'system'),
('field-role-name', 'demo-entity-role', '角色名', 'name', 'STRING', 50, false, true, false, '角色名称', 2, 'system'),
('field-role-code', 'demo-entity-role', '角色编码', 'code', 'STRING', 50, false, true, false, '角色编码', 3, 'system'),
('field-role-description', 'demo-entity-role', '描述', 'description', 'TEXT', NULL, true, false, false, '角色描述', 4, 'system'),
('field-role-status', 'demo-entity-role', '状态', 'status', 'STRING', 20, false, false, false, '角色状态：ACTIVE, INACTIVE', 5, 'system');

-- 插入示例关系
INSERT INTO lowcode_relations (id, project_id, name, code, description, type, source_entity_id, target_entity_id, config, created_by) VALUES 
('rel-user-role', 'demo-project-1', '用户角色关系', 'user-roles', '用户与角色的多对多关系', 'MANY_TO_MANY', 
'demo-entity-user', 'demo-entity-role', 
'{"joinTable":"demo_user_roles","sourceColumn":"user_id","targetColumn":"role_id"}', 
'system');

-- 插入示例API配置
INSERT INTO lowcode_api_configs (id, project_id, name, code, description, method, path, entity_id, parameters, responses, created_by) VALUES
('api-user-list', 'demo-project-1', '获取用户列表', 'get-users', '获取用户列表API', 'GET', '/users', 'demo-entity-user',
'[{"name":"page","type":"number","description":"页码","required":false},{"name":"limit","type":"number","description":"每页数量","required":false}]',
'[{"status":200,"description":"成功","schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}]',
'system'),
('api-user-create', 'demo-project-1', '创建用户', 'create-user', '创建新用户API', 'POST', '/users', 'demo-entity-user',
'[{"name":"body","type":"object","description":"用户信息","required":true,"schema":{"$ref":"#/components/schemas/CreateUserDto"}}]',
'[{"status":201,"description":"创建成功","schema":{"$ref":"#/components/schemas/User"}}]',
'system');

-- 插入示例查询
INSERT INTO lowcode_queries (id, project_id, name, description, base_entity_id, base_entity_alias, fields, filters, sorting, status, created_by) VALUES
('query-active-users', 'demo-project-1', '活跃用户查询', '查询所有状态为活跃的用户', 'demo-entity-user', 'user',
'[{"field":"id","alias":"用户ID","type":"UUID"},{"field":"username","alias":"用户名","type":"STRING"},{"field":"email","alias":"邮箱","type":"STRING"},{"field":"nickname","alias":"昵称","type":"STRING"},{"field":"status","alias":"状态","type":"STRING"}]',
'[{"field":"status","operator":"eq","value":"ACTIVE","type":"STRING"}]',
'[{"field":"username","direction":"ASC"}]',
'PUBLISHED',
'system'),
('query-user-roles', 'demo-project-1', '用户角色查询', '查询用户及其关联的角色信息', 'demo-entity-user', 'user',
'[{"field":"user.id","alias":"用户ID","type":"UUID"},{"field":"user.username","alias":"用户名","type":"STRING"},{"field":"user.email","alias":"邮箱","type":"STRING"},{"field":"role.name","alias":"角色名","type":"STRING"},{"field":"role.code","alias":"角色编码","type":"STRING"}]',
'[]',
'[{"field":"user.username","direction":"ASC"},{"field":"role.name","direction":"ASC"}]',
'PUBLISHED',
'system'),
('query-user-statistics', 'demo-project-1', '用户统计查询', '按状态统计用户数量', 'demo-entity-user', 'user',
'[{"field":"status","alias":"状态","type":"STRING"},{"field":"COUNT(*)","alias":"用户数量","type":"INTEGER"}]',
'[]',
'[{"field":"status","direction":"ASC"}]',
'PUBLISHED',
'system');

-- 为低代码平台菜单添加权限（ID从100开始）
INSERT INTO public.sys_menu (id, menu_type, menu_name, icon_type, icon, route_name, route_path, component, path_param, status, active_menu, hide_in_menu, pid, sequence, i18n_key, keep_alive, constant, href, multi_tab, lowcode_page_id, created_at, created_by, updated_at, updated_by) VALUES
(100, 'directory', 'lowcode', 1, 'carbon:application-web', 'lowcode', '/lowcode', 'layout.base', null, 'ENABLED', null, false, 0, 6, 'route.lowcode', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(101, 'menu', 'lowcode_project', 1, 'carbon:folder-details', 'lowcode_project', '/lowcode/project', 'view.lowcode_project', null, 'ENABLED', null, false, 100, 1, 'route.lowcode_project', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(102, 'menu', 'lowcode_entity', 1, 'carbon:data-table', 'lowcode_entity', '/lowcode/entity', 'view.lowcode_entity', null, 'ENABLED', null, false, 100, 2, 'route.lowcode_entity', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(103, 'menu', 'lowcode_field', 1, 'carbon:text-column', 'lowcode_field', '/lowcode/field', 'view.lowcode_field', null, 'ENABLED', null, false, 100, 3, 'route.lowcode_field', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(104, 'menu', 'lowcode_relationship', 1, 'carbon:connect', 'lowcode_relationship', '/lowcode/relationship', 'view.lowcode_relationship', null, 'ENABLED', null, false, 100, 4, 'route.lowcode_relationship', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(105, 'menu', 'lowcode_query', 1, 'carbon:search', 'lowcode_query', '/lowcode/query', 'view.lowcode_query', null, 'ENABLED', null, false, 100, 5, 'route.lowcode_query', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(106, 'menu', 'lowcode_api-config', 1, 'carbon:api', 'lowcode_api-config', '/lowcode/api-config', 'view.lowcode_api-config', null, 'ENABLED', null, false, 100, 6, 'route.lowcode_api-config', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(107, 'menu', 'lowcode_api-test', 1, 'carbon:test-tool', 'lowcode_api-test', '/lowcode/api-test', 'view.lowcode_api-test', null, 'ENABLED', null, false, 100, 7, 'route.lowcode_api-test', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(108, 'menu', 'lowcode_template', 1, 'carbon:template', 'lowcode_template', '/lowcode/template', 'view.lowcode_template', null, 'ENABLED', null, false, 100, 8, 'route.lowcode_template', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null),
(109, 'menu', 'lowcode_code-generation', 1, 'carbon:code', 'lowcode_code-generation', '/lowcode/code-generation', 'view.lowcode_code-generation', null, 'ENABLED', null, false, 100, 9, 'route.lowcode_code-generation', false, false, null, false, null, '2024-07-18 00:00:00.000', 'system', null, null);

-- 为管理员角色添加低代码平台菜单权限
INSERT INTO public.sys_role_menu (role_id, menu_id, domain) VALUES 
('1', 100, 'built-in'),
('1', 101, 'built-in'),
('1', 102, 'built-in'),
('1', 103, 'built-in'),
('1', 104, 'built-in'),
('1', 105, 'built-in'),
('1', 106, 'built-in'),
('1', 107, 'built-in'),
('1', 108, 'built-in'),
('1', 109, 'built-in');
