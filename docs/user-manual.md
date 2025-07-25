# Soybean Admin NestJS 低代码平台用户手册

## 📖 目录

1. [平台概述](#平台概述)
2. [快速开始](#快速开始)
3. [核心功能使用指南](#核心功能使用指南)
4. [API文档](#api文档)
5. [开发指南](#开发指南)
6. [运维指南](#运维指南)
7. [最佳实践](#最佳实践)

---

## 🌟 平台概述

### 整体架构

Soybean Admin NestJS 低代码平台是一个企业级的全栈低代码开发平台，采用微服务架构设计，支持可视化的实体设计、自动化的代码生成和完整的业务流程管理。

#### 架构组件

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层 (Frontend)                      │
├─────────────────────────────────────────────────────────────┤
│  Vue 3 + TypeScript + Naive UI + Amis 组件                  │
│  • 统一路由管理  • 环境配置  • API服务集成                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API网关层                               │
├─────────────────────────────────────────────────────────────┤
│  • 统一JWT认证  • 请求路由  • 负载均衡  • 监控统计           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│   主后端服务     │  低代码平台服务   │    Amis后端服务         │
│  (Backend)      │  (Lowcode)      │  (Amis-Backend)        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • 用户管理       │ • 实体设计器     │ • 页面配置管理           │
│ • 权限控制       │ • 模板管理       │ • 组件数据源             │
│ • 系统配置       │ • 代码生成       │ • 表单处理               │
│ • 基础服务       │ • 性能监控       │ • 数据查询               │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Redis + 文件存储                              │
│  • 业务数据  • 缓存  • 会话  • 文件资源                      │
└─────────────────────────────────────────────────────────────┘
```

### 核心功能

#### 🔐 统一JWT认证系统
- 跨微服务的统一认证体系
- 基于角色的访问控制（RBAC）
- 细粒度权限管理
- 令牌自动刷新和黑名单机制

#### 🎨 可视化实体设计器
- 拖拽式实体关系设计
- 实时设计验证和错误提示
- 支持复杂关系建模
- 一键生成代码架构

#### 🏗️ 分层代码生成架构
- Base层：自动生成的基础代码
- Biz层：可手动扩展的业务代码
- 支持多种代码模板和框架
- 完整的任务管理和进度跟踪

#### 📊 性能监控系统
- 实时性能指标收集
- 系统资源监控
- API响应时间统计
- 健康检查和告警机制

#### 🔧 模板管理系统
- Handlebars模板引擎
- 模板语法验证和测试
- 版本管理和发布流程
- 自定义Helper函数支持

### 技术栈

#### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **监控**: 自研性能监控系统
- **模板引擎**: Handlebars

#### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI组件**: Naive UI + Amis
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

#### 部署技术栈
- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **反向代理**: Nginx
- **监控**: 内置监控系统

---

## 🚀 快速开始

### 系统要求

- **操作系统**: Linux/macOS/Windows
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 最低4GB，推荐8GB+
- **磁盘空间**: 最低10GB可用空间

### Docker部署指南

#### 1. 获取项目代码

```bash
git clone https://github.com/your-org/soybean-admin-nestjs.git
cd soybean-admin-nestjs
```

#### 2. 环境配置

复制环境变量模板：

```bash
cp .env.docker.example .env.docker
```

编辑 `.env.docker` 文件，配置关键参数：

```bash
# 数据库配置
POSTGRES_DB=soybean_admin
POSTGRES_USER=soybean
POSTGRES_PASSWORD=your_secure_password

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 服务端口配置
BACKEND_PORT=9528
LOWCODE_PORT=3000
AMIS_PORT=9522
FRONTEND_PORT=3001
```

#### 3. 一键部署

使用统一部署脚本：

```bash
# 赋予执行权限
chmod +x scripts/deploy.sh

# 初始化环境
./scripts/deploy.sh init

# 启动所有服务
./scripts/deploy.sh start prod
```

#### 4. 验证部署

检查服务状态：

```bash
# 查看服务状态
./scripts/deploy.sh status

# 查看服务日志
./scripts/deploy.sh logs

# 健康检查
./scripts/deploy.sh health
```

访问服务：

- **前端应用**: http://localhost:3001
- **主后端API**: http://localhost:9528/api/docs
- **低代码平台API**: http://localhost:3000/api/docs
- **Amis后端API**: http://localhost:9522/api/docs

### 首次运行步骤

#### 1. 系统初始化

首次启动时，系统会自动执行以下初始化操作：

- 创建数据库表结构
- 初始化系统配置
- 创建默认管理员账户
- 导入基础模板数据

#### 2. 登录系统

使用默认管理员账户登录：

```
用户名: admin
密码: admin123
```

> ⚠️ **安全提示**: 首次登录后请立即修改默认密码！

#### 3. 基础配置

登录后完成以下基础配置：

1. **修改管理员密码**
   - 进入用户设置页面
   - 修改默认密码为强密码

2. **配置系统参数**
   - 设置系统名称和Logo
   - 配置邮件服务器（可选）
   - 设置文件存储路径

3. **创建项目**
   - 进入项目管理页面
   - 创建第一个低代码项目
   - 配置项目基本信息

---

## 📚 核心功能使用指南

### 🔐 统一JWT认证系统

#### 认证流程

1. **用户登录**
   ```typescript
   // 登录请求
   POST /api/auth/login
   {
     "username": "admin",
     "password": "admin123"
   }

   // 响应
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "user_123",
       "username": "admin",
       "roles": ["admin"],
       "permissions": ["user:read", "user:write"]
     }
   }
   ```

2. **API调用**
   ```bash
   curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
        http://localhost:9528/api/users
   ```

3. **令牌刷新**
   ```typescript
   POST /api/auth/refresh
   {
     "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
   }
   ```

#### 权限管理

##### 角色定义
- **super_admin**: 超级管理员，拥有所有权限
- **admin**: 管理员，拥有大部分管理权限
- **developer**: 开发者，拥有代码生成和模板管理权限
- **user**: 普通用户，拥有基础查看权限

##### 权限配置
```typescript
// 在控制器中使用权限装饰器
@Controller('users')
export class UserController {
  @Get()
  @JwtAuthWithPermissions('user:read')
  async getUsers() {
    // 需要 user:read 权限
  }

  @Post()
  @JwtAuthWithRoles('admin', 'super_admin')
  async createUser() {
    // 需要 admin 或 super_admin 角色
  }

  @Delete(':id')
  @SuperAdminAuth()
  async deleteUser() {
    // 只有超级管理员可以删除用户
  }
}
```

#### 前端集成

```typescript
// 在Vue组件中获取用户信息
import { useAuthStore } from '@/store/modules/auth';

const authStore = useAuthStore();

// 检查权限
if (authStore.hasPermission('user:write')) {
  // 显示编辑按钮
}

// 检查角色
if (authStore.hasRole('admin')) {
  // 显示管理功能
}
```

### 🎨 可视化实体设计器

#### 创建设计画布

1. **进入实体设计器**
   - 登录系统后，点击左侧菜单"实体设计器"
   - 点击"新建画布"按钮

2. **画布基本配置**
   ```typescript
   // 创建画布API
   POST /api/entity-designer/canvas
   {
     "name": "用户管理系统",
     "description": "用户相关实体设计",
     "projectId": "project_123"
   }
   ```

#### 实体设计操作

##### 添加实体
1. 点击工具栏"添加实体"按钮
2. 在画布上点击位置放置实体
3. 配置实体基本信息：
   - **实体代码**: 英文标识符（如：user）
   - **实体名称**: 中文显示名称（如：用户）
   - **实体描述**: 详细说明

##### 字段管理
```typescript
// 字段定义示例
{
  "name": "username",
  "type": "string",
  "required": true,
  "unique": true,
  "length": 50,
  "description": "用户名",
  "validation": {
    "pattern": "^[a-zA-Z0-9_]{3,20}$",
    "message": "用户名只能包含字母、数字和下划线，长度3-20位"
  }
}
```

支持的字段类型：
- **string**: 字符串类型
- **number**: 数字类型
- **boolean**: 布尔类型
- **date**: 日期类型
- **datetime**: 日期时间类型
- **text**: 长文本类型
- **json**: JSON对象类型

##### 关系设计
1. **一对一关系 (oneToOne)**
   - 用户 ↔ 用户资料
   - 每个用户对应一个用户资料

2. **一对多关系 (oneToMany)**
   - 用户 → 订单
   - 一个用户可以有多个订单

3. **多对多关系 (manyToMany)**
   - 用户 ↔ 角色
   - 用户可以有多个角色，角色可以分配给多个用户

#### 设计验证

系统提供实时的设计验证功能：

```typescript
// 验证结果示例
{
  "isValid": false,
  "errors": [
    {
      "type": "entity",
      "code": "EMPTY_ENTITY_NAME",
      "message": "实体名称不能为空",
      "entityId": "entity_123"
    }
  ],
  "warnings": [
    {
      "type": "best-practice",
      "code": "NO_FIELDS",
      "message": "实体没有定义任何字段",
      "suggestion": "建议至少定义一个字段"
    }
  ]
}
```

#### 代码生成

1. **验证设计**
   - 点击"验证设计"按钮
   - 修复所有错误和警告

2. **配置生成参数**
   ```typescript
   {
     "taskName": "用户管理系统代码生成",
     "config": {
       "projectName": "user-management",
       "outputDir": "./generated",
       "generateBase": true,
       "generateBiz": true,
       "generateTests": true
     },
     "async": true
   }
   ```

3. **执行代码生成**
   - 点击"生成代码"按钮
   - 系统创建代码生成任务
   - 可在任务管理页面查看进度

### 🏗️ 模板管理和代码生成流程

#### 模板管理

##### 模板类型
- **Controller模板**: 控制器代码模板
- **Service模板**: 服务层代码模板
- **Repository模板**: 数据访问层模板
- **DTO模板**: 数据传输对象模板
- **Entity模板**: 实体类模板
- **Test模板**: 测试代码模板

##### 创建模板

1. **进入模板管理**
   - 点击左侧菜单"模板管理"
   - 点击"新建模板"按钮

2. **模板基本信息**
   ```typescript
   {
     "name": "NestJS Controller模板",
     "type": "controller",
     "language": "typescript",
     "framework": "nestjs",
     "description": "标准的NestJS控制器模板"
   }
   ```

3. **编写模板内容**
   ```handlebars
   import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
   import { {{pascalCase entity.name}}Service } from './{{kebabCase entity.name}}.service';
   import { Create{{pascalCase entity.name}}Dto, Update{{pascalCase entity.name}}Dto } from './dto';

   @ApiTags('{{entity.name}}')
   @Controller('{{kebabCase entity.name}}')
   export class {{pascalCase entity.name}}Controller {
     constructor(
       private readonly {{camelCase entity.name}}Service: {{pascalCase entity.name}}Service,
     ) {}

     @Get()
     @ApiOperation({ summary: '获取{{entity.description}}列表' })
     async findAll(@Query() query: any) {
       return this.{{camelCase entity.name}}Service.findAll(query);
     }

     {{#each entity.fields}}
     {{#if this.unique}}
     @Get('by-{{kebabCase this.name}}/:{{this.name}}')
     @ApiOperation({ summary: '根据{{this.description}}查询{{../entity.description}}' })
     async findBy{{pascalCase this.name}}(@Param('{{this.name}}') {{this.name}}: {{this.type}}) {
       return this.{{camelCase ../entity.name}}Service.findBy{{pascalCase this.name}}({{this.name}});
     }
     {{/if}}
     {{/each}}

     @Post()
     @ApiOperation({ summary: '创建{{entity.description}}' })
     async create(@Body() createDto: Create{{pascalCase entity.name}}Dto) {
       return this.{{camelCase entity.name}}Service.create(createDto);
     }

     @Put(':id')
     @ApiOperation({ summary: '更新{{entity.description}}' })
     async update(
       @Param('id') id: string,
       @Body() updateDto: Update{{pascalCase entity.name}}Dto,
     ) {
       return this.{{camelCase entity.name}}Service.update(id, updateDto);
     }

     @Delete(':id')
     @ApiOperation({ summary: '删除{{entity.description}}' })
     async remove(@Param('id') id: string) {
       return this.{{camelCase entity.name}}Service.remove(id);
     }
   }
   ```

##### 模板验证

系统提供完整的模板验证功能：

```typescript
// 验证模板API
POST /api/templates/:id/validate

// 验证结果
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "type": "performance",
      "message": "检测到嵌套循环，可能影响性能",
      "code": "NESTED_LOOPS",
      "suggestion": "考虑优化模板结构以提高渲染性能"
    }
  ],
  "variables": ["entity", "fields"],
  "helpers": ["pascalCase", "camelCase", "kebabCase"],
  "syntaxAnalysis": {
    "totalLines": 45,
    "blockCount": 3,
    "expressionCount": 12,
    "complexityScore": 18,
    "performanceRating": "good"
  }
}
```

##### 模板测试

```typescript
// 测试模板API
POST /api/templates/:id/test
{
  "generateDefaultTests": true,
  "testCases": [
    {
      "name": "用户实体测试",
      "input": {
        "entity": {
          "name": "User",
          "description": "用户",
          "fields": [
            {
              "name": "username",
              "type": "string",
              "required": true,
              "unique": true,
              "description": "用户名"
            }
          ]
        }
      },
      "expectedContains": ["UserController", "findAll", "create"]
    }
  ]
}
```

#### 代码生成流程

##### 1. 创建生成任务

```typescript
// 创建分层代码生成任务
POST /api/code-generation/layered/tasks
{
  "name": "用户管理系统",
  "entities": [
    {
      "code": "user",
      "name": "User",
      "description": "用户",
      "fields": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "用户ID"
        },
        {
          "name": "username",
          "type": "string",
          "required": true,
          "unique": true,
          "length": 50,
          "description": "用户名"
        },
        {
          "name": "email",
          "type": "string",
          "required": true,
          "unique": true,
          "description": "邮箱"
        }
      ]
    }
  ],
  "config": {
    "projectName": "user-management",
    "outputDir": "./generated",
    "generateBase": true,
    "generateBiz": true,
    "generateTests": true,
    "createDirectories": true,
    "overwriteExisting": false
  },
  "async": true
}
```

##### 2. 监控任务进度

```typescript
// 获取任务状态
GET /api/code-generation/layered/tasks/:taskId

// 响应示例
{
  "id": "task_1234567890_abc123",
  "name": "用户管理系统",
  "status": "running",
  "progress": 65,
  "startTime": "2024-01-15T10:30:00Z",
  "filesCount": 12,
  "createdAt": "2024-01-15T10:29:45Z"
}
```

##### 3. 查看生成结果

```typescript
// 获取生成的文件列表
GET /api/code-generation/layered/tasks/:taskId/files

// 响应示例
{
  "files": [
    {
      "filePath": "user-management/base/controllers/user.base.controller.ts",
      "type": "controller",
      "layer": "base",
      "editable": false,
      "dependencies": [
        "user-management/base/services/user.base.service.ts",
        "user-management/base/dto/user.dto.ts"
      ]
    },
    {
      "filePath": "user-management/biz/controllers/user.controller.ts",
      "type": "controller",
      "layer": "biz",
      "editable": true,
      "dependencies": [
        "user-management/base/controllers/user.base.controller.ts"
      ]
    }
  ]
}
```

#### 分层架构说明

##### Base层（基础层）
- **特点**: 自动生成，不可手动修改
- **内容**: 基础CRUD操作、数据验证、基本业务逻辑
- **文件命名**: `*.base.ts`
- **重新生成**: 会覆盖现有文件

示例Base层控制器：
```typescript
// user.base.controller.ts
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';

@Controller('users')
export abstract class UserBaseController {
  // 基础CRUD方法
  abstract findAll(query: any): Promise<any>;
  abstract findOne(id: string): Promise<any>;
  abstract create(createDto: any): Promise<any>;
  abstract update(id: string, updateDto: any): Promise<any>;
  abstract remove(id: string): Promise<any>;
}
```

##### Biz层（业务层）
- **特点**: 可手动修改和扩展
- **内容**: 业务逻辑、自定义方法、特殊处理
- **文件命名**: `*.ts`
- **重新生成**: 不会覆盖现有文件

示例Biz层控制器：
```typescript
// user.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { UserBaseController } from './user.base.controller';
import { UserService } from './user.service';

@Controller('users')
export class UserController extends UserBaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  // 实现基础方法
  async findAll(query: any) {
    return this.userService.findAll(query);
  }

  // 自定义业务方法
  @Get('active')
  async findActiveUsers() {
    return this.userService.findActiveUsers();
  }

  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }
}
```

### 📊 性能监控和系统管理

#### 性能监控概述

系统内置了全面的性能监控功能，提供实时的系统状态监控、API性能统计和资源使用情况分析。

#### 监控指标

##### 系统资源监控
```typescript
// 获取系统资源使用情况
GET /api/performance/system/resources

// 响应示例
{
  "memory": {
    "total": 8589934592,
    "used": 4294967296,
    "free": 4294967296,
    "usagePercent": 50.0
  },
  "cpu": {
    "user": 1500000,
    "system": 800000,
    "usagePercent": 23.5
  },
  "heap": {
    "used": 134217728,
    "total": 268435456,
    "usagePercent": 50.0
  },
  "eventLoopDelay": 2.5,
  "activeHandles": 15,
  "activeRequests": 3
}
```

##### API性能统计
```typescript
// 获取所有操作的性能统计
GET /api/performance/stats

// 响应示例
[
  {
    "operation": "UserController.findAll",
    "totalRequests": 1250,
    "successRequests": 1245,
    "errorRequests": 5,
    "averageResponseTime": 125.5,
    "minResponseTime": 45,
    "maxResponseTime": 890,
    "p95ResponseTime": 245,
    "p99ResponseTime": 456,
    "throughput": 25,
    "errorRate": 0.4,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
]
```

#### 健康检查

```typescript
// 获取系统健康状态
GET /api/performance/health

// 响应示例
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "checks": {
    "memory": {
      "status": "healthy",
      "value": 65.5,
      "threshold": 80,
      "message": "Memory usage: 65.50%"
    },
    "cpu": {
      "status": "warning",
      "value": 75.2,
      "threshold": 70,
      "message": "CPU usage: 75.20%"
    },
    "responseTime": {
      "status": "healthy",
      "value": 125.5,
      "threshold": 500,
      "message": "Average response time: 125.50ms"
    },
    "errorRate": {
      "status": "healthy",
      "value": 0.4,
      "threshold": 1,
      "message": "Error rate: 0.40%"
    }
  }
}
```

#### 性能监控装饰器

在代码中使用性能监控装饰器：

```typescript
import { MonitorPerformance, MonitorDatabaseOperation } from '@/shared/monitoring';

@Injectable()
export class UserService {
  @MonitorPerformance({
    operation: 'UserService.findUsers',
    slowThreshold: 500,
    logArgs: true
  })
  async findUsers(query: any) {
    // 业务逻辑
  }

  @MonitorDatabaseOperation({
    operationType: 'query',
    tableName: 'users',
    slowThreshold: 100
  })
  async findUserById(id: string) {
    // 数据库查询
  }
}
```

#### 监控告警

系统支持多种告警方式：

1. **慢请求告警**
   - 当API响应时间超过阈值时触发
   - 默认阈值：1000ms

2. **错误率告警**
   - 当错误率超过阈值时触发
   - 默认阈值：5%

3. **资源使用告警**
   - 内存使用率超过80%
   - CPU使用率超过85%

#### Prometheus集成

系统提供Prometheus格式的监控指标：

```typescript
// 获取Prometheus格式指标
GET /api/performance/metrics

// 响应示例（Prometheus格式）
# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="used"} 4294967296
memory_usage_bytes{type="total"} 8589934592

# HELP cpu_usage_percent CPU usage percentage
# TYPE cpu_usage_percent gauge
cpu_usage_percent 23.5

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{operation="UserController.findAll",status="success"} 1245
http_requests_total{operation="UserController.findAll",status="error"} 5
```

---

## 📖 API文档

### 认证相关API

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_123",
      "username": "admin",
      "roles": ["admin"],
      "permissions": ["user:read", "user:write"]
    }
  }
}
```

#### 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 实体设计器API

#### 创建画布
```http
POST /api/entity-designer/canvas
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "用户管理系统",
  "description": "用户相关实体设计",
  "projectId": "project_123"
}
```

#### 获取画布详情
```http
GET /api/entity-designer/canvas/{canvasId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 更新画布
```http
PUT /api/entity-designer/canvas/{canvasId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "entities": [...],
  "relationships": [...],
  "config": {...}
}
```

#### 验证实体设计
```http
POST /api/entity-designer/canvas/{canvasId}/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 从画布生成代码
```http
POST /api/entity-designer/canvas/{canvasId}/generate-code
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "taskName": "用户管理系统代码生成",
  "config": {
    "projectName": "user-management",
    "outputDir": "./generated",
    "generateBase": true,
    "generateBiz": true,
    "generateTests": true
  },
  "async": true
}
```

### 代码生成API

#### 创建代码生成任务
```http
POST /api/code-generation/layered/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "用户管理系统",
  "entities": [...],
  "config": {...},
  "async": true
}
```

#### 获取任务状态
```http
GET /api/code-generation/layered/tasks/{taskId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 获取任务文件列表
```http
GET /api/code-generation/layered/tasks/{taskId}/files
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 获取生成统计
```http
GET /api/code-generation/layered/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 模板管理API

#### 获取模板列表
```http
GET /api/templates?page=1&limit=10&type=controller
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 创建模板
```http
POST /api/templates
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "NestJS Controller模板",
  "type": "controller",
  "language": "typescript",
  "framework": "nestjs",
  "template": "{{template content}}",
  "description": "标准的NestJS控制器模板"
}
```

#### 验证模板
```http
POST /api/templates/{id}/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 测试模板
```http
POST /api/templates/{id}/test
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "generateDefaultTests": true,
  "testCases": [...]
}
```

### 性能监控API

#### 获取系统资源
```http
GET /api/performance/system/resources
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 获取性能统计
```http
GET /api/performance/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 健康检查
```http
GET /api/performance/health
```

#### 获取Prometheus指标
```http
GET /api/performance/metrics
```

---

## 🛠️ 开发指南

### 分层代码架构详解

#### 架构原则

1. **分离关注点**: Base层处理基础功能，Biz层处理业务逻辑
2. **代码复用**: Base层代码可在多个项目间复用
3. **可维护性**: 业务代码与生成代码分离，便于维护
4. **扩展性**: Biz层可自由扩展，不受代码生成限制

#### 目录结构

```
generated/
├── project-name/
│   ├── base/                 # 基础层（自动生成）
│   │   ├── controllers/      # 基础控制器
│   │   ├── services/         # 基础服务
│   │   ├── repositories/     # 基础仓储
│   │   ├── dto/              # 基础DTO
│   │   ├── entities/         # 实体定义
│   │   └── interfaces/       # 接口定义
│   ├── biz/                  # 业务层（可手动修改）
│   │   ├── controllers/      # 业务控制器
│   │   ├── services/         # 业务服务
│   │   ├── dto/              # 业务DTO
│   │   └── modules/          # 业务模块
│   ├── shared/               # 共享层
│   │   ├── utils/            # 工具函数
│   │   ├── constants/        # 常量定义
│   │   ├── decorators/       # 装饰器
│   │   ├── interceptors/     # 拦截器
│   │   └── guards/           # 守卫
│   ├── config/               # 配置层
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   └── test/                 # 测试层
│       ├── unit/             # 单元测试
│       ├── integration/      # 集成测试
│       └── e2e/              # 端到端测试
```

### 监控和日志

#### 日志管理

```bash
# 查看所有服务日志
./scripts/deploy.sh logs

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f lowcode
docker-compose logs -f postgres

# 日志轮转配置
# /etc/logrotate.d/soybean-admin
/var/log/soybean-admin/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart nginx
    endscript
}
```

#### 监控指标

```bash
# 系统资源监控
curl http://localhost:9528/api/performance/system/resources

