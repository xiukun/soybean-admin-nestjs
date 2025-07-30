# Lowcode Platform Backend 低代码平台核心后端服务说明文档

## 服务概述

Lowcode Platform Backend 是 SoybeanAdmin NestJS 低代码平台的核心后端服务，负责低代码平台的核心业务逻辑，包括项目管理、实体建模、关系设计、API配置、代码生成、模板管理、部署管理等功能。该服务采用领域驱动设计(DDD)架构，提供完整的低代码开发平台支撑能力。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3 (lowcode schema)
- **Node.js**: 18.0.0+

### 架构特点
- **领域驱动设计**: 采用DDD架构模式，清晰的业务边界
- **微服务架构**: 独立的低代码平台核心服务
- **代码生成引擎**: 基于模板的代码自动生成
- **可视化建模**: 支持实体关系图可视化设计
- **多项目管理**: 支持多个低代码项目并行开发

### 安全和认证
- **认证**: JWT + Passport
- **权限控制**: 基于项目的访问控制
- **数据验证**: Class Validator 数据验证
- **API 安全**: 接口级别的权限控制

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **模板引擎**: Handlebars 4.7.8 (代码生成)
- **文件处理**: 文件上传和管理
- **国际化**: i18n 多语言支持

## 项目结构

```
lowcode-platform-backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── app.controller.ts       # 根控制器
│   ├── app.service.ts          # 根服务
│   ├── api/                    # API 控制器层
│   │   ├── code-editor/        # 代码编辑器 API
│   │   ├── code-generation/    # 代码生成 API
│   │   ├── collaboration/      # 协作功能 API
│   │   ├── deployment/         # 部署管理 API
│   │   ├── designer/           # 设计器 API
│   │   ├── health/             # 健康检查 API
│   │   ├── import-export/      # 导入导出 API
│   │   ├── lowcode/            # 低代码核心 API
│   │   ├── sync/               # 数据同步 API
│   │   └── template/           # 模板管理 API
│   ├── infra/                  # 基础设施层
│   │   ├── bounded-contexts/   # 领域上下文
│   │   └── database/           # 数据库配置
│   ├── lib/                    # 业务逻辑层
│   │   ├── api/                # API 业务逻辑
│   │   ├── bounded-contexts/   # 领域业务逻辑
│   │   ├── code-generation/    # 代码生成逻辑
│   │   └── shared/             # 共享业务逻辑
│   ├── resources/              # 资源文件
│   │   ├── i18n/               # 国际化文件
│   │   └── templates/          # 代码生成模板
│   └── views/                  # 视图模板
│       └── lowcode/            # 低代码视图
├── prisma/                     # 数据库配置
│   ├── schema.prisma           # 数据模型
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 数据种子
├── templates/                  # 代码生成模板
├── generated/                  # 生成的代码文件
└── dist/                       # 编译输出
```

## 核心功能模块

### 1. 项目管理 (Project Management)

#### 项目实体模型
```typescript
interface Project {
  id: string;                   // 项目唯一标识
  name: string;                 // 项目名称
  code: string;                 // 项目编码 (唯一)
  description?: string;         // 项目描述
  version?: string;             // 项目版本
  config?: Json;                // 项目配置
  status?: string;              // 项目状态 (ACTIVE/INACTIVE)
  
  // 部署相关字段
  deploymentStatus?: string;    // 部署状态 (INACTIVE/DEPLOYING/DEPLOYED/FAILED)
  deploymentPort?: number;      // 部署端口
  deploymentConfig?: Json;      // 部署配置
  lastDeployedAt?: Date;        // 最后部署时间
  deploymentLogs?: string;      // 部署日志
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  apiConfigs: ApiConfig[];      // API 配置
  apis: Api[];                  // API 接口
  entities: Entity[];           // 实体模型
  queries: LowcodeQuery[];      // 查询配置
  relations: Relation[];        // 关系配置
  deployments: ProjectDeployment[]; // 部署历史
}
```

#### 项目管理 API
```typescript
// 项目管理服务
@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  // 创建项目
  async createProject(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        id: this.generateId(),
        version: '1.0.0',
        status: 'ACTIVE',
        deploymentStatus: 'INACTIVE',
        config: {},
        deploymentConfig: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 获取项目列表
  async getProjects(query: QueryProjectDto) {
    const { page = 1, pageSize = 10, search, status } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              entities: true,
              apis: true,
              relations: true
            }
          }
        }
      }),
      this.prisma.project.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取项目详情
  async getProjectDetail(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        entities: {
          include: {
            fields: true,
            _count: {
              select: {
                sourceRelations: true,
                targetRelations: true
              }
            }
          }
        },
        relations: {
          include: {
            sourceEntity: true,
            targetEntity: true,
            sourceField: true,
            targetField: true
          }
        },
        apis: true,
        apiConfigs: true,
        queries: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // 更新项目
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除项目
  async deleteProject(id: string) {
    return this.prisma.project.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 2. 实体建模 (Entity Modeling)

#### 实体模型
```typescript
interface Entity {
  id: string;                   // 实体唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 实体名称
  code: string;                 // 实体编码
  tableName: string;            // 数据库表名
  description?: string;         // 实体描述
  category?: string;            // 实体分类
  diagramPosition?: Json;       // 图表位置信息
  config?: Json;                // 实体配置
  version?: string;             // 版本号
  status?: string;              // 状态 (DRAFT/PUBLISHED/ARCHIVED)
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  fields: Field[];              // 字段列表
  sourceRelations: Relation[];  // 作为源实体的关系
  targetRelations: Relation[];  // 作为目标实体的关系
  apis: Api[];                  // 相关API
  queries: LowcodeQuery[];      // 相关查询
}

interface Field {
  id: string;                   // 字段唯一标识
  entityId: string;             // 所属实体ID
  name: string;                 // 字段名称
  code: string;                 // 字段编码
  type: string;                 // 字段类型
  length?: number;              // 字段长度
  precision?: number;           // 精度
  scale?: number;               // 小数位数
  nullable?: boolean;           // 是否可空
  required?: boolean;           // 是否必填
  uniqueConstraint?: boolean;   // 唯一约束
  indexed?: boolean;            // 是否索引
  primaryKey?: boolean;         // 是否主键
  defaultValue?: string;        // 默认值
  validationRules?: Json;       // 验证规则
  referenceConfig?: Json;       // 引用配置
  enumOptions?: Json;           // 枚举选项
  comment?: string;             // 字段注释
  sortOrder?: number;           // 排序顺序
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  entity: Entity;               // 所属实体
  sourceRelations: Relation[];  // 作为源字段的关系
  targetRelations: Relation[];  // 作为目标字段的关系
}
```

#### 实体管理服务
```typescript
@Injectable()
export class EntityService {
  constructor(private prisma: PrismaService) {}

