import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.codegenTask.deleteMany();
    await prisma.apiConfig.deleteMany();
    await prisma.api.deleteMany();
    await prisma.lowcodeQuery.deleteMany();
    await prisma.relation.deleteMany();
    await prisma.field.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.templateVersion.deleteMany();
    await prisma.codeTemplate.deleteMany();
    await prisma.projectDeployment.deleteMany();
    await prisma.entityLayout.deleteMany();
    await prisma.project.deleteMany();
  }

  // 创建示例项目
  const demoProject = await prisma.project.create({
    data: {
      name: '电商管理系统',
      code: 'ecommerce-admin',
      description: '一个完整的电商后台管理系统，包含商品管理、订单管理、用户管理等功能',
      version: '1.0.0',
      config: {
        framework: 'nestjs',
        architecture: 'base-biz',
        language: 'typescript',
        database: 'postgresql',
        features: ['authentication', 'authorization', 'caching'],
        settings: {
          enableSwagger: true,
          enableTesting: true,
          enableDocker: true,
          enableAudit: true,
          enableSoftDelete: true,
          enableVersioning: false,
          enableTenancy: false
        }
      },
      status: 'ACTIVE',
      deploymentStatus: 'INACTIVE',
      createdBy: 'system',
    },
  });

  console.log(`✅ Created demo project: ${demoProject.name}`);

  // 创建用户实体
  const userEntity = await prisma.entity.create({
    data: {
      projectId: demoProject.id,
      name: '用户',
      code: 'User',
      tableName: 'users',
      description: '系统用户实体',
      category: 'user',
      diagramPosition: { x: 100, y: 100 },
      status: 'ACTIVE',
      createdBy: 'system',
    },
  });

  // 创建用户实体字段
  const userFields = [
    {
      entityId: userEntity.id,
      name: '用户名',
      code: 'username',
      type: 'STRING',
      length: 50,
      nullable: false,
      uniqueConstraint: true,
      primaryKey: false,
      comment: '用户登录名',
      sortOrder: 1,
      createdBy: 'system',
    },
    {
      entityId: userEntity.id,
      name: '邮箱',
      code: 'email',
      type: 'STRING',
      length: 255,
      nullable: false,
      uniqueConstraint: true,
      comment: '用户邮箱地址',
      validationRules: {
        pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
        message: '请输入有效的邮箱地址'
      },
      sortOrder: 2,
      createdBy: 'system',
    },
    {
      entityId: userEntity.id,
      name: '手机号',
      code: 'phone',
      type: 'STRING',
      length: 20,
      nullable: true,
      uniqueConstraint: true,
      comment: '用户手机号码',
      validationRules: {
        pattern: '^1[3-9]\\d{9}$',
        message: '请输入有效的手机号码'
      },
      sortOrder: 3,
      createdBy: 'system',
    },
    {
      entityId: userEntity.id,
      name: '状态',
      code: 'status',
      type: 'ENUM',
      nullable: false,
      defaultValue: 'ACTIVE',
      enumOptions: ['ACTIVE', 'INACTIVE', 'BANNED'],
      comment: '用户状态',
      sortOrder: 4,
      createdBy: 'system',
    },
    {
      entityId: userEntity.id,
      name: '创建时间',
      code: 'createdAt',
      type: 'DATETIME',
      nullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      comment: '记录创建时间',
      sortOrder: 100,
      createdBy: 'system',
    },
  ];

  await prisma.field.createMany({
    data: userFields,
  });

  console.log(`✅ Created user entity with ${userFields.length} fields`);

  // 创建商品实体
  const productEntity = await prisma.entity.create({
    data: {
      projectId: demoProject.id,
      name: '商品',
      code: 'Product',
      tableName: 'products',
      description: '商品信息实体',
      category: 'business',
      diagramPosition: { x: 400, y: 100 },
      status: 'ACTIVE',
      createdBy: 'system',
    },
  });

  // 创建商品实体字段
  const productFields = [
    {
      entityId: productEntity.id,
      name: '商品名称',
      code: 'name',
      type: 'STRING',
      length: 255,
      nullable: false,
      comment: '商品名称',
      sortOrder: 1,
      createdBy: 'system',
    },
    {
      entityId: productEntity.id,
      name: '商品编码',
      code: 'sku',
      type: 'STRING',
      length: 100,
      nullable: false,
      uniqueConstraint: true,
      comment: '商品SKU编码',
      sortOrder: 2,
      createdBy: 'system',
    },
    {
      entityId: productEntity.id,
      name: '价格',
      code: 'price',
      type: 'DECIMAL',
      precision: 10,
      scale: 2,
      nullable: false,
      comment: '商品价格',
      validationRules: {
        min: 0,
        message: '价格必须大于等于0'
      },
      sortOrder: 3,
      createdBy: 'system',
    },
    {
      entityId: productEntity.id,
      name: '库存数量',
      code: 'stock',
      type: 'INTEGER',
      nullable: false,
      defaultValue: '0',
      comment: '库存数量',
      validationRules: {
        min: 0,
        message: '库存数量不能为负数'
      },
      sortOrder: 4,
      createdBy: 'system',
    },
    {
      entityId: productEntity.id,
      name: '描述',
      code: 'description',
      type: 'TEXT',
      nullable: true,
      comment: '商品描述',
      sortOrder: 5,
      createdBy: 'system',
    },
    {
      entityId: productEntity.id,
      name: '状态',
      code: 'status',
      type: 'ENUM',
      nullable: false,
      defaultValue: 'ACTIVE',
      enumOptions: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      comment: '商品状态',
      sortOrder: 6,
      createdBy: 'system',
    },
  ];

  await prisma.field.createMany({
    data: productFields,
  });

  console.log(`✅ Created product entity with ${productFields.length} fields`);

  // 创建订单实体
  const orderEntity = await prisma.entity.create({
    data: {
      projectId: demoProject.id,
      name: '订单',
      code: 'Order',
      tableName: 'orders',
      description: '订单信息实体',
      category: 'business',
      diagramPosition: { x: 250, y: 300 },
      status: 'ACTIVE',
      createdBy: 'system',
    },
  });

  // 创建订单实体字段
  const orderFields = [
    {
      entityId: orderEntity.id,
      name: '订单号',
      code: 'orderNumber',
      type: 'STRING',
      length: 50,
      nullable: false,
      uniqueConstraint: true,
      comment: '订单号',
      sortOrder: 1,
      createdBy: 'system',
    },
    {
      entityId: orderEntity.id,
      name: '用户ID',
      code: 'userId',
      type: 'STRING',
      length: 36,
      nullable: false,
      comment: '下单用户ID',
      sortOrder: 2,
      createdBy: 'system',
    },
    {
      entityId: orderEntity.id,
      name: '总金额',
      code: 'totalAmount',
      type: 'DECIMAL',
      precision: 10,
      scale: 2,
      nullable: false,
      comment: '订单总金额',
      sortOrder: 3,
      createdBy: 'system',
    },
    {
      entityId: orderEntity.id,
      name: '订单状态',
      code: 'status',
      type: 'ENUM',
      nullable: false,
      defaultValue: 'PENDING',
      enumOptions: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      comment: '订单状态',
      sortOrder: 4,
      createdBy: 'system',
    },
    {
      entityId: orderEntity.id,
      name: '下单时间',
      code: 'orderTime',
      type: 'DATETIME',
      nullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      comment: '下单时间',
      sortOrder: 5,
      createdBy: 'system',
    },
  ];

  await prisma.field.createMany({
    data: orderFields,
  });

  console.log(`✅ Created order entity with ${orderFields.length} fields`);

  // 创建实体关系
  const relations = [
    {
      projectId: demoProject.id,
      name: 'user-orders',
      code: 'userOrders',
      description: '用户和订单的一对多关系',
      type: 'ONE_TO_MANY',
      sourceEntityId: userEntity.id,
      targetEntityId: orderEntity.id,
      foreignKeyName: 'user_id_fk',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      createdBy: 'system',
    },
  ];

  await prisma.relation.createMany({
    data: relations,
  });

  console.log(`✅ Created ${relations.length} entity relationships`);

  // 创建代码模板
  const templates = [
    {
      name: 'NestJS 实体模板',
      code: 'nestjs-entity',
      type: 'ENTITY',
      language: 'typescript',
      framework: 'nestjs',
      description: '生成 TypeORM 实体类',
      content: `import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('{{tableName}}')
export class {{pascalCase entityName}} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

{{#each fields}}
  {{#unless (eq code 'id')}}
  @Column({{#if nullable}}{nullable: true}{{else}}{nullable: false}{{/if}})
  {{code}}: {{mapTypeToTS type}};

  {{/unless}}
{{/each}}
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`,
      variables: [
        {
          name: 'entityName',
          type: 'string',
          required: true,
          description: '实体名称'
        },
        {
          name: 'tableName',
          type: 'string',
          required: true,
          description: '数据库表名'
        },
        {
          name: 'fields',
          type: 'array',
          required: true,
          description: '实体字段列表'
        }
      ],
      version: '1.0.0',
      status: 'ACTIVE',
      category: 'ENTITY',
      createdBy: 'system',
    },
    {
      name: 'NestJS 控制器模板',
      code: 'nestjs-controller',
      type: 'CONTROLLER',
      language: 'typescript',
      framework: 'nestjs',
      description: '生成 NestJS 控制器',
      content: `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto } from './dto/{{kebabCase entityName}}.dto';

@ApiTags('{{kebabCase entityName}}')
@Controller('{{kebabCase entityName}}')
export class {{pascalCase entityName}}Controller {
  constructor(private readonly {{camelCase entityName}}Service: {{pascalCase entityName}}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create {{entityName}}' })
  create(@Body() create{{pascalCase entityName}}Dto: Create{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.create(create{{pascalCase entityName}}Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all {{entityName}}' })
  findAll(@Query() query: any) {
    return this.{{camelCase entityName}}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get {{entityName}} by id' })
  findOne(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update {{entityName}}' })
  update(@Param('id') id: string, @Body() update{{pascalCase entityName}}Dto: Update{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.update(id, update{{pascalCase entityName}}Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete {{entityName}}' })
  remove(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.remove(id);
  }
}`,
      variables: [
        {
          name: 'entityName',
          type: 'string',
          required: true,
          description: '实体名称'
        }
      ],
      version: '1.0.0',
      status: 'ACTIVE',
      category: 'CONTROLLER',
      createdBy: 'system',
    },
    {
      name: 'NestJS 服务模板',
      code: 'nestjs-service',
      type: 'SERVICE',
      language: 'typescript',
      framework: 'nestjs',
      description: '生成 NestJS 服务类',
      content: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {{pascalCase entityName}} } from './entities/{{kebabCase entityName}}.entity';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto } from './dto/{{kebabCase entityName}}.dto';

