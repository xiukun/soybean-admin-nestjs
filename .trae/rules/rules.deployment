# Damai Lowcode Admin - 部署指南

## 概述
本文档提供了在各种环境中部署 Damai Lowcode Admin 的指南。该项目支持基于 Docker 的部署（推荐）和手动部署。

## 部署选项

| 部署类型 | 复杂度 | 推荐用途 |
|----------|--------|----------|
| Docker Compose | 低 | 开发、测试、小型生产环境 |
| 手动部署 | 中 | 自定义基础设施、企业生产环境 |
| Kubernetes | 高 | 大规模生产环境、高可用性 |

## Docker 部署（推荐）

### 使用 start-services.sh 脚本
1. **确保 Docker 正在运行**
2. **执行启动脚本**
   ```bash
   ./start-services.sh
   ```
3. **该脚本将**：
   - 构建所有 Docker 镜像
   - 在后台模式下启动所有服务
   - 配置必要的网络和卷
   - 设置环境变量

### 直接使用 Docker Compose
1. **构建并启动服务**
   ```bash
   docker-compose up --build -d
   ```

2. **停止服务**
   ```bash
   docker-compose down
   ```

3. **停止服务并删除卷**（重置所有数据）
   ```bash
   docker-compose down -v
   ```

### 服务端点
| 服务 | URL | 描述 |
|------|------|------|
| 前端 | http://localhost:9527 | 主应用前端 |
| 低代码设计器 | http://localhost:9555 | AMIS 低代码设计器 |
| 后端 API | http://localhost:9528/v1 | 后端 API 端点 |
| API 文档 | http://localhost:9528/api-docs | Swagger UI 文档 |
| PostgreSQL | localhost:25432 | 数据库（暴露端口） |
| Redis | localhost:26379 | Redis 缓存（暴露端口） |

### Docker Compose 配置
- **主配置**: `docker-compose.yml`
- **仅设计器配置**: `docker-compose.designer-only.yml`
- **服务**:
  - `frontend`: Vue 3 应用
  - `lowcode-designer`: React 低代码设计器
  - `backend`: NestJS 后端应用
  - `postgres`: PostgreSQL 数据库
  - `redis`: Redis 缓存

## 手动部署

### 后端部署

1. **前提条件**
   - Node.js 20.x+ 和 pnpm 9.x+
   - PostgreSQL 13.x+ 和 Redis 6.x+

2. **构建后端**
   ```bash
   cd backend
   pnpm install
   pnpm build
   ```

3. **设置环境变量**
   - 创建 `.env.production` 文件，包含生产配置
   - 配置数据库、Redis 和其他服务连接

4. **运行迁移和种子数据**
   ```bash
   pnpm prisma:migrate:deploy
   pnpm prisma:seed
   ```

5. **启动后端**
   ```bash
   pnpm start:prod
   # 或使用进程管理器如 PM2
   pm2 start --name soybean-backend npm -- start:prod
   ```

### 前端部署

1. **前提条件**
   - Node.js 20.x+ 和 pnpm 9.x+
   - Web 服务器（Nginx、Apache 等）

2. **构建前端**
   ```bash
   cd frontend
   pnpm install
   pnpm build
   ```

3. **设置环境变量**
   - 创建 `.env.production` 文件，包含生产配置
   - 设置 `VITE_API_URL` 指向后端 API

4. **部署到 Web 服务器**
   - 将 `dist` 目录复制到 Web 服务器的文档根目录
   - 配置 Nginx/Apache 以提供静态文件

### 低代码设计器部署

1. **前提条件**
   - Node.js 20.x+ 和 pnpm 9.x+
   - Web 服务器（Nginx、Apache 等）

2. **构建设计器**
   ```bash
   cd lowcode-designer
   pnpm install
   pnpm build
   ```

3. **设置环境变量**
   - 创建 `.env.production` 文件，包含生产配置
   - 设置 API 端点指向后端

4. **部署到 Web 服务器**
   - 将 `dist` 目录复制到 Web 服务器的文档根目录
   - 配置 Nginx/Apache 以提供静态文件

## 生产环境的环境配置

### 后端生产环境

#### 必需的环境变量
```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/soybean?schema=public"

# JWT 配置
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Redis 配置
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# 服务器配置
PORT=3000
NODE_ENV="production"

# 安全配置
SECURITY_CORS_ENABLED=true
SECURITY_RATE_LIMIT_ENABLED=true
```

#### 推荐的生产设置
- **启用 HTTPS**: 生产环境始终使用 HTTPS
- **设置强密码**: 对于数据库、Redis 和其他服务
- **限制 CORS 来源**: 限制为特定域名
- **启用限流**: 防止暴力攻击
- **使用反向代理**: Nginx 或 Caddy 用于 SSL 终止和负载均衡

### 前端生产环境

