# 低代码平台综合分析与重构方案

## 项目概述

本文档基于对SoybeanAdmin NestJS低代码平台项目的深入分析，提供完整的设计开发需求、任务规划、开发指南和测试方案。

### 技术架构

- **前端**: Vue 3 + TypeScript + AMIS + UnoCSS
- **后端**: NestJS + Fastify + Prisma + PostgreSQL
- **架构模式**: 微服务 + DDD (领域驱动设计)
- **数据库**: PostgreSQL (Docker部署)
- **部署**: Docker + Docker Compose

### 核心服务

1. **lowcode-platform-backend**: 低代码平台核心服务
2. **amis-lowcode-backend**: AMIS业务子服务
3. **frontend**: Vue前端应用

## 核心功能模块分析

### 1. 项目管理 (Project Management)

**功能描述**: 管理低代码项目的生命周期，包括创建、配置、版本控制和部署状态管理。

**数据模型**:
```typescript
interface Project {
  id: string;
  name: string;
  code: string; // 项目唯一标识
  description?: string;
  version: string;
  config: Json; // 项目配置
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  deploymentStatus: 'ACTIVE' | 'INACTIVE';
  deploymentPort?: number;
  deploymentConfig: Json;
  lastDeployedAt?: Date;
  deploymentLogs?: string;
}
```

**核心接口**:
- `POST /api/lowcode/projects` - 创建项目
- `GET /api/lowcode/projects` - 查询项目列表
- `GET /api/lowcode/projects/:id` - 获取项目详情
- `PUT /api/lowcode/projects/:id` - 更新项目
- `DELETE /api/lowcode/projects/:id` - 删除项目
- `POST /api/lowcode/projects/:id/deploy` - 部署项目
- `POST /api/lowcode/projects/:id/stop` - 停止项目

### 2. 实体管理 (Entity Management)

**功能描述**: 管理业务实体的定义，包括实体属性、表结构映射和状态管理。

**数据模型**:
```typescript
interface Entity {
  id: string;
  projectId: string;
  name: string;
  code: string; // 实体代码
  tableName: string; // 数据库表名
  description?: string;
  category?: string;
  diagramPosition?: Json; // ER图位置信息
  config: Json;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
}
```

**核心接口**:
- `POST /api/lowcode/entities` - 创建实体
- `GET /api/lowcode/entities` - 查询实体列表
- `GET /api/lowcode/entities/:id` - 获取实体详情
- `PUT /api/lowcode/entities/:id` - 更新实体
- `DELETE /api/lowcode/entities/:id` - 删除实体
- `POST /api/lowcode/entities/:id/publish` - 发布实体

### 3. 字段管理 (Field Management)

**功能描述**: 管理实体字段的定义，包括数据类型、约束条件、验证规则和引用关系。

**数据模型**:
```typescript
interface Field {
  id: string;
  entityId: string;
  name: string;
  code: string;
  type: 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIME' | 'UUID' | 'JSON' | 'TEXT';
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  required: boolean;
  uniqueConstraint: boolean;
  indexed: boolean;
  primaryKey: boolean;
  defaultValue?: string;
  validationRules?: Json;
  validation?: Json;
  referenceConfig?: Json;
  config?: Json;
  enumOptions?: Json;
  comment?: string;
  sortOrder: number;
}
```

**核心接口**:
- `POST /api/lowcode/fields` - 创建字段
- `GET /api/lowcode/fields` - 查询字段列表
- `GET /api/lowcode/fields/:id` - 获取字段详情
- `PUT /api/lowcode/fields/:id` - 更新字段
- `DELETE /api/lowcode/fields/:id` - 删除字段
- `POST /api/lowcode/fields/batch` - 批量操作字段

### 4. 关系管理 (Relationship Management)

**功能描述**: 管理实体间的关联关系，支持一对一、一对多、多对多关系类型。

**数据模型**:
```typescript
interface Relation {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  sourceEntityId: string;
  sourceFieldId?: string;
  targetEntityId: string;
  targetFieldId?: string;
  foreignKeyName?: string;
  joinTableConfig?: Json;
  onDelete: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
  onUpdate: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
  config: Json;
  status: 'ACTIVE' | 'INACTIVE';
  indexed: boolean;
  indexName?: string;
}
```

