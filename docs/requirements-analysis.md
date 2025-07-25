<!--
 * @Description: 
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 20:16:01
 * @LastEditors: henry.xiukun
-->
# 低代码平台重构需求分析文档

## 1. 项目概述

### 1.1 项目背景
基于现有的微服务架构低代码平台，进行全面重构和优化，构建一个健壮、可扩展的企业级低代码开发平台。平台支持可视化页面设计、智能代码生成、模板管理等核心功能，生成的代码遵循双层架构设计，确保可维护性和扩展性。

### 1.2 项目目标
- 构建完整的低代码开发生态系统
- 实现智能化的代码生成和模板管理
- 提供符合AMIS标准的接口生成能力
- 支持复杂业务场景的多表关联查询
- 确保系统的高可用性和可扩展性

### 1.3 技术栈
- **前端**: Vue3 + TypeScript + Element Plus + AMIS
- **后端**: NestJS + TypeScript + Prisma + PostgreSQL
- **容器化**: Docker + Docker Compose
- **代码生成**: Handlebars模板引擎
- **数据库**: PostgreSQL + Redis

## 2. 系统架构设计

### 2.1 微服务架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │ Lowcode Designer│    │   Backend       │
│   (Vue3)        │    │   (AMIS)        │    │  (NestJS)       │
│   Port: 9527    │    │   Port: 9555    │    │  Port: 9528     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Lowcode Platform │    │ AMIS Lowcode    │    │   PostgreSQL    │
│   Backend       │    │   Backend       │    │   + Redis       │
│  Port: 3000     │    │  Port: 9522     │    │  Port: 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 服务职责定义

#### 2.2.1 Frontend (主管理后台)
- **功能**: 项目管理、实体设计、代码生成配置、模板管理
- **技术**: Vue3 + TypeScript + Element Plus
- **端口**: 9527

#### 2.2.2 Backend (核心业务服务)
- **功能**: 用户认证、权限管理、基础数据管理、系统配置
- **技术**: NestJS + TypeScript + Prisma
- **端口**: 9528

#### 2.2.3 Lowcode Platform Backend (低代码平台核心)
- **功能**: 元数据管理、代码生成引擎、模板管理、API配置
- **技术**: NestJS + TypeScript + Prisma + Handlebars
- **端口**: 3000

#### 2.2.4 Lowcode Designer (可视化设计器)
- **功能**: 拖拽式页面构建、组件配置、预览发布
- **技术**: React + AMIS + TypeScript
- **端口**: 9555

#### 2.2.5 AMIS Lowcode Backend (动态业务服务)
- **功能**: 承载生成的业务API、数据CRUD、业务逻辑执行
- **技术**: NestJS + TypeScript + 动态生成代码
- **端口**: 9522

## 3. 核心功能需求

### 3.1 双层代码生成架构

#### 3.1.1 Base层代码特性
- **自动生成**: 每次代码生成时完全覆盖
- **标准化**: 遵循统一的代码规范和最佳实践
- **功能完整**: 包含CRUD、分页、搜索、排序等标准功能
- **AMIS兼容**: 生成的接口完全符合AMIS标准格式

**Base层包含文件**:
```
src/base/
├── controllers/
│   └── {entity}.base.controller.ts
├── services/
│   └── {entity}.base.service.ts
├── dto/
│   ├── {entity}.base.dto.ts
│   ├── create-{entity}.base.dto.ts
│   └── update-{entity}.base.dto.ts
└── entities/
    └── {entity}.base.entity.ts
```

#### 3.1.2 Biz层代码特性
- **继承扩展**: 继承Base层，支持业务定制
- **保护机制**: 首次生成后不再覆盖，保护开发者修改
- **灵活扩展**: 支持复杂业务逻辑、自定义验证、特殊查询

**Biz层包含文件**:
```
src/biz/
├── controllers/
│   └── {entity}.controller.ts
├── services/
│   └── {entity}.service.ts
├── dto/
│   ├── {entity}.dto.ts
│   └── custom-{entity}.dto.ts
└── validators/
    └── {entity}.validator.ts
```

### 3.2 模板管理系统

