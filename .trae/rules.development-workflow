# Damai Lowcode Admin - 开发工作流规则

## 开发环境设置

### 前提条件
- Node.js: 20.x 或更高版本
- pnpm: 9.x 或更高版本
- Docker: 20.10.x 或更高版本（用于容器化开发）
- Git: 2.30.x 或更高版本

### 初始化设置
1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd damai-lowcode-admin
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **设置环境变量**
   - 基于示例创建后端和前端的 `.env` 文件
   - 配置数据库、Redis 和其他服务连接

### Docker 开发（推荐）
1. **使用 Docker Compose 启动所有服务**
   ```bash
   ./start-services.sh
   # 或
   docker-compose up --build -d
   ```

2. **访问服务**
   - 前端: http://localhost:9527
   - 低代码设计器: http://localhost:9555
   - 后端 API: http://localhost:9528/v1
   - API 文档: http://localhost:9528/api-docs

## 后端开发工作流

### 项目结构
- **应用程序**: 位于 `backend/apps/` 目录
- **共享库**: 位于 `backend/libs/` 目录
- **Prisma Schema**: `backend/prisma/schema.prisma`

### 开发命令
- **安装依赖**: `pnpm install`
- **启动开发服务器**: `pnpm dev`
- **构建生产版本**: `pnpm build`
- **运行测试**: `pnpm test`
- **代码 lint**: `pnpm lint`
- **类型检查**: `pnpm typecheck`

### 使用 Prisma 进行数据库开发
1. **生成 Prisma Client**: `pnpm prisma:generate`
2. **创建迁移**: `pnpm prisma:migrate:dev`
3. **运行种子数据**: `pnpm prisma:seed`
4. **打开 Prisma Studio**: `pnpm prisma:studio`

### 添加新模块
1. **创建新应用**: `nest g app <app-name>`
2. **创建新库**: `nest g lib <lib-name>`
3. **生成模块**: `nest g module <module-name> --project <app-name>`
4. **生成控制器**: `nest g controller <controller-name> --project <app-name>`
5. **生成服务**: `nest g service <service-name> --project <app-name>`

## 前端开发工作流

### 项目结构
- **源代码**: 位于 `frontend/src/` 目录
- **组件**: `frontend/src/components/`
- **页面/视图**: `frontend/src/views/`
- **状态管理**: `frontend/src/store/`
- **服务**: `frontend/src/service/`

### 开发命令
- **安装依赖**: `pnpm install`
- **启动开发服务器**: `pnpm dev`（测试模式）或 `pnpm dev:prod`（生产模式）
- **构建生产版本**: `pnpm build`
- **预览生产构建**: `pnpm preview`
- **代码 lint**: `pnpm lint`
- **类型检查**: `pnpm typecheck`

### 添加新功能
1. **创建新组件**: 使用 PascalCase 命名组件
2. **添加路由**: 更新 `frontend/src/router/routes/`
3. **添加 Store 模块**: 使用 Pinia 进行状态管理
4. **添加 API 服务**: 添加到 `frontend/src/service/` 目录

### 组件开发
- **使用 `<script setup>` 语法**编写 Vue 3 组件
- **TypeScript**: 始终使用严格类型
- **SCSS**: 尽可能使用 scoped 样式
- **组合式 API**: 利用 Vue 3 组合式 API

## 数据库工作流

### Prisma Schema 变更
1. **修改 schema.prisma**: 更新 `backend/prisma/schema.prisma` 中的数据模型
2. **生成迁移**: `pnpm prisma:migrate:dev` - 这将创建一个新的迁移文件
3. **运行迁移**: 上述命令运行时会自动应用迁移
4. **生成 Client**: `pnpm prisma:generate` 更新 Prisma client
5. **运行种子数据**: `pnpm prisma:seed` 填充测试数据

### 种子数据
- 种子文件位于 `backend/prisma/seeds/`
- 使用 `pnpm prisma:seed` 运行种子数据
- 种子数据使用 TypeScript 编写

## 测试策略

### 后端测试
- **单元测试**: 位于 `*.spec.ts` 文件中
- **E2E 测试**: 位于 `test/` 目录中
- **运行测试**: `pnpm test`
- **运行特定测试**: `pnpm test <test-file>`

### 前端测试
- **单元测试**: 使用 Vue Test Utils 和 Jest
- **组件测试**: 隔离测试 Vue 组件
- **E2E 测试**: 使用 Cypress 或 Playwright

