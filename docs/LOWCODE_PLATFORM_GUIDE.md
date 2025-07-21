# 低代码平台系统指南

## 概述

本系统是一个基于NestJS的低代码平台，包含两个主要服务：
- **lowcode-platform-backend**: 低代码平台核心服务，负责项目管理、实体定义、代码模板管理和代码生成
- **amis-lowcode-backend**: Amis后端服务，提供用户管理、角色管理等基础功能

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    低代码平台系统                              │
├─────────────────────────────────────────────────────────────┤
│  lowcode-platform-backend (端口: 3003)                      │
│  ├── 项目管理 (Projects)                                     │
│  ├── 实体管理 (Entities)                                     │
│  ├── 代码模板管理 (Code Templates)                           │
│  ├── 代码生成 (Code Generation)                              │
│  └── 页面管理 (Pages)                                        │
├─────────────────────────────────────────────────────────────┤
│  amis-lowcode-backend (端口: 9522)                          │
│  ├── 用户管理 (Users)                                        │
│  ├── 角色管理 (Roles)                                        │
│  └── 基础服务 (Health Check, etc.)                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 数据库 (端口: 25432)                            │
│  ├── lowcode_* 表 (低代码平台数据)                           │
│  └── demo_* 表 (演示数据)                                    │
└─────────────────────────────────────────────────────────────┘
```

## 服务详情

### lowcode-platform-backend

**端口**: 3003  
**API文档**: http://localhost:3003/api-docs  
**健康检查**: http://localhost:3003/health

#### 主要功能模块

1. **项目管理**
   - 创建、查询、更新、删除项目
   - 项目配置管理
   - API: `/api/v1/projects`

2. **实体管理**
   - 定义数据实体和字段
   - 实体关系管理
   - API: `/api/v1/entities`

3. **代码模板管理**
   - 管理代码生成模板
   - 支持多种框架和架构
   - API: `/api/v1/code-templates`

4. **代码生成**
   - 基于模板和实体生成代码
   - 支持多种输出格式
   - API: `/api/v1/code-generation`

5. **页面管理**
   - 低代码页面配置
   - Amis页面模板管理
   - API: `/api/v1/pages`

### amis-lowcode-backend

**端口**: 9522  
**API文档**: http://localhost:9522/api/v1/docs  
**健康检查**: http://localhost:9522/api/v1/health

#### 主要功能模块

1. **用户管理**
   - 用户CRUD操作
   - 用户认证和授权
   - API: `/api/v1/users`

2. **角色管理**
   - 角色定义和权限管理
   - 角色分配
   - API: `/api/v1/roles`

## 数据库设计

### 核心表结构

#### lowcode_projects (项目表)
- `id`: 项目唯一标识
- `name`: 项目名称
- `description`: 项目描述
- `config`: 项目配置(JSON)
- `status`: 项目状态
- `created_at`, `updated_at`: 时间戳

#### lowcode_entities (实体表)
- `id`: 实体唯一标识
- `project_id`: 所属项目ID
- `name`: 实体名称
- `code`: 实体代码
- `fields`: 字段定义(JSON)
- `relationships`: 关系定义(JSON)

#### lowcode_code_templates (代码模板表)
- `id`: 模板唯一标识
- `name`: 模板名称
- `type`: 模板类型
- `framework`: 目标框架
- `content`: 模板内容
- `variables`: 变量定义(JSON)

#### lowcode_pages (页面表)
- `id`: 页面唯一标识
- `project_id`: 所属项目ID
- `name`: 页面名称
- `path`: 页面路径
- `config`: 页面配置(JSON)
- `amis_schema`: Amis页面schema(JSON)

#### demo_users (用户表)
- `id`: 用户ID
- `username`: 用户名
- `email`: 邮箱
- `password`: 密码(加密)
- `nickname`: 昵称
- `avatar`: 头像URL
- `status`: 用户状态

#### demo_roles (角色表)
- `id`: 角色ID
- `name`: 角色名称
- `code`: 角色代码
- `description`: 角色描述
- `permissions`: 权限列表(JSON)

## 环境配置

### 环境变量

#### lowcode-platform-backend (.env)
```env
NODE_ENV=development
PORT=3003
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend"
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
AMIS_BACKEND_URL=http://localhost:9522
```

#### amis-lowcode-backend (.env)
```env
NODE_ENV=development
PORT=9522
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend"
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 数据库配置

