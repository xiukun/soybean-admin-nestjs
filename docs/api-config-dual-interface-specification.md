# API配置双接口规范说明

## 概述

低代码平台的API配置支持两种不同的接口规范，分别用于不同的使用场景：

1. **平台管理接口**：用于低代码平台本身的管理功能
2. **低代码页面接口**：用于低代码页面中的数据展示

## 接口规范对比

### 1. 平台管理接口

**用途**：Vue管理界面中的表格展示和CRUD操作

**接口路径**：`/api-configs/project/{projectId}/paginated`

**请求参数**：
```json
{
  "current": 1,     // 当前页码
  "size": 10,       // 每页大小
  "search": "",     // 搜索关键词
  "method": "",     // HTTP方法筛选
  "status": ""      // 状态筛选
}
```

**响应格式**：
```json
{
  "records": [      // 记录列表
    {
      "id": "uuid",
      "name": "API名称",
      "method": "GET",
      "path": "/api/users",
      "fullPath": "http://localhost:3000/api/users",
      "description": "用户列表接口",
      "status": "ACTIVE",
      "hasAuthentication": true,
      "createdBy": "admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedBy": "admin",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,     // 总记录数
  "current": 1,     // 当前页码
  "size": 10        // 每页大小
}
```

### 2. 低代码页面接口

**用途**：amis等低代码框架中的数据源和选项列表

**接口路径**：`/api-configs/project/{projectId}/lowcode-paginated`

**请求参数**：
```json
{
  "page": 1,        // 页码
  "perPage": 10,    // 每页大小
  "search": "",     // 搜索关键词
  "method": "",     // HTTP方法筛选
  "status": ""      // 状态筛选
}
```

**响应格式**：
```json
{
  "status": 0,      // 状态码，0表示成功
  "msg": "",        // 消息
  "data": {
    "options": [    // 选项列表，符合amis标准
      {
        "label": "GET /api/users",
        "value": "uuid",
        "id": "uuid",
        "name": "用户列表",
        "method": "GET",
        "path": "/api/users",
        "fullPath": "http://localhost:3000/api/users",
        "api": "http://localhost:3000/api/users",
        "url": "http://localhost:3000/api/users",
        "description": "用户列表接口",
        "status": "ACTIVE",
        "hasAuthentication": true,
        "data": {       // GET请求的额外数据源配置
          "api": "http://localhost:3000/api/users",
          "method": "GET"
        }
      }
    ],
    "page": 1,        // 当前页码
    "perPage": 10,    // 每页大小
    "total": 100,     // 总记录数
    "totalPages": 10  // 总页数
  }
}
```

## 使用场景

### 平台管理接口使用场景

1. **Vue管理界面**：
   - API配置列表展示
   - 表格分页和搜索
   - CRUD操作

2. **前端代码示例**：
```typescript
// 获取API配置列表用于管理界面
const response = await fetchGetApiConfigList(projectId, {
  current: 1,
  size: 10,
  search: 'user'
});

// 响应数据直接用于NaiveUI表格
const tableData = response.data.records;
```

### 低代码页面接口使用场景

1. **amis页面配置**：
   - 数据源选择器
   - API配置下拉列表
   - 动态表单数据源

2. **前端代码示例**：
```typescript
// 获取API配置用于低代码页面
const response = await fetchGetApiConfigListForLowcode(projectId, {
  page: 1,
  perPage: 10
});

// 响应数据用于amis选择器
const options = response.data.data.options;
```

3. **amis配置示例**：
```json
{
  "type": "select",
  "name": "apiConfig",
  "label": "选择API",
  "source": {
    "method": "get",
    "url": "/api-configs/project/123/lowcode-paginated"
  }
}
```

## 生成amis配置

API配置选择器组件会根据选中的API自动生成对应的amis配置：

### GET请求 - 数据展示
```json
{
  "type": "service",
  "api": {
    "method": "GET",
    "url": "http://localhost:3000/api/users",
    "headers": {
      "Authorization": "${token}"
    }
  },
  "body": {
    "type": "table",
    "source": "$data",
    "columns": [
      { "name": "id", "label": "ID" },
      { "name": "name", "label": "名称" }
    ]
  }
}
```

### POST/PUT/DELETE请求 - 表单操作
```json
{
  "type": "form",
  "api": {
    "method": "POST",
    "url": "http://localhost:3000/api/users",
    "headers": {
      "Authorization": "${token}"
    }
  },
  "body": [
    {
      "type": "input-text",
      "name": "name",
      "label": "名称",
      "required": true
    }
  ]
}
```

## 技术实现

### 后端实现

1. **控制器方法**：
   - `getApiConfigsPaginated()` - 平台管理接口
   - `getApiConfigsLowcodePaginated()` - 低代码页面接口

2. **响应映射**：
   - `mapToResponseDto()` - 平台管理格式
   - `mapToLowcodeResponseDto()` - 低代码格式

### 前端实现

1. **API服务**：
   - `fetchGetApiConfigList()` - 平台管理接口调用
   - `fetchGetApiConfigListForLowcode()` - 低代码页面接口调用

2. **组件**：
   - `ApiConfigSelector` - 接口格式对比和选择器
   - 管理界面使用平台管理接口
   - 低代码页面使用低代码接口

## 最佳实践

1. **接口选择**：
   - 管理界面始终使用平台管理接口
   - 低代码页面始终使用低代码页面接口

2. **数据缓存**：
   - 两种接口可以独立缓存
   - 避免格式转换的性能开销

3. **错误处理**：
   - 统一的错误处理机制
   - 友好的错误提示

4. **扩展性**：
   - 支持自定义字段映射
   - 支持不同的低代码框架格式
