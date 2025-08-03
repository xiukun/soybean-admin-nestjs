-- 示例数据插入脚本
-- 用于测试低代码平台功能

-- 1. 插入示例项目
INSERT INTO lowcode_projects (id, name, code, description, version, config, status, created_by, created_at, updated_at)
VALUES 
  ('proj-001', '电商管理系统', 'ecommerce-admin', '一个完整的电商后台管理系统', '1.0.0', 
   '{"framework": "nestjs", "architecture": "ddd", "language": "typescript", "database": "postgresql"}', 
   'ACTIVE', 'admin', NOW(), NOW()),
  ('proj-002', '博客管理系统', 'blog-admin', '个人博客管理系统', '1.0.0', 
   '{"framework": "nestjs", "architecture": "ddd", "language": "typescript", "database": "postgresql"}', 
   'ACTIVE', 'admin', NOW(), NOW()),
  ('proj-003', '用户管理系统', 'user-management', '企业用户管理系统', '1.0.0', 
   '{"framework": "nestjs", "architecture": "ddd", "language": "typescript", "database": "postgresql"}', 
   'ACTIVE', 'admin', NOW(), NOW());

-- 2. 插入示例实体
INSERT INTO lowcode_entities (id, project_id, name, code, table_name, description, category, status, created_by, created_at, updated_at)
VALUES 
  -- 电商系统实体
  ('entity-001', 'proj-001', '商品', 'Product', 'products', '商品信息管理', '核心业务', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-002', 'proj-001', '订单', 'Order', 'orders', '订单信息管理', '核心业务', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-003', 'proj-001', '用户', 'User', 'users', '用户信息管理', '用户管理', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-004', 'proj-001', '分类', 'Category', 'categories', '商品分类管理', '基础数据', 'PUBLISHED', 'admin', NOW(), NOW()),
  
  -- 博客系统实体
  ('entity-005', 'proj-002', '文章', 'Article', 'articles', '博客文章管理', '内容管理', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-006', 'proj-002', '标签', 'Tag', 'tags', '文章标签管理', '基础数据', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-007', 'proj-002', '评论', 'Comment', 'comments', '文章评论管理', '互动功能', 'PUBLISHED', 'admin', NOW(), NOW()),
  
  -- 用户管理系统实体
  ('entity-008', 'proj-003', '员工', 'Employee', 'employees', '员工信息管理', '人员管理', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-009', 'proj-003', '部门', 'Department', 'departments', '部门信息管理', '组织架构', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('entity-010', 'proj-003', '角色', 'Role', 'roles', '角色权限管理', '权限管理', 'PUBLISHED', 'admin', NOW(), NOW());

-- 3. 插入示例字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, length, nullable, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
VALUES
  -- 商品实体字段
  ('field-001', 'entity-001', 'ID', 'id', 'UUID', 36, false, true, null, '主键ID', 1, 'admin', NOW(), NOW()),
  ('field-002', 'entity-001', '商品名称', 'name', 'STRING', 200, false, false, null, '商品名称', 2, 'admin', NOW(), NOW()),
  ('field-003', 'entity-001', '商品编码', 'code', 'STRING', 100, false, false, null, '商品编码', 3, 'admin', NOW(), NOW()),
  ('field-004', 'entity-001', '价格', 'price', 'DECIMAL', null, false, false, '0.00', '商品价格', 4, 'admin', NOW(), NOW()),
  ('field-005', 'entity-001', '库存', 'stock', 'INTEGER', null, false, false, '0', '库存数量', 5, 'admin', NOW(), NOW()),
  ('field-006', 'entity-001', '分类ID', 'category_id', 'UUID', 36, true, false, null, '分类ID', 6, 'admin', NOW(), NOW()),
  ('field-007', 'entity-001', '描述', 'description', 'TEXT', null, true, false, null, '商品描述', 7, 'admin', NOW(), NOW()),
  ('field-008', 'entity-001', '状态', 'status', 'STRING', 20, false, false, 'ACTIVE', '商品状态', 8, 'admin', NOW(), NOW()),
  ('field-009', 'entity-001', '创建时间', 'created_at', 'DATETIME', null, false, false, 'NOW()', '创建时间', 9, 'admin', NOW(), NOW()),
  ('field-010', 'entity-001', '更新时间', 'updated_at', 'DATETIME', null, false, false, 'NOW()', '更新时间', 10, 'admin', NOW(), NOW()),
  
  -- 订单实体字段
  ('field-011', 'entity-002', 'ID', 'id', 'UUID', 36, false, true, null, '主键ID', 1, 'admin', NOW(), NOW()),
  ('field-012', 'entity-002', '订单号', 'order_no', 'STRING', 100, false, false, null, '订单号', 2, 'admin', NOW(), NOW()),
  ('field-013', 'entity-002', '用户ID', 'user_id', 'UUID', 36, false, false, null, '用户ID', 3, 'admin', NOW(), NOW()),
  ('field-014', 'entity-002', '总金额', 'total_amount', 'DECIMAL', null, false, false, '0.00', '订单总金额', 4, 'admin', NOW(), NOW()),
  ('field-015', 'entity-002', '订单状态', 'status', 'STRING', 20, false, false, 'PENDING', '订单状态', 5, 'admin', NOW(), NOW()),
  ('field-016', 'entity-002', '创建时间', 'created_at', 'DATETIME', null, false, false, 'NOW()', '创建时间', 6, 'admin', NOW(), NOW()),
  ('field-017', 'entity-002', '更新时间', 'updated_at', 'DATETIME', null, false, false, 'NOW()', '更新时间', 7, 'admin', NOW(), NOW()),

  -- 用户实体字段
  ('field-018', 'entity-003', 'ID', 'id', 'UUID', 36, false, true, null, '主键ID', 1, 'admin', NOW(), NOW()),
  ('field-019', 'entity-003', '用户名', 'username', 'STRING', 50, false, false, null, '用户名', 2, 'admin', NOW(), NOW()),
  ('field-020', 'entity-003', '邮箱', 'email', 'STRING', 100, false, false, null, '邮箱地址', 3, 'admin', NOW(), NOW()),
  ('field-021', 'entity-003', '手机号', 'phone', 'STRING', 20, true, false, null, '手机号码', 4, 'admin', NOW(), NOW()),
  ('field-022', 'entity-003', '状态', 'status', 'STRING', 20, false, false, 'ACTIVE', '用户状态', 5, 'admin', NOW(), NOW()),
  ('field-023', 'entity-003', '创建时间', 'created_at', 'DATETIME', null, false, false, 'NOW()', '创建时间', 6, 'admin', NOW(), NOW()),
  ('field-024', 'entity-003', '更新时间', 'updated_at', 'DATETIME', null, false, false, 'NOW()', '更新时间', 7, 'admin', NOW(), NOW()),

  -- 分类实体字段
  ('field-025', 'entity-004', 'ID', 'id', 'UUID', 36, false, true, null, '主键ID', 1, 'admin', NOW(), NOW()),
  ('field-026', 'entity-004', '分类名称', 'name', 'STRING', 100, false, false, null, '分类名称', 2, 'admin', NOW(), NOW()),
  ('field-027', 'entity-004', '分类编码', 'code', 'STRING', 50, false, false, null, '分类编码', 3, 'admin', NOW(), NOW()),
  ('field-028', 'entity-004', '父级ID', 'parent_id', 'UUID', 36, true, false, null, '父级分类ID', 4, 'admin', NOW(), NOW()),
  ('field-029', 'entity-004', '排序', 'sort_order', 'INTEGER', null, false, false, '0', '排序号', 5, 'admin', NOW(), NOW()),
  ('field-030', 'entity-004', '状态', 'status', 'STRING', 20, false, false, 'ACTIVE', '分类状态', 6, 'admin', NOW(), NOW());

-- 4. 插入示例关系
INSERT INTO lowcode_relations (id, project_id, name, code, type, source_entity_id, target_entity_id, foreign_key_name, status, created_by, created_at, updated_at)
VALUES 
  ('rel-001', 'proj-001', '商品-分类关系', 'product_category', 'MANY_TO_ONE', 'entity-001', 'entity-004', 'fk_product_category', 'ACTIVE', 'admin', NOW(), NOW()),
  ('rel-002', 'proj-001', '订单-用户关系', 'order_user', 'MANY_TO_ONE', 'entity-002', 'entity-003', 'fk_order_user', 'ACTIVE', 'admin', NOW(), NOW()),
  ('rel-003', 'proj-001', '分类层级关系', 'category_parent', 'MANY_TO_ONE', 'entity-004', 'entity-004', 'fk_category_parent', 'ACTIVE', 'admin', NOW(), NOW());

-- 5. 插入代码模板
INSERT INTO lowcode_code_templates (id, name, code, type, language, framework, description, template, variables, status, created_by, created_at, updated_at)
VALUES
  ('tpl-001', 'Prisma实体模板', 'prisma_entity', 'ENTITY', 'PRISMA', 'NESTJS', 'Prisma Schema模板',
   '// Prisma model for {{entityName}}
model {{entityName}} {
  id String @id @default(cuid())

{{#each fields}}
  {{this.name}} {{this.prismaType}}{{#if this.optional}}?{{/if}}{{#if this.unique}} @unique{{/if}} @map("{{this.dbName}}")
{{/each}}

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("{{tableName}}")
}', 
   '[{"name": "entityName", "type": "string", "required": true}, {"name": "tableName", "type": "string", "required": true}, {"name": "fields", "type": "array", "required": true}]', 
   'ACTIVE', 'admin', NOW(), NOW()),
   
  ('tpl-002', 'NestJS控制器模板', 'nestjs_controller', 'CONTROLLER', 'TYPESCRIPT', 'NESTJS', 'NestJS控制器模板',
   'import { Controller, Get, Post, Put, Delete, Body, Param, Query } from ''@nestjs/common'';
import { ApiTags, ApiOperation, ApiResponse } from ''@nestjs/swagger'';
import { {{serviceName}} } from ''./{{serviceFileName}}'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from ''./dto'';

@ApiTags(''{{entityName}}'')
@Controller(''{{routePath}}'')
export class {{controllerName}} {
  constructor(private readonly {{serviceProperty}}: {{serviceName}}) {}

  @Get()
  @ApiOperation({ summary: ''获取{{entityName}}列表'' })
  async findAll(@Query() query: any) {
    return this.{{serviceProperty}}.findAll(query);
  }

  @Get('':id'')
  @ApiOperation({ summary: ''根据ID获取{{entityName}}'' })
  async findOne(@Param(''id'') id: string) {
    return this.{{serviceProperty}}.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: ''创建{{entityName}}'' })
  async create(@Body() createDto: Create{{entityName}}Dto) {
    return this.{{serviceProperty}}.create(createDto);
  }

  @Put('':id'')
  @ApiOperation({ summary: ''更新{{entityName}}'' })
  async update(@Param(''id'') id: string, @Body() updateDto: Update{{entityName}}Dto) {
    return this.{{serviceProperty}}.update(id, updateDto);
  }

  @Delete('':id'')
  @ApiOperation({ summary: ''删除{{entityName}}'' })
  async remove(@Param(''id'') id: string) {
    return this.{{serviceProperty}}.remove(id);
  }
}',
   '[{"name": "entityName", "type": "string", "required": true}, {"name": "serviceName", "type": "string", "required": true}, {"name": "serviceFileName", "type": "string", "required": true}, {"name": "controllerName", "type": "string", "required": true}, {"name": "serviceProperty", "type": "string", "required": true}, {"name": "routePath", "type": "string", "required": true}]',
   'ACTIVE', 'admin', NOW(), NOW()),
   
  ('tpl-003', 'NestJS服务模板', 'nestjs_service', 'SERVICE', 'TYPESCRIPT', 'NESTJS', 'NestJS服务类模板',
   'import { Injectable } from ''@nestjs/common'';
import { PrismaService } from ''../prisma/prisma.service'';
import { {{entityName}} } from ''@prisma/client'';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from ''./dto'';

@Injectable()
export class {{serviceName}} {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: any): Promise<{{entityName}}[]> {
    return this.prisma.{{entityNameCamel}}.findMany(query);
  }

  async findOne(id: string): Promise<{{entityName}} | null> {
    return this.prisma.{{entityNameCamel}}.findUnique({ where: { id } });
  }

  async create(createDto: Create{{entityName}}Dto): Promise<{{entityName}}> {
    return this.prisma.{{entityNameCamel}}.create({ data: createDto });
  }

  async update(id: string, updateDto: Update{{entityName}}Dto): Promise<{{entityName}}> {
    return this.prisma.{{entityNameCamel}}.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string): Promise<{{entityName}}> {
    return this.prisma.{{entityNameCamel}}.delete({ where: { id } });
  }

  async removeMany(ids: string[]): Promise<void> {
    await this.prisma.{{entityNameCamel}}.deleteMany({
      where: { id: { in: ids } },
    });
  }
}',
   '[{"name": "entityName", "type": "string", "required": true}, {"name": "entityFileName", "type": "string", "required": true}, {"name": "serviceName", "type": "string", "required": true}, {"name": "repositoryProperty", "type": "string", "required": true}]',
   'ACTIVE', 'admin', NOW(), NOW());

-- 6. 插入API配置示例
INSERT INTO lowcode_api_configs (id, project_id, name, code, method, path, entity_id, description, status, created_by, created_at, updated_at)
VALUES 
  ('api-001', 'proj-001', '获取商品列表', 'get_products', 'GET', '/products', 'entity-001', '获取商品列表API', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('api-002', 'proj-001', '创建商品', 'create_product', 'POST', '/products', 'entity-001', '创建商品API', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('api-003', 'proj-001', '获取订单列表', 'get_orders', 'GET', '/orders', 'entity-002', '获取订单列表API', 'PUBLISHED', 'admin', NOW(), NOW()),
  ('api-004', 'proj-001', '创建订单', 'create_order', 'POST', '/orders', 'entity-002', '创建订单API', 'PUBLISHED', 'admin', NOW(), NOW());

-- 提交事务
COMMIT;
