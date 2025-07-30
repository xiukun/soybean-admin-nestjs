# API 接口文档模板

## 概述

本文档提供了 SoybeanAdmin NestJS 低代码平台各个服务的 API 接口详细说明。平台采用 RESTful API 设计规范，支持 JSON 数据格式，使用 JWT 进行身份认证。

## 服务架构

### API 服务端点

| 服务名称 | 端口 | 基础路径 | 描述 |
|---------|------|----------|------|
| Backend | 9528 | `/api` | 主后端服务API |
| Amis Backend | 9522 | `/api/v1` | Amis低代码后端API |
| Lowcode Platform | 3000 | `/api/v1` | 低代码平台核心API |

### 环境地址

| 环境 | Backend | Amis Backend | Lowcode Platform |
|------|---------|--------------|------------------|
| 开发环境 | http://localhost:9528 | http://localhost:9522 | http://localhost:3000 |
| 测试环境 | https://test-api.example.com | https://test-amis.example.com | https://test-lowcode.example.com |
| 生产环境 | https://api.example.com | https://amis.example.com | https://lowcode.example.com |

## 通用规范

### 请求格式

#### HTTP 方法
- `GET`: 获取资源
- `POST`: 创建资源
- `PUT`: 更新资源（完整更新）
- `PATCH`: 更新资源（部分更新）
- `DELETE`: 删除资源

#### 请求头
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
Accept: application/json
User-Agent: SoybeanAdmin/1.0.0
```

#### 请求体格式
```json
{
  "data": {
    // 请求数据
  },
  "meta": {
    // 元数据（可选）
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

### 响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 响应数据
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid",
    "version": "1.0.0"
  }
}
```

#### 分页响应
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      // 数据列表
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

### 状态码说明

| 状态码 | 说明 | 描述 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 请求成功，无返回内容 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权，需要登录 |
| 403 | Forbidden | 禁止访问，权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 请求格式正确，但语义错误 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

## Backend API (主后端服务)

### 基础信息
- **基础URL**: `/api`
- **版本**: v1.0.0
- **认证方式**: JWT Bearer Token

### 1. 认证授权

#### 1.1 用户登录
```http
POST /api/auth/login
```

**请求参数:**
```json
{
  "username": "admin",
  "password": "123456",
  "captcha": "1234",
  "captchaId": "uuid"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "roles": ["admin"],
      "permissions": ["user:read", "user:write"]
    },
    "expiresIn": 604800
  }
}
```

#### 1.2 刷新Token
```http
POST /api/auth/refresh
```

**请求参数:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 1.3 用户登出
```http
POST /api/auth/logout
```

**请求头:**
```http
Authorization: Bearer <JWT_TOKEN>
```

#### 1.4 获取用户信息
```http
GET /api/auth/user-info
```

**请求头:**
```http
Authorization: Bearer <JWT_TOKEN>
```

### 2. 用户管理

#### 2.1 获取用户列表
```http
GET /api/users
```

**查询参数:**
```
?page=1&pageSize=10&search=admin&status=active&role=admin
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": "1",
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "avatar": "https://example.com/avatar.jpg",
        "status": "active",
        "roles": ["admin"],
        "lastLoginAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### 2.2 创建用户
```http
POST /api/users
```

**请求参数:**
```json
{
  "username": "newuser",
  "password": "123456",
  "nickname": "新用户",
  "email": "newuser@example.com",
  "phone": "13800138001",
  "roles": ["user"],
  "status": "active"
}
```

#### 2.3 获取用户详情
```http
GET /api/users/{id}
```

#### 2.4 更新用户
```http
PUT /api/users/{id}
```

**请求参数:**
```json
{
  "nickname": "更新的昵称",
  "email": "updated@example.com",
  "phone": "13800138002",
  "status": "active"
}
```

#### 2.5 删除用户
```http
DELETE /api/users/{id}
```

### 3. 角色权限管理

#### 3.1 获取角色列表
```http
GET /api/roles
```

#### 3.2 创建角色
```http
POST /api/roles
```

**请求参数:**
```json
{
  "name": "editor",
  "displayName": "编辑者",
  "description": "内容编辑权限",
  "permissions": ["content:read", "content:write"],
  "status": "active"
}
```

#### 3.3 获取权限列表
```http
GET /api/permissions
```