  // 创建实体
  async createEntity(createEntityDto: CreateEntityDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建实体
      const entity = await prisma.entity.create({
        data: {
          ...createEntityDto,
          id: this.generateId(),
          tableName: this.generateTableName(createEntityDto.code),
          version: '1.0.0',
          status: 'DRAFT',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 创建默认字段 (id, createdAt, updatedAt)
      const defaultFields = [
        {
          entityId: entity.id,
          name: 'ID',
          code: 'id',
          type: 'VARCHAR',
          length: 36,
          nullable: false,
          required: true,
          primaryKey: true,
          sortOrder: 0,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '创建时间',
          code: 'created_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 998,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '更新时间',
          code: 'updated_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 999,
          createdBy: createEntityDto.createdBy
        }
      ];

      await prisma.field.createMany({
        data: defaultFields.map(field => ({
          ...field,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      });

      return entity;
    });
  }

  // 获取实体列表
  async getEntities(projectId: string, query: QueryEntityDto) {
    const { page = 1, pageSize = 10, search, category, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              fields: true,
              sourceRelations: true,
              targetRelations: true,
              apis: true
            }
          }
        }
      }),
      this.prisma.entity.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体详情
  async getEntityDetail(id: string) {
    return this.prisma.entity.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        },
        sourceRelations: {
          include: {
            targetEntity: true,
            targetField: true
          }
        },
        targetRelations: {
          include: {
            sourceEntity: true,
            sourceField: true
          }
        },
        apis: true,
        queries: true
      }
    });
  }

  // 添加字段
  async addField(entityId: string, createFieldDto: CreateFieldDto) {
    return this.prisma.field.create({
      data: {
        ...createFieldDto,
        id: this.generateId(),
        entityId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 更新字段
  async updateField(fieldId: string, updateFieldDto: UpdateFieldDto) {
    return this.prisma.field.update({
      where: { id: fieldId },
      data: {
        ...updateFieldDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除字段
  async deleteField(fieldId: string) {
    return this.prisma.field.delete({
      where: { id: fieldId }
    });
  }

  // 批量更新字段排序
  async updateFieldsOrder(entityId: string, fieldsOrder: FieldOrderDto[]) {
    return this.prisma.$transaction(
      fieldsOrder.map(({ fieldId, sortOrder }) =>
        this.prisma.field.update({
          where: { id: fieldId },
          data: { sortOrder, updatedAt: new Date() }
        })
      )
    );
  }

  private generateTableName(code: string): string {
    return `lowcode_${code.toLowerCase()}`;
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 3. 关系设计 (Relationship Design)

#### 关系模型
```typescript
interface Relation {
  id: string;                   // 关系唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 关系名称
  code: string;                 // 关系编码
  description?: string;         // 关系描述
  type: string;                 // 关系类型 (ONE_TO_ONE/ONE_TO_MANY/MANY_TO_MANY)
  sourceEntityId: string;       // 源实体ID
  sourceFieldId?: string;       // 源字段ID
  targetEntityId: string;       // 目标实体ID
  targetFieldId?: string;       // 目标字段ID
  foreignKeyName?: string;      // 外键名称
  joinTableConfig?: Json;       // 中间表配置 (多对多关系)
  onDelete?: string;            // 删除策略 (RESTRICT/CASCADE/SET_NULL)
  onUpdate?: string;            // 更新策略 (RESTRICT/CASCADE/SET_NULL)
  config?: Json;                // 关系配置
  status?: string;              // 状态 (ACTIVE/INACTIVE)
  indexed?: boolean;            // 是否创建索引
  indexName?: string;           // 索引名称
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  sourceEntity: Entity;         // 源实体
  sourceField?: Field;          // 源字段
  targetEntity: Entity;         // 目标实体
  targetField?: Field;          // 目标字段
}
```

#### 关系管理服务
```typescript
@Injectable()
export class RelationService {
  constructor(private prisma: PrismaService) {}

  // 创建关系
  async createRelation(createRelationDto: CreateRelationDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建关系
      const relation = await prisma.relation.create({
        data: {
          ...createRelationDto,
          id: this.generateId(),
          status: 'ACTIVE',
          indexed: true,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 根据关系类型创建相应的字段或中间表
      await this.createRelationFields(relation);

      return relation;
    });
  }

  // 获取关系列表
  async getRelations(projectId: string, query: QueryRelationDto) {
    const { page = 1, pageSize = 10, search, type, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.relation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceEntity: {
            select: { id: true, name: true, code: true }
          },
          targetEntity: {
            select: { id: true, name: true, code: true }
          },
          sourceField: {
            select: { id: true, name: true, code: true, type: true }
          },
          targetField: {
            select: { id: true, name: true, code: true, type: true }
          }
        }
      }),
      this.prisma.relation.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体关系图数据
  async getEntityRelationshipDiagram(projectId: string) {
    const entities = await this.prisma.entity.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const relations = await this.prisma.relation.findMany({
      where: { projectId, status: 'ACTIVE' },
      include: {
        sourceEntity: {
          select: { id: true, name: true, code: true }
        },
        targetEntity: {
          select: { id: true, name: true, code: true }
        },
        sourceField: {
          select: { id: true, name: true, code: true }
        },
        targetField: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return {
      entities: entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        position: entity.diagramPosition,
        fields: entity.fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          primaryKey: field.primaryKey,
          nullable: field.nullable,
          unique: field.uniqueConstraint
        }))
      })),
      relations: relations.map(relation => ({
        id: relation.id,
        name: relation.name,
        type: relation.type,
        sourceEntity: relation.sourceEntity,
        targetEntity: relation.targetEntity,
        sourceField: relation.sourceField,
        targetField: relation.targetField
      }))
    };
  }

  // 更新实体位置
  async updateEntityPosition(entityId: string, position: { x: number; y: number }) {
    return this.prisma.entity.update({
      where: { id: entityId },
      data: {
        diagramPosition: position,
        updatedAt: new Date()
      }
    });
  }

  // 删除关系
  async deleteRelation(id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const relation = await prisma.relation.findUnique({
        where: { id }
      });

      if (!relation) {
        throw new NotFoundException('关系不存在');
      }

      // 删除关系相关的字段
      await this.removeRelationFields(relation);

      // 删除关系记录
      return prisma.relation.delete({
        where: { id }
      });
    });
  }

  private async createRelationFields(relation: Relation) {
    switch (relation.type) {
      case 'ONE_TO_ONE':
        await this.createOneToOneRelation(relation);
        break;
      case 'ONE_TO_MANY':
        await this.createOneToManyRelation(relation);
        break;
      case 'MANY_TO_MANY':
        await this.createManyToManyRelation(relation);
        break;
    }
  }

  private async createOneToOneRelation(relation: Relation) {
    // 在目标实体中创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: true,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createOneToManyRelation(relation: Relation) {
    // 在多的一方(目标实体)创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: false,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createManyToManyRelation(relation: Relation) {
    // 创建中间表配置
    const joinTableConfig = {
      tableName: `${relation.sourceEntity.tableName}_${relation.targetEntity.tableName}`,
      sourceColumn: `${relation.sourceEntity.code.toLowerCase()}_id`,
      targetColumn: `${relation.targetEntity.code.toLowerCase()}_id`
    };

    // 更新关系的中间表配置
    await this.prisma.relation.update({
      where: { id: relation.id },
      data: {
        joinTableConfig,
        updatedAt: new Date()
      }
    });
  }

  private async removeRelationFields(relation: Relation) {
    // 根据关系类型删除相应的字段
    // 这里需要根据具体的关系类型和配置来删除相关字段
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 4. API 配置管理

#### API 配置模型
```typescript
interface ApiConfig {
  id: string;                   // API配置唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // API名称
  code: string;                 // API编码
  description?: string;         // API描述
  method: string;               // HTTP方法 (GET/POST/PUT/DELETE)
  path: string;                 // API路径
  entityId?: string;            // 关联实体ID
  parameters?: Json;            // 参数配置
  responses?: Json;             // 响应配置
  security?: Json;              // 安全配置
  config?: Json;                // API配置
  status?: string;              // 状态 (DRAFT/PUBLISHED)
  version?: string;             // 版本号
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}

interface Api {
  id: string;                   // API唯一标识
  projectId: string;            // 所属项目ID
  entityId?: string;            // 关联实体ID
  name: string;                 // API名称
  code: string;                 // API编码
  path: string;                 // API路径
  method: string;               // HTTP方法
  description?: string;         // API描述
  requestConfig?: Json;         // 请求配置
  responseConfig?: Json;        // 响应配置
  queryConfig?: Json;           // 查询配置
  authConfig?: Json;            // 认证配置
  version?: string;             // 版本号
  status?: string;              // 状态
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}
```

#### API 管理服务
```typescript
@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) {}

  // 为实体生成标准CRUD API
  async generateEntityApis(entityId: string, createdBy: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: { fields: true }
    });

    if (!entity) {
      throw new NotFoundException('实体不存在');
    }

    const crudApis = [
      {
        name: `创建${entity.name}`,
        code: `create_${entity.code}`,
        method: 'POST',
        path: `/api/v1/${entity.code.toLowerCase()}s`,
        description: `创建${entity.name}记录`,
        entityId: entity.id,
        requestConfig: {
          body: this.generateRequestSchema(entity.fields, 'create')
        },
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `获取${entity.name}列表`,
        code: `list_${entity.code}`,
        method: 'GET',
        path: `/api/v1/${entity.code.toLowerCase()}s`,
        description: `获取${entity.name}列表`,
        entityId: entity.id,
        queryConfig: {
          pagination: true,
          search: true,
          filters: this.generateFilterConfig(entity.fields)
        },
        responseConfig: {
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: this.generateResponseSchema(entity.fields)
              },
              total: { type: 'number' },
              page: { type: 'number' },
              pageSize: { type: 'number' }
            }
          }
        }
      },
      {
        name: `获取${entity.name}详情`,
        code: `get_${entity.code}`,
        method: 'GET',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `获取${entity.name}详情`,
        entityId: entity.id,
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `更新${entity.name}`,
        code: `update_${entity.code}`,
        method: 'PUT',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `更新${entity.name}记录`,
        entityId: entity.id,
        requestConfig: {
          body: this.generateRequestSchema(entity.fields, 'update')
        },
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `删除${entity.name}`,
        code: `delete_${entity.code}`,
        method: 'DELETE',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `删除${entity.name}记录`,
        entityId: entity.id,
        responseConfig: {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    ];

    return this.prisma.$transaction(
      crudApis.map(apiData => 
        this.prisma.api.create({
          data: {
            ...apiData,
            id: this.generateId(),
            projectId: entity.projectId,
            version: '1.0.0',
            status: 'DRAFT',
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      )
    );
  }

  // 生成请求Schema
  private generateRequestSchema(fields: Field[], operation: 'create' | 'update') {
    const properties: any = {};
    
    fields.forEach(field => {
      if (field.code === 'id' || field.code === 'created_at' || field.code === 'updated_at') {
        return; // 跳过系统字段
      }

      const property: any = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name
      };

      if (field.length) {
        property.maxLength = field.length;
      }

      if (field.enumOptions) {
        property.enum = field.enumOptions;
      }

      if (operation === 'create' && field.required) {
        property.required = true;
      }

      properties[field.code] = property;
    });

    return {
      type: 'object',
      properties,
      required: fields
        .filter(f => f.required && !['id', 'created_at', 'updated_at'].includes(f.code))
        .map(f => f.code)
    };
  }

  // 生成响应Schema
  private generateResponseSchema(fields: Field[]) {
    const properties: any = {};
    
    fields.forEach(field => {
      properties[field.code] = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name
      };
    });

    return {
      type: 'object',
      properties
    };
  }

  // 生成过滤器配置
  private generateFilterConfig(fields: Field[]) {
    return fields
      .filter(field => ['VARCHAR', 'TEXT', 'INT', 'DECIMAL', 'DATE', 'TIMESTAMP'].includes(field.type))
      .map(field => ({
        field: field.code,
        type: field.type,
        operators: this.getOperatorsByType(field.type)
      }));
  }

  // 字段类型映射到JSON Schema类型
  private mapFieldTypeToJsonSchema(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'VARCHAR': 'string',
      'TEXT': 'string',
      'INT': 'integer',
      'BIGINT': 'integer',
      'DECIMAL': 'number',
      'FLOAT': 'number',
      'DOUBLE': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'string',
      'TIMESTAMP': 'string',
      'JSON': 'object'
    };
    
    return typeMap[fieldType] || 'string';
  }

  // 根据字段类型获取支持的操作符
  private getOperatorsByType(fieldType: string): string[] {
    const operatorMap: Record<string, string[]> = {
      'VARCHAR': ['eq', 'ne', 'like', 'in', 'not_in'],
      'TEXT': ['eq', 'ne', 'like'],
      'INT': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in'],
      'DECIMAL': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
      'BOOLEAN': ['eq', 'ne'],
      'DATE': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between'],
      'TIMESTAMP': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between']
    };
    
    return operatorMap[fieldType] || ['eq', 'ne'];
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 5. 查询构建器 (Query Builder)

#### 查询模型
```typescript
interface LowcodeQuery {
  id: string;                   // 查询唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 查询名称
  description?: string;         // 查询描述
  baseEntityId: string;         // 基础实体ID
  baseEntityAlias?: string;     // 基础实体别名
  joins?: Json;                 // 关联配置
  fields?: Json;                // 字段选择
  filters?: Json;               // 过滤条件
  sorting?: Json;               // 排序配置
  groupBy?: Json;               // 分组配置
  havingConditions?: Json;      // Having条件
  limit?: number;               // 限制条数
  offset?: number;              // 偏移量
  status?: string;              // 状态
  sqlQuery?: string;            // 生成的SQL查询
  executionStats?: Json;        // 执行统计
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  baseEntity: Entity;           // 基础实体
}
```

#### 查询构建服务
```typescript
@Injectable()
export class QueryBuilderService {
  constructor(private prisma: PrismaService) {}

  // 创建查询
  async createQuery(createQueryDto: CreateQueryDto) {
    const query = await this.prisma.lowcodeQuery.create({
      data: {
        ...createQueryDto,
        id: this.generateId(),
        baseEntityAlias: createQueryDto.baseEntityAlias || 'main',
        joins: createQueryDto.joins || [],
        fields: createQueryDto.fields || [],
        filters: createQueryDto.filters || [],
        sorting: createQueryDto.sorting || [],
        groupBy: createQueryDto.groupBy || [],
        havingConditions: createQueryDto.havingConditions || [],
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 生成SQL查询
    const sqlQuery = await this.generateSqlQuery(query.id);
    
    return this.prisma.lowcodeQuery.update({
      where: { id: query.id },
      data: { sqlQuery }
    });
  }

  // 生成SQL查询
  async generateSqlQuery(queryId: string): Promise<string> {
    const query = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId },
      include: {
        baseEntity: {
          include: { fields: true }
        },
        project: {
          include: {
            entities: {
              include: { fields: true }
            },
            relations: true
          }
        }
      }
    });

    if (!query) {
      throw new NotFoundException('查询不存在');
    }

    const sqlBuilder = new SqlQueryBuilder(query);
    return sqlBuilder.build();
  }

  // 执行查询
  async executeQuery(queryId: string, parameters: Record<string, any> = {}) {
    const query = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId }
    });

    if (!query || !query.sqlQuery) {
      throw new BadRequestException('查询不存在或SQL未生成');
    }

    const startTime = Date.now();
    
    try {
      // 替换参数
      const parameterizedSql = this.replaceParameters(query.sqlQuery, parameters);
      
      // 执行查询
      const result = await this.prisma.$queryRawUnsafe(parameterizedSql);
      
      const executionTime = Date.now() - startTime;
      
      // 更新执行统计
      await this.updateExecutionStats(queryId, {
        lastExecutedAt: new Date(),
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        success: true
      });

      return {
        data: result,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 更新执行统计
      await this.updateExecutionStats(queryId, {
        lastExecutedAt: new Date(),
        executionTime,
        success: false,
        error: error.message
      });

      throw new BadRequestException(`查询执行失败: ${error.message}`);
    }
  }

  // 查询预览
  async previewQuery(queryConfig: any): Promise<string> {
    const tempQuery = {
      ...queryConfig,
      id: 'preview',
      baseEntity: await this.prisma.entity.findUnique({
        where: { id: queryConfig.baseEntityId },
        include: { fields: true }
      }),
      project: await this.prisma.project.findUnique({
        where: { id: queryConfig.projectId },
        include: {
          entities: { include: { fields: true } },
          relations: true
        }
      })
    };

    const sqlBuilder = new SqlQueryBuilder(tempQuery);
    return sqlBuilder.build();
  }

  private replaceParameters(sql: string, parameters: Record<string, any>): string {
    let result = sql;
    
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const escapedValue = typeof value === 'string' ? `'${value}'` : String(value);
      result = result.replace(new RegExp(placeholder, 'g'), escapedValue);
    });

    return result;
  }

  private async updateExecutionStats(queryId: string, stats: any) {
    const currentStats = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId },
      select: { executionStats: true }
    });

    const updatedStats = {
      ...(currentStats?.executionStats as any || {}),
      ...stats,
      totalExecutions: ((currentStats?.executionStats as any)?.totalExecutions || 0) + 1
    };

    await this.prisma.lowcodeQuery.update({
      where: { id: queryId },
      data: { executionStats: updatedStats }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}

// SQL查询构建器
class SqlQueryBuilder {
  constructor(private query: any) {}

  build(): string {
    const parts = [
      this.buildSelect(),
      this.buildFrom(),
      this.buildJoins(),
      this.buildWhere(),
      this.buildGroupBy(),
      this.buildHaving(),
      this.buildOrderBy(),
      this.buildLimit()
    ].filter(Boolean);

    return parts.join('\n');
  }

  private buildSelect(): string {
    const fields = this.query.fields as any[] || [];
    
    if (fields.length === 0) {
      return `SELECT ${this.query.baseEntityAlias || 'main'}.*`;
    }

    const selectFields = fields.map(field => {
      const alias = field.alias ? ` AS ${field.alias}` : '';
      return `${field.table || this.query.baseEntityAlias}.${field.column}${alias}`;
    });

    return `SELECT ${selectFields.join(', ')}`;
  }

  private buildFrom(): string {
    const tableName = this.query.baseEntity.tableName;
    const alias = this.query.baseEntityAlias || 'main';
    return `FROM ${tableName} ${alias}`;
  }

  private buildJoins(): string {
    const joins = this.query.joins as any[] || [];
    
    return joins.map(join => {
      const joinType = join.type || 'INNER';
      const condition = join.condition || `${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`;
      return `${joinType} JOIN ${join.rightTable} ${join.rightAlias} ON ${condition}`;
    }).join('\n');
  }

  private buildWhere(): string {
    const filters = this.query.filters as any[] || [];
    
    if (filters.length === 0) {
      return '';
    }

    const conditions = filters.map(filter => {
      const table = filter.table || this.query.baseEntityAlias;
      const operator = this.mapOperator(filter.operator);
      const value = this.formatValue(filter.value, filter.type);
      
      return `${table}.${filter.column} ${operator} ${value}`;
    });

    return `WHERE ${conditions.join(' AND ')}`;
  }

  private buildGroupBy(): string {
    const groupBy = this.query.groupBy as any[] || [];
    
    if (groupBy.length === 0) {
      return '';
    }

    const groupFields = groupBy.map(field => 
      `${field.table || this.query.baseEntityAlias}.${field.column}`
    );

    return `GROUP BY ${groupFields.join(', ')}`;
  }

  private buildHaving(): string {
    const havingConditions = this.query.havingConditions as any[] || [];
    
    if (havingConditions.length === 0) {
      return '';
    }

    const conditions = havingConditions.map(condition => {
      const operator = this.mapOperator(condition.operator);
      const value = this.formatValue(condition.value, condition.type);
      
      return `${condition.aggregate}(${condition.column}) ${operator} ${value}`;
    });

    return `HAVING ${conditions.join(' AND ')}`;
  }

  private buildOrderBy(): string {
    const sorting = this.query.sorting as any[] || [];
    
    if (sorting.length === 0) {
      return '';
    }

    const orderFields = sorting.map(sort => {
      const table = sort.table || this.query.baseEntityAlias;
      const direction = sort.direction || 'ASC';
      return `${table}.${sort.column} ${direction}`;
    });

    return `ORDER BY ${orderFields.join(', ')}`;
  }

  private buildLimit(): string {
    const parts = [];
    
    if (this.query.limit) {
      parts.push(`LIMIT ${this.query.limit}`);
    }
    
    if (this.query.offset) {
      parts.push(`OFFSET ${this.query.offset}`);
    }

    return parts.join(' ');
  }

  private mapOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      'eq': '=',
      'ne': '!=',
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'like': 'LIKE',
      'in': 'IN',
      'not_in': 'NOT IN',
      'is_null': 'IS NULL',
      'is_not_null': 'IS NOT NULL'
    };
    
    return operatorMap[operator] || '=';
  }

  private formatValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    switch (type) {
      case 'VARCHAR':
      case 'TEXT':
      case 'DATE':
      case 'TIMESTAMP':
        return `'${value}'`;
      case 'INT':
      case 'BIGINT':
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE':
        return String(value);
      case 'BOOLEAN':
        return value ? 'TRUE' : 'FALSE';
      default:
        return `'${value}'`;
    }
  }
}
```

### 6. 代码生成引擎

#### 代码模板模型
```typescript
interface CodeTemplate {
  id: string;                   // 模板唯一标识
  name: string;                 // 模板名称
  code: string;                 // 模板编码 (唯一)
  type: string;                 // 模板类型 (CONTROLLER/SERVICE/DTO/ENTITY)
  language: string;             // 编程语言 (TypeScript/JavaScript/Java/Python)
  framework: string;            // 框架 (NestJS/Express/Spring/Django)
  description?: string;         // 模板描述
  content: string;              // 模板内容 (Handlebars格式)
  variables?: Json;             // 模板变量定义
  version?: string;             // 版本号
  status?: string;              // 状态 (ACTIVE/INACTIVE)
  category?: string;            // 分类
  tags?: Json;                  // 标签
  isPublic?: boolean;           // 是否公开
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  versions: TemplateVersion[];   // 模板版本历史
}

interface TemplateVersion {
  id: string;                   // 版本唯一标识
  templateId: string;           // 模板ID
  version: string;              // 版本号
  content: string;              // 版本内容
  variables?: Json;             // 版本变量
  changelog?: string;           // 变更日志
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  template: CodeTemplate;       // 关联模板
}

interface CodegenTask {
  id: string;                   // 任务唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 任务名称
  type: string;                 // 生成类型 (FULL/ENTITY/API/FRONTEND)
  config?: Json;                // 生成配置
  status?: string;              // 状态 (PENDING/RUNNING/COMPLETED/FAILED)
  progress?: number;            // 进度百分比
  result?: Json;                // 生成结果
  errorMsg?: string;            // 错误信息
  outputPath?: string;          // 输出路径
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedAt?: Date;             // 更新时间
}
```

#### 代码生成服务
```typescript
@Injectable()
export class CodeGenerationService {
  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService
  ) {}

  // 生成项目完整代码
  async generateProjectCode(projectId: string, config: GenerateProjectCodeDto) {
    const task = await this.createCodegenTask({
      projectId,
      name: '生成项目完整代码',
      type: 'FULL',
      config,
      createdBy: config.createdBy
    });

    // 异步执行代码生成
    this.executeCodeGeneration(task.id).catch(error => {
      console.error('代码生成失败:', error);
    });

    return task;
  }

  // 生成实体代码
  async generateEntityCode(entityId: string, config: GenerateEntityCodeDto) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        fields: true,
        project: true
      }
    });

    if (!entity) {
      throw new NotFoundException('实体不存在');
    }

    const task = await this.createCodegenTask({
      projectId: entity.projectId,
      name: `生成${entity.name}实体代码`,
      type: 'ENTITY',
      config: { entityId, ...config },
      createdBy: config.createdBy
    });

    // 异步执行代码生成
    this.executeEntityCodeGeneration(task.id, entity).catch(error => {
      console.error('实体代码生成失败:', error);
    });

    return task;
  }

  // 执行代码生成任务
  private async executeCodeGeneration(taskId: string) {
    await this.updateTaskStatus(taskId, 'RUNNING', 0);

    try {
      const task = await this.prisma.codegenTask.findUnique({
        where: { id: taskId }
      });

      const project = await this.prisma.project.findUnique({
        where: { id: task.projectId },
        include: {
          entities: {
            include: {
              fields: true,
              sourceRelations: {
                include: {
                  targetEntity: true,
                  targetField: true
                }
              },
              targetRelations: {
                include: {
                  sourceEntity: true,
                  sourceField: true
                }
              }
            }
          },
          relations: true,
          apis: true
        }
      });

      const config = task.config as any;
      const outputPath = `generated/${project.code}`;

      // 生成后端代码
      if (config.generateBackend) {
        await this.generateBackendCode(project, outputPath, taskId);
      }

      // 生成前端代码
      if (config.generateFrontend) {
        await this.generateFrontendCode(project, outputPath, taskId);
      }

      // 生成数据库脚本
      if (config.generateDatabase) {
        await this.generateDatabaseScript(project, outputPath, taskId);
      }

      await this.updateTaskStatus(taskId, 'COMPLETED', 100, {
        outputPath,
        generatedFiles: await this.getGeneratedFiles(outputPath)
      });

    } catch (error) {
      await this.updateTaskStatus(taskId, 'FAILED', 0, null, error.message);
      throw error;
    }
  }

  // 生成后端代码
  private async generateBackendCode(project: any, outputPath: string, taskId: string) {
    const backendPath = `${outputPath}/backend`;
    
    // 生成实体代码
    for (const entity of project.entities) {
      await this.generateEntityFiles(entity, backendPath);
      await this.updateTaskProgress(taskId, 30);
    }

    // 生成API代码
    for (const api of project.apis) {
      await this.generateApiFiles(api, backendPath);
      await this.updateTaskProgress(taskId, 50);
    }

    // 生成配置文件
    await this.generateConfigFiles(project, backendPath);
    await this.updateTaskProgress(taskId, 60);
  }

  // 生成实体文件
  private async generateEntityFiles(entity: any, outputPath: string) {
    const entityPath = `${outputPath}/src/entities`;
    
    // 生成实体类
    const entityTemplate = await this.templateService.getTemplate('entity', 'typescript', 'nestjs');
    const entityCode = await this.renderTemplate(entityTemplate.content, {
      entity,
      fields: entity.fields,
      relations: [...entity.sourceRelations, ...entity.targetRelations]
    });
    
    await this.writeFile(`${entityPath}/${entity.code}.entity.ts`, entityCode);

    // 生成DTO
    const dtoTemplate = await this.templateService.getTemplate('dto', 'typescript', 'nestjs');
    const dtoCode = await this.renderTemplate(dtoTemplate.content, {
      entity,
      fields: entity.fields
    });
    
    await this.writeFile(`${entityPath}/${entity.code}.dto.ts`, dtoCode);

    // 生成Service
    const serviceTemplate = await this.templateService.getTemplate('service', 'typescript', 'nestjs');
    const serviceCode = await this.renderTemplate(serviceTemplate.content, {
      entity,
      fields: entity.fields
    });
    
    await this.writeFile(`${entityPath}/${entity.code}.service.ts`, serviceCode);

    // 生成Controller
    const controllerTemplate = await this.templateService.getTemplate('controller', 'typescript', 'nestjs');
    const controllerCode = await this.renderTemplate(controllerTemplate.content, {
      entity,
      fields: entity.fields
    });
    
    await this.writeFile(`${entityPath}/${entity.code}.controller.ts`, controllerCode);
  }

  // 生成前端代码
  private async generateFrontendCode(project: any, outputPath: string, taskId: string) {
    const frontendPath = `${outputPath}/frontend`;
    
    // 生成页面组件
    for (const entity of project.entities) {
      await this.generatePageComponents(entity, frontendPath);
      await this.updateTaskProgress(taskId, 80);
    }

    // 生成路由配置
    await this.generateRouterConfig(project, frontendPath);
    await this.updateTaskProgress(taskId, 90);
  }

  // 生成数据库脚本
  private async generateDatabaseScript(project: any, outputPath: string, taskId: string) {
    const dbPath = `${outputPath}/database`;
    
    // 生成建表脚本
    const createTableScript = this.generateCreateTableScript(project.entities);
    await this.writeFile(`${dbPath}/create_tables.sql`, createTableScript);

    // 生成外键脚本
    const foreignKeyScript = this.generateForeignKeyScript(project.relations);
    await this.writeFile(`${dbPath}/create_foreign_keys.sql`, foreignKeyScript);

    // 生成索引脚本
    const indexScript = this.generateIndexScript(project.entities);
    await this.writeFile(`${dbPath}/create_indexes.sql`, indexScript);

    await this.updateTaskProgress(taskId, 95);
  }

  // 渲染模板
  private async renderTemplate(template: string, data: any): Promise<string> {
    const Handlebars = require('handlebars');
    
    // 注册辅助函数
    this.registerHandlebarsHelpers(Handlebars);
    
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  }

  // 注册Handlebars辅助函数
  private registerHandlebarsHelpers(Handlebars: any) {
    // 转换为PascalCase
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    });

    // 转换为camelCase
    Handlebars.registerHelper('camelCase', (str: string) => {
      return str.charAt(0).toLowerCase() + str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    });

    // 转换为kebab-case
    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    });

    // 字段类型映射
    Handlebars.registerHelper('mapFieldType', (fieldType: string, target: string) => {
      const typeMap: Record<string, Record<string, string>> = {
        typescript: {
          'VARCHAR': 'string',
          'TEXT': 'string',
          'INT': 'number',
          'BIGINT': 'number',
          'DECIMAL': 'number',
          'FLOAT': 'number',
          'DOUBLE': 'number',
          'BOOLEAN': 'boolean',
          'DATE': 'Date',
          'TIMESTAMP': 'Date',
          'JSON': 'any'
        },
        prisma: {
          'VARCHAR': 'String',
          'TEXT': 'String',
          'INT': 'Int',
          'BIGINT': 'BigInt',
          'DECIMAL': 'Decimal',
          'FLOAT': 'Float',
          'DOUBLE': 'Float',
          'BOOLEAN': 'Boolean',
          'DATE': 'DateTime',
          'TIMESTAMP': 'DateTime',
          'JSON': 'Json'
        }
      };
      
      return typeMap[target]?.[fieldType] || 'string';
    });
  }

  // 创建代码生成任务
  private async createCodegenTask(data: any) {
    return this.prisma.codegenTask.create({
      data: {
        ...data,
        id: this.generateId(),
        status: 'PENDING',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 更新任务状态
  private async updateTaskStatus(taskId: string, status: string, progress: number, result?: any, errorMsg?: string) {
    return this.prisma.codegenTask.update({
      where: { id: taskId },
      data: {
        status,
        progress,
        result,
        errorMsg,
        updatedAt: new Date()
      }
    });
  }

  // 更新任务进度
  private async updateTaskProgress(taskId: string, progress: number) {
    return this.prisma.codegenTask.update({
      where: { id: taskId },
      data: {
        progress,
        updatedAt: new Date()
      }
    });
  }

  // 写入文件
  private async writeFile(filePath: string, content: string) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // 确保目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');
  }

  // 获取生成的文件列表
  private async getGeneratedFiles(outputPath: string): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const files: string[] = [];
    
    async function walkDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    try {
      await walkDir(outputPath);
    } catch (error) {
      console.error('获取文件列表失败:', error);
    }
    
    return files;
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 7. 项目部署管理

#### 部署模型
```typescript
interface ProjectDeployment {
  id: string;                   // 部署唯一标识
  projectId: string;            // 项目ID
  version: string;              // 部署版本
  status: string;               // 部署状态 (PENDING/DEPLOYING/DEPLOYED/FAILED/STOPPED)
  port?: number;                // 部署端口
  config?: Json;                // 部署配置
  logs?: string;                // 部署日志
  startedAt?: Date;             // 开始时间
  completedAt?: Date;           // 完成时间
  errorMsg?: string;            // 错误信息
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  project: Project;             // 关联项目
}
```

#### 部署管理服务
```typescript
@Injectable()
export class DeploymentService {
  constructor(private prisma: PrismaService) {}

  // 部署项目
  async deployProject(projectId: string, deployConfig: DeployProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 创建部署记录
    const deployment = await this.prisma.projectDeployment.create({
      data: {
        projectId,
        version: deployConfig.version || project.version,
        status: 'PENDING',
        port: deployConfig.port || await this.getAvailablePort(),
        config: deployConfig.config || {},
        createdBy: deployConfig.createdBy,
        createdAt: new Date()
      }
    });

    // 异步执行部署
    this.executeDeployment(deployment.id).catch(error => {
      console.error('部署失败:', error);
    });

    return deployment;
  }

  // 执行部署
  private async executeDeployment(deploymentId: string) {
    await this.updateDeploymentStatus(deploymentId, 'DEPLOYING', new Date());

    try {
      const deployment = await this.prisma.projectDeployment.findUnique({
        where: { id: deploymentId },
        include: { project: true }
      });

      const project = deployment.project;
      const config = deployment.config as any;

      // 1. 生成项目代码
      const codegenResult = await this.generateProjectCode(project);
      await this.appendDeploymentLog(deploymentId, '✅ 代码生成完成');

      // 2. 构建Docker镜像
      const imageName = `lowcode-${project.code.toLowerCase()}:${deployment.version}`;
      await this.buildDockerImage(codegenResult.outputPath, imageName);
      await this.appendDeploymentLog(deploymentId, '✅ Docker镜像构建完成');

      // 3. 启动容器
      const containerId = await this.startContainer(imageName, deployment.port, config);
      await this.appendDeploymentLog(deploymentId, '✅ 容器启动完成');

      // 4. 健康检查
      await this.waitForHealthCheck(`http://localhost:${deployment.port}/health`);
      await this.appendDeploymentLog(deploymentId, '✅ 健康检查通过');

      // 5. 更新项目部署状态
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          deploymentStatus: 'DEPLOYED',
          deploymentPort: deployment.port,
          lastDeployedAt: new Date(),
          deploymentConfig: config
        }
      });

      await this.updateDeploymentStatus(deploymentId, 'DEPLOYED', null, new Date());

    } catch (error) {
      await this.updateDeploymentStatus(deploymentId, 'FAILED', null, null, error.message);
      await this.appendDeploymentLog(deploymentId, `❌ 部署失败: ${error.message}`);
      throw error;
    }
  }

  // 停止项目
  async stopProject(projectId: string, stoppedBy: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.deploymentStatus !== 'DEPLOYED') {
      throw new BadRequestException('项目未部署或状态异常');
    }

    try {
      // 停止容器
      const containerName = `lowcode-${project.code.toLowerCase()}`;
      await this.stopContainer(containerName);

      // 更新项目状态
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          deploymentStatus: 'INACTIVE',
          deploymentPort: null,
          deploymentLogs: `${project.deploymentLogs || ''}\n${new Date().toISOString()} - 项目已停止`
        }
      });

      return { success: true, message: '项目停止成功' };

    } catch (error) {
      throw new BadRequestException(`停止项目失败: ${error.message}`);
    }
  }

  // 获取部署日志
  async getDeploymentLogs(deploymentId: string) {
    const deployment = await this.prisma.projectDeployment.findUnique({
      where: { id: deploymentId },
      select: { logs: true, status: true, errorMsg: true }
    });

    if (!deployment) {
      throw new NotFoundException('部署记录不存在');
    }

    return {
      logs: deployment.logs || '',
      status: deployment.status,
      error: deployment.errorMsg
    };
  }

  // 获取可用端口
  private async getAvailablePort(): Promise<number> {
    const usedPorts = await this.prisma.project.findMany({
      where: {
        deploymentStatus: 'DEPLOYED',
        deploymentPort: { not: null }
      },
      select: { deploymentPort: true }
    });

    const usedPortNumbers = usedPorts.map(p => p.deploymentPort).filter(Boolean);
    
    // 从8000开始查找可用端口
    for (let port = 8000; port < 9000; port++) {
      if (!usedPortNumbers.includes(port)) {
        return port;
      }
    }

    throw new BadRequestException('没有可用的端口');
  }

  // 构建Docker镜像
  private async buildDockerImage(sourcePath: string, imageName: string) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const command = `docker build -t ${imageName} ${sourcePath}`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.log('Docker build output:', stdout);
      if (stderr) {
        console.warn('Docker build warnings:', stderr);
      }
    } catch (error) {
      throw new Error(`Docker镜像构建失败: ${error.message}`);
    }
  }

  // 启动容器
  private async startContainer(imageName: string, port: number, config: any): Promise<string> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const containerName = imageName.split(':')[0];
    const envVars = Object.entries(config.env || {})
      .map(([key, value]) => `-e ${key}=${value}`)
      .join(' ');

    const command = `docker run -d --name ${containerName} -p ${port}:3000 ${envVars} ${imageName}`;
    
    try {
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      throw new Error(`容器启动失败: ${error.message}`);
    }
  }

  // 停止容器
  private async stopContainer(containerName: string) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`docker stop ${containerName}`);
      await execAsync(`docker rm ${containerName}`);
    } catch (error) {
      throw new Error(`容器停止失败: ${error.message}`);
    }
  }

  // 健康检查
  private async waitForHealthCheck(url: string, maxRetries = 30, interval = 2000) {
    const axios = require('axios');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(url, { timeout: 5000 });
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error('健康检查超时');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // 更新部署状态
  private async updateDeploymentStatus(
    deploymentId: string, 
    status: string, 
    startedAt?: Date, 
    completedAt?: Date, 
    errorMsg?: string
  ) {
    return this.prisma.projectDeployment.update({
      where: { id: deploymentId },
      data: {
        status,
        startedAt,
        completedAt,
        errorMsg
      }
    });
  }

  // 追加部署日志
  private async appendDeploymentLog(deploymentId: string, logMessage: string) {
    const deployment = await this.prisma.projectDeployment.findUnique({
      where: { id: deploymentId },
      select: { logs: true }
    });

    const timestamp = new Date().toISOString();
    const newLog = `${timestamp} - ${logMessage}`;
    const updatedLogs = deployment.logs ? `${deployment.logs}\n${newLog}` : newLog;

    return this.prisma.projectDeployment.update({
      where: { id: deploymentId },
      data: { logs: updatedLogs }
    });
  }
}
```

## API 接口设计

### 主要 API 端点

#### 项目管理
```typescript
GET    /api/v1/projects           # 获取项目列表
POST   /api/v1/projects           # 创建项目
GET    /api/v1/projects/:id       # 获取项目详情
PUT    /api/v1/projects/:id       # 更新项目
DELETE /api/v1/projects/:id       # 删除项目
```

#### 实体管理
```typescript
GET    /api/v1/projects/:projectId/entities        # 获取实体列表
POST   /api/v1/projects/:projectId/entities        # 创建实体
GET    /api/v1/entities/:id                        # 获取实体详情
PUT    /api/v1/entities/:id                        # 更新实体
DELETE /api/v1/entities/:id                        # 删除实体

