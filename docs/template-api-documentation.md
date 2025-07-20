# 模板管理 API 接口文档

## 📋 接口概览

### 基础信息
- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **API版本**: v1

### 接口列表
| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | `/templates` | 创建模板 | ⚠️ 待完善 |
| GET | `/templates/:id` | 获取模板详情 | ⚠️ 待完善 |
| PUT | `/templates/:id` | 更新模板 | ⚠️ 待完善 |
| DELETE | `/templates/:id` | 删除模板 | ⚠️ 待完善 |
| GET | `/templates/project/:projectId` | 获取项目模板 | ⚠️ 待完善 |
| GET | `/templates/project/:projectId/paginated` | 分页获取项目模板 | ✅ 已实现 |
| POST | `/templates/:id/publish` | 发布模板 | ⚠️ 待完善 |
| POST | `/templates/:id/versions` | 创建模板版本 | ⚠️ 待完善 |
| POST | `/templates/:id/generate` | 生成代码 | ❌ 未实现 |
| GET | `/templates/:id/usage` | 获取使用统计 | ❌ 未实现 |

## 🔧 接口详情

### 1. 创建模板

**POST** `/templates`

#### 请求参数
```json
{
  "projectId": "string",           // 项目ID (必填)
  "name": "string",               // 模板名称 (必填)
  "description": "string",        // 模板描述 (可选)
  "category": "CONTROLLER",       // 模板分类 (必填)
  "language": "TYPESCRIPT",       // 编程语言 (必填)
  "framework": "NESTJS",          // 框架 (可选)
  "content": "string",            // 模板内容 (必填)
  "variables": [                  // 模板变量 (可选)
    {
      "name": "entityName",
      "type": "string",
      "description": "实体名称",
      "defaultValue": "Entity",
      "required": true,
      "validation": {
        "pattern": "^[A-Z][a-zA-Z0-9]*$",
        "minLength": 1,
        "maxLength": 50
      }
    }
  ],
  "tags": ["controller", "nestjs"], // 标签 (可选)
  "isPublic": false               // 是否公开 (可选，默认false)
}
```

#### 响应示例
```json
{
  "id": "01HKQR8X9Y2Z3A4B5C6D7E8F9G",
  "projectId": "demo-project-1",
  "name": "Basic Controller Template",
  "description": "A basic NestJS controller template",
  "category": "CONTROLLER",
  "language": "TYPESCRIPT",
  "framework": "NESTJS",
  "content": "import { Controller, Get } from '@nestjs/common';\n\n@Controller('{{entityName}}')\nexport class {{pascalCase entityName}}Controller {\n  @Get()\n  findAll() {\n    return 'This action returns all {{entityName}}';\n  }\n}",
  "variables": [
    {
      "name": "entityName",
      "type": "string",
      "description": "实体名称",
      "defaultValue": "Entity",
      "required": true,
      "validation": {
        "pattern": "^[A-Z][a-zA-Z0-9]*$",
        "minLength": 1,
        "maxLength": 50
      }
    }
  ],
  "tags": ["controller", "nestjs"],
  "isPublic": false,
  "status": "DRAFT",
  "versions": [],
  "currentVersion": "1.0.0",
  "usageCount": 0,
  "rating": null,
  "createdBy": "user-id",
  "createdAt": "2025-07-20T15:30:00.000Z",
  "updatedAt": "2025-07-20T15:30:00.000Z"
}
```

### 2. 分页获取项目模板

**GET** `/templates/project/:projectId/paginated`

#### 路径参数
- `projectId`: 项目ID

#### 查询参数
```
current=1              // 当前页码 (默认: 1)
size=10               // 每页大小 (默认: 10)
name=controller       // 模板名称过滤
category=CONTROLLER   // 分类过滤
status=PUBLISHED      // 状态过滤
language=TYPESCRIPT   // 语言过滤
framework=NESTJS      // 框架过滤
search=keyword        // 关键词搜索
```

