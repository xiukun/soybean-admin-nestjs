# API参考文档

## lowcode-platform-backend API

**基础URL**: `http://localhost:3003`  
**API版本**: v1  
**认证**: JWT Bearer Token

### 健康检查

#### GET /health
获取服务健康状态

**响应示例**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### 项目管理

#### GET /api/v1/projects/paginated
获取分页项目列表

**查询参数**:
- `current` (number): 当前页码，默认1
- `size` (number): 每页大小，默认10

**响应示例**:
```json
{
  "data": [
    {
      "id": "demo-project-1",
      "name": "演示项目",
      "description": "这是一个演示项目",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "current": 1,
  "size": 10
}
```

#### GET /api/v1/projects/:id
根据ID获取项目详情

**路径参数**:
- `id` (string): 项目ID

**响应示例**:
```json
{
  "data": {
    "id": "demo-project-1",
    "name": "演示项目",
    "description": "这是一个演示项目",
    "config": {
      "framework": "nestjs",
      "architecture": "base-biz"
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/v1/projects
创建新项目

**请求体**:
```json
{
  "name": "新项目",
  "description": "项目描述",
  "config": {
    "framework": "nestjs",
    "architecture": "base-biz"
  }
}
```

### 实体管理

#### GET /api/v1/entities/paginated
获取分页实体列表

**查询参数**:
- `current` (number): 当前页码
- `size` (number): 每页大小
- `projectId` (string, 可选): 项目ID过滤

**响应示例**:
```json
{
  "data": [
    {
      "id": "demo-entity-user",
      "projectId": "demo-project-1",
      "name": "用户",
      "code": "User",
      "fields": [
        {
          "name": "id",
          "type": "INTEGER",
          "primaryKey": true
        },
        {
          "name": "username",
          "type": "STRING",
          "required": true
        }
      ]
    }
  ],
  "total": 1,
  "current": 1,
  "size": 10
}
```

#### GET /api/v1/entities/:id
根据ID获取实体详情

**响应示例**:
```json
{
  "data": {
    "id": "demo-entity-user",
    "projectId": "demo-project-1",
    "name": "用户",
    "code": "User",
    "tableName": "demo_users",
    "fields": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true
      },
      {
        "name": "username",
        "type": "STRING",
        "required": true,
        "unique": true
      },
      {
        "name": "email",
        "type": "STRING",
        "required": true
      }
    ],
    "relationships": []
  }
}
```

### 代码模板管理

#### GET /api/v1/code-templates/paginated
获取分页代码模板列表

**查询参数**:
- `current` (number): 当前页码
- `size` (number): 每页大小
- `type` (string, 可选): 模板类型过滤
- `framework` (string, 可选): 框架过滤

**响应示例**:
```json
{
  "data": [
    {
      "id": "tpl-nestjs-entity-model",
      "name": "NestJS实体模型模板",
      "type": "entity_model",
      "framework": "nestjs",
      "description": "生成NestJS实体模型代码"
    }
  ],
  "total": 1,
  "current": 1,
  "size": 10
}
```

#### GET /api/v1/code-templates/:id
根据ID获取代码模板详情

**响应示例**:
```json
{
  "data": {
    "id": "tpl-nestjs-entity-model",
    "name": "NestJS实体模型模板",
    "type": "entity_model",
    "framework": "nestjs",
    "content": "// Template content here...",
    "variables": [
      {
        "name": "entityName",
        "type": "string",
        "required": true,
        "description": "实体名称"
      }
    ]
  }
}
```

### 代码生成

#### POST /api/v1/code-generation/generate
生成代码

**请求体**:
```json
{
  "projectId": "demo-project-1",
  "templateIds": ["tpl-nestjs-entity-model"],
  "entityIds": ["demo-entity-user"],
  "variables": {
    "customVariable": "value"
  },
  "options": {
    "overwriteExisting": true,
    "generateTests": false,
    "generateDocs": false,
    "architecture": "base-biz",
    "framework": "nestjs"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "generatedFiles": [
    {
      "path": "src/entities/user.entity.ts",
      "content": "// Generated code...",
      "size": 1024
    }
  ],
  "summary": {
    "totalFiles": 1,
    "totalSize": 1024,
    "duration": 150
  }
}
```

#### POST /api/v1/code-generation/validate
验证代码生成请求

**请求体**:
```json
{
  "projectId": "demo-project-1",
  "templateIds": ["tpl-nestjs-entity-model"],
  "entityIds": ["demo-entity-user"],
  "variables": {}
}
```

**响应示例**:
```json
{
  "valid": true,
  "issues": [],
  "warnings": [
    {
      "type": "missing_variable",
      "message": "建议提供customVariable变量"
    }
  ]
}
```

### 页面管理

#### GET /api/v1/pages/paginated
获取分页页面列表

**查询参数**:
- `current` (number): 当前页码
- `size` (number): 每页大小
- `projectId` (string, 可选): 项目ID过滤

#### GET /api/v1/pages/:id
根据ID获取页面详情

#### POST /api/v1/pages
创建新页面

**请求体**:
```json
{
  "projectId": "demo-project-1",
  "name": "用户管理页面",
  "path": "/users",
  "config": {
    "title": "用户管理",
    "permissions": ["user:read"]
  },
  "amisSchema": {
    "type": "page",
    "title": "用户管理",
    "body": []
  }
}
```

---

## amis-lowcode-backend API

**基础URL**: `http://localhost:9522`  
**API版本**: v1  
**认证**: JWT Bearer Token

### 健康检查

#### GET /api/v1
获取API基本信息

**响应示例**:
```json
{
  "message": "Amis Lowcode Backend API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/v1/health
获取服务健康状态

**响应示例**:
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "latency": 5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 用户管理

#### GET /api/v1/users
获取分页用户列表

**查询参数**:
- `page` (number): 页码，默认1
- `pageSize` (number): 每页大小，默认10
- `search` (string, 可选): 搜索关键词
- `status` (string, 可选): 状态过滤

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "nickname": "管理员",
        "avatar": null,
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

#### GET /api/v1/users/:id
根据ID获取用户详情

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "avatar": null,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/v1/users
创建新用户

**请求体**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "nickname": "新用户",
  "status": "active"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "nickname": "新用户",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/v1/users/:id
更新用户信息

**请求体**:
```json
{
  "nickname": "更新的昵称",
  "status": "inactive"
}
```

#### DELETE /api/v1/users/:id
删除用户

**响应示例**:
```json
{
  "status": 0,
  "msg": "success"
}
```

### 角色管理

#### GET /api/v1/roles
获取分页角色列表

**查询参数**:
- `page` (number): 页码
- `pageSize` (number): 每页大小

#### POST /api/v1/roles
创建新角色

**请求体**:
```json
{
  "name": "编辑者",
  "code": "editor",
  "description": "内容编辑角色",
  "permissions": ["content:read", "content:write"],
  "status": "active"
}
```

## 错误码说明

### 通用错误码
- `0`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

### 业务错误码
- `1001`: 用户不存在
- `1002`: 用户名已存在
- `1003`: 邮箱已存在
- `2001`: 项目不存在
- `2002`: 实体不存在
- `3001`: 模板不存在
- `3002`: 代码生成失败