GET    /api/v1/entities/:entityId/fields           # 获取字段列表
POST   /api/v1/entities/:entityId/fields           # 添加字段
PUT    /api/v1/fields/:id                          # 更新字段
DELETE /api/v1/fields/:id                          # 删除字段
```

#### 关系管理
```typescript
GET    /api/v1/projects/:projectId/relations       # 获取关系列表
POST   /api/v1/projects/:projectId/relations       # 创建关系
GET    /api/v1/relations/:id                       # 获取关系详情
PUT    /api/v1/relations/:id                       # 更新关系
DELETE /api/v1/relations/:id                       # 删除关系

GET    /api/v1/projects/:projectId/diagram         # 获取关系图数据
PUT    /api/v1/entities/:id/position               # 更新实体位置
```

#### 代码生成
```typescript
POST   /api/v1/projects/:projectId/generate        # 生成项目代码
POST   /api/v1/entities/:entityId/generate         # 生成实体代码
GET    /api/v1/codegen-tasks/:id                   # 获取生成任务状态
GET    /api/v1/codegen-tasks/:id/logs              # 获取生成日志
```

#### 部署管理
```typescript
POST   /api/v1/projects/:projectId/deploy          # 部署项目
POST   /api/v1/projects/:projectId/stop            # 停止项目
GET    /api/v1/deployments/:id                     # 获取部署详情
GET    /api/v1/deployments/:id/logs                # 获取部署日志
```

#### 模板管理
```typescript
GET    /api/v1/templates                           # 获取模板列表
POST   /api/v1/templates                           # 创建模板
GET    /api/v1/templates/:id                       # 获取模板详情
PUT    /api/v1/templates/:id                       # 更新模板
DELETE /api/v1/templates/:id                       # 删除模板
```

## 部署配置

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# 安装Docker CLI (用于部署功能)
RUN apk add --no-cache docker-cli

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/package.json ./

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
```

