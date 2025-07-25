# API 参考文档

## 📋 目录

1. [认证API](#认证api)
2. [用户管理API](#用户管理api)
3. [实体设计器API](#实体设计器api)
4. [代码生成API](#代码生成api)
5. [模板管理API](#模板管理api)
6. [性能监控API](#性能监控api)
7. [系统管理API](#系统管理api)

---

## 🔐 认证API

### 基础信息
- **Base URL**: `http://localhost:9528/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

### 用户登录

```http
POST /auth/login
```

**请求体**:
```json
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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresAt": "2024-01-15T12:30:00Z",
    "refreshTokenExpiresAt": "2024-01-22T10:30:00Z",
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "roles": ["admin"],
      "permissions": ["user:read", "user:write", "system:admin"]
    }
  }
}
```

### 刷新令牌

```http
POST /auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 获取用户信息

```http
GET /auth/user-info
Authorization: Bearer {accessToken}
```

### 用户登出

```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

---

## 👥 用户管理API

### 获取用户列表

```http
GET /users?page=1&limit=10&search=admin
Authorization: Bearer {accessToken}
```

**查询参数**:
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 10）
- `search`: 搜索关键词
- `role`: 角色筛选
- `status`: 状态筛选

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "users": [
      {
        "id": "user_123",
        "username": "admin",
        "email": "admin@example.com",
        "roles": ["admin"],
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 创建用户

```http
POST /users
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "roles": ["user"],
  "status": "active"
}
```

### 更新用户

```http
PUT /users/{userId}
Authorization: Bearer {accessToken}
```

### 删除用户

```http
DELETE /users/{userId}
Authorization: Bearer {accessToken}
```

---

## 🎨 实体设计器API

### 基础信息
- **Base URL**: `http://localhost:3000/api`
- **认证**: 需要JWT认证

### 创建画布

```http
POST /entity-designer/canvas
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "name": "用户管理系统",
  "description": "用户相关实体设计",
  "projectId": "project_123"
}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "canvasId": "canvas_1234567890_abc123",
    "name": "用户管理系统",
    "projectId": "project_123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 获取画布详情

```http
GET /entity-designer/canvas/{canvasId}
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "id": "canvas_123",
    "name": "用户管理系统",
    "description": "用户相关实体设计",
    "canvasData": {
      "entities": [
        {
          "id": "entity_1",
          "code": "user",
          "name": "User",
          "description": "用户实体",
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
            }
          ],
          "position": { "x": 100, "y": 100 },
          "size": { "width": 200, "height": 150 }
        }
      ],
      "relationships": [
        {
          "id": "rel_1",
          "sourceEntityId": "entity_1",
          "targetEntityId": "entity_2",
          "sourceField": "id",
          "targetField": "userId",
          "type": "oneToMany",
          "name": "用户订单关系"
        }
      ],
      "config": {
        "size": { "width": 2000, "height": 1500 },
        "zoom": 1,
        "viewport": { "x": 0, "y": 0 },
        "grid": {
          "enabled": true,
          "size": 20,
          "color": "#f0f0f0"
        }
      }
    },
    "version": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 更新画布

```http
PUT /entity-designer/canvas/{canvasId}
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "entities": [...],
  "relationships": [...],
  "config": {...}
}
```

### 验证实体设计

```http
POST /entity-designer/canvas/{canvasId}/validate
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
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
        "entityId": "entity_123",
        "suggestion": "建议至少定义一个字段"
      }
    ]
  }
}
```

### 从画布生成代码

```http
POST /entity-designer/canvas/{canvasId}/generate-code
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "taskName": "用户管理系统代码生成",
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

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "taskId": "task_1234567890_abc123",
    "canvasId": "canvas_123",
    "entitiesCount": 3,
    "message": "代码生成任务创建成功"
  }
}
```

---

## 🏗️ 代码生成API

### 创建代码生成任务

```http
POST /code-generation/layered/tasks
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "name": "用户管理系统",
  "entities": [
    {
      "code": "user",
      "name": "User",
      "description": "用户实体",
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

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "taskId": "task_1234567890_abc123"
  }
}
```

### 获取任务状态

```http
GET /code-generation/layered/tasks/{taskId}
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "id": "task_1234567890_abc123",
    "name": "用户管理系统",
    "status": "completed",
    "progress": 100,
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": "2024-01-15T10:32:15Z",
    "filesCount": 24,
    "createdAt": "2024-01-15T10:29:45Z"
  }
}
```

### 获取任务文件列表

```http
GET /code-generation/layered/tasks/{taskId}/files
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "files": [
      {
        "filePath": "user-management/base/controllers/user.base.controller.ts",
        "type": "controller",
        "layer": "base",
        "editable": false,
        "dependencies": [
          "user-management/base/services/user.base.service.ts",
          "user-management/base/dto/user.dto.ts"
        ],
        "metadata": {
          "entity": "user",
          "generated": true,
          "warning": "此文件由代码生成器自动生成，请勿手动修改"
        }
      }
    ]
  }
}
```

### 获取生成统计

```http
GET /code-generation/layered/statistics
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "totalTasks": 15,
    "successfulTasks": 13,
    "failedTasks": 2,
    "totalFiles": 324,
    "averageGenerationTime": 125500,
    "recentTasks": [...]
  }
}
```

---

## 📝 模板管理API

### 获取模板列表

```http
GET /templates?page=1&limit=10&type=controller&language=typescript
Authorization: Bearer {accessToken}
```

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `type`: 模板类型（controller, service, repository, dto, entity）
- `language`: 编程语言（typescript, javascript）
- `framework`: 框架（nestjs, express）

### 创建模板

```http
POST /templates
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "name": "NestJS Controller模板",
  "type": "controller",
  "language": "typescript",
  "framework": "nestjs",
  "template": "import { Controller, Get, Post } from '@nestjs/common';\n\n@Controller('{{kebabCase entity.name}}')\nexport class {{pascalCase entity.name}}Controller {\n  // Controller implementation\n}",
  "description": "标准的NestJS控制器模板",
  "variables": ["entity"],
  "helpers": ["kebabCase", "pascalCase"]
}
```

### 验证模板

```http
POST /templates/{templateId}/validate
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      {
        "type": "performance",
        "code": "NESTED_LOOPS",
        "message": "检测到嵌套循环，可能影响性能",
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
}
```

### 测试模板

```http
POST /templates/{templateId}/test
Authorization: Bearer {accessToken}
```

**请求体**:
```json
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

---

## 📊 性能监控API

### 获取系统资源使用情况

```http
GET /performance/system/resources
Authorization: Bearer {accessToken}
```

**响应**:
```json
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

### 获取性能统计

```http
GET /performance/stats
Authorization: Bearer {accessToken}
```

### 健康检查

```http
GET /performance/health
```

**响应**:
```json
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

### 获取Prometheus指标

```http
GET /performance/metrics
```

**响应** (Prometheus格式):
```
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

## ⚙️ 系统管理API

### 获取系统信息

```http
GET /system/info
Authorization: Bearer {accessToken}
```

### 系统配置

```http
GET /system/config
Authorization: Bearer {accessToken}

PUT /system/config
Authorization: Bearer {accessToken}
```

### 数据库状态

```http
GET /system/database/status
Authorization: Bearer {accessToken}
```

---

## 📋 错误代码

### HTTP状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突
- `422`: 数据验证失败
- `500`: 服务器内部错误

### 业务错误代码

- `1001`: 用户名或密码错误
- `1002`: 令牌已过期
- `1003`: 令牌无效
- `1004`: 权限不足
- `2001`: 实体不存在
- `2002`: 实体名称重复
- `2003`: 字段验证失败
- `3001`: 模板语法错误
- `3002`: 模板变量缺失
- `4001`: 代码生成失败
- `4002`: 任务不存在

---

## 📞 技术支持

如有API使用问题，请参考：
- [用户手册](user-manual.md)
- [GitHub Issues](https://github.com/your-org/soybean-admin-nestjs/issues)
- [在线文档](https://docs.soybean-admin.com)
