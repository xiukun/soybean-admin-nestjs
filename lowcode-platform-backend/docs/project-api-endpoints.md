# 项目管理API接口文档

## 概述

项目管理模块提供了多种格式的API接口，以支持不同的前端框架和使用场景：

- **Vue表格格式**：用于Vue.js前端的标准表格组件
- **Amis格式**：用于amis低代码页面的表格组件

## API接口列表

### 1. 获取所有项目（Vue格式）

**接口地址：** `GET /api/v1/projects`

**描述：** 获取所有项目的列表，返回数组格式，适用于Vue表格组件

**响应格式：**
```json
[
  {
    "id": "1",
    "name": "E-commerce Platform",
    "code": "ecommerce",
    "description": "电商平台低代码项目",
    "version": "1.0.0",
    "config": {
      "framework": "nestjs",
      "architecture": "base-biz",
      "language": "typescript",
      "database": "postgresql"
    },
    "status": "ACTIVE",
    "entityCount": 15,
    "templateCount": 8,
    "createdBy": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
]
```

### 2. 获取所有项目（Amis格式）

**接口地址：** `GET /api/v1/projects/amis`

**描述：** 获取所有项目的列表，返回amis格式，适用于amis低代码页面

**响应格式：**
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "options": [
      {
        "id": "1",
        "name": "E-commerce Platform",
        "code": "ecommerce",
        "description": "电商平台低代码项目",
        "version": "1.0.0",
        "config": {
          "framework": "nestjs",
          "architecture": "base-biz",
          "language": "typescript",
          "database": "postgresql"
        },
        "status": "ACTIVE",
        "entityCount": 15,
        "templateCount": 8,
        "createdBy": "admin",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ]
  }
}
```

### 3. 分页获取项目（Vue格式）

**接口地址：** `GET /api/v1/projects/paginated`

**描述：** 分页获取项目列表，返回Vue表格标准分页格式

**请求参数：**
- `current` (number, optional): 当前页码，默认1
- `size` (number, optional): 每页大小，默认10
- `status` (string, optional): 项目状态过滤
- `search` (string, optional): 搜索关键词

**响应格式：**
```json
{
  "current": 1,
  "size": 10,
  "total": 5,
  "records": [
    {
      "id": "1",
      "name": "E-commerce Platform",
      "code": "ecommerce",
      "description": "电商平台低代码项目",
      "version": "1.0.0",
      "config": {
        "framework": "nestjs",
        "architecture": "base-biz",
        "language": "typescript",
        "database": "postgresql"
      },
      "status": "ACTIVE",
      "entityCount": 15,
      "templateCount": 8,
      "createdBy": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### 4. 分页获取项目（Amis格式）

**接口地址：** `GET /api/v1/projects/paginated/amis`

**描述：** 分页获取项目列表，返回amis分页表格格式

**请求参数：**
- `current` (number, optional): 当前页码，默认1
- `size` (number, optional): 每页大小，默认10
- `status` (string, optional): 项目状态过滤
- `search` (string, optional): 搜索关键词

**响应格式：**
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "options": [
      {
        "id": "1",
        "name": "E-commerce Platform",
        "code": "ecommerce",
        "description": "电商平台低代码项目",
        "version": "1.0.0",
        "config": {
          "framework": "nestjs",
          "architecture": "base-biz",
          "language": "typescript",
          "database": "postgresql"
        },
        "status": "ACTIVE",
        "entityCount": 15,
        "templateCount": 8,
        "createdBy": "admin",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "page": 1,
    "perPage": 10,
    "total": 5
  }
}
```

## 使用场景

### Vue.js前端
- 使用 `/api/v1/projects` 获取所有项目
- 使用 `/api/v1/projects/paginated` 进行分页查询

### Amis低代码页面
- 使用 `/api/v1/projects/amis` 获取所有项目
- 使用 `/api/v1/projects/paginated/amis` 进行分页查询

## 响应工具类

项目使用了统一的响应工具类来生成不同格式的响应：

- `ListResponse.simple()` - 生成简单数组格式
- `PaginationResponse.simple()` - 生成Vue分页格式
- `AmisResponse.table()` - 生成amis表格格式
- `AmisResponse.paginationTable()` - 生成amis分页表格格式

这确保了所有接口都遵循统一的响应格式规范。
