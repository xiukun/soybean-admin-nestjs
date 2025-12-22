# 版本管理 API

本模块提供产品版本管理和低代码页面历史版本管理的API接口。

## API 端点

### 产品版本管理 (Version Management)

#### 1. 获取版本列表
```
POST /api/version/list
```

请求体：
```json
{
  "versionNum": "1.0",  // 可选，版本号筛选
  "page": 1,            // 可选，页码，默认1
  "perPage": 10         // 可选，每页数量，默认10
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "options": [
      {
        "id": "1",
        "versionName": "初始版本",
        "versionNum": "1.0.0",
        "description": "系统初始版本",
        "status": "ENABLED",
        "createdBy": "-1",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 3,
    "current": 1,
    "size": 10
  }
}
```

#### 2. 获取版本列表（用于下拉选择）
```
GET /api/version/list
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "label": "初始版本 (1.0.0)",
      "value": "1.0.0"
    }
  ]
}
```

#### 3. 创建版本
```
POST /api/version/create
```

请求体：
```json
{
  "versionName": "新版本",
  "versionNum": "2.0.0",
  "description": "版本描述"
}
```

#### 4. 更新版本
```
POST /api/version/update
```

请求体：
```json
{
  "id": "1",
  "versionName": "更新后的版本名",
  "versionNum": "2.0.1",
  "description": "更新后的描述"
}
```

#### 5. 启用版本
```
POST /api/version/enable
```

请求体：
```json
{
  "id": "1"
}
```

注意：启用一个版本会自动禁用其他所有版本。

### 低代码历史页面管理 (History Management)

#### 1. 获取历史版本列表
```
POST /api/lowcode/history/list
```

请求体：
```json
{
  "mainId": "page-id",      // 可选，页面ID筛选
  "versionNum": "1.0",      // 可选，版本号筛选
  "pageNum": 1,             // 可选，页码，默认1
  "pageSize": 10            // 可选，每页数量，默认10
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "options": [
      {
        "id": "version-id",
        "pageId": "page-id",
        "menuPage": "页面标题",
        "pageVersion": "1.0.0",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "creator": "user-id",
        "changelog": "变更说明"
      }
    ],
    "total": 10,
    "current": 1,
    "size": 10
  }
}
```

#### 2. 删除历史版本
```
POST /api/lowcode/history/delete
```

请求体：
```json
{
  "id": "version-id"
}
```

#### 3. 批量删除历史版本
```
POST /api/lowcode/history/batch-delete
```

请求体：
```json
{
  "ids": ["version-id-1", "version-id-2"]
}
```

### 低代码页面列表（用于筛选）

#### 获取页面列表
```
GET /api/lowcode/pages/list
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "label": "页面标题",
      "value": "page-id"
    }
  ]
}
```

## 认证

所有API端点都需要JWT认证。请在请求头中包含：
```
Authorization: Bearer <your-jwt-token>
```

## 数据库

### 产品版本表 (sys_product_version)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| version_name | VARCHAR(100) | 版本名称 |
| version_num | VARCHAR(20) | 版本号（唯一） |
| description | TEXT | 版本描述 |
| status | Status | 状态（ENABLED/DISABLED） |
| created_at | TIMESTAMP | 创建时间 |
| created_by | VARCHAR | 创建人 |
| updated_at | TIMESTAMP | 更新时间 |
| updated_by | VARCHAR | 更新人 |

### 低代码页面版本表 (sys_lowcode_page_version)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| page_id | UUID | 页面ID（外键） |
| version | VARCHAR(20) | 版本号 |
| schema | JSONB | AMIS JSON Schema |
| changelog | TEXT | 变更说明 |
| created_at | TIMESTAMP | 创建时间 |
| created_by | VARCHAR | 创建人 |

## 初始化

### Prisma Seed

运行以下命令初始化种子数据：
```bash
cd backend
npm run prisma:seed
```

### Docker

Docker环境会自动执行SQL初始化脚本：
- `deploy/postgres/01_create_table.sql` - 创建表结构
- `deploy/postgres/10_sys_product_version.sql` - 插入产品版本数据

## 开发

### 生成Prisma客户端

修改schema后需要重新生成客户端：
```bash
cd backend
npx prisma generate
```

### 运行开发服务器

```bash
cd backend
npm run start:dev
```