**核心接口**:
- `POST /api/lowcode/relationships` - 创建关系
- `GET /api/lowcode/relationships` - 查询关系列表
- `GET /api/lowcode/relationships/:id` - 获取关系详情
- `PUT /api/lowcode/relationships/:id` - 更新关系
- `DELETE /api/lowcode/relationships/:id` - 删除关系

### 5. 查询管理 (Query Management)

**功能描述**: 可视化查询构建器，支持复杂的多表联查、条件过滤、排序和分组。

**数据模型**:
```typescript
interface LowcodeQuery {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  baseEntityId: string;
  baseEntityAlias: string;
  joins: Json[]; // 连接配置
  fields: Json[]; // 查询字段
  filters: Json[]; // 过滤条件
  sorting: Json[]; // 排序规则
  groupBy: Json[]; // 分组字段
  havingConditions: Json[]; // Having条件
  limit?: number;
  offset?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  sqlQuery?: string; // 生成的SQL
  executionStats?: Json; // 执行统计
}
```

**核心接口**:
- `POST /api/lowcode/queries` - 创建查询
- `GET /api/lowcode/queries` - 查询列表
- `GET /api/lowcode/queries/:id` - 获取查询详情
- `PUT /api/lowcode/queries/:id` - 更新查询
- `DELETE /api/lowcode/queries/:id` - 删除查询
- `POST /api/lowcode/queries/:id/execute` - 执行查询
- `POST /api/lowcode/queries/:id/preview` - 预览SQL

### 6. API配置 (API Configuration)

**功能描述**: 基于实体自动生成RESTful API配置，支持自定义参数、响应格式和安全策略。

**数据模型**:
```typescript
interface ApiConfig {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  entityId?: string;
  parameters: Json[]; // 参数配置
  responses: Json[]; // 响应配置
  security: Json; // 安全配置
  config: Json;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  version: string;
}
```

**核心接口**:
- `POST /api/lowcode/api-configs` - 创建API配置
- `GET /api/lowcode/api-configs` - 查询API配置列表
- `GET /api/lowcode/api-configs/:id` - 获取API配置详情
- `PUT /api/lowcode/api-configs/:id` - 更新API配置
- `DELETE /api/lowcode/api-configs/:id` - 删除API配置
- `POST /api/lowcode/api-configs/:id/generate` - 生成API代码

### 7. API测试 (API Testing)

**功能描述**: 内置API测试工具，支持参数配置、请求发送和响应验证。

**核心接口**:
- `POST /api/lowcode/api-test/execute` - 执行API测试
- `GET /api/lowcode/api-test/history` - 获取测试历史
- `POST /api/lowcode/api-test/save` - 保存测试用例

### 8. 模板管理 (Template Management)

**功能描述**: 管理代码生成模板，支持多语言、多框架的模板定义和版本控制。

**数据模型**:
```typescript
interface CodeTemplate {
  id: string;
  name: string;
  code: string;
  type: 'ENTITY_MODEL' | 'ENTITY_DTO' | 'ENTITY_SERVICE' | 'ENTITY_CONTROLLER' | 'ENTITY_REPOSITORY' | 'API_CONTROLLER';
  language: 'TYPESCRIPT' | 'JAVASCRIPT' | 'JAVA' | 'PYTHON';
  framework: 'NESTJS' | 'EXPRESS' | 'SPRING_BOOT' | 'FASTAPI';
  description?: string;
  content: string; // Handlebars模板内容
  variables: Json[]; // 模板变量
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  tags: Json[];
  isPublic: boolean;
}
```

**核心接口**:
- `POST /api/lowcode/templates` - 创建模板
- `GET /api/lowcode/templates` - 查询模板列表
- `GET /api/lowcode/templates/:id` - 获取模板详情
- `PUT /api/lowcode/templates/:id` - 更新模板
- `DELETE /api/lowcode/templates/:id` - 删除模板
- `POST /api/lowcode/templates/:id/preview` - 预览生成结果

### 9. 代码生成器 (Code Generator)

**功能描述**: 基于实体定义和模板生成完整的业务代码，支持增量生成和自定义扩展。

