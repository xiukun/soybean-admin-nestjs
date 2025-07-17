# 低代码平台 API 文档

## 概述

本文档描述了低代码平台后端API的详细接口规范，包括项目管理、实体管理、关系管理、API配置、多表查询、代码模板管理和代码生成等功能模块。

## 基础信息

- **Base URL**: `http://localhost:3000`
- **API版本**: v1
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

大部分API需要JWT认证，请在请求头中包含：

```
Authorization: Bearer <your-jwt-token>
```

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## API 接口

### 1. 项目管理 (Projects)

#### 1.1 获取项目列表
```
GET /v1/projects
```

**查询参数:**
- `page` (number, optional): 页码，默认1
- `limit` (number, optional): 每页数量，默认20
- `search` (string, optional): 搜索关键词
- `status` (string, optional): 项目状态 (ACTIVE, INACTIVE, ARCHIVED)

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "01HXXX...",
      "name": "示例项目",
      "description": "这是一个示例项目",
      "type": "web",
      "status": "ACTIVE",
      "config": {
        "framework": "react",
        "database": "postgresql"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": "user123"
    }
  ]
}
```

#### 1.2 创建项目
```
POST /v1/projects
```

**请求体:**
```json
{
  "name": "新项目",
  "description": "项目描述",
  "type": "web",
  "config": {
    "framework": "react",
    "database": "postgresql"
  }
}
```

#### 1.3 获取项目详情
```
GET /v1/projects/{id}
```

#### 1.4 更新项目
```
PUT /v1/projects/{id}
```

#### 1.5 删除项目
```
DELETE /v1/projects/{id}
```

### 2. 实体管理 (Entities)

#### 2.1 获取项目下的实体列表
```
GET /v1/entities/project/{projectId}
```

#### 2.2 获取分页实体列表
```
GET /v1/entities/project/{projectId}/paginated
```

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量
- `search` (string, optional): 搜索关键词
- `status` (string, optional): 实体状态
- `category` (string, optional): 实体分类

#### 2.3 创建实体
```
POST /v1/entities
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "用户",
  "code": "user",
  "tableName": "users",
  "description": "用户实体",
  "category": "core"
}
```

#### 2.4 获取实体详情
```
GET /v1/entities/{id}
```

#### 2.5 更新实体
```
PUT /v1/entities/{id}
```

#### 2.6 删除实体
```
DELETE /v1/entities/{id}
```

#### 2.7 根据代码获取实体
```
GET /v1/entities/project/{projectId}/code/{code}
```

#### 2.8 获取实体统计信息
```
GET /v1/entities/project/{projectId}/stats
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "draft": 6,
    "published": 4,
    "deprecated": 0
  }
}
```

### 3. 关系管理 (Relationships)

#### 3.1 获取项目下的关系列表
```
GET /v1/relationships/project/{projectId}
```

#### 3.2 获取分页关系列表
```
GET /v1/relationships/project/{projectId}/paginated
```

#### 3.3 创建关系
```
POST /v1/relationships
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "用户订单",
  "code": "userOrders",
  "type": "ONE_TO_MANY",
  "sourceEntityId": "01HYYY...",
  "targetEntityId": "01HZZZ...",
  "description": "用户与订单的关系",
  "onDelete": "CASCADE",
  "onUpdate": "CASCADE"
}
```

#### 3.4 获取关系详情
```
GET /v1/relationships/{id}
```

#### 3.5 更新关系
```
PUT /v1/relationships/{id}
```

#### 3.6 删除关系
```
DELETE /v1/relationships/{id}
```

### 4. API配置管理 (API Configs)

#### 4.1 获取项目下的API配置列表
```
GET /v1/api-configs/project/{projectId}
```

#### 4.2 创建API配置
```
POST /v1/api-configs
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "获取用户列表",
  "path": "/api/users",
  "method": "GET",
  "description": "获取用户列表API",
  "entityId": "01HYYY...",
  "queryConfig": {
    "pagination": {
      "enabled": true,
      "defaultPageSize": 20,
      "maxPageSize": 100
    }
  },
  "responseConfig": {
    "format": "json",
    "wrapper": "data"
  },
  "authRequired": true,
  "rateLimit": {
    "enabled": true,
    "requests": 100,
    "window": 60
  }
}
```

#### 4.3 测试API配置
```
POST /v1/api-configs/{id}/test
```

### 5. 多表查询 (Multi-table Queries)

#### 5.1 创建多表查询
```
POST /v1/queries
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "用户订单查询",
  "description": "查询用户及其订单信息",
  "baseEntityId": "01HYYY...",
  "baseEntityAlias": "u",
  "joins": [
    {
      "type": "LEFT",
      "targetEntityId": "01HZZZ...",
      "sourceField": "id",
      "targetField": "userId",
      "alias": "o"
    }
  ],
  "fields": [
    {
      "field": "name",
      "entityAlias": "u",
      "alias": "userName"
    },
    {
      "field": "title",
      "entityAlias": "o",
      "alias": "orderTitle"
    }
  ],
  "filters": [
    {
      "field": "status",
      "operator": "eq",
      "value": "active",
      "entityAlias": "u"
    }
  ],
  "sorting": [
    {
      "field": "createdAt",
      "direction": "DESC",
      "entityAlias": "u"
    }
  ],
  "limit": 100
}
```

#### 5.2 执行查询
```
POST /v1/queries/{id}/execute
```

### 6. 代码模板管理 (Code Templates)

#### 6.1 获取项目下的模板列表
```
GET /v1/templates/project/{projectId}
```

**查询参数:**
- `category` (string, optional): 模板分类
- `language` (string, optional): 编程语言
- `framework` (string, optional): 框架
- `tags` (string, optional): 标签，逗号分隔

#### 6.2 创建代码模板
```
POST /v1/templates
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "React组件模板",
  "description": "基础React组件模板",
  "category": "component",
  "language": "typescript",
  "framework": "react",
  "content": "import React from 'react';\n\ninterface {{componentName}}Props {\n  // Props定义\n}\n\nconst {{componentName}}: React.FC<{{componentName}}Props> = () => {\n  return (\n    <div>\n      <h1>{{title}}</h1>\n    </div>\n  );\n};\n\nexport default {{componentName}};",
  "variables": [
    {
      "name": "componentName",
      "type": "string",
      "description": "组件名称",
      "required": true,
      "defaultValue": "MyComponent"
    },
    {
      "name": "title",
      "type": "string",
      "description": "标题",
      "required": false,
      "defaultValue": "Hello World"
    }
  ],
  "tags": ["react", "component", "typescript"],
  "isPublic": false
}
```

#### 6.3 发布模板
```
POST /v1/templates/{id}/publish
```

#### 6.4 创建模板版本
```
POST /v1/templates/{id}/versions
```

### 7. 代码生成 (Code Generation)

#### 7.1 创建代码生成任务
```
POST /v1/codegen/tasks
```

**请求体:**
```json
{
  "projectId": "01HXXX...",
  "name": "生成用户管理模块",
  "type": "MODULE",
  "config": {
    "entities": ["user", "role"],
    "templates": ["01HTTT..."],
    "outputPath": "/src/modules/user",
    "framework": "nestjs"
  }
}
```

#### 7.2 获取生成任务状态
```
GET /v1/codegen/tasks/{id}
```

#### 7.3 获取生成结果
```
GET /v1/codegen/tasks/{id}/result
```

#### 7.4 下载生成的代码
```
GET /v1/codegen/tasks/{id}/download
```

## 错误码说明

| 错误码 | 描述 |
|--------|------|
| VALIDATION_ERROR | 请求参数验证失败 |
| NOT_FOUND | 资源不存在 |
| UNAUTHORIZED | 未授权访问 |
| FORBIDDEN | 权限不足 |
| CONFLICT | 资源冲突 |
| INTERNAL_ERROR | 服务器内部错误 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 |

## 状态码说明

- `200` - 请求成功
- `201` - 创建成功
- `204` - 删除成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `429` - 请求频率超限
- `500` - 服务器内部错误

## 使用示例

### JavaScript/TypeScript
```typescript
// 获取项目列表
const response = await fetch('/v1/projects', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### cURL
```bash
# 创建项目
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新项目",
    "description": "项目描述",
    "type": "web"
  }'
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持项目管理、实体管理、关系管理
- 支持API配置和多表查询
- 支持代码模板管理和代码生成

## 联系方式

如有问题或建议，请联系开发团队。
