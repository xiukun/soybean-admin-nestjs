# Damai Lowcode Admin Docker 部署指南

本文档介绍如何使用 Docker 部署 Damai Lowcode Admin 项目，包括前端、后端和低代码设计器。

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

## 📞 技术支持

如果遇到问题，请：

1. 查看服务日志
2. 检查网络连接
3. 确认配置文件正确
4. 联系技术支持团队