@Injectable()
export class {{pascalCase entityName}}Service {
  constructor(
    @InjectRepository({{pascalCase entityName}})
    private readonly {{camelCase entityName}}Repository: Repository<{{pascalCase entityName}}>,
  ) {}

  async create(create{{pascalCase entityName}}Dto: Create{{pascalCase entityName}}Dto): Promise<{{pascalCase entityName}}> {
    const {{camelCase entityName}} = this.{{camelCase entityName}}Repository.create(create{{pascalCase entityName}}Dto);
    return this.{{camelCase entityName}}Repository.save({{camelCase entityName}});
  }

  async findAll(query?: any): Promise<{{pascalCase entityName}}[]> {
    return this.{{camelCase entityName}}Repository.find(query);
  }

  async findOne(id: string): Promise<{{pascalCase entityName}}> {
    const {{camelCase entityName}} = await this.{{camelCase entityName}}Repository.findOne({ where: { id } });
    if (!{{camelCase entityName}}) {
      throw new NotFoundException(\`{{entityName}} with ID \${id} not found\`);
    }
    return {{camelCase entityName}};
  }

  async update(id: string, update{{pascalCase entityName}}Dto: Update{{pascalCase entityName}}Dto): Promise<{{pascalCase entityName}}> {
    await this.{{camelCase entityName}}Repository.update(id, update{{pascalCase entityName}}Dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.{{camelCase entityName}}Repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(\`{{entityName}} with ID \${id} not found\`);
    }
  }
}`,
      variables: [
        {
          name: 'entityName',
          type: 'string',
          required: true,
          description: '实体名称'
        }
      ],
      version: '1.0.0',
      status: 'ACTIVE',
      category: 'SERVICE',
      createdBy: 'system',
    },
  ];

  for (const template of templates) {
    await prisma.codeTemplate.create({
      data: {
        ...template,
        variables: template.variables,
      },
    });
  }

  console.log(`✅ Created ${templates.length} code templates`);

  // 创建示例查询
  const queries = [
    {
      projectId: demoProject.id,
      name: '活跃用户查询',
      description: '查询所有活跃状态的用户',
      baseEntityId: userEntity.id,
      baseEntityAlias: 'user',
      fields: [
        { field: 'user.id', alias: 'userId' },
        { field: 'user.username', alias: 'username' },
        { field: 'user.email', alias: 'email' },
        { field: 'user.createdAt', alias: 'createdAt' }
      ],
      filters: [
        {
          field: 'user.status',
          operator: 'EQUALS',
          value: 'ACTIVE'
        }
      ],
      sorting: [
        {
          field: 'user.createdAt',
          direction: 'DESC'
        }
      ],
      status: 'ACTIVE',
      createdBy: 'system',
    },
    {
      projectId: demoProject.id,
      name: '用户订单统计',
      description: '查询用户的订单数量和总金额',
      baseEntityId: userEntity.id,
      baseEntityAlias: 'user',
      joins: [
        {
          type: 'LEFT',
          entity: 'Order',
          alias: 'order',
          condition: 'user.id = order.userId'
        }
      ],
      fields: [
        { field: 'user.id', alias: 'userId' },
        { field: 'user.username', alias: 'username' },
        { field: 'COUNT(order.id)', alias: 'orderCount' },
        { field: 'SUM(order.totalAmount)', alias: 'totalAmount' }
      ],
      groupBy: [
        { field: 'user.id' },
        { field: 'user.username' }
      ],
      sorting: [
        {
          field: 'totalAmount',
          direction: 'DESC'
        }
      ],
      status: 'ACTIVE',
      createdBy: 'system',
    },
  ];

  for (const query of queries) {
    await prisma.lowcodeQuery.create({
      data: {
        ...query,
        joins: query.joins || [],
        fields: query.fields || [],
        filters: query.filters || [],
        sorting: query.sorting || [],
        groupBy: query.groupBy || [],
      },
    });
  }

  console.log(`✅ Created ${queries.length} sample queries`);

  // 创建一个简单的第二个项目
  const blogProject = await prisma.project.create({
    data: {
      name: '博客管理系统',
      code: 'blog-admin',
      description: '简单的博客管理系统，包含文章管理、分类管理等功能',
      version: '1.0.0',
      config: {
        framework: 'nestjs',
        architecture: 'base-biz',
        language: 'typescript',
        database: 'postgresql',
        features: ['authentication'],
        settings: {
          enableSwagger: true,
          enableTesting: false,
          enableDocker: true,
          enableAudit: false,
          enableSoftDelete: true,
        }
      },
      status: 'ACTIVE',
      deploymentStatus: 'INACTIVE',
      createdBy: 'system',
    },
  });

  console.log(`✅ Created blog project: ${blogProject.name}`);

  console.log('🎉 Seed completed successfully!');
  console.log(`
📊 Summary:
- Projects: 2
- Entities: 3 (User, Product, Order)
- Fields: ${userFields.length + productFields.length + orderFields.length}
- Relationships: 1
- Code Templates: ${templates.length}
- Queries: ${queries.length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });