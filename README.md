# SoybeanAdmin NestJS

<p align="center">
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"/>
  </a>
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/stargazers">
    <img src="https://img.shields.io/github/stars/honghuangdc/soybean-admin-nestjs.svg" alt="stars"/>
  </a>
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/network/members">
    <img src="https://img.shields.io/github/forks/honghuangdc/soybean-admin-nestjs.svg" alt="forks"/>
  </a>
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/issues">
    <img src="https://img.shields.io/github/issues/honghuangdc/soybean-admin-nestjs.svg" alt="issues"/>
  </a>
</p>

## 在线预览

- 预览地址：[https://soybean-nest.bytebytebrew.com](https://soybean-nest.bytebytebrew.com)

> **注意**：由于数据库(PostgreSQL)和缓存(Redis)部署在Vercel上，访问可能需要科学上网工具。如果遇到访问缓慢或者无法访问问题，建议使用本地部署方式进行体验。

<p align="center">
  <a href="#简介">简介</a> •
  <a href="#特性">特性</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#贡献指南">贡献指南</a> •
  <a href="#许可证">许可证</a>
</p>

## 简介

SoybeanAdmin NestJS 是一个基于 NestJS 的后台管理系统脚手架，采用 monorepo 结构设计。它为开发者提供了一个灵活、模块化的起点，内置基础的权限管理功能，旨在帮助快速构建高质量的企业级管理系统。

本项目的后端基于 NestJS 框架，提供了多种架构模式供选择，包括传统的 MVC 模式（在 base-demo 中展示）以及更高级的 CQRS 和 DDD 设计模式（在 base-system 中实现）。它集成了 Prisma ORM 用于数据库操作，为开发提供了极大的便利。

前端采用了最新的技术栈，包括 Vue3、Vite5、TypeScript、Pinia 和 UnoCSS，结合了丰富的主题配置和组件。

无论您是要开发一个小型的管理后台，还是构建 CMS 等企业应用，SoybeanAdmin NestJS 都能为您提供一个坚实的起点和高效的开发体验。本项目提供了灵活可扩展的基础，您可以根据自己的需求和偏好进行定制和扩展。

值得注意的是，虽然项目中包含了CQRS和DDD设计的示例，但这并不是强制性的。在 `base-demo` 目录中，我们展示了如何根据个人喜好和业务需求来组织代码结构。您可以完全按照自己的业务规范来使用这个脚手架，不必严格遵循CQRS或DDD的模式。这种灵活性使得SoybeanAdmin NestJS 能够适应各种不同的开发风格和项目需求。

## 特性

- **模块化设计**：采用 NestJS 的模块系统，实现高内聚、低耦合的代码组织。
- **多种架构模式**：支持传统 MVC、CQRS 和 DDD 设计模式，满足不同复杂度的项目需求。
- **Monorepo 结构**：便于管理多个相关的项目和共享代码。
- **Prisma ORM**：提供类型安全的数据库操作。
- **自动化路由**：简化 API 端点的管理。
- **权限管理**：内置基于角色的访问控制（RBAC）系统。
- **JWT 认证**：安全的用户认证和授权机制。
- **API 文档**：自动生成 Swagger API 文档。
- **环境配置**：支持多环境配置。
- **前端技术栈**：Vue3、Vite5、TypeScript、Pinia 和 UnoCSS。
- **主题定制**：丰富的主题配置选项。
- **国际化支持**：轻松实现多语言支持。

## 项目结构

```
soybean-admin-nestjs/
├── backend/                 # 后端代码
│   ├── .http/               # HTTP 请求文件
│   ├── apps/                # 应用模块
│   │   ├── base-demo/       # 基础演示模块（MVC 模式）
│   │   └── base-system/     # 基础系统模块（CQRS/DDD 模式）
│   │       └── src/
│   │           ├── api/     # API 接口
│   │           ├── infra/   # 基础设施
│   │           ├── lib/     # 领域模块
│   │           └── resources/ # 资源文件
│   ├── dist/                # 编译输出目录
│   ├── libs/                # 共享库
│   │   ├── bootstrap/       # 启动模块
│   │   ├── config/          # 配置模块
│   │   ├── constants/       # 常量定义
│   │   ├── global/          # 全局模块
│   │   ├── infra/           # 基础设施
│   │   │   ├── adapter/     # 适配器
│   │   │   ├── decorators/  # 装饰器
│   │   │   ├── filters/     # 过滤器
│   │   │   ├── guard/       # 守卫
│   │   │   ├── interceptors/# 拦截器
│   │   │   ├── rest/        # REST 相关
│   │   │   └── strategies/  # 策略
│   │   ├── shared/          # 共享模块
│   │   │   ├── errors/      # 错误处理
│   │   │   ├── ip2region/   # IP 地址转换
│   │   │   ├── oss/         # 对象存储
│   │   │   ├── prisma/      # Prisma 相关
│   │   │   └── redis/       # Redis 相关
│   │   ├── typings/         # 类型定义
│   │   └── utils/           # 工具函数
│   ├── node_modules/        # 依赖包
│   └── prisma/              # Prisma 配置和迁移
├── frontend/                # 前端代码
└── README.md                # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js: 18.x.x 或更高版本
- PostgreSQL: 13.x 或更高版本
- Redis: 6.x 或更高版本
- pnpm: 8.x.x 或更高版本
- Docker (推荐): 20.x.x 或更高版本

### 快速开始（推荐方式）

使用 Docker Compose 一键启动所有服务（包含 PostgreSQL、Redis 等依赖）：

```bash
docker-compose -p soybean-admin-nest up -d
```

启动后即可访问：

- 前端页面：`http://localhost:9527`
- 后端接口：`http://localhost:9528/v1`
- Swagger文档：`http://127.0.0.1:9528/api-docs`

### 手动安装与配置

#### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
pnpm install

# 安装前端依赖
cd frontend
pnpm install
```

#### 2. 配置环境

1. 数据库配置：
   - 确保 PostgreSQL 服务已启动
   - 创建新的数据库
   - 更新 `backend/.env` 中的数据库连接信息

2. Redis配置：
   - 确保 Redis 服务已启动
   - 在 `backend/libs/config/src/redis.config.ts` 下修改 Redis 连接配置

3. 其他配置：
   - 检查并按需修改 `backend/libs/config/src` 下的其他配置文件

#### 3. 数据库初始化

```bash
cd backend

# 方式一：使用 Makefile（推荐）
make init_migration

# 方式二：直接使用 prisma 命令
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma db seed
```

#### 4. 生成 Prisma 客户端

```bash
pnpm prisma:generate
```

> 注意：此命令用于生成 Prisma 客户端代码，使 TypeScript 能够识别数据库模型，与数据库迁移无关。
> 在首次运行或 schema 变更后必须执行此命令。

#### 5. 运行项目

```bash
# 后端
cd backend
pnpm start:dev

# 前端
cd frontend
pnpm dev
```

访问 `http://localhost:9527` 查看运行结果。

### 开发说明

1. **数据库变更流程**：
   - 修改 `prisma/schema.prisma`
   - 执行 `make generate_migration` 生成迁移文件
   - 执行 `make deploy_migration` 应用迁移

2. **配置文件说明**：
   所有配置文件位于 `backend/libs/config`：
   - `database.config.ts`: 数据库配置
   - `redis.config.ts`: Redis 配置
   - `jwt.config.ts`: JWT 配置
   - 等等...

3. **环境变量**：
   - 开发环境：`.env`
   - 生产环境：`.env.production` 自行创建
   - 测试环境：`.env.test` 自行创建

### 注意事项

1. 首次运行必须执行数据库初始化
2. 修改 schema 后需要重新生成 Prisma 客户端
3. 建议使用 Docker 方式启动，可以避免环境配置问题

## 技术栈

### 后端

- NestJS
- Prisma
- PostgreSQL
- TypeScript
- Jest

### 前端

- Vue 3
- Vite 5
- TypeScript
- Pinia
- UnoCSS

## 贡献者

感谢以下贡献者的贡献。如果您想为本项目做出贡献，请参考 [贡献指南](#贡献指南)。

<a href="https://github.com/honghuangdc/soybean-admin-nestjs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=honghuangdc/soybean-admin-nestjs" />
</a>

## 贡献指南

我们非常欢迎您的贡献！如果您有任何改进意见或功能建议，请在 GitHub 上给我们一个 ⭐️，这是对我们持续改进和添加新功能的最大动力！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 将您的改动推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

请确保遵循我们的代码规范和提交消息格式。
