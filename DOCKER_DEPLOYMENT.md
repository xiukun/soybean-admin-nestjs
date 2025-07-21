# Soybean Admin NestJS Docker 部署指南

本文档介绍如何使用 Docker 部署 Soybean Admin NestJS 项目，包括前端、后端和低代码设计器。

## 🏗️ 架构概览

项目包含以下服务：

- **frontend**: 前端管理系统 (端口: 9527)
- **lowcode-designer**: 低代码设计器 (端口: 9555)
- **backend**: 后端 API 服务 (端口: 9528)
- **postgres**: PostgreSQL 数据库 (端口: 25432)
- **redis**: Redis 缓存 (端口: 26379)
- **pgbouncer**: PostgreSQL 连接池 (端口: 6432)

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 运行启动脚本（会自动检查并构建设计器）
./start-services.sh
```

### 方式二：手动启动

```bash
# 1. 首先构建低代码设计器（避免内存溢出）
./build-designer.sh

# 2. 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 方式三：仅重建设计器

```bash
# 快速重建设计器（用于更新设计器代码）
./rebuild-designer.sh
```

## 📋 服务访问地址

启动成功后，可以通过以下地址访问各个服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端管理系统 | http://localhost:9527 | 主要的管理界面 |
| 低代码设计器 | http://localhost:9555 | 页面设计器 |
| 后端 API | http://localhost:9528 | API 服务 |
| API 文档 | http://localhost:9528/api-docs | Swagger 文档 |
| PostgreSQL | localhost:25432 | 数据库 |
| Redis | localhost:26379 | 缓存服务 |
| PgBouncer | localhost:6432 | 连接池 |

## 🔐 默认登录信息

- **用户名**: admin
- **密码**: 123456

## 🛠️ 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f frontend
docker-compose logs -f lowcode-designer
docker-compose logs -f backend
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart frontend
docker-compose restart lowcode-designer
docker-compose restart backend
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 重新构建服务
```bash
# 重新构建所有服务
docker-compose build --no-cache

# 重新构建特定服务
docker-compose build --no-cache frontend
docker-compose build --no-cache lowcode-designer

# 快速重建设计器（推荐）
./rebuild-designer.sh

# 仅构建设计器静态资源
./build-designer.sh
```

### 设计器专用命令
```bash
# 构建设计器静态资源
./build-designer.sh

# 快速重建并重启设计器
./rebuild-designer.sh

# 仅启动设计器（需要外部后端）
docker-compose -f docker-compose.designer-only.yml up -d
```

## 🔧 配置说明

### 低代码设计器构建流程

为了避免在 Docker 容器中编译时出现内存溢出问题，采用了预编译的方式：

1. **本地构建**: 使用 `./build-designer.sh` 在本地编译设计器
2. **静态资源**: 编译结果保存在 `static-designer/` 目录
3. **Docker 构建**: Docker 直接复制预编译的静态资源
4. **轻量镜像**: 最终镜像只包含 Nginx + 静态文件

**构建流程**:
```bash
# 1. 本地编译（需要 Node.js 和 pnpm）
./build-designer.sh

# 2. Docker 构建（轻量级，无需编译）
docker-compose build lowcode-designer

# 3. 启动服务
docker-compose up -d lowcode-designer
```

### 环境变量

主要的环境变量配置在 `docker-compose.yml` 中：

- **数据库配置**: PostgreSQL 连接信息
- **Redis 配置**: Redis 连接信息
- **JWT 配置**: 认证相关配置
- **CORS 配置**: 跨域访问配置

### 网络配置

所有服务都在 `soybean-admin` 网络中，可以通过服务名进行内部通信。

### 数据持久化

- PostgreSQL 数据存储在 `soybean-admin-postgres_data` 卷中
- Redis 数据存储在 `soybean-admin-redis_data` 卷中

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口 9527、9555、9528、25432、26379、6432 是否被占用
   - 可以修改 `docker-compose.yml` 中的端口映射

2. **服务启动失败**
   - 查看服务日志：`docker-compose logs [service_name]`
   - 检查 Docker 和 Docker Compose 版本

3. **数据库连接失败**
   - 确保 PostgreSQL 服务已启动并健康
   - 检查数据库连接字符串配置

4. **前端无法访问后端**
   - 检查 CORS 配置
   - 确认后端服务健康状态

### 健康检查

项目配置了健康检查机制：

- **backend**: 检查 API 端点响应
- **postgres**: 检查数据库连接
- **redis**: 检查 Redis 连接

## 📝 开发说明

### 本地开发

如果需要本地开发，可以：

1. 只启动数据库和 Redis：
```bash
docker-compose up postgres redis -d
```

2. 本地运行前端和后端服务

### 自定义配置

可以通过以下方式自定义配置：

