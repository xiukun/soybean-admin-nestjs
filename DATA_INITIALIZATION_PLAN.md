# 统一数据初始化方案
# Unified Data Initialization Plan

## 概述 Overview

本文档描述了低代码平台系统的统一数据初始化方案，确保在Docker和非Docker环境下都能正常初始化数据。

This document describes the unified data initialization plan for the low-code platform system, ensuring proper data initialization in both Docker and non-Docker environments.

## 架构设计 Architecture Design

### 1. 微服务数据初始化
- **低代码平台后端** (lowcode-platform-backend): 负责项目、实体、字段、API配置、代码模板等数据
- **Amis低代码后端** (amis-lowcode-backend): 负责用户、角色、页面模板等数据

### 2. 初始化检测机制
- 首次运行检测：检查数据库中是否存在初始数据
- 自动初始化：根据环境变量自动运行数据初始化
- 跳过重复初始化：避免重复执行初始化操作

## 文件结构 File Structure

```
soybean-admin-nestjs/
├── lowcode-platform-backend/
│   ├── prisma/
│   │   ├── schema.prisma                    # 数据库模式
│   │   └── seed.ts                          # 种子数据文件
│   ├── src/infra/database/
│   │   └── database-init.service.ts         # 数据库初始化服务
│   ├── scripts/
│   │   └── dev-init.sh                      # 开发环境初始化脚本
│   └── docker-entrypoint.sh                # Docker启动脚本
├── amis-lowcode-backend/
│   ├── prisma/
│   │   ├── schema.prisma                    # 数据库模式
│   │   └── seed.ts                          # 种子数据文件
│   ├── src/shared/database/
│   │   └── database-init.service.ts         # 数据库初始化服务
│   ├── scripts/
│   │   └── dev-init.sh                      # 开发环境初始化脚本
│   └── docker/startup.sh                   # Docker启动脚本
├── deploy/postgres/
│   ├── 11_lowcode_platform_data.sql        # 低代码平台数据SQL
│   ├── 12_lowcode_queries_init.sql         # 查询初始化SQL
│   └── 13_prisma_templates_update.sql      # Prisma模板更新SQL
└── scripts/
    └── check-data-init.js                  # 数据初始化状态检查脚本
```

## 环境变量 Environment Variables

### 通用环境变量
- `AUTO_INIT_DATA`: 是否自动初始化数据 (true/false)
- `DOCKER_ENV`: 是否为Docker环境 (true/false)
- `DATABASE_URL`: 数据库连接字符串

### 低代码平台后端
```bash
NODE_ENV=development
AUTO_INIT_DATA=true
DOCKER_ENV=false
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

### Amis低代码后端
```bash
NODE_ENV=development
AUTO_INIT_DATA=true
DOCKER_ENV=false
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

## 使用方法 Usage

### 1. 开发环境 Development Environment

#### 低代码平台后端
```bash
cd lowcode-platform-backend
./scripts/dev-init.sh
npm run start:dev
```

#### Amis低代码后端
```bash
cd amis-lowcode-backend
./scripts/dev-init.sh
npm run start:dev
```

### 2. Docker环境 Docker Environment

#### 设置环境变量
```bash
export AUTO_INIT_DATA=true
export DOCKER_ENV=true
export RUN_MIGRATIONS=true
```

#### 启动服务
```bash
docker-compose up -d
```

### 3. 手动初始化 Manual Initialization

#### 低代码平台后端
```bash
cd lowcode-platform-backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

#### Amis低代码后端
```bash
cd amis-lowcode-backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 初始化数据内容 Initialization Data Content

### 低代码平台后端数据
- **示例项目**: 演示项目配置
- **代码模板**: NestJS实体模型、服务类模板
- **API配置**: 用户管理相关API配置
- **示例实体**: 用户、角色实体定义
- **字段定义**: 实体字段配置

### Amis低代码后端数据
- **默认用户**: admin、demo用户
- **默认角色**: 管理员、用户、访客角色
- **用户角色关联**: 用户与角色的关联关系
- **页面模板**: CRUD列表页面、表单页面模板

## 检查和验证 Check and Validation

### 运行状态检查脚本
```bash
node scripts/check-data-init.js
```

### 验证数据初始化状态
- 检查所有必要文件是否存在
- 验证package.json中的seed配置
- 确认数据库初始化服务已配置
- 检查Docker和开发环境脚本

## 故障排除 Troubleshooting

### 常见问题
1. **Prisma客户端未初始化**: 运行 `npx prisma generate`
2. **数据库连接失败**: 检查 `DATABASE_URL` 配置
3. **种子数据运行失败**: 检查数据库表是否存在
4. **权限问题**: 确保脚本文件有执行权限

### 强制重新初始化
```bash
# 低代码平台后端
cd lowcode-platform-backend
npx prisma db push --force-reset
npx prisma db seed

# Amis低代码后端
cd amis-lowcode-backend
npx prisma db push --force-reset
npx prisma db seed
```

## 最佳实践 Best Practices

1. **环境隔离**: 不同环境使用不同的数据库
2. **数据备份**: 定期备份重要的初始化数据
3. **版本控制**: 将种子数据变更纳入版本控制
4. **测试验证**: 在部署前测试数据初始化功能
5. **监控日志**: 监控初始化过程的日志输出

## 更新日志 Change Log

- **2024-07-21**: 创建统一数据初始化方案
- **2024-07-21**: 实现首次运行检测机制
- **2024-07-21**: 添加Docker和非Docker环境支持
- **2024-07-21**: 创建数据初始化状态检查脚本