### 环境变量配置
```bash
# 应用配置
NODE_ENV=production
PORT=3000
SERVICE_NAME=lowcode-platform

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=lowcode

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest!@#123.
JWT_EXPIRES_IN=7d

# 服务间通信
BACKEND_URL=http://backend:9528
AMIS_BACKEND_URL=http://amis-backend:9522

# 代码生成配置
CODE_GENERATION_PATH=/app/generated
TEMPLATE_PATH=/app/resources/templates

# 部署配置
DOCKER_HOST=unix:///var/run/docker.sock
DEPLOYMENT_PORT_RANGE_START=8000
DEPLOYMENT_PORT_RANGE_END=8999

# 文件上传配置
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Redis 配置 (可选)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 开发指南

### 本地开发
```bash
# 安装依赖
pnpm install

# 数据库迁移
pnpm prisma:migrate
pnpm prisma:generate

# 启动开发服务器
pnpm start:dev

# 运行测试
pnpm test
pnpm test:e2e

# 代码检查
pnpm lint
pnpm lint:fix
```

### 添加新功能模块
```bash
# 生成新的API模块
nest g module api/new-feature
nest g controller api/new-feature
nest g service api/new-feature

# 生成业务逻辑模块
nest g module lib/new-feature
nest g service lib/new-feature
```

## 最佳实践

### 1. 领域驱动设计
- 按业务领域组织代码结构
- 明确界定上下文边界
- 使用聚合根管理实体生命周期

### 2. 代码生成模板
- 使用版本控制管理模板
- 提供丰富的模板变量
- 支持模板继承和组合

### 3. 部署安全
- 容器资源限制
- 网络隔离配置
- 敏感信息加密存储

### 4. 性能优化
- 数据库查询优化
- 缓存策略设计
- 异步任务处理

---

**服务端口**: 3000  
**API 基础路径**: http://localhost:3
# Lowcode Platform Backend 低代码平台核心后端服务说明文档

## 服务概述

Lowcode Platform Backend 是 SoybeanAdmin NestJS 低代码平台的核心后端服务，负责低代码平台的核心业务逻辑，包括项目管理、实体建模、关系设计、API配置、代码生成、模板管理、部署管理等功能。该服务采用领域驱动设计(DDD)架构，提供完整的低代码开发平台支撑能力。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3 (lowcode schema)
- **Node.js**: 18.0.0+

### 架构特点
- **领域驱动设计**: 采用DDD架构模式，清晰的业务边界
- **微服务架构**: 独立的低代码平台核心服务
- **代码生成引擎**: 基于模板的代码自动生成
- **可视化建模**: 支持实体关系图可视化设计
- **多项目管理**: 支持多个低代码项目并行开发

### 安全和认证
- **认证**: JWT + Passport
- **权限控制**: 基于项目的访问控制
- **数据验证**: Class Validator 数据验证
- **API 安全**: 接口级别的权限控制

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **模板引擎**: Handlebars 4.7.8 (代码生成)
- **文件处理**: 文件上传和管理
- **国际化**: i18n 多语言支持

## 项目结构

```
lowcode-platform-backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── app.controller.ts       # 根控制器
│   ├── app.service.ts          # 根服务
│   ├── api/                    # API 控制器层
│   │   ├── code-editor/        # 代码编辑器 API
│   │   ├── code-generation/    # 代码生成 API
│   │   ├── collaboration/      # 协作功能 API
│   │   ├── deployment/         # 部署管理 API
│   │   ├── designer/           # 设计器 API
│   │   ├── health/             # 健康检查 API
│   │   ├── import-export/      # 导入导出 API
│   │   ├── lowcode/            # 低代码核心 API
│   │   ├── sync/               # 数据同步 API
│   │   └── template/           # 模板管理 API
│   ├── infra/                  # 基础设施层
│   │   ├── bounded-contexts/   # 领域上下文
│   │   └── database/           # 数据库配置
│   ├── lib/                    # 业务逻辑层
│   │   ├── api/                # API 业务逻辑
│   │   ├── bounded-contexts/   # 领域业务逻辑
│   │   ├── code-generation/    # 代码生成逻辑
│   │   └── shared/             # 共享业务逻辑
│   ├── resources/              # 资源文件
│   │   ├── i18n/               # 国际化文件
│   │   └── templates/          # 代码生成模板
│   └── views/                  # 视图模板
│       └── lowcode/            # 低代码视图
├── prisma/                     # 数据库配置
│   ├── schema.prisma           # 数据模型
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 数据种子
├── templates/                  # 代码生成模板
├── generated/                  # 生成的代码文件
└── dist/                       # 编译输出
```

## 核心功能模块

### 1. 项目管理 (Project Management)

#### 项目实体模型
```typescript
interface Project {
  id: string;                   // 项目唯一标识
  name: string;                 // 项目名称
  code: string;                 // 项目编码 (唯一)
  description?: string;         // 项目描述
  version?: string;             // 项目版本
  config?: Json;                // 项目配置
  status?: string;              // 项目状态 (ACTIVE/INACTIVE)
  
