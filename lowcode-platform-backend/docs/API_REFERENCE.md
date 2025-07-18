# 低代码平台 API 参考文档

## 概述

本文档描述了低代码平台后端 API 的所有端点、请求格式、响应格式和使用示例。

### 基础信息

- **基础 URL**: `http://localhost:3000/api/v1`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`
- **API 版本**: v1

### 认证

大部分 API 端点需要 JWT 认证。在请求头中包含：

```
Authorization: Bearer <your-jwt-token>
```

## 健康检查 API

### 基础健康检查

```http
GET /health
```

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### 详细健康检查

```http
GET /health/detailed
```

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": {
    "status": "healthy",
    "responseTime": 15
  },
  "memory": {
    "used": 134217728,
    "total": 268435456,
    "percentage": 50
  },
  "cpu": {
    "usage": 25.5
  }
}
```

### 就绪性检查

```http
GET /health/ready
```

### 存活性检查

```http
GET /health/live
```

### 性能指标

```http
GET /health/metrics
```

返回 Prometheus 格式的性能指标。

## 项目管理 API

### 获取项目列表

```http
GET /api/v1/projects
```

**查询参数:**
- `page` (number, optional): 页码，默认 1
- `limit` (number, optional): 每页数量，默认 10
- `search` (string, optional): 搜索关键词
- `status` (string, optional): 项目状态筛选

**响应示例:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "示例项目",
      "code": "example-project",
      "description": "这是一个示例项目",
      "version": "1.0.0",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z",
      "createdBy": "uuid"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### 创建项目

```http
POST /api/v1/projects
```

**请求体:**
```json
{
  "name": "新项目",
  "code": "new-project",
  "description": "项目描述",
  "version": "1.0.0",
  "status": "ACTIVE"
}
```

### 获取项目详情

```http
GET /api/v1/projects/{id}
```

### 更新项目

```http
PUT /api/v1/projects/{id}
```

### 删除项目

```http
DELETE /api/v1/projects/{id}
```

## 实体管理 API

### 获取实体列表

```http
GET /api/v1/entities
```

**查询参数:**
- `projectId` (string, required): 项目 ID
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `category` (string, optional): 实体分类

### 创建实体

```http
POST /api/v1/entities
```

**请求体:**
```json
{
  "projectId": "uuid",
  "name": "用户",
  "code": "user",
  "tableName": "users",
  "description": "用户实体",
  "category": "core",
  "status": "PUBLISHED"
}
```

### 获取实体详情

```http
GET /api/v1/entities/{id}
```

### 更新实体

```http
PUT /api/v1/entities/{id}
```

### 删除实体

```http
DELETE /api/v1/entities/{id}
```

## 字段管理 API

### 获取字段列表

```http
GET /api/v1/fields
```

**查询参数:**
- `entityId` (string, required): 实体 ID

### 创建字段

```http
POST /api/v1/fields
```

**请求体:**
```json
{
  "entityId": "uuid",
  "name": "用户名",
  "code": "username",
  "type": "VARCHAR",
  "length": 50,
  "nullable": false,
  "unique": true,
  "primaryKey": false,
  "defaultValue": null,
  "description": "用户登录名",
  "order": 1
}
```

### 字段类型

支持的字段类型：
- `VARCHAR`: 可变长字符串
- `TEXT`: 长文本
- `INTEGER`: 整数
- `DECIMAL`: 小数
- `BOOLEAN`: 布尔值
- `DATE`: 日期
- `DATETIME`: 日期时间
- `TIMESTAMP`: 时间戳
- `UUID`: UUID
- `JSON`: JSON 数据

## 关系管理 API

### 获取关系列表

```http
GET /api/v1/relationships
```

### 创建关系

```http
POST /api/v1/relationships
```

**请求体:**
```json
{
  "sourceEntityId": "uuid",
  "targetEntityId": "uuid",
  "type": "ONE_TO_MANY",
  "sourceField": "authorId",
  "targetField": "id",
  "name": "文章作者",
  "description": "文章与作者的关系"
}
```

### 关系类型

- `ONE_TO_ONE`: 一对一
- `ONE_TO_MANY`: 一对多
- `MANY_TO_ONE`: 多对一
- `MANY_TO_MANY`: 多对多

## API 配置管理

### 获取 API 配置列表

