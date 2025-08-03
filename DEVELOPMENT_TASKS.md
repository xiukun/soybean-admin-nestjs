# SoybeanAdmin NestJS 低代码平台开发任务清单

## 📋 项目概述

基于对项目的深入分析，本文档提供了完整的开发任务清单，旨在完善低代码平台的后端和前端功能，参考 rxModels 的设计理念，实现一个功能完整、代码整洁、国际化支持的低代码平台。

## 🏗️ 技术架构总览

### 服务架构
```
┌─────────────────────────────────────────────────────────────────┐
│                    SoybeanAdmin NestJS 低代码平台                │
├─────────────────────────────────────────────────────────────────┤
│  frontend/          │  backend/           │  lowcode-platform-  │
│  (端口: 9527)       │  (端口: 9528)       │  backend/           │
│  Vue3 + Naive UI   │  NestJS + Fastify   │  (端口: 3002)       │
│  + Amis + UnoCSS   │  + PostgreSQL       │  NestJS + Fastify   │
│                    │  + Redis + Prisma   │  + PostgreSQL       │
├─────────────────────────────────────────────────────────────────┤
│  lowcode-designer/  │  amis-lowcode-      │  PostgreSQL         │
│  (端口: 9555)       │  backend/           │  (端口: 25432)      │
│  React + Amis      │  (端口: 9522)       │  + Redis            │
│  Designer          │  NestJS + Fastify   │  (端口: 26379)      │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库架构
- **backend schema**: 系统管理核心服务 (用户、角色、菜单、权限)
- **lowcode schema**: 低代码平台服务 (项目、实体、API配置)
- **amis schema**: 代码生成业务服务 (演示数据和页面模板)

## 🎯 核心开发任务

### Phase 1: 基础设施完善 (优先级: 🔴 高)

#### 1.1 数据库一致性保证
- [ ] **检查 Prisma Schema 与 SQL 文件一致性**
  - 验证 `backend/prisma/schema.prisma` 与 `deploy/postgres/*.sql` 的一致性
  - 确保 Docker 数据库与本地开发环境表结构一致
  - 修复任何不匹配的字段定义和约束

- [ ] **完善数据库初始化脚本**
  - 优化 `deploy/postgres/00_init_schemas.sql` 多 schema 初始化
  - 确保所有必要的枚举类型和约束正确创建
  - 添加数据完整性检查脚本

#### 1.2 服务启动和健康检查
- [ ] **修复 Docker Compose 配置**
  - 解决网络连接问题，优化镜像构建
  - 添加服务依赖检查和健康监控
  - 配置开发环境的热重载支持

- [ ] **实现服务间通信**
  - 配置各服务间的 API 调用
  - 实现统一的错误处理和日志记录
  - 添加服务发现和负载均衡

### Phase 2: 低代码平台核心功能 (优先级: 🔴 高)

#### 2.1 项目管理增强
- [ ] **完善项目生命周期管理**
  - 实现项目创建、配置、部署、停用的完整流程
  - 添加项目版本控制和回滚功能
  - 实现项目模板和快速创建功能

- [ ] **项目部署功能**
  - 实现项目到 amis-lowcode-backend 的自动部署
  - 添加部署状态监控和日志记录
  - 支持热更新和零停机部署

#### 2.2 实体建模系统
- [ ] **实体设计器优化**
  - 完善实体字段的类型定义和验证规则
  - 实现实体关系的可视化设计 (参考 rxModels)
  - 添加实体继承和抽象实体支持

- [ ] **通用字段自动生成**
  - 实现创建实体时自动添加 `id`, `createdAt`, `updatedAt` 等通用字段
  - 支持自定义通用字段模板
  - 添加字段约束和索引的自动生成

#### 2.3 关系管理系统
- [ ] **关系设计器 (X6 集成)**
  - 实现基于 AntV X6 的实体关系图可视化设计
  - 支持拖拽创建一对一、一对多、多对多关系
  - 添加关系验证和循环依赖检测

- [ ] **关系代码生成**
  - 自动生成 Prisma 关系定义
  - 生成关联查询的 API 接口
  - 实现级联操作和外键约束

### Phase 3: 代码生成引擎 (优先级: 🟡 中)

#### 3.1 模板管理系统
- [ ] **模板引擎优化**
  - 基于 Handlebars 实现灵活的模板系统
  - 支持模板继承和组合
  - 添加模板版本控制和发布机制

- [ ] **预置模板库**
  - NestJS Controller/Service/Module 模板
  - Prisma Schema 生成模板
  - DTO 和 Interface 模板
  - Amis 页面配置模板

#### 3.2 代码生成器 (参考 rxModels)
- [ ] **Base-Biz 双层架构生成**
  - Base 层：自动生成的基础 CRUD 代码
  - Biz 层：开发者自定义的业务逻辑
  - 实现增量生成和冲突处理

- [ ] **智能代码生成**
  - 根据实体关系自动生成关联查询
  - 支持复杂查询条件和分页
  - 生成符合 Amis 规范的 API 响应格式

### Phase 4: API 管理和测试 (优先级: 🟡 中)

#### 4.1 API 配置管理
- [ ] **动态 API 配置**
  - 支持可视化配置 API 端点
  - 实现请求/响应 Schema 定义
  - 添加 API 权限和限流配置

- [ ] **查询构建器**
  - 可视化多表关联查询设计
  - 支持复杂条件和聚合查询
  - 实现查询性能优化建议

#### 4.2 API 测试工具
- [ ] **内置 API 测试**
  - 集成类似 Postman 的 API 测试功能
  - 支持测试用例管理和自动化测试
  - 添加 API 文档自动生成

### Phase 5: 前端界面完善 (优先级: 🟢 低)

#### 5.1 低代码设计器
- [ ] **Amis 设计器集成**
  - 完善 lowcode-designer 的功能
  - 实现拖拽式页面设计
  - 添加组件库和模板市场

- [ ] **实时预览功能**
  - 设计器中的实时预览
  - 支持多设备预览
  - 添加交互式原型功能

#### 5.2 管理界面优化
- [ ] **用户体验优化**
  - 完善项目管理、实体管理等页面的交互
  - 添加操作引导和帮助文档
  - 实现快捷键和批量操作

- [ ] **国际化支持**
  - 完善中英文双语支持
  - 添加更多语言包
  - 实现动态语言切换

### Phase 6: 性能优化和测试 (优先级: 🟢 低)

#### 6.1 性能优化
- [ ] **代码生成性能优化**
  - 实现模板编译缓存
  - 优化大量实体的批量生成
  - 添加生成进度监控

- [ ] **数据库性能优化**
  - 添加必要的数据库索引
  - 实现查询性能监控
  - 优化复杂关联查询

#### 6.2 测试覆盖
- [ ] **单元测试**
  - 核心业务逻辑的单元测试
  - API 接口的集成测试
  - 代码生成功能的测试

- [ ] **端到端测试**
  - 完整业务流程的自动化测试
  - 性能测试和压力测试
  - 兼容性测试

## 🚀 快速开始指南

### 1. 环境准备
```bash
# 安装依赖
pnpm install

# 启动数据库 (Docker)
docker-compose up -d postgres redis

# 初始化数据库
cd deploy && ./setup-lowcode-platform.sh
```

### 2. 启动开发服务
```bash
# 启动后端服务
cd backend && pnpm run start:dev

# 启动低代码平台后端
cd lowcode-platform-backend && pnpm run start:dev

# 启动 Amis 后端
cd amis-lowcode-backend && pnpm run start:dev

# 启动前端
cd frontend && pnpm run dev

# 启动设计器
cd lowcode-designer && pnpm run dev
```

### 3. 访问地址
- 前端管理界面: http://localhost:9527
- 后端 API 文档: http://localhost:9528/api-docs
- 低代码平台 API: http://localhost:3002/api-docs
- Amis 后端 API: http://localhost:9522/api/v1/docs
- 低代码设计器: http://localhost:9555

## 📝 开发规范

### 代码规范
- 遵循 ESLint 和 Prettier 配置
- 使用 TypeScript 严格模式
- 函数和类必须添加中文注释
- 遵循 DDD 分层架构原则

### 提交规范
```bash
# 提交格式
git commit -m "<type>(<scope>): <subject>"

# 示例
git commit -m "feat(lowcode): 实现实体关系可视化设计器"
git commit -m "fix(backend): 修复用户权限验证问题"
git commit -m "docs(readme): 更新部署文档"
```

### API 规范
- 统一使用 `{status, msg, data}` 响应格式
- 实现 Amis 兼容的分页格式
- 添加完整的 Swagger 文档
- 实现统一的错误处理

## 🎯 里程碑目标

### Milestone 1: 基础平台 (2周)
- ✅ 数据库一致性
- ✅ 服务正常启动
- ✅ 基础 CRUD 功能

### Milestone 2: 核心功能 (4周)
- 🔄 实体建模系统
- 🔄 关系管理系统
- 🔄 代码生成引擎

### Milestone 3: 完整平台 (6周)
- ⏳ API 管理和测试
- ⏳ 前端界面完善
- ⏳ 性能优化

### Milestone 4: 生产就绪 (8周)
- ⏳ 完整测试覆盖
- ⏳ 部署和监控
- ⏳ 文档和培训

## 📚 参考资源

- [rxModels 文档](https://rxdrag.com/docs/rx-models/)
- [NestJS 官方文档](https://nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [Amis 文档](https://aisuda.bce.baidu.com/amis/)
- [AntV X6 文档](https://x6.antv.vision/)

---

**注意**: 本任务清单基于项目当前状态制定，在开发过程中可能需要根据实际情况调整优先级和时间安排。建议采用敏捷开发方式，每个 Sprint 专注于一个 Phase 的核心功能。