#### 3.2.1 模板分类体系
- **Controller模板**: CRUD控制器、自定义接口控制器
- **Service模板**: 业务逻辑服务、数据访问服务
- **DTO模板**: 请求对象、响应对象、查询对象
- **Entity模板**: 数据模型、关系映射
- **配置模板**: 路由配置、权限配置、API文档

#### 3.2.2 模板功能特性
- **语法支持**: Handlebars模板语法，支持条件、循环、函数
- **变量系统**: 类型化变量定义，支持默认值和验证
- **预览测试**: 实时预览生成结果，支持测试数据
- **版本管理**: 模板版本控制，支持回滚和比较
- **导入导出**: 模板打包分享，支持团队协作

### 3.3 多表关联接口生成

#### 3.3.1 关联关系配置
- **一对一关系**: User -> Profile
- **一对多关系**: User -> Orders
- **多对多关系**: User -> Roles
- **自关联**: Category -> SubCategories

#### 3.3.2 查询接口生成
- **关联查询**: 自动生成JOIN查询和嵌套查询
- **分页支持**: 关联数据的分页和排序
- **条件过滤**: 支持主表和关联表的复合查询条件
- **性能优化**: 懒加载、批量查询、缓存策略

## 4. 数据库设计方案

### 4.1 核心表结构设计

#### 4.1.1 项目管理表
```sql
-- 项目表
CREATE TABLE lowcode_projects (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    config JSONB DEFAULT '{}',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.2 实体管理表
```sql
-- 实体表
CREATE TABLE lowcode_entities (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, code)
);

-- 字段表
CREATE TABLE lowcode_fields (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_id VARCHAR(36) NOT NULL REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    length INTEGER,
    precision_val INTEGER,
    scale_val INTEGER,
    nullable BOOLEAN DEFAULT true,
    default_value TEXT,
    comment TEXT,
    config JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_id, code)
);
```

#### 4.1.3 关系管理表
```sql
-- 关系表
CREATE TABLE lowcode_relationships (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    source_entity_id VARCHAR(36) NOT NULL REFERENCES lowcode_entities(id),
    target_entity_id VARCHAR(36) NOT NULL REFERENCES lowcode_entities(id),
    type VARCHAR(20) NOT NULL, -- ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY
    source_field VARCHAR(50),
    target_field VARCHAR(50),
    config JSONB DEFAULT '{}',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, code)
);
```

#### 4.1.4 模板管理表
```sql
-- 模板表
CREATE TABLE lowcode_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- CONTROLLER, SERVICE, DTO, ENTITY, CONFIG
    language VARCHAR(20) NOT NULL, -- TYPESCRIPT, JAVASCRIPT
    framework VARCHAR(50), -- NESTJS, EXPRESS, FASTIFY
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    version VARCHAR(20) DEFAULT '1.0.0',
    is_public BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 模板版本表