#### 响应示例
```json
{
  "records": [
    {
      "id": "template-1",
      "projectId": "demo-project-1",
      "name": "Basic Controller Template",
      "description": "A basic NestJS controller template",
      "category": "CONTROLLER",
      "language": "TYPESCRIPT",
      "framework": "NESTJS",
      "content": "import { Controller, Get } from '@nestjs/common';\n\n@Controller('{{entityName}}')\nexport class {{pascalCase entityName}}Controller {\n  @Get()\n  findAll() {\n    return 'This action returns all {{entityName}}';\n  }\n}",
      "variables": [
        {
          "name": "entityName",
          "type": "string",
          "description": "Entity name",
          "required": true
        }
      ],
      "tags": ["controller", "nestjs"],
      "isPublic": true,
      "status": "PUBLISHED",
      "versions": [],
      "currentVersion": "1.0.0",
      "usageCount": 5,
      "rating": 4.5,
      "createdBy": "system",
      "createdAt": "2025-07-20T15:30:00.000Z",
      "updatedAt": "2025-07-20T15:30:00.000Z"
    }
  ],
  "total": 2,
  "current": 1,
  "size": 10
}
```

### 3. 获取模板详情

**GET** `/templates/:id`

#### 路径参数
- `id`: 模板ID

#### 响应示例
```json
{
  "id": "template-1",
  "projectId": "demo-project-1",
  "name": "Basic Controller Template",
  "description": "A basic NestJS controller template",
  "category": "CONTROLLER",
  "language": "TYPESCRIPT",
  "framework": "NESTJS",
  "content": "import { Controller, Get } from '@nestjs/common';\n\n@Controller('{{entityName}}')\nexport class {{pascalCase entityName}}Controller {\n  @Get()\n  findAll() {\n    return 'This action returns all {{entityName}}';\n  }\n}",
  "variables": [
    {
      "name": "entityName",
      "type": "string",
      "description": "Entity name",
      "required": true,
      "validation": {
        "pattern": "^[A-Z][a-zA-Z0-9]*$"
      }
    }
  ],
  "tags": ["controller", "nestjs"],
  "isPublic": true,
  "status": "PUBLISHED",
  "versions": [
    {
      "version": "1.0.0",
      "content": "...",
      "variables": [...],
      "changelog": "Initial version",
      "createdAt": "2025-07-20T15:30:00.000Z",
      "createdBy": "system"
    }
  ],
  "currentVersion": "1.0.0",
  "usageCount": 5,
  "rating": 4.5,
  "createdBy": "system",
  "createdAt": "2025-07-20T15:30:00.000Z",
  "updatedAt": "2025-07-20T15:30:00.000Z"
}
```

### 4. 更新模板

**PUT** `/templates/:id`

#### 路径参数
- `id`: 模板ID

#### 请求参数
```json
{
  "name": "Updated Controller Template",
  "description": "An updated NestJS controller template",
  "content": "import { Controller, Get, Post } from '@nestjs/common';\n\n@Controller('{{entityName}}')\nexport class {{pascalCase entityName}}Controller {\n  @Get()\n  findAll() {\n    return 'This action returns all {{entityName}}';\n  }\n\n  @Post()\n  create() {\n    return 'This action creates a {{entityName}}';\n  }\n}",
  "variables": [
    {
      "name": "entityName",
      "type": "string",
      "description": "实体名称",
      "required": true
    }
  ],
  "tags": ["controller", "nestjs", "crud"],
  "isPublic": true
}
```

### 5. 发布模板

**POST** `/templates/:id/publish`

#### 路径参数
- `id`: 模板ID

#### 请求参数
```json
{
  "version": "1.1.0",
  "changelog": "Added create method"
}
```

### 6. 生成代码

**POST** `/templates/:id/generate`

#### 路径参数
- `id`: 模板ID