```http
GET /api/v1/api-configs
```

### 创建 API 配置

```http
POST /api/v1/api-configs
```

**请求体:**
```json
{
  "entityId": "uuid",
  "method": "GET",
  "path": "/users",
  "name": "获取用户列表",
  "description": "获取所有用户的分页列表",
  "enabled": true,
  "authentication": true,
  "parameters": [
    {
      "name": "page",
      "type": "number",
      "required": false,
      "defaultValue": "1",
      "description": "页码"
    }
  ],
  "response": {
    "type": "object",
    "properties": {
      "data": { "type": "array" },
      "pagination": { "type": "object" }
    }
  }
}
```

## 代码模板管理

### 获取模板列表

```http
GET /api/v1/code-templates
```

### 创建模板

```http
POST /api/v1/code-templates
```

**请求体:**
```json
{
  "projectId": "uuid",
  "name": "NestJS 控制器模板",
  "code": "nestjs-controller",
  "category": "controller",
  "language": "typescript",
  "framework": "nestjs",
  "description": "用于生成 NestJS 控制器的模板",
  "template": "模板内容...",
  "variables": [
    {
      "name": "entity",
      "type": "object",
      "required": true,
      "description": "实体信息"
    }
  ],
  "status": "PUBLISHED"
}
```

## 代码生成 API

### 生成代码

```http
POST /api/v1/code-generation/generate
```

**请求体:**
```json
{
  "projectId": "uuid",
  "entityIds": ["uuid1", "uuid2"],
  "templateIds": ["uuid1", "uuid2"],
  "outputPath": "./generated",
  "options": {
    "overwrite": true,
    "createDirectories": true,
    "format": true
  }
}
```

### 获取生成历史

```http
GET /api/v1/code-generation/history
```

### 获取生成详情

```http
GET /api/v1/code-generation/history/{id}
```

## 查询执行 API

### 执行查询

```http
POST /api/v1/queries/execute
```

**请求体:**
```json
{
  "projectId": "uuid",
  "query": {
    "select": ["users.username", "posts.title"],
    "from": "users",
    "joins": [
      {
        "type": "LEFT",
        "table": "posts",
        "on": "users.id = posts.authorId"
      }
    ],
    "where": {
      "users.status": "ACTIVE"
    },
    "orderBy": [
      {
        "field": "posts.createdAt",
        "direction": "DESC"
      }
    ],
    "limit": 10
  }
}
```

## 错误响应格式

所有 API 错误都遵循统一格式：

```json
{
  "error": "ERROR_CODE",
  "message": "错误描述",
  "details": "详细错误信息",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/projects"
}
```

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `422 Unprocessable Entity`: 数据验证失败
- `500 Internal Server Error`: 服务器内部错误

## 速率限制

API 实施速率限制以防止滥用：

- **默认限制**: 每分钟 200 请求
- **认证用户**: 每分钟 1000 请求
- **管理员**: 无限制

超出限制时返回 `429 Too Many Requests`。

## 分页

支持分页的端点使用统一的分页格式：

**查询参数:**
- `page`: 页码（从 1 开始）
- `limit`: 每页数量（最大 100）

**响应格式:**
```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 10,
    "pages": 100
  }
}
```

## 排序

支持排序的端点使用 `sort` 参数：

```
GET /api/v1/projects?sort=name:asc,createdAt:desc
```

## 筛选

支持筛选的端点使用字段名作为查询参数：

```
GET /api/v1/projects?status=ACTIVE&name=example
```

## WebSocket API

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

### 事件类型

- `code-generation-progress`: 代码生成进度更新
- `hot-update`: 热更新通知
- `system-notification`: 系统通知

## SDK 和客户端库

### JavaScript/TypeScript

```bash
npm install @lowcode-platform/client
```

```javascript
import { LowCodeClient } from '@lowcode-platform/client';

const client = new LowCodeClient({
  baseURL: 'http://localhost:3000',
  token: 'your-jwt-token'
});

// 获取项目列表
const projects = await client.projects.list();
```

## 示例和教程

更多示例和教程请参考：

- [快速开始指南](./QUICK_START.md)
- [开发工作流](./DEVELOPMENT_WORKFLOW.md)
- [部署指南](./DEPLOYMENT.md)
- [最佳实践](./BEST_PRACTICES.md)