### 测试覆盖率
- 关键功能的测试覆盖率目标为 80%+ 
- 测试边缘情况
- 模拟外部依赖

## 代码质量

### 代码检查与格式化
- **Lint**: 提交前运行 `pnpm lint`
- **格式化**: Prettier 配置为自动格式化代码
- **类型检查**: 运行 `pnpm typecheck` 检查 TypeScript 错误

### Git 钩子
- **pre-commit**: 运行 linting 和类型检查
- **commit-msg**: 验证提交消息格式

## CI/CD 管道

### 持续集成
1. **代码推送到功能分支**
2. **CI 运行**: linting、类型检查和测试
3. **构建**: 创建生产构建
4. **测试**: 运行单元测试和 E2E 测试

### 持续部署
1. **合并到 main 分支**: 触发部署到暂存环境
2. **推送到 release/* 分支**: 部署到生产环境
3. **步骤**:
   - 检出代码
   - 设置 Node.js
   - 安装依赖
   - Lint 和类型检查
   - 运行测试
   - 构建 Docker 镜像
   - 推送到容器注册表
   - 部署到目标环境

## Git 工作流

### 分支策略
- **main**: 生产就绪代码
- **develop**: 开发分支
- **feature/**: 功能分支（例如：`feature/auth-system`）
- **bugfix/**: Bug 修复分支（例如：`bugfix/login-error`）
- **hotfix/**: 生产环境紧急修复（例如：`hotfix/security-vulnerability`）

### 提交消息格式
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式:

```
<type>[可选 scope]: <description>

[可选 body]

[可选 footer(s)]
```

#### 类型示例
- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档变更
- **style**: 代码风格变更（格式化等）
- **refactor**: 代码重构
- **test**: 添加或更新测试
- **chore**: 构建过程或辅助工具变更
- **perf**: 性能改进
- **ci**: CI 配置变更
- **revert**: 回滚之前的提交

### Pull Request 流程
1. **从 develop 创建功能分支**
2. **实现变更**并编写测试
3. **本地运行所有测试**: `pnpm test && pnpm lint && pnpm typecheck`
4. **推送分支**并创建 Pull Request
5. **代码审查**: 至少需要一名审查者批准
6. **CI 通过**: 所有自动化检查必须通过
7. **合并**: 合并到 develop 分支

## 发布流程

1. **更新版本**: 在 package.json 文件中更新版本号
2. **创建发布分支**: 从 main 创建 `release/vX.Y.Z` 分支
3. **彻底测试**: 运行完整测试套件
4. **标记发布**: 创建 Git 标签 `vX.Y.Z`
5. **发布**: 部署到生产环境
6. **合并回**: 将发布分支合并回 main 和 develop 分支

## 文档

### 代码文档
- 使用 JSDoc/TSDoc 为函数、类和模块编写文档
- 记录所有公共 API
- 在适当的地方包含使用示例

### 项目文档
- 主要变更更新 README.md
- 新功能记录到相应的文件
- 后端变更更新 API 文档

## 安全考虑

### 开发
- 切勿将机密信息提交到代码仓库
- 对敏感配置使用环境变量
- 对所有用户输入进行 sanitize
- 验证所有 API 请求

### 代码审查
- 审查安全漏洞
- 检查适当的认证/授权
- 验证输入验证
- 确保使用安全依赖

## 故障排除

### 常见问题
1. **数据库连接错误**: 验证 Docker 容器是否运行以及环境变量是否正确
2. **依赖冲突**: 使用 pnpm 代替 npm/yarn
3. **Prisma 客户端错误**: 使用 `pnpm prisma:generate` 重新生成客户端
4. **Docker 问题**: 使用 `docker-compose down -v` 重置卷并重新启动

### 日志
- **后端日志**: 位于 `backend/logs/` 目录
- **Docker 日志**: `docker-compose logs <service-name>`
- **前端日志**: 检查浏览器开发者控制台

## 最佳实践

1. **编写干净、可维护的代码**: 遵循 SOLID 原则
2. **尽早测试、经常测试**: 为新功能编写测试
3. **保持拉取请求小**: 专注于一个功能或 bug 修复
4. **记录变更**: 更新文档以记录新功能
5. **严格使用 TypeScript**: 避免 `any` 类型并启用严格模式
6. **自我审查**: 在提交前检查自己的代码
7. **遵循现有模式**: 与项目架构保持一致
8. **定期更新依赖**: 定期更新依赖以获取安全补丁