#### 必需的环境变量
```bash
# API 配置
VITE_API_URL="https://api.your-domain.com/v1"

# 构建配置
VITE_DROP_CONSOLE=true
VITE_OUT_DIR="dist"
```

#### 推荐的生产设置
- **启用 gzip/brotli 压缩**: 配置 Web 服务器压缩资源
- **设置长缓存头**: 对于静态资源
- **使用 CDN**: 用于提供静态文件
- **启用 HTTPS**: 始终在生产环境中使用 HTTPS

## 扩展考虑

### 水平扩展
1. **后端**: 负载均衡器后的多个实例
2. **前端**: 共享静态资源的多个实例
3. **数据库**: 考虑使用只读副本扩展读取
4. **Redis**: 使用 Redis Cluster 实现高可用性和可扩展性

### 负载均衡
- **后端**: 使用 Nginx、Caddy 或云负载均衡器
- **前端**: 使用 CDN 或云负载均衡器
- **会话亲和性**: 不需要（JWT 是无状态的）

### 数据库扩展
1. **PostgreSQL**:
   - 使用只读副本扩展读取
   - 非常大数据集考虑分片
   - 使用连接池（PgBouncer）

2. **Redis**:
   - 使用 Redis Cluster 实现高可用性
   - 考虑使用 Redis Sentinel 进行主从复制

## 监控和日志

### 后端日志
- **日志文件**: 位于 `backend/logs/` 目录
- **日志级别**: 在环境变量中配置（DEBUG, INFO, WARN, ERROR）
- **结构化日志**: 用于机器可读性的 JSON 格式
- **日志轮换**: 默认启用

### 前端监控
- **错误跟踪**: 考虑使用 Sentry 或 LogRocket
- **性能监控**: 考虑使用 Lighthouse CI 或 Google PageSpeed Insights
- **用户分析**: 可选，使用隐私友好的解决方案

### 基础设施监控
- **服务器指标**: Prometheus + Grafana
- **Docker 监控**: cAdvisor、Prometheus Docker Exporter
- **数据库监控**: PostgreSQL Exporter for Prometheus
- **Redis 监控**: Redis Exporter for Prometheus

## 备份和恢复

### 数据库备份
1. **自动备份**: 设置 pg_dump 或 pgBackRest
2. **备份计划**: 每日完整备份，每小时增量备份
3. **备份存储**: 异地存储（S3、GCS 等）
4. **恢复测试**: 定期测试备份恢复

### 配置备份
1. **环境变量**: 安全备份 `.env` 文件
2. **数据库 Schema**: 备份 Prisma schema 和迁移
3. **配置文件**: 备份关键配置文件

## CI/CD 部署

### GitHub Actions 工作流
1. **工作流文件**: `.github/workflows/deploy.yml`
2. **触发器**:
   - 推送到 `main` 分支: 部署到暂存环境
   - 推送到 `release/*` 分支: 部署到生产环境
3. **步骤**:
   - 检出代码
   - 设置 Node.js
   - 安装依赖
   - Lint 和类型检查
   - 运行测试
   - 构建 Docker 镜像
   - 推送到容器注册表
   - 部署到目标环境

### 自动部署步骤
1. **后端**:
   - 构建并推送 Docker 镜像
   - 在生产服务器上拉取镜像
   - 重启容器
   - 运行数据库迁移

2. **前端**:
   - 构建生产资产
   - 部署到 CDN 或静态托管
   - 必要时使缓存失效

## 故障排除

### 常见问题
1. **数据库连接错误**: 验证 Docker 容器是否运行以及环境变量是否正确
2. **依赖冲突**: 使用 pnpm 代替 npm/yarn
3. **Prisma 客户端错误**: 使用 `pnpm prisma:generate` 重新生成客户端
4. **Docker 问题**: 使用 `docker-compose down -v` 重置卷并重新启动

### 日志
- **后端日志**: `docker exec -it soybean-backend cat logs/application.log`
- **Docker 日志**: `docker-compose logs <service-name>`
- **前端日志**: 检查浏览器开发者控制台

## 最佳实践

1. **使用 Docker 实现一致的环境**
2. **实现 CI/CD 实现自动部署**
3. **使用环境特定的配置文件**
4. **持续监控所有服务**
5. **实施适当的备份和恢复程序**
6. **在生产前在暂存环境测试部署**
7. **在所有环境中使用 HTTPS**
8. **实施适当的安全措施**
9. **记录所有部署程序**
10. **定期更新依赖项和安全补丁**

## 结论

Damai Lowcode Admin 设计为易于在各种环境中部署。推荐的基于 Docker 的部署提供了一种一致且可靠的方式，只需最少的配置即可运行所有服务。对于生产环境，请遵循本文档中概述的安全和性能准则，以确保安全且可扩展的部署。