#### 请求参数
```json
{
  "variables": {
    "entityName": "User",
    "description": "User management"
  },
  "options": {
    "format": true,        // 是否格式化代码
    "validate": true       // 是否验证生成的代码
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "generatedCode": {
    "content": "import { Controller, Get, Post } from '@nestjs/common';\n\n@Controller('user')\nexport class UserController {\n  @Get()\n  findAll() {\n    return 'This action returns all user';\n  }\n\n  @Post()\n  create() {\n    return 'This action creates a user';\n  }\n}",
    "filename": "user.controller.ts",
    "language": "TYPESCRIPT",
    "framework": "NESTJS"
  },
  "metadata": {
    "templateId": "template-1",
    "templateVersion": "1.1.0",
    "generatedAt": "2025-07-20T15:30:00.000Z",
    "variablesUsed": {
      "entityName": "User"
    }
  }
}
```

## 📊 数据类型定义

### 枚举类型

#### TemplateCategory
```typescript
enum TemplateCategory {
  CONTROLLER = 'CONTROLLER',
  SERVICE = 'SERVICE',
  MODEL = 'MODEL',
  DTO = 'DTO',
  COMPONENT = 'COMPONENT',
  PAGE = 'PAGE',
  CONFIG = 'CONFIG',
  TEST = 'TEST',
  UTIL = 'UTIL',
  MIDDLEWARE = 'MIDDLEWARE'
}
```

#### TemplateLanguage
```typescript
enum TemplateLanguage {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CSHARP = 'CSHARP',
  GO = 'GO',
  PHP = 'PHP',
  RUST = 'RUST'
}
```

#### TemplateFramework
```typescript
enum TemplateFramework {
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  SPRING = 'SPRING',
  DJANGO = 'DJANGO',
  FLASK = 'FLASK',
  DOTNET = 'DOTNET',
  GIN = 'GIN',
  VUE = 'VUE',
  REACT = 'REACT',
  ANGULAR = 'ANGULAR'
}
```

#### TemplateStatus
```typescript
enum TemplateStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED'
}
```

#### VariableType
```typescript
enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  ENUM = 'enum',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url'
}
```

## 🚨 错误码说明

### HTTP状态码
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 参数验证失败
- `500` - 服务器内部错误

### 业务错误码
```json
{
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "Template not found",
    "details": {
      "templateId": "template-1"
    }
  }
}
```

#### 错误码列表
- `TEMPLATE_NOT_FOUND` - 模板不存在
- `TEMPLATE_ALREADY_EXISTS` - 模板已存在
- `TEMPLATE_VALIDATION_FAILED` - 模板验证失败
- `TEMPLATE_GENERATION_FAILED` - 代码生成失败
- `INSUFFICIENT_PERMISSIONS` - 权限不足
- `INVALID_TEMPLATE_VARIABLES` - 模板变量无效
- `TEMPLATE_COMPILATION_ERROR` - 模板编译错误

## 🔐 认证和权限

### JWT Token
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 权限级别
- `READ` - 查看模板
- `WRITE` - 编辑模板
- `DELETE` - 删除模板
- `PUBLISH` - 发布模板
- `ADMIN` - 管理权限

## 📝 使用示例

### cURL示例
```bash
# 获取项目模板列表
curl -X GET "http://localhost:3000/api/v1/templates/project/demo-project-1/paginated?current=1&size=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 创建模板
curl -X POST "http://localhost:3000/api/v1/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "demo-project-1",
    "name": "User Controller",
    "category": "CONTROLLER",
    "language": "TYPESCRIPT",
    "framework": "NESTJS",
    "content": "import { Controller } from \"@nestjs/common\";\n\n@Controller(\"{{entityName}}\")\nexport class {{pascalCase entityName}}Controller {}"
  }'

# 生成代码
curl -X POST "http://localhost:3000/api/v1/templates/template-1/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "entityName": "user"
    }
  }'
```

### JavaScript示例
```javascript
// 使用fetch API
const response = await fetch('/api/v1/templates/project/demo-project-1/paginated', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

---

**文档版本**: v1.0  
**最后更新**: 2025-07-20  
**维护者**: 开发团队