# 应用性能监控
curl http://localhost:9528/api/performance/stats

# 健康检查
curl http://localhost:9528/api/performance/health

# Prometheus指标
curl http://localhost:9528/api/performance/metrics
```

#### 告警配置

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@example.com'
    subject: 'Soybean Admin Alert'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

### 备份和恢复

#### 数据库备份

```bash
# 自动备份脚本
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="soybean_admin"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker exec postgres pg_dump -U soybean $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

#### 数据恢复

```bash
# 恢复数据库
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 停止应用服务
docker-compose stop backend lowcode amis-backend

# 恢复数据库
gunzip -c $BACKUP_FILE | docker exec -i postgres psql -U soybean -d soybean_admin

# 重启服务
docker-compose start backend lowcode amis-backend

echo "Database restore completed"
```

### 故障排查

#### 常见问题

1. **服务启动失败**
   ```bash
   # 检查服务状态
   docker-compose ps

   # 查看错误日志
   docker-compose logs service_name

   # 检查端口占用
   netstat -tulpn | grep :3000
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker exec postgres pg_isready -U soybean

   # 检查连接字符串
   echo $DATABASE_URL

   # 测试连接
   docker exec postgres psql -U soybean -d soybean_admin -c "SELECT 1;"
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   docker stats

   # 调整服务内存限制
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

4. **磁盘空间不足**
   ```bash
   # 检查磁盘使用
   df -h

   # 清理Docker镜像
   docker system prune -a

   # 清理日志文件
   find /var/log -name "*.log" -mtime +30 -delete
   ```

#### 性能调优

1. **数据库优化**
   ```sql
   -- 查看慢查询
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;

   -- 创建索引
   CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

   -- 分析表统计信息
   ANALYZE users;
   ```

2. **应用优化**
   ```typescript
   // 启用查询缓存
   @Injectable()
   export class UserService {
     @Cacheable('users', 300) // 缓存5分钟
     async findAll() {
       return this.userRepository.findAll();
     }
   }

   // 数据库连接池配置
   {
     "database": {
       "pool": {
         "min": 2,
         "max": 10,
         "acquireTimeoutMillis": 30000,
         "idleTimeoutMillis": 30000
       }
     }
   }
   ```

3. **Redis优化**
   ```bash
   # redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   save 60 10000
   ```

---

## 💡 最佳实践

### 开发最佳实践

#### 1. 代码组织

**分层架构原则**
- Base层只包含基础CRUD操作，不包含业务逻辑
- Biz层继承Base层，添加业务逻辑和自定义方法
- 共享层提供通用工具和组件
- 配置层集中管理所有配置信息

```typescript
// ✅ 正确的分层实现
// base/user.base.service.ts
export abstract class UserBaseService {
  // 基础CRUD方法
  abstract findAll(): Promise<User[]>;
  abstract create(data: any): Promise<User>;
}