  // 部署相关字段
  deploymentStatus?: string;    // 部署状态 (INACTIVE/DEPLOYING/DEPLOYED/FAILED)
  deploymentPort?: number;      // 部署端口
  deploymentConfig?: Json;      // 部署配置
  lastDeployedAt?: Date;        // 最后部署时间
  deploymentLogs?: string;      // 部署日志
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  apiConfigs: ApiConfig[];      // API 配置
  apis: Api[];                  // API 接口
  entities: Entity[];           // 实体模型
  queries: LowcodeQuery[];      // 查询配置
  relations: Relation[];        // 关系配置
  deployments: ProjectDeployment[]; // 部署历史
}
```

#### 项目管理 API
```typescript
// 项目管理服务
@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  // 创建项目
  async createProject(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        id: this.generateId(),
        version: '1.0.0',
        status: 'ACTIVE',
        deploymentStatus: 'INACTIVE',
        config: {},
        deploymentConfig: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 获取项目列表
  async getProjects(query: QueryProjectDto) {
    const { page = 1, pageSize = 10, search, status } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              entities: true,
              apis: true,
              relations: true
            }
          }
        }
      }),
      this.prisma.project.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取项目详情
  async getProjectDetail(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        entities: {
          include: {
            fields: true,
            _count: {
              select: {
                sourceRelations: true,
                targetRelations: true
              }
            }
          }
        },
        relations: {
          include: {
            sourceEntity: true,
            targetEntity: true,
            sourceField: true,
            targetField: true
          }
        },
        apis: true,
        apiConfigs: true,
        queries: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // 更新项目
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除项目
  async deleteProject(id: string) {
    return this.prisma.project.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 2. 实体建模 (Entity Modeling)

#### 实体模型
```typescript
interface Entity {
  id: string;                   // 实体唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 实体名称
  code: string;                 // 实体编码
  tableName: string;            // 数据库表名
  description?: string;         // 实体描述
  category?: string;            // 实体分类
  diagramPosition?: Json;       // 图表位置信息
  config?: Json;                // 实体配置
  version?: string;             // 版本号
  status?: string;              // 状态 (DRAFT/PUBLISHED/ARCHIVED)
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  fields: Field[];              // 字段列表
  sourceRelations: Relation[];  // 作为源实体的关系
  targetRelations: Relation[];  // 作为目标实体的关系
  apis: Api[];                  // 相关API
  queries: LowcodeQuery[];      // 相关查询
}

interface Field {
  id: string;                   // 字段唯一标识
  entityId: string;             // 所属实体ID
  name: string;                 // 字段名称
  code: string;                 // 字段编码
  type: string;                 // 字段类型
  length?: number;              // 字段长度
  precision?: number;           // 精度
  scale?: number;               // 小数位数
  nullable?: boolean;           // 是否可空
  required?: boolean;           // 是否必填
  uniqueConstraint?: boolean;   // 唯一约束
  indexed?: boolean;            // 是否索引
  primaryKey?: boolean;         // 是否主键
  defaultValue?: string;        // 默认值
  validationRules?: Json;       // 验证规则
  referenceConfig?: Json;       // 引用配置
  enumOptions?: Json;           // 枚举选项
  comment?: string;             // 字段注释
  sortOrder?: number;           // 排序顺序
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  entity: Entity;               // 所属实体
  sourceRelations: Relation[];  // 作为源字段的关系
  targetRelations: Relation[];  // 作为目标字段的关系
}
```

#### 实体管理服务
```typescript
@Injectable()
export class EntityService {
  constructor(private prisma: PrismaService) {}

  // 创建实体
  async createEntity(createEntityDto: CreateEntityDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建实体
      const entity = await prisma.entity.create({
        data: {
          ...createEntityDto,
          id: this.generateId(),
          tableName: this.generateTableName(createEntityDto.code),
          version: '1.0.0',
          status: 'DRAFT',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 创建默认字段 (id, createdAt, updatedAt)
      const defaultFields = [
        {
          entityId: entity.id,
          name: 'ID',
          code: 'id',
          type: 'VARCHAR',
          length: 36,
          nullable: false,
          required: true,
          primaryKey: true,
          sortOrder: 0,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '创建时间',
          code: 'created_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 998,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '更新时间',
          code: 'updated_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 999,
          createdBy: createEntityDto.createdBy
        }
      ];

      await prisma.field.createMany({
        data: defaultFields.map(field => ({
          ...field,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      });

      return entity;
    });
  }

  // 获取实体列表
  async getEntities(projectId: string, query: QueryEntityDto) {
    const { page = 1, pageSize = 10, search, category, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              fields: true,
              sourceRelations: true,
              targetRelations: true,
              apis: true
            }
          }
        }
      }),
      this.prisma.entity.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体详情
  async getEntityDetail(id: string) {
    return this.prisma.entity.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        },
        sourceRelations: {
          include: {
            targetEntity: true,
            targetField: true
          }
        },
        targetRelations: {
          include: {
            sourceEntity: true,
            sourceField: true
          }
        },
        apis: true,
        queries: true
      }
    });
  }

  // 添加字段
  async addField(entityId: string, createFieldDto: CreateFieldDto) {
    return this.prisma.field.create({
      data: {
        ...createFieldDto,
        id: this.generateId(),
        entityId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 更新字段
  async updateField(fieldId: string, updateFieldDto: UpdateFieldDto) {
    return this.prisma.field.update({
      where: { id: fieldId },
      data: {
        ...updateFieldDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除字段
  async deleteField(fieldId: string) {
    return this.prisma.field.delete({
      where: { id: fieldId }
    });
  }

  // 批量更新字段排序
  async updateFieldsOrder(entityId: string, fieldsOrder: FieldOrderDto[]) {
    return this.prisma.$transaction(
      fieldsOrder.map(({ fieldId, sortOrder }) =>
        this.prisma.field.update({
          where: { id: fieldId },
          data: { sortOrder, updatedAt: new Date() }
        })
      )
    );
  }

  private generateTableName(code: string): string {
    return `lowcode_${code.toLowerCase()}`;
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 3. 关系设计 (Relationship Design)

#### 关系模型
```typescript
interface Relation {
  id: string;                   // 关系唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 关系名称
  code: string;                 // 关系编码
  description?: string;         // 关系描述
  type: string;                 // 关系类型 (ONE_TO_ONE/ONE_TO_MANY/MANY_TO_MANY)
  sourceEntityId: string;       // 源实体ID
  sourceFieldId?: string;       // 源字段ID
  targetEntityId: string;       // 目标实体ID
  targetFieldId?: string;       // 目标字段ID
  foreignKeyName?: string;      // 外键名称
  joinTableConfig?: Json;       // 中间表配置 (多对多关系)
  onDelete?: string;            // 删除策略 (RESTRICT/CASCADE/SET_NULL)
  onUpdate?: string;            // 更新策略 (RESTRICT/CASCADE/SET_NULL)
  config?: Json;                // 关系配置
  status?: string;              // 状态 (ACTIVE/INACTIVE)
  indexed?: boolean;            // 是否创建索引
  indexName?: string;           // 索引名称
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  sourceEntity: Entity;         // 源实体
  sourceField?: Field;          // 源字段
  targetEntity: Entity;         // 目标实体
  targetField?: Field;          // 目标字段
}
```

#### 关系管理服务
```typescript
@Injectable()
export class RelationService {
  constructor(private prisma: PrismaService) {}

  // 创建关系
  async createRelation(createRelationDto: CreateRelationDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建关系
      const relation = await prisma.relation.create({
        data: {
          ...createRelationDto,
          id: this.generateId(),
          status: 'ACTIVE',
          indexed: true,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 根据关系类型创建相应的字段或中间表
      await this.createRelationFields(relation);

      return relation;
    });
  }

  // 获取关系列表
  async getRelations(projectId: string, query: QueryRelationDto) {
    const { page = 1, pageSize = 10, search, type, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.relation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceEntity: {
            select: { id: true, name: true, code: true }
          },
          targetEntity: {
            select: { id: true, name: true, code: true }
          },
          sourceField: {
            select: { id: true, name: true, code: true, type: true }
          },
          targetField: {
            select: { id: true, name: true, code: true, type: true }
          }
        }
      }),
      this.prisma.relation.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体关系图数据
  async getEntityRelationshipDiagram(projectId: string) {
    const entities = await this.prisma.entity.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const relations = await this.prisma.relation.findMany({
      where: { projectId, status: 'ACTIVE' },
      include: {
        sourceEntity: {
          select: { id: true, name: true, code: true }
        },
        targetEntity: {
          select: { id: true, name: true, code: true }
        },
        sourceField: {
          select: { id: true, name: true, code: true }
        },
        targetField: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return {
      entities: entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        position: entity.diagramPosition,
        fields: entity.fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          primaryKey: field.primaryKey,
          nullable: field.nullable,
          unique: field.uniqueConstraint
        }))
      })),
      relations: relations.map(relation => ({
        id: relation.id,
        name: relation.name,
        type: relation.type,
        sourceEntity: relation.sourceEntity,
        targetEntity: relation.targetEntity,
        sourceField: relation.sourceField,
        targetField: relation.targetField
      }))
    };
  }

  // 更新实体位置
  async updateEntityPosition(entityId: string, position: { x: number; y: number }) {
    return this.prisma.entity.update({
      where: { id: entityId },
      data: {
        diagramPosition: position,
        updatedAt: new Date()
      }
    });
  }

  // 删除关系
  async deleteRelation(id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const relation = await prisma.relation.findUnique({
        where: { id }
      });

      if (!relation) {
        throw new NotFoundException('关系不存在');
      }

      // 删除关系相关的字段
      await this.removeRelationFields(relation);

      // 删除关系记录
      return prisma.relation.delete({
        where: { id }
      });
    });
  }

  private async createRelationFields(relation: Relation) {
    switch (relation.type) {
      case 'ONE_TO_ONE':
        await this.createOneToOneRelation(relation);
        break;
      case 'ONE_TO_MANY':
        await this.createOneToManyRelation(relation);
        break;
      case 'MANY_TO_MANY':
        await this.createManyToManyRelation(relation);
        break;
    }
  }

  private async createOneToOneRelation(relation: Relation) {
    // 在目标实体中创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: true,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createOneToManyRelation(relation: Relation) {
    // 在多的一方(目标实体)创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: false,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createManyToManyRelation(relation: Relation) {
    // 创建中间表配置
    const joinTableConfig = {
      tableName: `${relation.sourceEntity.tableName}_${relation.targetEntity.tableName}`,
      sourceColumn: `${relation.sourceEntity.code.toLowerCase()}_id`,
      targetColumn: `${relation.targetEntity.code.toLowerCase()}_id`
    };

    // 更新关系的中间表配置
    await this.prisma.relation.update({
      where: { id: relation.id },
      data: {
        joinTableConfig,
        updatedAt: new Date()
      }
    });
  }

  private async removeRelationFields(relation: Relation) {
    // 根据关系类型删除相应的字段
    // 这里需要根据具体的关系类型和配置来删除相关字段
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 4. API 配置管理

#### API 配置模型
```typescript
interface ApiConfig {
  id: string;                   // API配置唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // API名称
  code: string;                 // API编码
  description?: string;         // API描述
  method: string;               // HTTP方法 (GET/POST/PUT/DELETE)
  path: string;                 // API路径
  entityId?: string;            // 关联实体ID
  parameters?: Json;            // 参数配置
  responses?: Json;             // 响应配置
  security?: Json;              // 安全配置
  config?: Json;                // API配置
  status?: string;              // 状态 (DRAFT/PUBLISHED)
  version?: string;             // 版本号
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}

interface Api {
  id: string;                   // API唯一标识
  projectId: string;            // 所属项目ID
  entityId?: string;            // 关联实体ID
  name: string;                 // API名称
  code: string;                 // API编码
  path: string;                 // API路径
  method: string;               // HTTP方法
  description?: string;         // API描述
  requestConfig?: Json;         // 请求配置
  responseConfig?: Json;        // 响应配置
  queryConfig?: Json;           // 查询配置
  authConfig?: Json;            // 认证配置
  version?: string;             // 版本号
  status?: string;              // 状态
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}
```

#### API 管理服务
```typescript
@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) {}

  // 为实体生成标准CRUD API
  async generateEntityApis(entityId: string, createdBy: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: { fields: true }
    });

    if (!entity) {
      throw new NotFoundException('实体不存在');
    }

    const crudApis = [
      {
        name: `创建${entity.name}`,
        code: `create_${entity.code}`,
        method: 'POST',
        path: `/api/v1/${entity.code.toLowerCase()}s`,
        description: `创建${entity.name}记录`,
        entityId: entity.id,
        requestConfig: {
          body: this.generateRequestSchema(entity.fields, 'create')
        },
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `获取${entity.name}列表`,
        code: `list_${entity.code}`,
        method: 'GET',
        path: `/api/v1/${entity.code.toLowerCase()}s`,
        description: `获取${entity.name}列表`,
        entityId: entity.id,
        queryConfig: {
          pagination: true,
          search: true,
          filters: this.generateFilterConfig(entity.fields)
        },
        responseConfig: {
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: this.generateResponseSchema(entity.fields)
              },
              total: { type: 'number' },
              page: { type: 'number' },
              pageSize: { type: 'number' }
            }
          }
        }
      },
      {
        name: `获取${entity.name}详情`,
        code: `get_${entity.code}`,
        method: 'GET',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `获取${entity.name}详情`,
        entityId: entity.id,
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `更新${entity.name}`,
        code: `update_${entity.code}`,
        method: 'PUT',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `更新${entity.name}记录`,
        entityId: entity.id,
        requestConfig: {
          body: this.generateRequestSchema(entity.fields, 'update')
        },
        responseConfig: {
          schema: this.generateResponseSchema(entity.fields)
        }
      },
      {
        name: `删除${entity.name}`,
        code: `delete_${entity.code}`,
        method: 'DELETE',
        path: `/api/v1/${entity.code.toLowerCase()}s/{id}`,
        description: `删除${entity.name}记录`,
        entityId: entity.id,
        responseConfig: {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    ];

    return this.prisma.$transaction(
      crudApis.map(apiData => 
        this.prisma.api.create({
          data: {
            ...apiData,
            id: this.generateId(),
            projectId: entity.projectId,
            version: '1.0.0',
            status: 'DRAFT',
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      )
    );
  }

  // 生成请求Schema
  private generateRequestSchema(fields: Field[], operation: 'create' | 'update') {
    const properties: any = {};
    
    fields.forEach(field => {
      if (field.code === 'id' || field.code === 'created_at' || field.code === 'updated_at') {
        return; // 跳过系统字段
      }

      const property: any = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name
      };

      if (field.length) {
        property.maxLength = field.length;
      }

      if (field.enumOptions) {
        property.enum = field.enumOptions;
      }

      if (operation === 'create' && field.required) {
        property.required = true;
      }

      properties[field.code] = property;
    });

    return {
      type: 'object',
      properties,
      required: fields
        .filter(f => f.required && !['id', 'created_at', 'updated_at'].includes(f.code))
        .map(f => f.code)
    };
  }

  // 生成响应Schema
  private generateResponseSchema(fields: Field[]) {
    const properties: any = {};
    
    fields.forEach(field => {
      properties[field.code] = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name
      };
    });

    return {
      type: 'object',
      properties
    };
  }

  // 生成过滤器配置
  private generateFilterConfig(fields: Field[]) {
    return fields
      .filter(field => ['VARCHAR', 'TEXT', 'INT', 'DECIMAL', 'DATE', 'TIMESTAMP'].includes(field.type))
      .map(field => ({
        field: field.code,
        type: field.type,
        operators: this.getOperatorsByType(field.type)
      }));
  }

  // 字段类型映射到JSON Schema类型
  private mapFieldTypeToJsonSchema(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'VARCHAR': 'string',
      'TEXT': 'string',
      'INT': 'integer',
      'BIGINT': 'integer',
      'DECIMAL': 'number',
      'FLOAT': 'number',
      'DOUBLE': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'string',
      'TIMESTAMP': 'string',
      'JSON': 'object'
    };
    
    return typeMap[fieldType] || 'string';
  }

  // 根据字段类型获取支持的操作符
  private getOperatorsByType(fieldType: string): string[] {
    const operatorMap: Record<string, string[]> = {
      'VARCHAR': ['eq', 'ne', 'like', 'in', 'not_in'],
      'TEXT': ['eq', 'ne', 'like'],
      'INT': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in'],
      'DECIMAL': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
      'BOOLEAN': ['eq', 'ne'],
      'DATE': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between'],
      'TIMESTAMP': ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between']
    };
    
    return operatorMap[fieldType] || ['eq', 'ne'];
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 5. 查询构建器 (Query Builder)

#### 查询模型
```typescript
interface LowcodeQuery {
  id: string;                   // 查询唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 查询名称
  description?: string;         // 查询描述
  baseEntityId: string;         // 基础实体ID
  baseEntityAlias?: string;     // 基础实体别名
  joins?: Json;                 // 关联配置
  fields?: Json;                // 字段选择
  filters?: Json;               // 过滤条件
  sorting?: Json;               // 排序配置
  groupBy?: Json;               // 分组配置
  havingConditions?: Json;      // Having条件
  limit?: number;               // 限制条数
  offset?: number;              // 偏移量
  status?: string;              // 状态
  sqlQuery?: string;            // 生成的SQL查询
  executionStats?: Json;        // 执行统计
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  baseEntity: Entity;           // 基础实体
}
```

#### 查询构建服务
```typescript
@Injectable()
export class QueryBuilderService {
  constructor(private prisma: PrismaService) {}

  // 创建查询
  async createQuery(createQueryDto: CreateQueryDto) {
    const query = await this.prisma.lowcodeQuery.create({
      data: {
        ...createQueryDto,
        id: this.generateId(),
        baseEntityAlias: createQueryDto.baseEntityAlias || 'main',
        joins: createQueryDto.joins || [],
        fields: createQueryDto.fields || [],
        filters: createQueryDto.filters || [],
        sorting: createQueryDto.sorting || [],
        groupBy: createQueryDto.groupBy || [],
        havingConditions: createQueryDto.havingConditions || [],
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 生成SQL查询
    const sqlQuery = await this.generateSqlQuery(query.id);
    
    return this.prisma.lowcodeQuery.update({
      where: { id: query.id },
      data: { sqlQuery }
    });
  }

  // 生成SQL查询
  async generateSqlQuery(queryId: string): Promise<string> {
    const query = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId },
      include: {
        baseEntity: {
          include: { fields: true }
        },
        project: {
          include: {
            entities: {
              include: { fields: true }
            },
            relations: true
          }
        }
      }
    });

    if (!query) {
      throw new NotFoundException('查询不存在');
    }

    const sqlBuilder = new SqlQueryBuilder(query);
    return sqlBuilder.build();
  }

  // 执行查询
  async executeQuery(queryId: string, parameters: Record<string, any> = {}) {
    const query = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId }
    });

    if (!query || !query.sqlQuery) {
      throw new BadRequestException('查询不存在或SQL未生成');
    }

    const startTime = Date.now();
    
    try {
      // 替换参数
      const parameterizedSql = this.replaceParameters(query.sqlQuery, parameters);
      
      // 执行查询
      const result = await this.prisma.$queryRawUnsafe(parameterizedSql);
      
      const executionTime = Date.now() - startTime;
      
      // 更新执行统计
      await this.updateExecutionStats(queryId, {
        lastExecutedAt: new Date(),
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        success: true
      });

      return {
        data: result,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 更新执行统计
      await this.updateExecutionStats(queryId, {
        lastExecutedAt: new Date(),
        executionTime,
        success: false,
        error: error.message
      });

      throw new BadRequestException(`查询执行失败: ${error.message}`);
    }
  }

  // 查询预览
  async previewQuery(queryConfig: any): Promise<string> {
    const tempQuery = {
      ...queryConfig,
      id: 'preview',
      baseEntity: await this.prisma.entity.findUnique({
        where: { id: queryConfig.baseEntityId },
        include: { fields: true }
      }),
      project: await this.prisma.project.findUnique({
        where: { id: queryConfig.projectId },
        include: {
          entities: { include: { fields: true } },
          relations: true
        }
      })
    };

    const sqlBuilder = new SqlQueryBuilder(tempQuery);
    return sqlBuilder.build();
  }

  private replaceParameters(sql: string, parameters: Record<string, any>): string {
    let result = sql;
    
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const escapedValue = typeof value === 'string' ? `'${value}'` : String(value);
      result = result.replace(new RegExp(placeholder, 'g'), escapedValue);
    });

    return result;
  }

  private async updateExecutionStats(queryId: string, stats: any) {
    const currentStats = await this.prisma.lowcodeQuery.findUnique({
      where: { id: queryId },
      select: { executionStats: true }
    });

    const updatedStats = {
      ...(currentStats?.executionStats as any || {}),
      ...stats,
      totalExecutions: ((currentStats?.executionStats as any)?.totalExecutions || 0) + 1
    };

    await this.prisma.lowcodeQuery.update({
      where: { id: queryId },
      data: { executionStats: updatedStats }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}

// SQL查询构建器
class SqlQueryBuilder {
  constructor(private query: any) {}

  build(): string {
    const parts = [
      this.buildSelect(),
      this.buildFrom(),
      this.buildJoins(),
      this.buildWhere(),
      this.buildGroupBy(),
      this.buildHaving(),
      this.buildOrderBy(),
      this.buildLimit()
    ].filter(Boolean);

    return parts.join('\n');
  }

  private buildSelect(): string {
    const fields = this.query.fields as any[] || [];
    
    if (fields.length === 0) {
      return `SELECT ${this.query.baseEntityAlias || 'main'}.*`;
    }

    const selectFields = fields.map(field => {
      const alias = field.alias ? ` AS ${field.alias}` : '';
      return `${field.table || this.query.baseEntityAlias}.${field.column}${alias}`;
    });

    return `SELECT ${selectFields.join(', ')}`;
  }

  private buildFrom(): string {
    const tableName = this.query.baseEntity.tableName;
    const alias = this.query.baseEntityAlias || 'main';
    return `FROM ${tableName} ${alias}`;
  }

  private buildJoins(): string {
    const joins = this.query.joins as any[] || [];
    
    return joins.map(join => {
      const joinType = join.type || 'INNER';
      const condition = join.condition || `${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`;
      return `${joinType} JOIN ${join.rightTable} ${join.rightAlias} ON ${condition}`;
    }).join('\n');
  }

  private buildWhere(): string {
    const filters = this.query.filters as any[] || [];
    
    if (filters.length === 0) {
      return '';
    }

    const conditions = filters.map(filter => {
      const table = filter.table || this.query.baseEntityAlias;
      const operator = this.mapOperator(filter.operator);
      const value = this.formatValue(filter.value, filter.type);
      
      return `${table}.${filter.column} ${operator} ${value}`;
    });

    return `WHERE ${conditions.join(' AND ')}`;
  }

  private buildGroupBy(): string {
    const groupBy = this.query.groupBy as any[] || [];
    
    if (groupBy.length === 0) {
      return '';
    }

    const groupFields = groupBy.map(field => 
      `${field.table || this.query.baseEntityAlias}.${field.column}`
    );

    return `GROUP BY ${groupFields.join(', ')}`;
  }

  private buildHaving(): string {
    const havingConditions = this.query.havingConditions as any[] || [];
    
    if (havingConditions.length === 0) {
      return '';
    }

    const conditions = havingConditions.map(condition => {
      const operator = this.mapOperator(condition.operator);
      const value = this.formatValue(condition.value, condition.type);
      
      return `${condition.aggregate}(${condition.column}) ${operator} ${value}`;
    });

    return `HAVING ${conditions.join(' AND ')}`;
  }

  private buildOrderBy(): string {
    const sorting = this.query.sorting as any[] || [];
    
    if (sorting.length === 0) {
      return '';
    }

    const orderFields = sorting.map(sort => {
      const table = sort.table || this.query.baseEntityAlias;
      const direction = sort.direction || 'ASC';
      return `${table}.${sort.column} ${direction}`;
    });

    return `ORDER BY ${orderFields.join(', ')}`;
  }

  private buildLimit(): string {
    const parts = [];
    
    if (this.query.limit) {
      parts.push(`LIMIT ${this.query.limit}`);
    }
    
    if (this.query.offset) {
      parts.push(`OFFSET ${this.query.offset}`);
    }

    return parts.join(' ');
  }

  private mapOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      'eq': '=',
      'ne': '!=',
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'like': 'LIKE',
      'in': 'IN',
      'not_in': 'NOT IN',
      'is_null': 'IS NULL',
      'is_not_null': 'IS NOT NULL'
    };
    
    return operatorMap[operator] || '=';
  }

  private formatValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    switch (type) {
      case 'VARCHAR':
      case 'TEXT':
      case 'DATE':
      case 'TIMESTAMP':
        return `'${value}'`;
      case 'INT':
      case 'BIGINT':
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE':
        return String(value);
      case 'BOOLEAN':
        return value ? 'TRUE' : 'FALSE';
      default:
        return `'${value}'`;
    }
  }
}
```

### 6. 代码生成引擎

#### 代码模板模型
```typescript
interface CodeTemplate {
  id: string;                   // 模板唯一标识
  name: string;                 // 模板名称
  code: string;                 // 模板编码 (唯一)
  type: string;                 // 模板类型 (CONTROLLER/SERVICE/DTO/ENTITY)
  language: string;             // 编程语言 (TypeScript/JavaScript/Java/Python)
  framework: string;            // 框架 (NestJS/Express/Spring/Django)
  description?: string;         // 模板描述
  content: string;              // 模板内容 (Handlebars格式)
  variables?: Json;             // 模板变量定义
  version?: string;             // 版本号
  status?: string;              // 状态 (ACTIVE/INACTIVE)
  category?: string;            // 分类
  tags?: Json;                  // 标签
  isPublic?: boolean;           // 是否公开
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  versions:
# Lowcode Platform Backend 低代码平台核心后端服务说明文档

## 服务概述

Lowcode Platform Backend 是 SoybeanAdmin NestJS 低代码平台的核心后端服务，负责低代码平台的核心业务逻辑，包括项目管理、实体建模、关系设计、API配置、代码生成、模板管理、部署管理等功能。该服务采用领域驱动设计(DDD)架构，提供完整的低代码开发平台支撑能力。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3 (lowcode schema)
- **Node.js**: 18.0.0+

### 架构特点
- **领域驱动设计**: 采用DDD架构模式，清晰的业务边界
- **微服务架构**: 独立的低代码平台核心服务
- **代码生成引擎**: 基于模板的代码自动生成
- **可视化建模**: 支持实体关系图可视化设计
- **多项目管理**: 支持多个低代码项目并行开发

### 安全和认证
- **认证**: JWT + Passport
- **权限控制**: 基于项目的访问控制
- **数据验证**: Class Validator 数据验证
- **API 安全**: 接口级别的权限控制

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **模板引擎**: Handlebars 4.7.8 (代码生成)
- **文件处理**: 文件上传和管理
- **国际化**: i18n 多语言支持

## 项目结构

```
lowcode-platform-backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── app.controller.ts       # 根控制器
│   ├── app.service.ts          # 根服务
│   ├── api/                    # API 控制器层
│   │   ├── code-editor/        # 代码编辑器 API
│   │   ├── code-generation/    # 代码生成 API
│   │   ├── collaboration/      # 协作功能 API
│   │   ├── deployment/         # 部署管理 API
│   │   ├── designer/           # 设计器 API
│   │   ├── health/             # 健康检查 API
│   │   ├── import-export/      # 导入导出 API
│   │   ├── lowcode/            # 低代码核心 API
│   │   ├── sync/               # 数据同步 API
│   │   └── template/           # 模板管理 API
│   ├── infra/                  # 基础设施层
│   │   ├── bounded-contexts/   # 领域上下文
│   │   └── database/           # 数据库配置
│   ├── lib/                    # 业务逻辑层
│   │   ├── api/                # API 业务逻辑
│   │   ├── bounded-contexts/   # 领域业务逻辑
│   │   ├── code-generation/    # 代码生成逻辑
│   │   └── shared/             # 共享业务逻辑
│   ├── resources/              # 资源文件
│   │   ├── i18n/               # 国际化文件
│   │   └── templates/          # 代码生成模板
│   └── views/                  # 视图模板
│       └── lowcode/            # 低代码视图
├── prisma/                     # 数据库配置
│   ├── schema.prisma           # 数据模型
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 数据种子
├── templates/                  # 代码生成模板
├── generated/                  # 生成的代码文件
└── dist/                       # 编译输出
```

## 核心功能模块

### 1. 项目管理 (Project Management)

#### 项目实体模型
```typescript
interface Project {
  id: string;                   // 项目唯一标识
  name: string;                 // 项目名称
  code: string;                 // 项目编码 (唯一)
  description?: string;         // 项目描述
  version?: string;             // 项目版本
  config?: Json;                // 项目配置
  status?: string;              // 项目状态 (ACTIVE/INACTIVE)
  
  // 部署相关字段
  deploymentStatus?: string;    // 部署状态 (INACTIVE/DEPLOYING/DEPLOYED/FAILED)
  deploymentPort?: number;      // 部署端口
  deploymentConfig?: Json;      // 部署配置
  lastDeployedAt?: Date;        // 最后部署时间
  deploymentLogs?: string;      // 部署日志
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  apiConfigs: ApiConfig[];      // API 配置
  apis: Api[];                  // API 接口
  entities: Entity[];           // 实体模型
  queries: LowcodeQuery[];      // 查询配置
  relations: Relation[];        // 关系配置
  deployments: ProjectDeployment[]; // 部署历史
}
```

#### 项目管理 API
```typescript
// 项目管理服务
@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  // 创建项目
  async createProject(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        id: this.generateId(),
        version: '1.0.0',
        status: 'ACTIVE',
        deploymentStatus: 'INACTIVE',
        config: {},
        deploymentConfig: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 获取项目列表
  async getProjects(query: QueryProjectDto) {
    const { page = 1, pageSize = 10, search, status } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              entities: true,
              apis: true,
              relations: true
            }
          }
        }
      }),
      this.prisma.project.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取项目详情
  async getProjectDetail(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        entities: {
          include: {
            fields: true,
            _count: {
              select: {
                sourceRelations: true,
                targetRelations: true
              }
            }
          }
        },
        relations: {
          include: {
            sourceEntity: true,
            targetEntity: true,
            sourceField: true,
            targetField: true
          }
        },
        apis: true,
        apiConfigs: true,
        queries: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // 更新项目
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除项目
  async deleteProject(id: string) {
    return this.prisma.project.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 2. 实体建模 (Entity Modeling)

#### 实体模型
```typescript
interface Entity {
  id: string;                   // 实体唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 实体名称
  code: string;                 // 实体编码
  tableName: string;            // 数据库表名
  description?: string;         // 实体描述
  category?: string;            // 实体分类
  diagramPosition?: Json;       // 图表位置信息
  config?: Json;                // 实体配置
  version?: string;             // 版本号
  status?: string;              // 状态 (DRAFT/PUBLISHED/ARCHIVED)
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  fields: Field[];              // 字段列表
  sourceRelations: Relation[];  // 作为源实体的关系
  targetRelations: Relation[];  // 作为目标实体的关系
  apis: Api[];                  // 相关API
  queries: LowcodeQuery[];      // 相关查询
}

interface Field {
  id: string;                   // 字段唯一标识
  entityId: string;             // 所属实体ID
  name: string;                 // 字段名称
  code: string;                 // 字段编码
  type: string;                 // 字段类型
  length?: number;              // 字段长度
  precision?: number;           // 精度
  scale?: number;               // 小数位数
  nullable?: boolean;           // 是否可空
  required?: boolean;           // 是否必填
  uniqueConstraint?: boolean;   // 唯一约束
  indexed?: boolean;            // 是否索引
  primaryKey?: boolean;         // 是否主键
  defaultValue?: string;        // 默认值
  validationRules?: Json;       // 验证规则
  referenceConfig?: Json;       // 引用配置
  enumOptions?: Json;           // 枚举选项
  comment?: string;             // 字段注释
  sortOrder?: number;           // 排序顺序
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  entity: Entity;               // 所属实体
  sourceRelations: Relation[];  // 作为源字段的关系
  targetRelations: Relation[];  // 作为目标字段的关系
}
```

#### 实体管理服务
```typescript
@Injectable()
export class EntityService {
  constructor(private prisma: PrismaService) {}