#### 3.4 分配角色权限
```http
PUT /api/roles/{id}/permissions
```

**请求参数:**
```json
{
  "permissions": ["user:read", "user:write", "content:read"]
}
```

### 4. 系统管理

#### 4.1 获取系统配置
```http
GET /api/system/config
```

#### 4.2 更新系统配置
```http
PUT /api/system/config
```

#### 4.3 获取系统状态
```http
GET /api/system/status
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "connections": 5,
      "maxConnections": 100
    },
    "redis": {
      "status": "connected",
      "memory": "10MB",
      "keys": 150
    },
    "services": {
      "amis-backend": "healthy",
      "lowcode-platform": "healthy"
    }
  }
}
```

## Amis Backend API (Amis低代码后端)

### 基础信息
- **基础URL**: `/api/v1`
- **版本**: v1.0.0
- **认证方式**: JWT Bearer Token

### 1. 页面管理

#### 1.1 获取页面列表
```http
GET /api/v1/pages
```

**查询参数:**
```
?page=1&pageSize=10&search=dashboard&type=page&status=published
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": "1",
        "title": "仪表盘",
        "path": "/dashboard",
        "type": "page",
        "status": "published",
        "schema": {
          "type": "page",
          "title": "仪表盘",
          "body": [
            {
              "type": "grid",
              "columns": [
                {
                  "type": "card",
                  "header": {
                    "title": "用户统计"
                  },
                  "body": "用户总数: 1000"
                }
              ]
            }
          ]
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 1.2 创建页面
```http
POST /api/v1/pages
```

**请求参数:**
```json
{
  "title": "新页面",
  "path": "/new-page",
  "type": "page",
  "schema": {
    "type": "page",
    "title": "新页面",
    "body": []
  },
  "status": "draft"
}
```

#### 1.3 获取页面详情
```http
GET /api/v1/pages/{id}
```

#### 1.4 更新页面
```http
PUT /api/v1/pages/{id}
```

#### 1.5 删除页面
```http
DELETE /api/v1/pages/{id}
```

#### 1.6 发布页面
```http
POST /api/v1/pages/{id}/publish
```

#### 1.7 预览页面
```http
GET /api/v1/pages/{id}/preview
```

### 2. 组件管理

#### 2.1 获取组件库
```http
GET /api/v1/components
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "categories": [
      {
        "name": "基础组件",
        "key": "basic",
        "components": [
          {
            "type": "input-text",
            "name": "文本输入",
            "icon": "fa fa-input",
            "description": "文本输入框",
            "schema": {
              "type": "input-text",
              "label": "文本输入",
              "name": "text"
            },
            "preview": "https://example.com/preview/input-text.png"
          }
        ]
      }
    ]
  }
}
```

#### 2.2 获取组件详情
```http
GET /api/v1/components/{type}
```

### 3. 数据源管理

#### 3.1 获取数据源列表
```http
GET /api/v1/datasources
```

#### 3.2 创建数据源
```http
POST /api/v1/datasources
```

**请求参数:**
```json
{
  "name": "用户数据源",
  "type": "api",
  "config": {
    "url": "/api/users",
    "method": "GET",
    "headers": {},
    "params": {}
  },
  "description": "获取用户列表数据"
}
```

#### 3.3 测试数据源
```http
POST /api/v1/datasources/{id}/test
```

### 4. 模板管理

#### 4.1 获取模板列表
```http
GET /api/v1/templates
```

#### 4.2 创建模板
```http
POST /api/v1/templates
```

**请求参数:**
```json
{
  "name": "用户管理模板",
  "category": "admin",
  "schema": {
    "type": "page",
    "title": "用户管理",
    "body": [
      {
        "type": "crud",
        "api": "/api/users",
        "columns": [
          {
            "name": "username",
            "label": "用户名"
          }
        ]
      }
    ]
  },
  "preview": "https://example.com/preview/user-template.png",
  "tags": ["用户", "管理", "CRUD"]
}
```

## Lowcode Platform API (低代码平台核心)

### 基础信息
- **基础URL**: `/api/v1`
- **版本**: v1.0.0
- **认证方式**: JWT Bearer Token

### 1. 项目管理

#### 1.1 获取项目列表
```http
GET /api/v1/projects
```

**查询参数:**
```
?page=1&pageSize=10&search=项目名称&status=active
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": "proj_001",
        "name": "电商管理系统",
        "code": "ecommerce_admin",
        "description": "电商后台管理系统",
        "version": "1.0.0",
        "status": "active",
        "deploymentStatus": "deployed",
        "deploymentPort": 8001,
        "lastDeployedAt": "2024-01-01T10:00:00Z",
        "entityCount": 5,
        "apiCount": 20,
        "relationCount": 8,
        "createdBy": "admin",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 1.2 创建项目
