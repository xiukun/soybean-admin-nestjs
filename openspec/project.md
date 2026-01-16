# Project Context

## Purpose
- 提供可快速二开的企业级后台管理与低代码设计能力，覆盖权限、菜单、角色、租户等常见后台场景。
- 后端以 NestJS monorepo 为骨架，既支持简单 MVC，也支持 CQRS/DDD，兼顾快速开发与复杂业务扩展。
- 前端提供 Vue3 管理端和 AMIS 低代码设计器（React），帮助以低成本搭建业务页面与表单。

## Tech Stack
### Backend
- NestJS 11.x + TypeScript 5（严格模式），Prisma 6.x，PostgreSQL 13+，Redis 6+。
- 认证与授权：JWT、Casbin（RBAC）。
- API 文档与安全：Swagger/OpenAPI、Helmet、CORS、限流。
- 测试：Jest + SuperTest。

### Frontend
- Vue 3 + Vite 5/6、TypeScript 严格模式、Pinia、Vue Router 4、Vue I18n。
- UI 与样式：Naive UI、UnoCSS、Iconify。

### Lowcode Designer
- React 18 + Vite 5、TypeScript 5、AMIS 6.x（低代码引擎），可扩展自定义组件/插件。

### DevOps
- pnpm 工作区、Docker/Docker Compose、本地脚本 `start-services.sh`，CI/CD 使用 GitHub Actions（lint、typecheck、test、build、push 镜像）。

## Project Conventions
### Code Style
- TypeScript 全局严格模式，禁止隐式 any；命名：目录/文件 kebab-case，组件/类/接口 PascalCase，变量 camelCase，常量 UPPER_SNAKE_CASE。
- 导入顺序：内置模块 → 外部依赖 → 内部路径分组，组内字母序且组间空行（后端/前端分别遵循对应 ESLint 规则）。
- 格式化：Prettier（单引号、分号、2 空格、尾随逗号 es5，行宽 120）；提交前 lint+格式化+类型检查。
- 接口返回遵循 AMIS 规范：`{ status: 0, msg: string, data: object }`；禁止直接返回裸字符串/数组。
- 分页协议：请求参数 `page`/`perPage`，返回 `pageNum`/`pageSize`/`total`/`options`。

### Architecture Patterns
- 后端：`base-demo` 采用 MVC；`base-system` 采用 CQRS/DDD（API 层→应用层→领域层→基础设施层），强调依赖倒置和领域隔离。
- 前端：Vue 组件化 + Composition API，状态集中在 Pinia，复用逻辑抽取为 hooks/composables，路由与页面分层清晰。
- 低代码设计器：基于 AMIS 6.x，React 组件 + 插件可扩展，后端通过 REST API 提供数据与存储能力。

### Testing Strategy
- 后端：Jest 单测 + SuperTest E2E，关键功能覆盖率目标 80%+；测试文件 `*.spec.ts`。
- 前端：Vue Test Utils + Jest/其它测试框架；E2E 可用 Cypress/Playwright；测试文件 `*.spec.ts` 或 `*.test.ts`。
- 提交前建议运行 lint、typecheck、test 以保持质量。

### Git Workflow
- 分支：`main`（生产）、`develop`（开发）、`feature/*`、`bugfix/*`、`hotfix/*`。
- 提交信息遵循 Conventional Commits（如 `feat(auth): ...`）。
- 使用 pnpm；monorepo 工作区为 `frontend`、`backend`。
- CI 包含 lint/typecheck/test/build；本地 pre-commit 执行 lint 与类型检查。

## Domain Context
- 场景：企业后台管理与低代码页面构建，核心能力包含用户/角色/菜单/权限（Casbin）、JWT 登录、表单/列表页面配置、页面低代码设计与发布。
- 模块：后端 `base-system` 为主业务（权限、菜单、租户等），`base-demo` 为示例；前端管理端配合后端 RBAC；低代码设计器用于 AMIS Schema 的可视化设计与存储。

## Important Constraints
- 默认使用 Docker Compose 启动全栈；也可手动安装但需 Node 20+/pnpm 9+、PostgreSQL/Redis。
- 开发阶段可直接调整 SQL 与 seed 数据（保持本地与 docker 数据一致），注意避免遗漏同步。
- 环境变量：后端 `.env/.env.production/.env.test`，前端 Vite 变量需 `VITE_` 前缀；敏感信息不可入库。
- 保持 TypeScript 严格与命名/导入规范；目录使用 kebab-case；遵循 AMIS 接口返回/分页约定。
- 优先简单实现（KISS/YAGNI），避免过度设计；遵循 SOLID、DRY、关注点分离。

## External Dependencies
- 基础服务：PostgreSQL、Redis。
- 认证与权限：JWT、Casbin。
- ORM 与工具：Prisma、Cache Manager、Helmet、CORS、Swagger/OpenAPI。
- 前端生态：Naive UI、UnoCSS、Iconify、Vue Router、Pinia、Vue I18n。
- 低代码：AMIS 6.x（React）及其插件机制。
- 容器与部署：Docker/Docker Compose，CI 使用 GitHub Actions。