1. 修改 `docker-compose.yml` 中的环境变量
2. 创建 `.env` 文件覆盖默认配置
3. 修改各服务的 `nginx.conf` 配置文件

## 🔄 更新部署

更新代码后重新部署：

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up --build -d
```

## 🚀 增强功能

### 低代码平台服务 (端口: 3000)

新增的低代码平台服务提供以下功能：

- **项目管理**: 创建和管理低代码项目
- **实体设计**: 可视化数据模型设计
- **模板管理**: 代码生成模板管理
- **代码生成**: 智能代码生成和部署

访问地址：http://localhost:3000

### Amis后端服务 (端口: 9522)

生成代码的运行时环境：

- **动态API**: 根据实体自动生成API
- **数据管理**: 动态数据CRUD操作
- **自动初始化**: 首次运行自动创建数据库结构

访问地址：http://localhost:9522

### 自动化部署脚本

使用增强的部署和管理脚本：

```bash
# 一键部署（包含健康检查）
./deploy.sh

# 带备份的部署
./deploy.sh --backup

# 强制重建所有镜像
./deploy.sh --force-rebuild
```

### 管理工具

```bash
# 使用管理脚本
./scripts/manage.sh help

# 常用操作
./scripts/manage.sh start          # 启动服务
./scripts/manage.sh stop           # 停止服务
./scripts/manage.sh status         # 查看状态
./scripts/manage.sh logs backend   # 查看日志
./scripts/manage.sh backup         # 创建备份
./scripts/manage.sh health         # 健康检查
```

### 健康检查

```bash
# 运行健康检查
./scripts/health-check.sh

# 生成健康报告
./scripts/health-check.sh --report

# 自定义检查参数
./scripts/health-check.sh --timeout 15 --retry 5
```

## 🔧 配置说明

### 环境变量

主要环境变量配置：

```env
# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend

# 低代码平台配置
AUTO_INIT_DATA=true              # 自动初始化数据
FIRST_RUN_DETECTION=true         # 首次运行检测
AMIS_BACKEND_PATH=/app/amis-backend

# 性能监控
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
```

### 数据持久化

增强的数据持久化：

- `generated-code/` - 低代码平台生成的代码
- `amis-generated/` - Amis后端生成的代码
- `logs/` - 应用日志文件
- `amis-logs/` - Amis后端日志
- `uploads/` - 文件上传目录

## 📊 监控和维护

### 服务监控

```bash
# 查看所有服务状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看系统资源
./scripts/health-check.sh
```

### 日志管理

```bash
# 查看实时日志
./scripts/manage.sh logs

# 查看特定服务日志
./scripts/manage.sh logs lowcode-platform 100

# 查看错误日志
docker-compose logs --tail=50 | grep ERROR
```

### 备份和恢复

```bash
# 创建完整备份
./scripts/manage.sh backup

# 从备份恢复
./scripts/manage.sh restore backups/backup_20231201_120000.tar.gz

# 数据库备份
docker-compose exec postgres pg_dump -U soybean soybean-admin-nest-backend > db_backup.sql
```

## 🔐 安全配置

### 生产环境安全

1. **更改默认密码**：
   ```env
   POSTGRES_PASSWORD=your-secure-password
   REDIS_PASSWORD=your-secure-redis-password
   JWT_SECRET=your-secure-jwt-secret
   ```

2. **网络安全**：
   - 配置防火墙规则
   - 使用内网访问数据库
   - 启用SSL/TLS加密

3. **访问控制**：
   - 配置CORS策略
   - 实施API访问限制
   - 启用审计日志

## 🚨 故障排除

### 常见问题

1. **服务启动失败**：
   ```bash
   # 查看详细日志
   ./scripts/manage.sh logs service-name

   # 重启服务
   ./scripts/manage.sh restart service-name
   ```

2. **端口冲突**：
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :9527

   # 修改docker-compose.yml中的端口映射
   ```

3. **内存不足**：
   ```bash
   # 清理系统资源
   ./scripts/manage.sh cleanup

   # 调整容器内存限制
   # 编辑docker-compose.yml中的deploy.resources配置
   ```

### 性能优化

1. **数据库优化**：
   ```bash
   # 调整PostgreSQL配置
   docker-compose exec postgres psql -U soybean -c "SHOW all;"
   ```

2. **缓存优化**：
   ```bash
   # 检查Redis状态
   docker-compose exec redis redis-cli info
   ```

3. **资源监控**：
   ```bash
   # 监控容器资源使用
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

## 📞 技术支持

如果遇到问题，请：

1. 运行健康检查：`./scripts/health-check.sh`
2. 查看服务日志：`./scripts/manage.sh logs`
3. 检查系统资源：`docker stats`
4. 查看GitHub Issues或联系技术支持团队

---

**注意**: 本部署方案支持开发、测试和生产环境。生产环境请确保修改默认密码和安全配置。
