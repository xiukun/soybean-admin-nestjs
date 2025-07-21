# 低代码平台 API 文档

本文档描述了低代码平台的 REST API 接口，包括认证、项目管理、实体管理、模板管理和代码生成等功能。

## 基础信息

- **Base URL**: `https://api.lowcode-platform.com`
- **API Version**: `v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)

## 认证

### 登录
获取访问令牌以调用其他 API。

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "user-id",
      "username": "your-username",
      "email": "user@example.com",
      "roles": ["user"]
    }
  }
}
```

### 刷新令牌
使用刷新令牌获取新的访问令牌。

```http
POST /api/v1/auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh-token>

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 登出
注销当前会话。

```http
POST /api/v1/auth/logout
Authorization: Bearer <access-token>
```

## 项目管理

### 获取项目列表
获取用户有权限访问的项目列表。

```http
GET /api/v1/projects?current=1&size=10&search=keyword
Authorization: Bearer <access-token>
```

**查询参数**:
- `current` (可选): 页码，默认为 1
- `size` (可选): 每页数量，默认为 10，最大 100
- `search` (可选): 搜索关键词
- `framework` (可选): 技术框架筛选
- `status` (可选): 项目状态筛选

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "project-id",
        "name": "电商管理系统",
        "code": "ecommerce-admin",
        "description": "电商平台的后台管理系统",
        "framework": "nestjs",
        "architecture": "ddd",
        "language": "typescript",
        "database": "postgresql",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "entityCount": 15,
        "templateCount": 8
      }
    ],
    "meta": {
      "current": 1,
      "size": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 创建项目
创建新的项目。

```http
POST /api/v1/projects
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "用户管理系统",
  "code": "user-management",
  "description": "企业用户管理系统",
  "framework": "nestjs",
  "architecture": "ddd",
  "language": "typescript",
  "database": "postgresql",
  "features": ["authentication", "authorization", "caching"],
  "settings": {
    "enableSwagger": true,
    "enableTesting": true,
    "enableDocker": true,
    "enableAudit": true,
    "enableSoftDelete": true,
    "enableVersioning": false,
    "enableTenancy": false
  }
}
```

### 获取项目详情
获取指定项目的详细信息。

```http
GET /api/v1/projects/{projectId}
Authorization: Bearer <access-token>
```

### 更新项目
更新项目信息。

```http
PUT /api/v1/projects/{projectId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "更新后的项目名称",
  "description": "更新后的项目描述",
  "settings": {
    "enableSwagger": false
  }
}
```

### 删除项目
删除指定项目（软删除）。

```http
DELETE /api/v1/projects/{projectId}
Authorization: Bearer <access-token>
```

## 实体管理

### 获取实体列表
获取项目中的实体列表。

```http
GET /api/v1/projects/{projectId}/entities?current=1&size=10
Authorization: Bearer <access-token>
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "entity-id",
        "projectId": "project-id",
        "name": "用户",
        "code": "User",
        "tableName": "users",
        "description": "系统用户实体",
        "fieldCount": 8,
        "relationshipCount": 3,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "meta": {
      "current": 1,
      "size": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### 创建实体
在项目中创建新实体。

```http
POST /api/v1/projects/{projectId}/entities
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "商品",
  "code": "Product",
  "tableName": "products",
  "description": "商品信息实体",
  "fields": [
    {
      "name": "商品名称",
      "code": "name",
      "type": "STRING",
      "length": 255,
      "nullable": false,
      "isUnique": false,
      "description": "商品的名称"
    },
    {
      "name": "价格",
      "code": "price",
      "type": "DECIMAL",
      "precision": 10,
      "scale": 2,
      "nullable": false,
      "description": "商品价格"
    }
  ]
}
```

### 获取实体详情
获取实体的详细信息，包括字段和关系。

```http
GET /api/v1/entities/{entityId}
Authorization: Bearer <access-token>
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "id": "entity-id",
    "projectId": "project-id",
    "name": "用户",
    "code": "User",
    "tableName": "users",
    "description": "系统用户实体",
    "fields": [
      {
        "id": "field-id",
        "name": "邮箱",
        "code": "email",
        "type": "STRING",
        "length": 255,
        "nullable": false,
        "isUnique": true,
        "isPrimaryKey": false,
        "isSystemField": false,
        "description": "用户邮箱地址",
        "sortOrder": 1
      }
    ],
    "relationships": [
      {
        "id": "relationship-id",
        "relationshipName": "profile",
        "relationType": "oneToOne",
        "targetEntityId": "profile-entity-id",
        "targetEntityName": "UserProfile",
        "isRequired": false,
        "description": "用户资料"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新实体
更新实体信息。

```http
PUT /api/v1/entities/{entityId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "更新后的实体名称",
  "description": "更新后的描述"
}
```

### 删除实体
删除指定实体。

```http
DELETE /api/v1/entities/{entityId}
Authorization: Bearer <access-token>
```

## 字段管理

### 添加字段
为实体添加新字段。

```http
POST /api/v1/entities/{entityId}/fields
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "手机号",
  "code": "phone",
  "type": "STRING",
  "length": 20,
  "nullable": true,
  "isUnique": false,
  "description": "用户手机号码",
  "validationRules": {
    "pattern": "^1[3-9]\\d{9}$",
    "message": "请输入有效的手机号码"
  }
}
```

### 更新字段
更新字段信息。

```http
PUT /api/v1/fields/{fieldId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "更新后的字段名称",
  "nullable": false,
  "description": "更新后的描述"
}
```

### 删除字段
删除指定字段。

```http
DELETE /api/v1/fields/{fieldId}
Authorization: Bearer <access-token>
```

## 关系管理

### 添加关系
为实体添加关系。

```http
POST /api/v1/entities/{entityId}/relationships
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "relationshipName": "orders",
  "relationType": "oneToMany",
  "targetEntityId": "order-entity-id",
  "isRequired": false,
  "description": "用户的订单列表"
}
```

### 更新关系
更新关系信息。

```http
PUT /api/v1/relationships/{relationshipId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "relationshipName": "更新后的关系名称",
  "isRequired": true,
  "description": "更新后的描述"
}
```

### 删除关系
删除指定关系。

```http
DELETE /api/v1/relationships/{relationshipId}
Authorization: Bearer <access-token>
```

## 模板管理

### 获取模板列表
获取可用的模板列表。

```http
GET /api/v1/templates?framework=nestjs&category=entity&current=1&size=20
Authorization: Bearer <access-token>
```

**查询参数**:
- `framework` (可选): 技术框架筛选
- `category` (可选): 模板分类筛选
- `language` (可选): 编程语言筛选
- `status` (可选): 模板状态筛选

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "template-id",
        "name": "NestJS 实体模板",
        "category": "entity",
        "language": "typescript",
        "framework": "nestjs",
        "version": "1.2.0",
        "status": "published",
        "description": "生成 TypeORM 实体类",
        "author": "系统",
        "downloadCount": 1250,
        "rating": 4.8,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "meta": {
      "current": 1,
      "size": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 获取模板详情
获取模板的详细信息。

```http
GET /api/v1/templates/{templateId}
Authorization: Bearer <access-token>
```

### 创建自定义模板
创建自定义模板。

```http
POST /api/v1/templates
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "自定义实体模板",
  "category": "entity",
  "language": "typescript",
  "framework": "nestjs",
  "description": "自定义的实体模板",
  "content": "import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';\n\n@Entity('{{tableName}}')\nexport class {{entityName}} {\n  @PrimaryGeneratedColumn('uuid')\n  id: string;\n\n{{#each fields}}\n  @Column()\n  {{code}}: {{mapTypeToTS type}};\n{{/each}}\n}",
  "variables": [
    {
      "name": "entityName",
      "type": "string",
      "required": true,
      "description": "实体类名称"
    },
    {
      "name": "tableName",
      "type": "string",
      "required": true,
      "description": "数据库表名"
    },
    {
      "name": "fields",
      "type": "array",
      "required": true,
      "description": "实体字段列表"
    }
  ]
}
```

## 代码生成

### 生成代码
根据选定的实体和模板生成代码。

```http
POST /api/v1/code-generation
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "projectId": "project-id",
  "templateIds": ["template-1", "template-2"],
  "entityIds": ["entity-1", "entity-2"],
  "outputPath": "./generated",
  "variables": {
    "packageName": "com.example.app",
    "baseUrl": "/api/v1",
    "author": "开发者姓名"
  },
  "options": {
    "architecture": "ddd",
    "framework": "nestjs",
    "overwriteExisting": false,
    "generateTests": true,
    "generateDocs": true
  }
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "taskId": "generation-task-id",
    "files": [
      {
        "name": "user.entity.ts",
        "path": "src/entities/user.entity.ts",
        "content": "import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';\n\n@Entity('users')\nexport class User {\n  @PrimaryGeneratedColumn('uuid')\n  id: string;\n\n  @Column()\n  email: string;\n\n  @Column()\n  firstName: string;\n}",
        "size": 256,
        "language": "typescript"
      }
    ],
    "structure": [
      {
        "name": "src",
        "type": "directory",
        "children": [
          {
            "name": "entities",
            "type": "directory",
            "children": [
              {
                "name": "user.entity.ts",
                "type": "file",
                "size": 256
              }
            ]
          }
        ]
      }
    ],
    "stats": {
      "totalFiles": 12,
      "totalLines": 450,
      "totalSize": 15680,
      "fileTypes": {
        "typescript": 8,
        "json": 2,
        "markdown": 2
      }
    },
    "validation": [
      {
        "type": "success",
        "title": "代码生成成功",
        "message": "所有文件生成完成，无错误"
      }
    ]
  }
}
```

### 代码预览
在生成代码前预览效果。

```http
POST /api/v1/code-generation/preview
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "projectId": "project-id",
  "templateIds": ["template-1"],
  "entityIds": ["entity-1"],
  "variables": {
    "packageName": "com.example.app"
  },
  "architecture": "ddd",
  "framework": "nestjs"
}
```

### 验证模板变量
验证模板变量的有效性。

```http
POST /api/v1/code-generation/validate
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "templateId": "template-id",
  "variables": {
    "entityName": "User",
    "tableName": "users",
    "fields": [
      {
        "name": "email",
        "type": "STRING"
      }
    ]
  }
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      {
        "type": "warning",
        "field": "tableName",
        "message": "建议使用复数形式的表名"
      }
    ],
    "suggestions": [
      {
        "field": "tableName",
        "suggestion": "users",
        "reason": "遵循数据库命名约定"
      }
    ]
  }
}
```

## 元数据聚合

### 获取项目元数据
获取项目的完整元数据信息。

```http
GET /api/v1/metadata/projects/{projectId}
Authorization: Bearer <access-token>
```

### 获取实体元数据
获取实体的元数据信息。

```http
GET /api/v1/metadata/entities/{entityId}
Authorization: Bearer <access-token>
```

## 健康检查

### 系统健康状态
检查系统的健康状态。

```http
GET /api/v1/health
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "uptime": 86400,
    "version": "1.0.0",
    "environment": "production",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 15,
        "lastChecked": "2024-01-01T00:00:00Z"
      },
      "cache": {
        "status": "healthy",
        "responseTime": 2,
        "lastChecked": "2024-01-01T00:00:00Z"
      }
    },
    "metrics": {
      "requests": {
        "total": 15420,
        "successful": 15380,
        "failed": 40,
        "averageResponseTime": 125.5
      },
      "system": {
        "memoryUsage": 65.2,
        "cpuUsage": 23.8,
        "uptime": 86400
      }
    }
  }
}
```

## 错误处理

### 错误响应格式
所有错误响应都遵循统一的格式：

```json
{
  "status": 1,
  "msg": "error",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "请求参数验证失败",
    "details": {
      "field": "email",
      "message": "邮箱格式不正确"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/projects",
    "method": "POST",
    "requestId": "req-12345"
  }
}
```

### 常见错误码
- `400 BAD_REQUEST`: 请求参数错误
- `401 UNAUTHORIZED`: 未授权访问
- `403 FORBIDDEN`: 权限不足
- `404 NOT_FOUND`: 资源不存在
- `409 CONFLICT`: 资源冲突
- `422 UNPROCESSABLE_ENTITY`: 业务逻辑错误
- `429 TOO_MANY_REQUESTS`: 请求频率过高
- `500 INTERNAL_SERVER_ERROR`: 服务器内部错误

## 速率限制

API 实施了速率限制以防止滥用：
- **普通用户**: 1000 请求/15分钟
- **高级用户**: 5000 请求/15分钟
- **企业用户**: 10000 请求/15分钟

超出限制时会返回 `429 Too Many Requests` 错误。

## SDK 和工具

### JavaScript/TypeScript SDK
```bash
npm install @lowcode-platform/sdk
```

```typescript
import { LowcodePlatformClient } from '@lowcode-platform/sdk';

const client = new LowcodePlatformClient({
  baseURL: 'https://api.lowcode-platform.com',
  token: 'your-access-token'
});

// 获取项目列表
const projects = await client.projects.list();

// 创建实体
const entity = await client.entities.create(projectId, {
  name: '用户',
  code: 'User',
  tableName: 'users'
});

// 生成代码
const result = await client.codeGeneration.generate({
  projectId,
  templateIds: ['template-1'],
  entityIds: ['entity-1']
});
```

### CLI 工具
```bash
npm install -g @lowcode-platform/cli

# 登录
lowcode login

# 创建项目
lowcode project create "我的项目" --framework nestjs

# 生成代码
lowcode generate --project my-project --templates entity,service --entities User,Product
```

---

更多详细信息请参考：
- [用户指南](./USER_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)
- [开发指南](./DEVELOPMENT.md)