**数据模型**:
```typescript
interface CodegenTask {
  id: string;
  projectId: string;
  name: string;
  type: 'ENTITY' | 'API' | 'FULL_PROJECT';
  config: Json;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  result?: Json;
  errorMsg?: string;
  outputPath?: string;
}
```

**核心接口**:
- `POST /api/lowcode/code-generation/generate` - 启动代码生成
- `GET /api/lowcode/code-generation/tasks` - 查询生成任务
- `GET /api/lowcode/code-generation/tasks/:id` - 获取任务详情
- `POST /api/lowcode/code-generation/tasks/:id/cancel` - 取消任务
- `GET /api/lowcode/code-generation/preview` - 预览生成代码

## 数据流与业务逻辑

### 低代码开发流程

1. **项目创建**: 用户创建新的低代码项目
2. **实体设计**: 定义业务实体和字段
3. **关系建模**: 建立实体间的关联关系
4. **查询配置**: 创建复杂查询逻辑
5. **API配置**: 自动生成或自定义API接口
6. **代码生成**: 基于模板生成业务代码
7. **部署运行**: 部署到amis-lowcode-backend服务
8. **前端集成**: 在frontend中配置AMIS页面

### 代码生成策略

**分层生成**:
- **Base层**: 自动生成的基础CRUD代码
- **Biz层**: 手动扩展的业务逻辑代码

**生成内容**:
- Entity模型定义
- DTO数据传输对象
- Service业务服务
- Controller控制器
- Prisma Schema更新
- API文档生成

## 技术实现要点

### 1. Prisma Schema动态更新

```typescript
// 实体变更时自动更新Prisma Schema
export class PrismaSchemaService {
  async updateSchema(entities: Entity[], relations: Relation[]) {
    const schemaContent = this.generateSchema(entities, relations);
    await this.writeSchemaFile(schemaContent);
    await this.runMigration();
  }
}
```

### 2. 代码模板引擎

```typescript
// 基于Handlebars的模板渲染
export class TemplateEngine {
  async renderTemplate(template: CodeTemplate, context: any) {
    const compiled = Handlebars.compile(template.content);
    return compiled(context);
  }
}
```

### 3. 动态API生成

```typescript
// 运行时动态注册API路由
export class DynamicApiService {
  async generateApiRoutes(apiConfigs: ApiConfig[]) {
    for (const config of apiConfigs) {
      await this.registerRoute(config);
    }
  }
}
```

### 4. 多租户数据隔离

```typescript
// 基于项目ID的数据隔离
export class TenantService {
  async getProjectData(projectId: string, userId: string) {
    // 验证用户权限
    await this.validateAccess(projectId, userId);
    // 返回项目范围内的数据
    return this.prisma.entity.findMany({
      where: { projectId }
    });
  }
}
```

## 部署架构

### Docker容器化部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: soybean_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./deploy/postgres:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  lowcode-platform-backend:
    build: ./lowcode-platform-backend
    ports:
      - "3002:3002"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/soybean_admin

  amis-lowcode-backend:
    build: ./amis-lowcode-backend
    ports:
      - "3002:3002"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/soybean_admin

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - lowcode-platform-backend
      - amis-lowcode-backend
```

### 服务间通信

- **lowcode-platform-backend**: 核心设计服务，端口3002
- **amis-lowcode-backend**: 业务运行时服务，端口3002
- **frontend**: 前端应用，端口5173

## 安全策略

### 1. 身份认证
- JWT Token认证
- 用户权限验证
- API访问控制

### 2. 数据安全
- SQL注入防护
- XSS攻击防护
- 数据加密存储

### 3. 代码安全
- 模板注入防护
- 文件路径验证
- 代码执行隔离

## 性能优化

### 1. 数据库优化
- 索引策略优化
- 查询性能监控
- 连接池管理

### 2. 缓存策略
- Redis缓存
- 查询结果缓存
- 模板编译缓存

### 3. 代码生成优化
- 增量生成
- 并行处理
- 文件变更检测

## 监控与日志

### 1. 应用监控
- 健康检查接口
- 性能指标收集
- 错误率监控

### 2. 业务监控
- 代码生成成功率
- API调用统计
- 用户行为分析

### 3. 日志管理
- 结构化日志
- 日志级别控制
- 日志聚合分析

---

本文档为低代码平台的综合分析基础，后续将基于此分析制定详细的开发任务和测试计划。