// biz/user.service.ts
export class UserService extends UserBaseService {
  // 实现基础方法
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  // 添加业务方法
  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.findByStatus('active');
  }
}
```

#### 2. 模板开发

**模板设计原则**
- 使用语义化的变量名
- 添加详细的注释说明
- 支持条件渲染和循环
- 提供默认值和错误处理

```handlebars
{{!-- ✅ 良好的模板示例 --}}
{{!--
模板说明: NestJS实体模板
用途: 生成TypeORM实体类
变量: entity (实体定义对象)
--}}

import { Entity, PrimaryGeneratedColumn, Column{{#if entity.hasTimestamps}}, CreateDateColumn, UpdateDateColumn{{/if}} } from 'typeorm';

@Entity('{{snakeCase entity.name}}')
export class {{pascalCase entity.name}} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  {{#each entity.fields}}
  {{#if this.description}}
  /** {{this.description}} */
  {{/if}}
  @Column({{#if this.options}}{{{json this.options}}}{{/if}})
  {{this.name}}: {{this.type}}{{#unless this.required}}?{{/unless}};

  {{/each}}

  {{#if entity.hasTimestamps}}
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  {{/if}}
}
```

#### 3. 实体设计

**实体设计规范**
- 使用清晰的实体名称和描述
- 字段命名遵循驼峰命名法
- 合理设置字段类型和约束
- 建立正确的实体关系

```typescript
// ✅ 良好的实体设计示例
const userEntity: EntityDefinition = {
  code: 'user',
  name: 'User',
  description: '系统用户',
  fields: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: '用户唯一标识'
    },
    {
      name: 'username',
      type: 'string',
      required: true,
      unique: true,
      length: 50,
      description: '用户名',
      validation: {
        pattern: '^[a-zA-Z0-9_]{3,20}$',
        message: '用户名只能包含字母、数字和下划线，长度3-20位'
      }
    },
    {
      name: 'email',
      type: 'string',
      required: true,
      unique: true,
      description: '邮箱地址',
      validation: {
        pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
        message: '请输入有效的邮箱地址'
      }
    }
  ],
  relationships: [
    {
      type: 'oneToMany',
      targetEntity: 'order',
      field: 'orders',
      foreignKey: 'userId'
    }
  ]
};
```

### 部署最佳实践

#### 1. 环境配置

**配置管理原则**
- 敏感信息使用环境变量
- 不同环境使用不同配置文件
- 配置验证和默认值设置
- 配置文档化和版本控制

```bash
# ✅ 生产环境配置示例
# .env.production
NODE_ENV=production

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# 监控配置
ENABLE_MONITORING=true
METRICS_RETENTION_PERIOD=3600000
MAX_METRICS_COUNT=10000

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 2. 安全配置

**安全最佳实践**
- 使用强密码和密钥
- 启用HTTPS和安全头
- 定期更新依赖包
- 实施访问控制和审计

```nginx
# ✅ Nginx安全配置
server {
    # 安全头设置
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'";

    # 隐藏服务器信息
    server_tokens off;

    # 限制请求大小
    client_max_body_size 10M;

    # 速率限制
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

#### 3. 监控和告警

**监控策略**
- 设置关键指标监控
- 配置合理的告警阈值
- 建立故障响应流程
- 定期检查和优化

```yaml
# ✅ 监控配置示例
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'soybean-admin'
    static_configs:
      - targets: ['localhost:9528', 'localhost:3000']
    metrics_path: '/api/performance/metrics'
    scrape_interval: 30s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 常见问题解答

#### Q1: 如何自定义代码生成模板？

**A**: 按以下步骤操作：

1. 进入模板管理页面
2. 点击"新建模板"
3. 选择模板类型和语言
4. 编写Handlebars模板内容
5. 使用模板验证功能检查语法
6. 创建测试用例验证输出
7. 发布模板供代码生成使用

```handlebars
{{!-- 自定义控制器模板示例 --}}
import { Controller, Get } from '@nestjs/common';

@Controller('{{kebabCase entity.name}}')
export class {{pascalCase entity.name}}Controller {
  {{#each entity.fields}}
  {{#if this.unique}}
  @Get('by-{{kebabCase this.name}}/:{{this.name}}')
  async findBy{{pascalCase this.name}}() {
    // 自定义查询逻辑
  }
  {{/if}}
  {{/each}}
}
```

#### Q2: 如何扩展业务层代码？

**A**: 业务层代码完全可以手动修改：

```typescript
// biz/user.service.ts - 可以自由修改
export class UserService extends UserBaseService {
  // 重写基础方法，添加业务逻辑
  async create(createDto: CreateUserDto): Promise<User> {
    // 添加业务验证
    await this.validateBusinessRules(createDto);

    // 调用基础方法
    const user = await super.create(createDto);

    // 添加后置处理
    await this.sendWelcomeEmail(user);

    return user;
  }

  // 添加自定义业务方法
  async promoteToAdmin(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.update(userId, { role: 'admin' });
  }
}
```

#### Q3: 如何处理数据库迁移？

**A**: 系统提供自动化的数据库管理：

```bash
# 查看迁移状态
./scripts/deploy.sh db:status

# 执行迁移
./scripts/deploy.sh db:migrate

# 回滚迁移
./scripts/deploy.sh db:rollback

# 重置数据库
./scripts/deploy.sh db:reset
```

#### Q4: 如何配置多环境部署？

**A**: 为不同环境创建对应的配置文件：

```bash
# 开发环境
cp .env.development.example .env.development
./scripts/deploy.sh start dev

# 测试环境
cp .env.testing.example .env.testing
./scripts/deploy.sh start test

# 生产环境
cp .env.production.example .env.production
./scripts/deploy.sh start prod
```

#### Q5: 如何监控系统性能？

**A**: 系统内置了完整的监控功能：

```bash
# 查看实时性能指标
curl http://localhost:9528/api/performance/stats

# 查看系统健康状态
curl http://localhost:9528/api/performance/health

# 导出Prometheus指标
curl http://localhost:9528/api/performance/metrics

# 查看监控面板
# 访问 http://localhost:3001/monitoring
```

#### Q6: 如何备份和恢复数据？

**A**: 使用内置的备份脚本：

```bash
# 创建备份
./scripts/backup.sh

# 恢复数据
./scripts/restore.sh /path/to/backup.sql.gz

# 定时备份（添加到crontab）
0 2 * * * /path/to/soybean-admin/scripts/backup.sh
```

---

## 📞 技术支持

### 获取帮助

- **文档**: [在线文档](https://docs.soybean-admin.com)
- **GitHub**: [项目仓库](https://github.com/your-org/soybean-admin-nestjs)
- **Issues**: [问题反馈](https://github.com/your-org/soybean-admin-nestjs/issues)
- **讨论**: [社区讨论](https://github.com/your-org/soybean-admin-nestjs/discussions)

### 版本信息

- **当前版本**: v2.0.0
- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 13.0
- **Redis**: >= 6.0
- **Docker**: >= 20.10

### 更新日志

#### v2.0.0 (2024-01-15)
- ✨ 新增统一JWT认证系统
- ✨ 新增可视化实体设计器
- ✨ 新增分层代码生成架构
- ✨ 新增性能监控系统
- ✨ 新增模板管理和验证
- 🐛 修复若干已知问题
- 📝 完善文档和示例

#### v1.5.0 (2023-12-01)
- ✨ 新增Docker部署支持
- ✨ 新增Swagger文档优化
- 🔧 优化前端集成配置
- 📝 更新部署文档

---

## 📄 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件。

---

**© 2024 Soybean Admin Team. All rights reserved.**

#### Base层开发规范

##### 控制器基类
```typescript
// user.base.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('User')
@Controller('users')
export abstract class UserBaseController {
  // 抽象方法，由Biz层实现
  abstract findAll(query: any): Promise<any>;
  abstract findOne(id: string): Promise<any>;
  abstract create(createDto: any): Promise<any>;
  abstract update(id: string, updateDto: any): Promise<any>;
  abstract remove(id: string): Promise<any>;

  // 基础路由定义
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  async getAllUsers(@Query() query: any) {
    return this.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async getUser(@Param('id') id: string) {
    return this.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async createUser(@Body() createDto: any) {
    return this.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  async updateUser(@Param('id') id: string, @Body() updateDto: any) {
    return this.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    return this.remove(id);
  }
}
```

##### 服务基类
```typescript
// user.base.service.ts
import { Injectable } from '@nestjs/common';
import { UserBaseRepository } from '../repositories/user.base.repository';
import { User } from '../entities/user.entity';

@Injectable()
export abstract class UserBaseService {
  constructor(
    protected readonly userRepository: UserBaseRepository,
  ) {}

  // 基础CRUD方法
  async findAll(query: any): Promise<User[]> {
    return this.userRepository.findAll(query);
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne(id);
  }

  async create(createDto: any): Promise<User> {
    return this.userRepository.create(createDto);
  }

  async update(id: string, updateDto: any): Promise<User> {
    return this.userRepository.update(id, updateDto);
  }

  async remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }

  // 抽象方法，由Biz层实现
  abstract validateCreateData(createDto: any): Promise<void>;
  abstract validateUpdateData(id: string, updateDto: any): Promise<void>;
}
```

#### Biz层开发规范

##### 业务控制器
```typescript
// user.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserBaseController } from '../base/controllers/user.base.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController extends UserBaseController {
  constructor(
    private readonly userService: UserService,
  ) {
    super();
  }

  // 实现基类抽象方法
  async findAll(query: any) {
    return this.userService.findAll(query);
  }

  async findOne(id: string) {
    return this.userService.findOne(id);
  }

  async create(createDto: CreateUserDto) {
    return this.userService.create(createDto);
  }

  async update(id: string, updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  async remove(id: string) {
    return this.userService.remove(id);
  }

  // 自定义业务方法
  @Get('active')
  async getActiveUsers() {
    return this.userService.findActiveUsers();
  }

  @Post(':id/activate')
  async activateUser(@Param('id') id: string) {
    return this.userService.activateUser(id);
  }

  @Post(':id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }
}
```

##### 业务服务
```typescript
// user.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { UserBaseService } from '../base/services/user.base.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from '../base/entities/user.entity';

@Injectable()
export class UserService extends UserBaseService {
  // 实现基类抽象方法
  async validateCreateData(createDto: CreateUserDto): Promise<void> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findByUsername(createDto.username);
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findByEmail(createDto.email);
    if (existingEmail) {
      throw new BadRequestException('邮箱已存在');
    }
  }

  async validateUpdateData(id: string, updateDto: UpdateUserDto): Promise<void> {
    // 检查用户是否存在
    const user = await this.findOne(id);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 如果更新用户名，检查是否重复
    if (updateDto.username && updateDto.username !== user.username) {
      const existingUser = await this.userRepository.findByUsername(updateDto.username);
      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }
    }
  }

  // 重写基类方法，添加业务逻辑
  async create(createDto: CreateUserDto): Promise<User> {
    await this.validateCreateData(createDto);

    // 密码加密
    const hashedPassword = await this.hashPassword(createDto.password);

    return super.create({
      ...createDto,
      password: hashedPassword,
      status: 'active',
      createdAt: new Date(),
    });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    await this.validateUpdateData(id, updateDto);

    const updateData = { ...updateDto };

    // 如果更新密码，进行加密
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }

    updateData.updatedAt = new Date();

    return super.update(id, updateData);
  }

  // 自定义业务方法
  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.findByStatus('active');
  }

  async activateUser(id: string): Promise<User> {
    return this.update(id, { status: 'active' });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.update(id, { status: 'inactive' });
  }

  private async hashPassword(password: string): Promise<string> {
    // 密码加密逻辑
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 10);
  }
}
```

### 模板开发指南

#### Handlebars Helper函数

系统内置了丰富的Helper函数：

```typescript
// 字符串处理
{{pascalCase "user_name"}}        // UserName
{{camelCase "user_name"}}         // userName
{{kebabCase "UserName"}}          // user-name
{{snakeCase "UserName"}}          // user_name
{{upperCase "hello"}}             // HELLO
{{lowerCase "HELLO"}}             // hello

// 数组处理
{{#each items}}
  {{@index}}: {{this.name}}
{{/each}}

{{#if (gt items.length 0)}}
  有 {{items.length}} 个项目
{{/if}}

// 条件判断
{{#if user.isActive}}
  用户已激活
{{else}}
  用户未激活
{{/if}}

{{#unless user.isDeleted}}
  用户存在
{{/unless}}

// 比较操作
{{#if (eq user.role "admin")}}
  管理员用户
{{/if}}

{{#if (or (eq status "active") (eq status "pending"))}}
  用户状态正常
{{/if}}

// 日期处理
{{formatDate createdAt "YYYY-MM-DD"}}
{{formatDateTime updatedAt "YYYY-MM-DD HH:mm:ss"}}
{{now "YYYY-MM-DD HH:mm:ss"}}

// 数学运算
{{add 1 2}}                       // 3
{{subtract 5 2}}                  // 3
{{multiply 3 4}}                  // 12
{{divide 10 2}}                   // 5
```

#### 自定义Helper函数

```typescript
// 注册自定义Helper
import Handlebars from 'handlebars';

// 生成UUID
Handlebars.registerHelper('uuid', () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
});

// 生成随机数
Handlebars.registerHelper('random', (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
});

// 字符串截取
Handlebars.registerHelper('truncate', (str: string, length: number) => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
});

// 使用示例
{{uuid}}                          // 生成UUID
{{random 1 100}}                  // 生成1-100的随机数
{{truncate description 50}}       // 截取描述到50个字符
```

#### 模板最佳实践

1. **模板结构化**
   ```handlebars
   {{!-- 文件头部注释 --}}
   {{!--
   模板名称: NestJS Controller模板
   作者: 系统生成
   创建时间: {{now "YYYY-MM-DD HH:mm:ss"}}
   描述: 标准的NestJS控制器模板
   --}}

   {{!-- 导入语句 --}}
   import { Controller, Get, Post } from '@nestjs/common';

   {{!-- 类定义 --}}
   @Controller('{{kebabCase entity.name}}')
   export class {{pascalCase entity.name}}Controller {
     // 控制器实现
   }
   ```

2. **条件渲染**
   ```handlebars
   {{#if entity.hasTimestamps}}
   import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
   {{/if}}

   export class {{pascalCase entity.name}} {
     {{#each entity.fields}}
     {{#if this.isPrimaryKey}}
     @PrimaryGeneratedColumn('uuid')
     {{else}}
     @Column({{#if this.options}}{{{json this.options}}}{{/if}})
     {{/if}}
     {{this.name}}: {{this.type}};

     {{/each}}

     {{#if entity.hasTimestamps}}
     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;
     {{/if}}
   }
   ```

3. **循环处理**
   ```handlebars
   {{#each entity.fields}}
   {{#unless @first}},{{/unless}}
   {
     "name": "{{this.name}}",
     "type": "{{this.type}}",
     "required": {{this.required}}{{#if @last}}{{else}},{{/if}}
   }{{/each}}
   ```

### 前端集成配置

#### 环境配置

```typescript
// .env.development
VITE_APP_NAME=Soybean Admin
VITE_SERVICE_BASE_URL=http://localhost:9528
VITE_OTHER_SERVICE_BASE_URL={"lowcode":"http://localhost:3000","amis":"http://localhost:9522"}
VITE_HTTP_PROXY=Y
VITE_ROUTER_HISTORY_MODE=history
VITE_ROUTE_HOME=/dashboard

# JWT配置
VITE_JWT_STORAGE_KEY=token
VITE_REFRESH_TOKEN_KEY=refreshToken

# 低代码配置
VITE_DESIGNER_URL=http://localhost:3001
VITE_ENABLE_DESIGNER=Y
VITE_DEFAULT_PAGE_TYPE=amis
```

#### API服务配置

```typescript
// src/service/api/unified-api.ts
import { envConfig } from '@/utils/env-config';

class UnifiedApiService {
  // 主后端服务
  user = {
    login: (data: LoginData) => this.request.post('/auth/login', data),
    getUserInfo: () => this.request.get('/auth/user-info'),
    logout: () => this.request.post('/auth/logout'),
  };

  // 低代码平台服务
  entityDesigner = {
    createCanvas: (data: CreateCanvasData) =>
      this.lowcodeRequest.post('/entity-designer/canvas', data),
    getCanvas: (id: string) =>
      this.lowcodeRequest.get(`/entity-designer/canvas/${id}`),
    updateCanvas: (id: string, data: UpdateCanvasData) =>
      this.lowcodeRequest.put(`/entity-designer/canvas/${id}`, data),
  };

  // Amis后端服务
  amisPage = {
    getPageConfig: (pageId: string) =>
      this.amisRequest.get(`/pages/${pageId}`),
    savePageConfig: (pageId: string, config: any) =>
      this.amisRequest.post(`/pages/${pageId}`, config),
  };

  private get request() {
    return this.createRequest(envConfig.getServiceConfig('backend'));
  }

  private get lowcodeRequest() {
    return this.createRequest(envConfig.getServiceConfig('lowcode'));
  }

  private get amisRequest() {
    return this.createRequest(envConfig.getServiceConfig('amis'));
  }
}

export const unifiedApi = new UnifiedApiService();
```

#### 路由配置

```typescript
// src/router/modules/lowcode-routes.ts
import { envConfig } from '@/utils/env-config';

export const lowcodeRoutes = {
  name: 'lowcode',
  path: '/lowcode',
  component: () => import('@/layouts/base-layout/index.vue'),
  children: [
    {
      name: 'entity-designer',
      path: '/lowcode/entity-designer',
      component: () => import('@/views/lowcode/entity-designer.vue'),
      meta: {
        title: '实体设计器',
        requiresAuth: true,
        permissions: ['lowcode:design'],
      },
    },
    {
      name: 'template-manager',
      path: '/lowcode/template-manager',
      component: () => import('@/views/lowcode/template-manager.vue'),
      meta: {
        title: '模板管理',
        requiresAuth: true,
        permissions: ['lowcode:template'],
      },
    },
    {
      name: 'code-generation',
      path: '/lowcode/code-generation',
      component: () => import('@/views/lowcode/code-generation.vue'),
      meta: {
        title: '代码生成',
        requiresAuth: true,
        permissions: ['lowcode:generate'],
      },
    },
  ],
};
```

---

## 🚀 运维指南

### 部署架构

#### 生产环境部署

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 主后端服务
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${BACKEND_PORT}:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 低代码平台服务
  lowcode:
    build:
      context: .
      dockerfile: Dockerfile.lowcode
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${LOWCODE_PORT}:3000"
    restart: unless-stopped

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - lowcode
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Nginx配置

```nginx
# nginx/nginx.conf
upstream backend {
    server backend:3000;
}

upstream lowcode {
    server lowcode:3000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    # 前端静态资源
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 主后端API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 低代码平台API
    location /lowcode-api/ {
        rewrite ^/lowcode-api/(.*) /api/$1 break;
        proxy_pass http://lowcode;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```