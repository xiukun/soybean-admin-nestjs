import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 初始化代码生成器相关数据
 */
async function initializeCodeGenerationData() {
  try {
    console.log('📋 代码生成器数据初始化...');
    // 由于Prisma客户端类型问题，这里暂时跳过菜单初始化
    // 菜单数据将通过SQL脚本在Docker部署时初始化
    console.log('📝 代码生成器菜单将通过SQL脚本初始化');
    console.log('✅ 代码生成器数据初始化完成');

  } catch (error) {
    console.error('❌ 代码生成器数据初始化失败:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 开始低代码平台种子数据初始化...');

  try {
    // 检查是否已经初始化过
    const existingProject = await prisma.project.findFirst();
    if (existingProject) {
      console.log('📋 数据已存在，跳过初始化');
      return;
    }

    // 创建示例项目
    console.log('📁 创建示例项目...');
    const project = await prisma.project.upsert({
      where: { id: 'demo-project-1' },
      update: {
        name: '演示项目',
        description: '用于演示和测试的项目',
        updatedAt: new Date(),
      },
      create: {
        id: 'demo-project-1',
        name: '演示项目',
        code: 'demo-project-1',
        description: '用于演示和测试的项目',
        version: '1.0.0',
        config: {
          database: { type: 'postgresql', host: 'localhost', port: 5432 },
          api: { baseUrl: '/api/v1', prefix: 'demo' }
        },
        status: 'ACTIVE',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ 项目创建完成:', project.name);

    // 创建代码模板
    console.log('📝 创建代码模板...');
    const codeTemplates = [
      {
        id: 'tpl-nestjs-entity-model',
        name: 'NestJS Prisma实体模型',
        code: 'nestjs-prisma-entity-model',
        type: 'ENTITY_MODEL',
        language: 'TYPESCRIPT',
        framework: 'NESTJS',
        description: 'NestJS Prisma实体模型代码模板',
        template: `// Prisma Schema Model for {{entityName}}
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
}`,
        variables: [
          { name: 'entityName', type: 'string', description: '实体类名' },
          { name: 'tableName', type: 'string', description: '数据库表名' },
          { name: 'fields', type: 'array', description: '字段列表' }
        ],
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'tpl-nestjs-service',
        name: 'NestJS Prisma服务类',
        code: 'nestjs-prisma-service',
        type: 'ENTITY_SERVICE',
        language: 'TYPESCRIPT',
        framework: 'NESTJS',
        description: 'NestJS Prisma服务类代码模板',
        template: `import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { {{entityName}}, Create{{entityName}}Input, Update{{entityName}}Input } from './interfaces/{{kebabCase entityName}}.interface';
import { Create{{entityName}}Dto, Update{{entityName}}Dto, {{entityName}}ResponseDto } from './dto/{{kebabCase entityName}}.dto';
import { Prisma } from '@prisma/client';

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

      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.create({
        data,
      });

      return this.mapToResponseDto({{camelCase entityName}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('{{entityName}} with this data already exists');
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

    const {{camelCase entityName}}s = await this.prisma.{{camelCase entityName}}.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
    });

    return {{camelCase entityName}}s.map(this.mapToResponseDto);
  }

  async findOne(id: string): Promise<{{entityName}}ResponseDto> {
    const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.findUnique({
      where: { id },
    });

    if (!{{camelCase entityName}}) {
      throw new NotFoundException(\`{{entityName}} with ID \${id} not found\`);
    }

    return this.mapToResponseDto({{camelCase entityName}});
  }

  async update(id: string, update{{entityName}}Dto: Update{{entityName}}Dto, userId?: string): Promise<{{entityName}}ResponseDto> {
    await this.findOne(id); // Check if exists

    try {
      const data: Prisma.{{entityName}}UpdateInput = {
        ...update{{entityName}}Dto,
        updatedBy: userId,
      };

      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.update({
        where: { id },
        data,
      });

      return this.mapToResponseDto({{camelCase entityName}});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('{{entityName}} with this data already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.{{camelCase entityName}}.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.{{entityName}}WhereInput): Promise<number> {
    return this.prisma.{{camelCase entityName}}.count({ where });
  }

  private mapToResponseDto({{camelCase entityName}}: any): {{entityName}}ResponseDto {
    return {
      id: {{camelCase entityName}}.id,
{{#each fields}}
{{#unless this.isSystemField}}
      {{this.code}}: {{camelCase ../entityName}}.{{this.code}},
{{/unless}}
{{/each}}
      createdAt: {{camelCase entityName}}.createdAt,
      updatedAt: {{camelCase entityName}}.updatedAt,
      createdBy: {{camelCase entityName}}.createdBy,
      updatedBy: {{camelCase entityName}}.updatedBy,
    };
  }
}`,
        variables: [
          { name: 'entityName', type: 'string', description: '实体类名' },
          { name: 'fields', type: 'array', description: '字段列表' }
        ],
        status: 'ACTIVE',
        createdBy: 'system',
      }
    ];

    for (const template of codeTemplates) {
      await prisma.codeTemplate.upsert({
        where: { code: template.code },
        update: {
          name: template.name,
          type: template.type,
          language: template.language,
          framework: template.framework,
          description: template.description,
          template: template.template,
          variables: template.variables,
          status: template.status,
          updatedAt: new Date(),
        },
        create: {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ 代码模板创建完成');

  // 创建示例API配置
  console.log('🔌 创建示例API配置...');
  const apiConfigs = [
    {
      name: '获取用户列表',
      code: 'get-users',
      description: '获取系统中的用户列表',
      method: 'GET',
      path: '/api/users',
      parameters: [],
      responses: {
        '200': {
          description: '成功获取用户列表',
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      },
      security: { type: 'none' },
      config: {},
    },
    {
      name: '创建用户',
      code: 'create-user',
      description: '创建新用户',
      method: 'POST',
      path: '/api/users',
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: '用户姓名',
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          description: '用户邮箱',
        },
      ],
      responses: {
        '201': {
          description: '用户创建成功',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '400': {
          description: '请求参数错误',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              errors: { type: 'array' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '更新用户',
      code: 'update-user',
      description: '更新用户信息',
      method: 'PUT',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: '用户姓名',
        },
        {
          name: 'email',
          type: 'string',
          required: false,
          description: '用户邮箱',
        },
      ],
      responses: {
        '200': {
          description: '用户更新成功',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '删除用户',
      code: 'delete-user',
      description: '删除用户',
      method: 'DELETE',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
      ],
      responses: {
        '204': {
          description: '用户删除成功',
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'jwt' },
      config: { requireAuth: true },
    },
    {
      name: '获取用户详情',
      code: 'get-user',
      description: '根据ID获取用户详情',
      method: 'GET',
      path: '/api/users/{id}',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          in: 'path',
          description: '用户ID',
        },
      ],
      responses: {
        '200': {
          description: '成功获取用户详情',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        '404': {
          description: '用户不存在',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      security: { type: 'none' },
      config: {},
    },
  ];

  for (const apiConfig of apiConfigs) {
    const created = await prisma.apiConfig.upsert({
      where: {
        projectId_code: {
          projectId: project.id,
          code: apiConfig.code,
        },
      },
      update: {
        name: apiConfig.name,
        description: apiConfig.description,
        method: apiConfig.method,
        path: apiConfig.path,
        parameters: apiConfig.parameters,
        responses: apiConfig.responses,
        security: apiConfig.security,
        config: apiConfig.config,
        updatedAt: new Date(),
      },
      create: {
        projectId: project.id,
        name: apiConfig.name,
        code: apiConfig.code,
        description: apiConfig.description,
        method: apiConfig.method,
        path: apiConfig.path,
        parameters: apiConfig.parameters,
        responses: apiConfig.responses,
        security: apiConfig.security,
        config: apiConfig.config,
        status: 'PUBLISHED',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ API配置创建完成:', created.name);
  }

    // 创建示例实体
    console.log('🏗️ 创建示例实体...');
    const entities = [
      {
        id: 'demo-entity-user',
        projectId: project.id,
        name: '用户',
        code: 'User',
        tableName: 'demo_users',
        description: '用户实体，包含基本的用户信息',
        category: '用户管理',
        config: { displayName: '用户', icon: 'user', color: '#1890ff' },
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'demo-entity-role',
        projectId: project.id,
        name: '角色',
        code: 'Role',
        tableName: 'demo_roles',
        description: '角色实体，用于权限管理',
        category: '权限管理',
        config: { displayName: '角色', icon: 'crown', color: '#52c41a' },
        status: 'ACTIVE',
        createdBy: 'system',
      }
    ];

    for (const entity of entities) {
      await prisma.entity.upsert({
        where: { id: entity.id },
        update: {
          name: entity.name,
          code: entity.code,
          tableName: entity.tableName,
          description: entity.description,
          category: entity.category,
          config: entity.config,
          status: entity.status,
          updatedAt: new Date(),
        },
        create: {
          ...entity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ 示例实体创建完成');

    // 创建示例字段
    console.log('📋 创建示例字段...');
    const fields = [
      // 用户实体字段
      {
        id: 'field-user-id',
        entityId: 'demo-entity-user',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '用户唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        id: 'field-user-username',
        entityId: 'demo-entity-user',
        name: '用户名',
        code: 'username',
        type: 'STRING',
        length: 50,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: false,
        comment: '用户登录名',
        sortOrder: 2,
        createdBy: 'system',
      },
      {
        id: 'field-user-email',
        entityId: 'demo-entity-user',
        name: '邮箱',
        code: 'email',
        type: 'STRING',
        length: 100,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: false,
        comment: '用户邮箱地址',
        sortOrder: 3,
        createdBy: 'system',
      },
      {
        id: 'field-user-nickname',
        entityId: 'demo-entity-user',
        name: '昵称',
        code: 'nickname',
        type: 'STRING',
        length: 50,
        nullable: true,
        uniqueConstraint: false,
        primaryKey: false,
        comment: '用户昵称',
        sortOrder: 4,
        createdBy: 'system',
      },
      // 角色实体字段
      {
        id: 'field-role-id',
        entityId: 'demo-entity-role',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '角色唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        id: 'field-role-name',
        entityId: 'demo-entity-role',
        name: '角色名',
        code: 'name',
        type: 'STRING',
        length: 50,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: false,
        comment: '角色名称',
        sortOrder: 2,
        createdBy: 'system',
      }
    ];

    for (const field of fields) {
      await prisma.field.upsert({
        where: { id: field.id },
        update: {
          name: field.name,
          code: field.code,
          type: field.type,
          length: field.length,
          nullable: field.nullable,
          uniqueConstraint: field.uniqueConstraint,
          primaryKey: field.primaryKey,
          comment: field.comment,
          sortOrder: field.sortOrder,
          updatedAt: new Date(),
        },
        create: {
          ...field,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ 示例字段创建完成');

  // 统计数据
  const projectCount = await prisma.project.count();
  const apiConfigCount = await prisma.apiConfig.count();
  const entityCount = await prisma.entity.count();
  const fieldCount = await prisma.field.count();
  const templateCount = await prisma.codeTemplate.count();

  console.log('📊 种子数据统计:');
  console.log(`   项目数量: ${projectCount}`);
  console.log(`   API配置数量: ${apiConfigCount}`);
  console.log(`   实体数量: ${entityCount}`);
  console.log(`   字段数量: ${fieldCount}`);
  console.log(`   代码模板数量: ${templateCount}`);

  // 初始化代码生成器相关数据
  console.log('🚀 初始化代码生成器数据...');
  await initializeCodeGenerationData();

  console.log('🎉 低代码平台种子数据初始化完成!');

  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