  // 创建实体
  async createEntity(createEntityDto: CreateEntityDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建实体
      const entity = await prisma.entity.create({
        data: {
          ...createEntityDto,
          id: this.generateId(),
          tableName: this.generateTableName(createEntityDto.code),
          version: '1.0.0',
          status: 'DRAFT',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 创建默认字段 (id, createdAt, updatedAt)
      const defaultFields = [
        {
          entityId: entity.id,
          name: 'ID',
          code: 'id',
          type: 'VARCHAR',
          length: 36,
          nullable: false,
          required: true,
          primaryKey: true,
          sortOrder: 0,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '创建时间',
          code: 'created_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 998,
          createdBy: createEntityDto.createdBy
        },
        {
          entityId: entity.id,
          name: '更新时间',
          code: 'updated_at',
          type: 'TIMESTAMP',
          nullable: false,
          required: true,
          sortOrder: 999,
          createdBy: createEntityDto.createdBy
        }
      ];

      await prisma.field.createMany({
        data: defaultFields.map(field => ({
          ...field,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      });

      return entity;
    });
  }

  // 获取实体列表
  async getEntities(projectId: string, query: QueryEntityDto) {
    const { page = 1, pageSize = 10, search, category, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              fields: true,
              sourceRelations: true,
              targetRelations: true,
              apis: true
            }
          }
        }
      }),
      this.prisma.entity.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体详情
  async getEntityDetail(id: string) {
    return this.prisma.entity.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        },
        sourceRelations: {
          include: {
            targetEntity: true,
            targetField: true
          }
        },
        targetRelations: {
          include: {
            sourceEntity: true,
            sourceField: true
          }
        },
        apis: true,
        queries: true
      }
    });
  }

  // 添加字段
  async addField(entityId: string, createFieldDto: CreateFieldDto) {
    return this.prisma.field.create({
      data: {
        ...createFieldDto,
        id: this.generateId(),
        entityId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 更新字段
  async updateField(fieldId: string, updateFieldDto: UpdateFieldDto) {
    return this.prisma.field.update({
      where: { id: fieldId },
      data: {
        ...updateFieldDto,
        updatedAt: new Date()
      }
    });
  }

  // 删除字段
  async deleteField(fieldId: string) {
    return this.prisma.field.delete({
      where: { id: fieldId }
    });
  }

  // 批量更新字段排序
  async updateFieldsOrder(entityId: string, fieldsOrder: FieldOrderDto[]) {
    return this.prisma.$transaction(
      fieldsOrder.map(({ fieldId, sortOrder }) =>
        this.prisma.field.update({
          where: { id: fieldId },
          data: { sortOrder, updatedAt: new Date() }
        })
      )
    );
  }

  private generateTableName(code: string): string {
    return `lowcode_${code.toLowerCase()}`;
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 3. 关系设计 (Relationship Design)

#### 关系模型
```typescript
interface Relation {
  id: string;                   // 关系唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // 关系名称
  code: string;                 // 关系编码
  description?: string;         // 关系描述
  type: string;                 // 关系类型 (ONE_TO_ONE/ONE_TO_MANY/MANY_TO_MANY)
  sourceEntityId: string;       // 源实体ID
  sourceFieldId?: string;       // 源字段ID
  targetEntityId: string;       // 目标实体ID
  targetFieldId?: string;       // 目标字段ID
  foreignKeyName?: string;      // 外键名称
  joinTableConfig?: Json;       // 中间表配置 (多对多关系)
  onDelete?: string;            // 删除策略 (RESTRICT/CASCADE/SET_NULL)
  onUpdate?: string;            // 更新策略 (RESTRICT/CASCADE/SET_NULL)
  config?: Json;                // 关系配置
  status?: string;              // 状态 (ACTIVE/INACTIVE)
  indexed?: boolean;            // 是否创建索引
  indexName?: string;           // 索引名称
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  sourceEntity: Entity;         // 源实体
  sourceField?: Field;          // 源字段
  targetEntity: Entity;         // 目标实体
  targetField?: Field;          // 目标字段
}
```

#### 关系管理服务
```typescript
@Injectable()
export class RelationService {
  constructor(private prisma: PrismaService) {}

  // 创建关系
  async createRelation(createRelationDto: CreateRelationDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 创建关系
      const relation = await prisma.relation.create({
        data: {
          ...createRelationDto,
          id: this.generateId(),
          status: 'ACTIVE',
          indexed: true,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 根据关系类型创建相应的字段或中间表
      await this.createRelationFields(relation);

      return relation;
    });
  }

  // 获取关系列表
  async getRelations(projectId: string, query: QueryRelationDto) {
    const { page = 1, pageSize = 10, search, type, status } = query;
    
    const where: any = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.relation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceEntity: {
            select: { id: true, name: true, code: true }
          },
          targetEntity: {
            select: { id: true, name: true, code: true }
          },
          sourceField: {
            select: { id: true, name: true, code: true, type: true }
          },
          targetField: {
            select: { id: true, name: true, code: true, type: true }
          }
        }
      }),
      this.prisma.relation.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // 获取实体关系图数据
  async getEntityRelationshipDiagram(projectId: string) {
    const entities = await this.prisma.entity.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const relations = await this.prisma.relation.findMany({
      where: { projectId, status: 'ACTIVE' },
      include: {
        sourceEntity: {
          select: { id: true, name: true, code: true }
        },
        targetEntity: {
          select: { id: true, name: true, code: true }
        },
        sourceField: {
          select: { id: true, name: true, code: true }
        },
        targetField: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return {
      entities: entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        position: entity.diagramPosition,
        fields: entity.fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          primaryKey: field.primaryKey,
          nullable: field.nullable,
          unique: field.uniqueConstraint
        }))
      })),
      relations: relations.map(relation => ({
        id: relation.id,
        name: relation.name,
        type: relation.type,
        sourceEntity: relation.sourceEntity,
        targetEntity: relation.targetEntity,
        sourceField: relation.sourceField,
        targetField: relation.targetField
      }))
    };
  }

  // 更新实体位置
  async updateEntityPosition(entityId: string, position: { x: number; y: number }) {
    return this.prisma.entity.update({
      where: { id: entityId },
      data: {
        diagramPosition: position,
        updatedAt: new Date()
      }
    });
  }

  // 删除关系
  async deleteRelation(id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const relation = await prisma.relation.findUnique({
        where: { id }
      });

      if (!relation) {
        throw new NotFoundException('关系不存在');
      }

      // 删除关系相关的字段
      await this.removeRelationFields(relation);

      // 删除关系记录
      return prisma.relation.delete({
        where: { id }
      });
    });
  }

  private async createRelationFields(relation: Relation) {
    switch (relation.type) {
      case 'ONE_TO_ONE':
        await this.createOneToOneRelation(relation);
        break;
      case 'ONE_TO_MANY':
        await this.createOneToManyRelation(relation);
        break;
      case 'MANY_TO_MANY':
        await this.createManyToManyRelation(relation);
        break;
    }
  }

  private async createOneToOneRelation(relation: Relation) {
    // 在目标实体中创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: true,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createOneToManyRelation(relation: Relation) {
    // 在多的一方(目标实体)创建外键字段
    const foreignKeyField = {
      entityId: relation.targetEntityId,
      name: `${relation.sourceEntity.name}ID`,
      code: `${relation.sourceEntity.code.toLowerCase()}_id`,
      type: 'VARCHAR',
      length: 36,
      nullable: false,
      comment: `关联到${relation.sourceEntity.name}`,
      createdBy: relation.createdBy
    };

    await this.prisma.field.create({
      data: {
        ...foreignKeyField,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createManyToManyRelation(relation: Relation) {
    // 创建中间表配置
    const joinTableConfig = {
      tableName: `${relation.sourceEntity.tableName}_${relation.targetEntity.tableName}`,
      sourceColumn: `${relation.sourceEntity.code.toLowerCase()}_id`,
      targetColumn: `${relation.targetEntity.code.toLowerCase()}_id`
    };

    // 更新关系的中间表配置
    await this.prisma.relation.update({
      where: { id: relation.id },
      data: {
        joinTableConfig,
        updatedAt: new Date()
      }
    });
  }

  private async removeRelationFields(relation: Relation) {
    // 根据关系类型删除相应的字段
    // 这里需要根据具体的关系类型和配置来删除相关字段
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

### 4. API 配置管理

#### API 配置模型
```typescript
interface ApiConfig {
  id: string;                   // API配置唯一标识
  projectId: string;            // 所属项目ID
  name: string;                 // API名称
  code: string;                 // API编码
  description?: string;         // API描述
  method: string;               // HTTP方法 (GET/POST/PUT/DELETE)
  path: string;                 // API路径
  entityId?: string;            // 关联实体ID
  parameters?: Json;            // 参数配置
  responses?: Json;             // 响应配置
  security?: Json;              // 安全配置
  config?: Json;                // API配置
  status?: string;              // 状态 (DRAFT/PUBLISHED)
  version?: string;             // 版本号
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}

interface Api {
  id: string;                   // API唯一标识
  projectId: string;            // 所属项目ID
  entityId?: string;            // 关联实体ID
  name: string;                 // API名称
  code: string;                 // API编码
  path: string;                 // API路径
  method: string;               // HTTP方法
  description?: string;         // API描述
  requestConfig?: Json;         // 请求配置
  responseConfig?: Json;        // 响应配置
  queryConfig?: Json;           // 查询配置
  authConfig?: Json;            // 认证配置
  version?: string;             // 版本号
  status?: string;              // 状态
  
  // 系统字段
  createdBy: string;            // 创建人
  createdAt?: Date;             // 创建时间
  updatedBy?: string;           // 更新人
  updatedAt?: Date;             // 更新时间
  
  // 关联关系
  project: Project;             // 所属项目
  entity?: Entity;              // 关联实体
}
```

#### API 管理服务
```typescript
@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) {}

  // 为实体生成标准CRUD API
  async generateEntityApis(entityId: string, createdBy: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: { fields: true }
    });

    if (!entity) {
      throw new NotFoundException('实体不存在');
    }

    const crudApis = [
      {
        name: `创建${entity.name}`,
        code: `create_${entity.code}`,
        method: 'POST',
        path: `/api