```http
POST /api/v1/projects
```

**请求参数:**
```json
{
  "name": "新项目",
  "code": "new_project",
  "description": "项目描述",
  "version": "1.0.0",
  "config": {
    "database": {
      "type": "postgresql",
      "schema": "public"
    },
    "api": {
      "prefix": "/api/v1",
      "version": "1.0.0"
    }
  }
}
```

#### 1.3 获取项目详情
```http
GET /api/v1/projects/{id}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "proj_001",
    "name": "电商管理系统",
    "code": "ecommerce_admin",
    "description": "电商后台管理系统",
    "version": "1.0.0",
    "status": "active",
    "config": {},
    "entities": [
      {
        "id": "entity_001",
        "name": "用户",
        "code": "user",
        "tableName": "lowcode_user",
        "fieldCount": 8,
        "relationCount": 3
      }
    ],
    "relations": [
      {
        "id": "rel_001",
        "name": "用户-订单关系",
        "type": "ONE_TO_MANY",
        "sourceEntity": {
          "id": "entity_001",
          "name": "用户"
        },
        "targetEntity": {
          "id": "entity_002",
          "name": "订单"
        }
      }
    ],
    "apis": [
      {
        "id": "api_001",
        "name": "获取用户列表",
        "method": "GET",
        "path": "/api/v1/users",
        "status": "published"
      }
    ],
    "deployments": [
      {
        "id": "deploy_001",
        "version": "1.0.0",
        "status": "deployed",
        "port": 8001,
        "deployedAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

#### 1.4 更新项目
```http
PUT /api/v1/projects/{id}
```

#### 1.5 删除项目
```http
DELETE /api/v1/projects/{id}
```

### 2. 实体管理

#### 2.1 获取实体列表
```http
GET /api/v1/projects/{projectId}/entities
```

**查询参数:**
```
?page=1&pageSize=10&search=用户&category=business&status=published
```

#### 2.2 创建实体
```http
POST /api/v1/projects/{projectId}/entities
```

**请求参数:**
```json
{
  "name": "用户",
  "code": "user",
  "description": "系统用户实体",
  "category": "business",
  "fields": [
    {
      "name": "用户名",
      "code": "username",
      "type": "VARCHAR",
      "length": 50,
      "nullable": false,
      "required": true,
      "uniqueConstraint": true,
      "comment": "用户登录名"
    },
    {
      "name": "邮箱",
      "code": "email",
      "type": "VARCHAR",
      "length": 100,
      "nullable": false,
      "required": true,
      "uniqueConstraint": true,
      "comment": "用户邮箱地址"
    }
  ]
}
```

#### 2.3 获取实体详情
```http
GET /api/v1/entities/{id}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "entity_001",
    "projectId": "proj_001",
    "name": "用户",
    "code": "user",
    "tableName": "lowcode_user",
    "description": "系统用户实体",
    "category": "business",
    "status": "published",
    "version": "1.0.0",
    "diagramPosition": {
      "x": 100,
      "y": 200
    },
    "fields": [
      {
        "id": "field_001",
        "name": "ID",
        "code": "id",
        "type": "VARCHAR",
        "length": 36,
        "nullable": false,
        "required": true,
        "primaryKey": true,
        "sortOrder": 0,
        "comment": "主键ID"
      },
      {
        "id": "field_002",
        "name": "用户名",
        "code": "username",
        "type": "VARCHAR",
        "length": 50,
        "nullable": false,
        "required": true,
        "uniqueConstraint": true,
        "sortOrder": 1,
        "comment": "用户登录名"
      }
    ],
    "sourceRelations": [
      {
        "id": "rel_001",
        "name": "用户-订单关系",
        "type": "ONE_TO_MANY",
        "targetEntity": {
          "id": "entity_002",
          "name": "订单"
        }
      }
    ],
    "targetRelations": [],
    "apis": [
      {
        "id": "api_001",
        "name": "获取用户列表",
        "method": "GET",
        "path": "/api/v1/users"
      }
    ]
  }
}
```

#### 2.4 更新实体
```http
PUT /api/v1/entities/{id}
```

#### 2.5 删除实体
```http
DELETE /api/v1/entities/{id}
```

### 3. 字段管理

#### 3.1 获取字段列表
```http
GET /api/v1/entities/{entityId}/fields
```

#### 3.2 添加字段
```http
POST /api/v1/entities/{entityId}/fields
```

**请求参数:**
```json
{
  "name": "手机号",
  "code": "phone",
  "type": "VARCHAR",
  "length": 20,
  "nullable": true,
  "required": false,
  "uniqueConstraint": false,
  "indexed": true,
  "defaultValue": "",
  "validationRules": {
    "pattern": "^1[3-9]\\d{9}$",
    "message": "请输入正确的手机号码"
  },
  "comment": "用户手机号码",
  "sortOrder": 10
}
```

#### 3.3 更新字段
```http
PUT /api/v1/fields/{id}
```

#### 3.4 删除字段
```http
DELETE /api/v1/fields/{id}
```

#### 3.5 批量更新字段排序
```http
PUT /api/v1/entities/{entityId}/fields/order
```

**请求参数:**
```json
{
  "fieldsOrder": [
    {
      "fieldId": "field_001",
      "sortOrder": 0
    },
    {
      "fieldId": "field_002",
      "sortOrder": 1
    }
  ]
}
```

### 4. 关系管理

#### 4.1 获取关系列表
```http
GET /api/v1/projects/{projectId}/relations
```

#### 4.2 创建关系
```http
POST /api/v1/projects/{projectId}/relations
```

**请求参数:**
```json
{
  "name": "用户-订单关系",
  "code": "user_order_relation",
  "description": "用户与订单的一对多关系",
  "type": "ONE_TO_MANY",
  "sourceEntityId": "entity_001",
  "targetEntityId": "entity_002",
  "foreignKeyName": "user_id",
  "onDelete": "CASCADE",
  "onUpdate": "CASCADE",
  "indexed": true
}
```

#### 4.3 获取实体关系图
```http
GET /api/v1/projects/{projectId}/diagram
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "entities": [
      {
        "id": "entity_001",
        "name": "用户",
        "code": "user",
        "tableName": "lowcode_user",
        "position": {
          "x": 100,
          "y": 200
        },
        "fields": [
          {
            "id": "field_001",
            "name": "ID",
            "code": "id",
            "type": "VARCHAR",
            "primaryKey": true,
            "nullable": false,
            "unique": false
          }
        ]
      }
    ],
    "relations": [
      {
        "id": "rel_001",
        "name": "用户-订单关系",
        "type": "ONE_TO_MANY",
        "sourceEntity": {
          "id": "entity_001",
          "name": "用户",
          "code": "user"
        },
        "targetEntity": {
          "id": "entity_002",
          "name": "订单",
          "code": "order"
        },
        "sourceField": {
          "id": "field_001",
          "name": "ID",
          "code": "id"
        },
        "targetField": {
          "id": "field_010",
          "name": "用户ID",
          "code": "user_id"
        }
      }
    ]
  }
}
```

#### 4.4 更新实体位置
```http
PUT /api/v1/entities/{id}/position
```

**请求参数:**
```json
{
  "x": 150,
  "y": 250
}
```

### 5. API 管理

#### 5.1 获取API列表
```http
GET /api/v1/projects/{projectId}/apis
```

#### 5.2 为实体生成标准CRUD API
```http
POST /api/v1/entities/{entityId}/generate-apis
```

**请求参数:**
```json
{
  "apis": ["create", "read", "update", "delete", "list"],
  "options": {
    "enablePagination": true,
    "enableSearch": true,
    "enableFilters": true,
    "enableSorting": true
  }
}
```

#### 5.3 创建自定义API
```http
POST /api/v1/projects/{projectId}/apis
```

**请求参数:**
```json
{
  "name": "获取用户统计",
  "code": "get_user_stats",
  "method": "GET",
  "path": "/api/v1/users/stats",
  "description": "获取用户统计信息",
  "entityId": "entity_001",
  "requestConfig": {
    "parameters": [
      {
        "name": "startDate",
        "type": "string",
        "required": false,
        "description": "开始日期"
      }
    ]
  },