CREATE TABLE lowcode_template_versions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_id VARCHAR(36) NOT NULL REFERENCES lowcode_templates(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    changelog TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_id, version)
);
```

#### 4.1.5 代码生成表
```sql
-- 代码生成任务表
CREATE TABLE lowcode_generation_tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL REFERENCES lowcode_projects(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- FULL, INCREMENTAL, ENTITY_ONLY
    entity_ids JSONB, -- 选中的实体ID列表
    template_ids JSONB, -- 使用的模板ID列表
    config JSONB DEFAULT '{}',
    output_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RUNNING, SUCCESS, FAILED
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    generated_files JSONB DEFAULT '[]',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

#### 4.1.6 API配置表
```sql
-- API配置表
CREATE TABLE lowcode_api_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL REFERENCES lowcode_projects(id),
    entity_id VARCHAR(36) REFERENCES lowcode_entities(id),
    name VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE
    path VARCHAR(200) NOT NULL,
    description TEXT,
    request_schema JSONB,
    response_schema JSONB,
    query_config JSONB, -- 查询配置，支持多表关联
    auth_required BOOLEAN DEFAULT true,
    rate_limit INTEGER,
    cache_ttl INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, method, path)
);
```

### 4.2 索引设计
```sql
-- 性能优化索引
CREATE INDEX idx_lowcode_entities_project_id ON lowcode_entities(project_id);
CREATE INDEX idx_lowcode_fields_entity_id ON lowcode_fields(entity_id);
CREATE INDEX idx_lowcode_relationships_project_id ON lowcode_relationships(project_id);
CREATE INDEX idx_lowcode_relationships_source_entity ON lowcode_relationships(source_entity_id);
CREATE INDEX idx_lowcode_relationships_target_entity ON lowcode_relationships(target_entity_id);
CREATE INDEX idx_lowcode_templates_category ON lowcode_templates(category);
CREATE INDEX idx_lowcode_templates_status ON lowcode_templates(status);
CREATE INDEX idx_lowcode_generation_tasks_project_id ON lowcode_generation_tasks(project_id);
CREATE INDEX idx_lowcode_generation_tasks_status ON lowcode_generation_tasks(status);
CREATE INDEX idx_lowcode_api_configs_project_id ON lowcode_api_configs(project_id);
CREATE INDEX idx_lowcode_api_configs_entity_id ON lowcode_api_configs(entity_id);
```

## 5. AMIS接口标准规范

### 5.1 标准响应格式
```typescript
// 成功响应格式
interface AmisSuccessResponse<T = any> {
  status: 0;
  msg: string;
  data: T;
}

// 错误响应格式
interface AmisErrorResponse {
  status: number; // 非0表示错误
  msg: string;
  errors?: Record<string, string[]>;
}

// 分页响应格式
interface AmisPaginationResponse<T = any> {
  status: 0;
  msg: string;
  data: {
    options: T[];
    total: number;
    page?: number;
    perPage?: number;
  };
}
```

### 5.2 CRUD接口规范

#### 5.2.1 查询列表接口
```typescript
// GET /api/v1/{entity}
// 查询参数
interface QueryParams {
  page?: number;        // 页码，从1开始
  perPage?: number;     // 每页数量
  orderBy?: string;     // 排序字段
  orderDir?: 'asc' | 'desc'; // 排序方向
  keywords?: string;    // 关键词搜索
  [key: string]: any;   // 其他过滤条件
}

// 响应格式
interface ListResponse<T> {
  status: 0;
  msg: 'success';
  data: {
    options: T[];
    total: number;
    page: number;
    perPage: number;
  };
}
```

#### 5.2.2 创建接口
```typescript
// POST /api/v1/{entity}
interface CreateResponse<T> {
  status: 0;
  msg: 'success';
  data: T;
}
```

#### 5.2.3 更新接口
```typescript
// PUT /api/v1/{entity}/{id}
interface UpdateResponse<T> {
  status: 0;
  msg: 'success';
  data: T;
}
```

#### 5.2.4 删除接口
```typescript
// DELETE /api/v1/{entity}/{id}
interface DeleteResponse {
  status: 0;
  msg: 'success';
  data: null;
}
```

### 5.3 多表关联查询接口
```typescript
// GET /api/v1/{entity}/{id}/relations/{relation}
interface RelationQueryParams {
  page?: number;
  perPage?: number;
  include?: string[];   // 包含的关联字段
  fields?: string[];    // 返回的字段列表
  where?: Record<string, any>; // 关联表的查询条件
}

interface RelationResponse<T> {
  status: 0;
  msg: 'success';
  data: {
    options: T[];
    total: number;
    page: number;
    perPage: number;
  };
}
```

## 6. 技术实现规范

### 6.1 代码生成模板规范

#### 6.1.1 Controller模板变量
```typescript
interface ControllerTemplateVars {
  entity: {
    name: string;           // 实体名称
    code: string;           // 实体代码
    tableName: string;      // 表名
    description: string;    // 描述
  };
  fields: Array<{
    name: string;           // 字段名称
    code: string;           // 字段代码
    type: string;           // 字段类型
    nullable: boolean;      // 是否可空
    comment: string;        // 字段注释
  }>;
  relationships: Array<{
    name: string;           // 关系名称
    type: string;           // 关系类型
    targetEntity: string;   // 目标实体
    sourceField: string;    // 源字段
    targetField: string;    // 目标字段
  }>;
  project: {
    name: string;           // 项目名称
    code: string;           // 项目代码
    namespace: string;      // 命名空间
  };
  config: {
    generateAuth: boolean;  // 是否生成认证
    generateValidation: boolean; // 是否生成验证
    generateSwagger: boolean;    // 是否生成Swagger
  };
}
```

#### 6.1.2 Base Controller模板示例
```handlebars
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
{{#if config.generateAuth}}
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
{{/if}}
import { {{pascalCase entity.code}}BaseService } from '../services/{{kebabCase entity.code}}.base.service';
import { Create{{pascalCase entity.code}}BaseDto } from '../dto/create-{{kebabCase entity.code}}.base.dto';
import { Update{{pascalCase entity.code}}BaseDto } from '../dto/update-{{kebabCase entity.code}}.base.dto';
import { {{pascalCase entity.code}}QueryDto } from '../dto/{{kebabCase entity.code}}-query.dto';

/**
 * {{entity.name}}基础控制器
 * 此文件由代码生成器自动生成，请勿手动修改
 * 如需自定义业务逻辑，请在 biz/controllers/{{kebabCase entity.code}}.controller.ts 中继承并扩展
 */
@ApiTags('{{entity.name}}管理')
{{#if config.generateAuth}}
@UseGuards(JwtAuthGuard)
{{/if}}
@Controller('{{kebabCase entity.code}}')
export abstract class {{pascalCase entity.code}}BaseController {
  constructor(
    protected readonly {{camelCase entity.code}}Service: {{pascalCase entity.code}}BaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取{{entity.name}}列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: {{pascalCase entity.code}}QueryDto) {
    const result = await this.{{camelCase entity.code}}Service.findAll(query);
    return {
      status: 0,
      msg: 'success',
      data: {
        options: result.options,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取{{entity.name}}详情' })
  async findOne(@Param('id') id: string) {
    const result = await this.{{camelCase entity.code}}Service.findOne(id);
    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建{{entity.name}}' })
  async create(@Body() createDto: Create{{pascalCase entity.code}}BaseDto) {
    const result = await this.{{camelCase entity.code}}Service.create(createDto);
    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新{{entity.name}}' })
  async update(@Param('id') id: string, @Body() updateDto: Update{{pascalCase entity.code}}BaseDto) {
    const result = await this.{{camelCase entity.code}}Service.update(id, updateDto);
    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除{{entity.name}}' })
  async remove(@Param('id') id: string) {
    await this.{{camelCase entity.code}}Service.remove(id);
    return {
      status: 0,
      msg: 'success',
      data: null,
    };
  }

{{#each relationships}}
  @Get(':id/{{kebabCase name}}')
  @ApiOperation({ summary: '获取{{../entity.name}}的{{name}}' })
  async get{{pascalCase name}}(@Param('id') id: string, @Query() query: any) {
    const result = await this.{{camelCase ../entity.code}}Service.get{{pascalCase name}}(id, query);
    return {
      status: 0,
      msg: 'success',
      data: {
        options: result.options,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
      },
    };
  }
{{/each}}
}
```

## 7. 开发实施计划

### 7.1 阶段划分

#### 阶段1: 基础架构重构 (3-4天)
- **数据库设计与迁移**
  - 重新设计表结构
  - 编写迁移脚本
  - 更新deploy目录下的SQL文件
  - 数据一致性验证
- **服务间通信优化**
  - 统一认证机制
  - API网关配置
  - 错误处理标准化
- **阶段测试**
  - 数据库连接测试
  - 服务启动验证
  - 认证机制测试

#### 阶段2: 核心功能开发 (4-5天)
- **模板管理系统重构**
  - 模板CRUD功能
  - 版本控制系统
  - 预览测试功能
- **双层代码生成器实现**
  - Base层代码生成
  - Biz层代码保护
  - 模板引擎集成
- **阶段测试**
  - 后端API接口测试
  - 前端模板管理界面测试
  - 代码生成功能端到端测试
  - AMIS格式验证测试

#### 阶段3: 高级功能开发 (3-4天)
- **多表关联接口生成**
  - 关系配置界面
  - 关联查询生成
  - 性能优化
- **AMIS接口格式适配**
  - 标准格式实现（options替换items）
  - 响应格式统一
  - 错误处理规范
- **阶段测试**
  - 多表关联查询测试
  - 前端关系设计器测试
  - AMIS接口格式兼容性测试
  - 性能压力测试

#### 阶段4: 前端界面优化 (2-3天)
- **管理界面重构**
  - 项目管理界面
  - 实体设计器
  - 代码生成配置
- **用户体验优化**
  - 操作流程简化
  - 实时反馈
  - 错误提示优化
- **阶段测试**
  - 前端界面功能测试
  - 用户交互体验测试
  - 响应式设计测试
  - 浏览器兼容性测试

#### 阶段5: 测试与部署 (2-3天)
- **功能测试**
  - 单元测试
  - 集成测试
  - E2E测试
- **部署验证**
  - Docker容器化
  - 本地环境验证
  - 性能测试

### 7.2 技术风险评估

#### 7.2.1 高风险项
- **数据库迁移**: 现有数据的兼容性处理
- **代码生成逻辑**: 复杂模板的解析和生成
- **服务间通信**: 认证和权限的统一管理

#### 7.2.2 中风险项
- **前端界面重构**: 用户体验的平滑过渡
- **AMIS格式适配**: 接口格式的完全兼容
- **性能优化**: 大量数据的处理效率

#### 7.2.3 风险缓解措施
- 分阶段迭代开发，及时发现和解决问题
- 完善的测试覆盖，确保功能稳定性
- 详细的文档和代码注释，便于维护
- 备份和回滚机制，确保数据安全

### 7.3 质量保证措施

#### 7.3.1 代码质量
- TypeScript严格模式
- ESLint代码规范检查
- Prettier代码格式化
- 单元测试覆盖率>80%

#### 7.3.2 系统稳定性
- 服务健康检查
- 数据库连接池管理
- 错误监控和告警
- 日志收集和分析

#### 7.3.3 用户体验
- 响应式设计
- 加载状态提示
- 错误信息友好化
- 操作引导和帮助

## 8. 交付成果清单

### 8.1 技术文档
- [x] 需求分析文档
- [ ] 系统架构设计文档
- [ ] 数据库设计文档
- [ ] API接口文档
- [ ] 代码生成器使用手册
- [ ] 部署运维文档

### 8.2 核心功能
- [ ] 双层代码生成器
- [ ] 模板管理系统
- [ ] 多表关联查询生成
- [ ] AMIS接口格式适配
- [ ] 可视化实体设计器
- [ ] 项目管理功能

### 8.3 系统组件
- [ ] 重构后的5个微服务
- [ ] 统一的认证授权系统
- [ ] 完整的Docker部署方案
- [ ] 自动化测试套件
- [ ] 监控和日志系统

### 8.4 用户界面
- [ ] 项目管理界面
- [ ] 实体设计器界面
- [ ] 模板管理界面
- [ ] 代码生成配置界面
- [ ] 可视化页面设计器

## 9. 验收标准

### 9.1 功能验收
- 能够创建项目并设计实体模型
- 能够配置实体间的关联关系
- 能够管理和编辑代码模板
- 能够生成符合AMIS标准的接口代码
- 能够通过可视化设计器构建页面
- 生成的代码能够正常运行和部署

### 9.2 性能验收
- 代码生成时间<30秒（中等复杂度项目）
- 接口响应时间<500ms（正常负载）
- 系统启动时间<2分钟（所有服务）
- 内存使用<2GB（所有服务总和）

### 9.3 稳定性验收
- 系统连续运行24小时无故障
- 支持并发用户数>50
- 数据一致性100%保证
- 服务可用性>99.9%

### 9.4 易用性验收
- 新用户能在30分钟内完成基本操作
- 操作流程直观，无需复杂培训
- 错误提示清晰，便于问题定位
- 文档完整，覆盖所有功能点

---

**文档版本**: v1.0
**创建日期**: 2025-07-25
**最后更新**: 2025-07-25
**负责人**: 开发团队
**审核人**: 项目经理