**PostgreSQL 连接信息**:
- 主机: localhost
- 端口: 25432
- 数据库: soybean-admin-nest-backend
- 用户名: soybean
- 密码: soybean@123.

## 启动指南

### 1. 启动数据库
```bash
# 确保PostgreSQL在端口25432运行
# 数据库已包含初始化数据
```

### 2. 启动lowcode-platform-backend
```bash
cd lowcode-platform-backend
npm install
npm run start:dev
```

### 3. 启动amis-lowcode-backend
```bash
cd amis-lowcode-backend
npm install
npm run start:dev
```

### 4. 验证服务
- lowcode-platform-backend: http://localhost:3003/health
- amis-lowcode-backend: http://localhost:9522/api/v1/health

## API使用示例

### 获取项目列表
```bash
curl "http://localhost:3003/api/v1/projects/paginated?current=1&size=10"
```

### 获取用户列表
```bash
curl "http://localhost:9522/api/v1/users?page=1&pageSize=10"
```

### 代码生成
```bash
curl -X POST "http://localhost:3003/api/v1/code-generation/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "demo-project-1",
    "templateIds": ["tpl-nestjs-entity-model"],
    "entityIds": ["demo-entity-user"],
    "variables": {},
    "options": {
      "overwriteExisting": true,
      "architecture": "base-biz",
      "framework": "nestjs"
    }
  }'
```

## 测试

### 运行集成测试
```bash
# lowcode-platform-backend
cd lowcode-platform-backend
npm run test:e2e

# amis-lowcode-backend
cd amis-lowcode-backend
npm run test:e2e
```

## 故障排除

### 常见问题

1. **端口占用**
   - 检查端口3003和9522是否被占用
   - 使用 `lsof -ti:PORT` 查找占用进程

2. **数据库连接失败**
   - 确认PostgreSQL服务运行状态
   - 检查连接字符串和凭据

3. **Prisma相关错误**
   - 运行 `npx prisma generate` 重新生成客户端
   - 检查schema.prisma与数据库结构是否一致

4. **TypeScript编译错误**
   - 删除生成的错误文件
   - 重新启动开发服务器

## 开发指南

### 添加新的API端点
1. 在相应的控制器中添加路由
2. 实现业务逻辑服务
3. 添加相应的测试用例
4. 更新API文档

### 扩展数据模型
1. 更新Prisma schema
2. 运行数据库迁移
3. 更新相关的服务和控制器
4. 添加测试用例

### 添加新的代码模板
1. 在数据库中创建模板记录
2. 定义模板变量和内容
3. 测试代码生成功能
4. 更新文档

## 部署指南

### Docker部署
```bash
# 构建镜像
docker build -t lowcode-platform-backend ./lowcode-platform-backend
docker build -t amis-lowcode-backend ./amis-lowcode-backend

# 运行容器
docker run -d -p 3003:3003 --name lowcode-platform lowcode-platform-backend
docker run -d -p 9522:9522 --name amis-backend amis-lowcode-backend
```

### 生产环境配置
- 使用环境变量管理敏感信息
- 配置反向代理(Nginx)
- 设置SSL证书
- 配置日志收集和监控

## 安全考虑

1. **JWT Token管理**
   - 定期轮换JWT密钥
   - 设置合理的过期时间
   - 实现Token刷新机制

2. **数据库安全**
   - 使用强密码
   - 限制数据库访问权限
   - 定期备份数据

3. **API安全**
   - 实现请求限流
   - 输入验证和清理
   - CORS配置

## 监控和日志

### 日志配置
- 使用结构化日志格式
- 配置日志轮转
- 集中化日志收集

### 监控指标
- API响应时间
- 数据库连接状态
- 内存和CPU使用率
- 错误率统计
