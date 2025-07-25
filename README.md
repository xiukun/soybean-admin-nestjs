# 🚀 Soybean Admin NestJS 低代码平台

<div align="center">

![Logo](https://via.placeholder.com/200x80/1890ff/ffffff?text=Soybean+Admin)

**基于 NestJS + Vue3 + TypeScript 的企业级低代码开发平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D4.9.0-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10-blue.svg)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[快速开始](docs/quick-start.md) • [用户手册](docs/user-manual.md) • [API文档](docs/api-reference.md) • [在线演示](https://demo.soybean-admin.com)

</div>

---

## ✨ 特性亮点

### 🎨 可视化设计
- **拖拽式实体设计器** - 直观的实体关系建模
- **实时设计验证** - 智能错误检测和修复建议
- **多种关系支持** - 一对一、一对多、多对多关系
- **自动布局算法** - 智能的画布布局优化

### 🏗️ 分层代码架构
- **Base/Biz分层** - 基础代码与业务代码完全分离
- **智能代码生成** - 支持Controller、Service、Repository、DTO等
- **模板引擎** - 强大的Handlebars模板系统
- **任务管理** - 完整的代码生成任务监控

### 🔐 企业级安全
- **统一JWT认证** - 跨微服务的统一认证体系
- **RBAC权限控制** - 基于角色的细粒度权限管理
- **安全装饰器** - 丰富的认证和授权装饰器
- **令牌管理** - 自动刷新和黑名单机制

### 📊 性能监控
- **实时监控** - 系统资源和API性能监控
- **健康检查** - 多维度的系统健康状态检查
- **Prometheus集成** - 标准化的监控指标导出
- **告警机制** - 智能的性能告警和通知

### 🐳 容器化部署
- **Docker支持** - 完整的容器化部署方案
- **一键部署** - 自动化的部署和初始化脚本
- **环境隔离** - 开发、测试、生产环境配置
- **服务编排** - Docker Compose多服务管理

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层 (Frontend)                      │
├─────────────────────────────────────────────────────────────┤
│  Vue 3 + TypeScript + Naive UI + Amis 组件                  │
│  • 统一路由管理  • 环境配置  • API服务集成                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API网关层                               │
├─────────────────────────────────────────────────────────────┤
│  • 统一JWT认证  • 请求路由  • 负载均衡  • 监控统计           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│   主后端服务     │  低代码平台服务   │    Amis后端服务         │
│  (Backend)      │  (Lowcode)      │  (Amis-Backend)        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • 用户管理       │ • 实体设计器     │ • 页面配置管理           │
│ • 权限控制       │ • 模板管理       │ • 组件数据源             │
│ • 系统配置       │ • 代码生成       │ • 表单处理               │
│ • 基础服务       │ • 性能监控       │ • 数据查询               │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Redis + 文件存储                              │
│  • 业务数据  • 缓存  • 会话  • 文件资源                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 系统要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 最低4GB，推荐8GB+
- **磁盘空间**: 最低10GB可用空间

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/your-org/soybean-admin-nestjs.git
cd soybean-admin-nestjs

# 2. 环境配置
cp .env.docker.example .env.docker

# 3. 一键启动
chmod +x scripts/deploy.sh
./scripts/deploy.sh init
./scripts/deploy.sh start prod

# 4. 验证部署
./scripts/deploy.sh health
```

### 访问系统

- 🌐 **前端应用**: http://localhost:3001
- 📚 **API文档**: http://localhost:9528/api/docs
- 🎨 **低代码平台**: http://localhost:3000/api/docs

**默认账户**: admin / admin123

> 📖 详细部署指南请参考 [快速开始文档](docs/quick-start.md)

---

## 📚 文档导航

| 文档 | 描述 | 链接 |
|------|------|------|
| 🚀 快速开始 | 5分钟快速部署和第一个项目 | [quick-start.md](docs/quick-start.md) |
| 📖 用户手册 | 完整的功能使用指南 | [user-manual.md](docs/user-manual.md) |
| 📋 API参考 | 详细的API接口文档 | [api-reference.md](docs/api-reference.md) |
| 🛠️ 开发指南 | 开发和扩展指南 | [development-guide.md](docs/development-guide.md) |
| 🐳 部署指南 | 生产环境部署指南 | [deployment-guide.md](docs/deployment-guide.md) |
| ❓ 常见问题 | 问题解答和故障排查 | [faq.md](docs/faq.md) |
---

## 🎯 核心功能

### 🎨 实体设计器

<details>
<summary>点击展开详情</summary>

- **可视化设计界面** - 拖拽式实体关系建模
- **实时验证** - 智能的设计错误检测和修复建议
- **关系管理** - 支持一对一、一对多、多对多关系
- **字段配置** - 丰富的字段类型和验证规则
- **画布管理** - 版本控制和协作功能

```typescript
// 实体定义示例
const userEntity = {
  code: 'user',
  name: 'User',
  description: '系统用户',
  fields: [
    {
      name: 'username',
      type: 'string',
      required: true,
      unique: true,
      validation: {
        pattern: '^[a-zA-Z0-9_]{3,20}$',
        message: '用户名只能包含字母、数字和下划线，长度3-20位'
      }
    }
  ]
};
```

</details>

### 🏗️ 分层代码生成

<details>
<summary>点击展开详情</summary>

- **Base层** - 自动生成的基础CRUD代码，不可手动修改
- **Biz层** - 可扩展的业务逻辑层，支持自定义开发
- **Shared层** - 共享工具和组件
- **Test层** - 自动生成的测试代码

```
generated/project-name/
├── base/                 # 基础层（自动生成）
│   ├── controllers/      # 基础控制器
│   ├── services/         # 基础服务
│   └── repositories/     # 基础仓储
├── biz/                  # 业务层（可修改）
│   ├── controllers/      # 业务控制器
│   └── services/         # 业务服务
├── shared/               # 共享层
└── test/                 # 测试层
```

</details>

### 🔐 统一认证系统

<details>
<summary>点击展开详情</summary>

- **JWT认证** - 跨微服务的统一认证体系
- **RBAC权限** - 基于角色的访问控制
- **权限装饰器** - 丰富的认证和授权装饰器
- **令牌管理** - 自动刷新和黑名单机制

```typescript
// 权限控制示例
@Controller('users')
export class UserController {
  @Get()
  @JwtAuthWithPermissions('user:read')
  async getUsers() {
    // 需要 user:read 权限
  }

  @Post()
  @JwtAuthWithRoles('admin')
  async createUser() {
    // 需要 admin 角色
  }
}
```

</details>

### 📊 性能监控

<details>
<summary>点击展开详情</summary>

- **实时监控** - 系统资源和API性能监控
- **健康检查** - 多维度的系统健康状态
- **Prometheus集成** - 标准化监控指标
- **告警机制** - 智能告警和通知

```typescript
// 性能监控装饰器
@Injectable()
export class UserService {
  @MonitorPerformance({
    operation: 'UserService.findUsers',
    slowThreshold: 500
  })
  async findUsers() {
    // 自动监控方法性能
  }
}
```

</details>

---

## 🛠️ 技术栈

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **监控**: 自研性能监控系统
- **模板引擎**: Handlebars

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI组件**: Naive UI + Amis
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

### 部署技术栈
- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **反向代理**: Nginx
- **监控**: 内置监控系统

---

## 📈 项目状态

### 已完成功能 ✅

- [x] **统一JWT认证系统** - 跨微服务认证体系
- [x] **可视化实体设计器** - 拖拽式实体关系建模
- [x] **分层代码生成架构** - Base/Biz分层代码生成
- [x] **性能监控系统** - 实时监控和健康检查
- [x] **模板管理系统** - Handlebars模板引擎
- [x] **Docker部署方案** - 一键部署和环境管理
- [x] **Swagger文档优化** - 统一API文档
- [x] **前端集成优化** - 统一API服务管理

### 开发中功能 🚧

- [ ] **Amis低代码业务服务生成** - 完整的业务代码生成
- [ ] **单表CRUD接口生成** - 符合Amis规范的接口
- [ ] **多表关联接口生成** - 复杂查询接口生成
- [ ] **接口参数配置系统** - 可视化参数配置
- [ ] **低代码设计器集成** - 与设计器深度集成
- [ ] **前端Amis组件适配** - 无缝数据对接

### 计划功能 📋

- [ ] **工作流引擎** - 可视化业务流程设计
- [ ] **报表系统** - 动态报表生成和展示
- [ ] **多租户支持** - 企业级多租户架构
- [ ] **插件系统** - 可扩展的插件机制
- [ ] **国际化支持** - 多语言界面支持

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 配置
- 编写单元测试和集成测试
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/)

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

特别感谢：
- [NestJS](https://nestjs.com/) - 强大的 Node.js 框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Prisma](https://prisma.io/) - 现代数据库工具包
- [Amis](https://aisuda.bce.baidu.com/amis/) - 低代码前端框架

---

## 📞 联系我们

- **GitHub Issues**: [提交问题](https://github.com/your-org/soybean-admin-nestjs/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/your-org/soybean-admin-nestjs/discussions)
- **邮箱**: support@soybean-admin.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

**🚀 让我们一起构建更好的低代码开发平台！**

</div>


