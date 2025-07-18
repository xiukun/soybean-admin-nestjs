# 低代码平台数据库配置说明

## 概述

本文档说明了低代码平台的数据库配置，确保与主系统（backend）的数据库配置保持一致，同时使用独立的数据库实例避免冲突。

## 配置信息

### 数据库配置
- **数据库类型**: PostgreSQL 16.3
- **数据库名**: `lowcode_platform`
- **用户名**: `soybean`
- **密码**: `soybean@123.`
- **Docker映射端口**: `25432` (主机) → `5432` (容器)
- **连接字符串**: `postgresql://soybean:soybean@123.@localhost:25432/lowcode_platform?schema=public`

### Redis配置（共用主系统）
- **Redis版本**: 7.2.0-v11 (redis-stack)
- **密码**: `123456`
- **端口**: `26379` (主机端口)
- **数据库**: `6` (避免与主系统冲突)

### 后端服务配置
- **端口**: `3000`
- **API文档**: `http://localhost:3000/api-docs`

## 与主系统的一致性

### 相同配置
- ✅ 数据库用户名: `soybean`
- ✅ 数据库密码: `soybean@123.`
- ✅ Redis服务: 共用主系统Redis服务
- ✅ Redis密码: `123456` (与主系统一致)
- ✅ JWT密钥格式: 统一的安全密钥格式

### 独立配置
- 🔄 数据库端口: `25432` (避免与主系统的 `5432` 冲突)
- 🔄 数据库名: `lowcode_platform` (独立的数据库)
- 🔄 Redis数据库: `6` (避免与主系统的数据库冲突)
- 🔄 后端端口: `3000` (避免与主系统的 `9528` 冲突)

## 文件结构

```
lowcode-platform-backend/
├── .env                          # 环境配置文件
├── docker-compose.yml            # Docker编排文件（仅包含PostgreSQL）
├── start-services.sh             # 服务启动脚本
├── verify-config.sh              # 配置验证脚本
├── database/
│   └── init/
│       └── 01-init-database.sql  # 数据库初始化脚本
├── redis/                        # Redis配置文件（已废弃，共用主系统）
│   └── redis.conf               # 保留用于参考
└── logs/                        # 日志目录
    └── postgres/               # PostgreSQL日志
```

## 启动方式

### 方式一：使用启动脚本（推荐）
```bash
# 启动所有服务
./start-services.sh start

# 仅启动数据库服务
./start-services.sh db-only

# 查看服务状态
./start-services.sh status

# 停止所有服务
./start-services.sh stop

# 重启所有服务
./start-services.sh restart
```

### 方式二：使用Docker Compose
```bash
# 确保主系统Redis已启动
cd ../backend && docker-compose up -d redis

# 启动lowcode数据库服务
cd ../lowcode-platform-backend
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f lowcode-postgres

# 停止服务
docker-compose down
```

### 方式三：开发模式
```bash
# 确保主系统Redis已启动
cd ../backend && docker-compose up -d redis

# 仅启动数据库
cd ../lowcode-platform-backend
docker-compose up -d lowcode-postgres

# 本地运行后端服务
npm run start:dev
```

## 数据库连接测试

### 使用psql连接
```bash
psql -h localhost -p 25432 -U soybean -d lowcode_platform
```

### 使用Redis CLI连接（共用主系统）
```bash
redis-cli -h localhost -p 26379 -a "123456"
```

## 环境变量说明

| 变量名 | 值 | 说明 |
|--------|----|----|
| `DATABASE_URL` | `postgresql://soybean:soybean@123.@localhost:25432/lowcode_platform?schema=public` | 数据库连接字符串 |
| `PORT` | `3000` | 后端服务端口 |
| `REDIS_HOST` | `localhost` | Redis主机地址（共用主系统） |
| `REDIS_PORT` | `26379` | Redis端口（共用主系统） |
| `REDIS_PASSWORD` | `123456` | Redis密码（与主系统一致） |
| `JWT_SECRET` | `JWT_SECRET-lowcode-platform@123456!@#.` | JWT密钥 |

## 端口映射表

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| PostgreSQL | 5432 | 25432 | 数据库服务（独立） |
| Redis | - | 26379 | 缓存服务（共用主系统） |
| Backend API | 3000 | 3000 | 后端API服务 |

## 数据库初始化

数据库初始化脚本 `database/init/01-init-database.sql` 包含：
- 时区设置为 `Asia/Shanghai`
- 必要的PostgreSQL扩展
- 审计日志表和触发器
- 性能监控视图
- 实用函数

## 故障排除

### 端口冲突
如果端口被占用，可以：
1. 修改 `docker-compose.yml` 中的端口映射
2. 停止占用端口的服务
3. 使用 `lsof -i :端口号` 查看占用进程

### 数据库连接失败
1. 检查Docker容器是否正常运行
2. 检查防火墙设置
3. 验证用户名和密码
4. 检查数据库是否已创建

### Redis连接失败
1. 检查主系统Redis服务状态
2. 确保主系统已启动：`cd ../backend && docker-compose up -d redis`
3. 验证密码配置（应为123456）
4. 检查端口26379是否开放

## 监控和维护

### 查看容器日志
```bash
# 查看PostgreSQL日志
docker-compose logs -f lowcode-postgres

# 查看主系统Redis日志
cd ../backend && docker-compose logs -f redis

# 查看后端服务日志
docker-compose logs -f lowcode-backend
```

### 数据库备份
```bash
# 备份数据库
docker-compose exec lowcode-postgres pg_dump -U soybean lowcode_platform > backup.sql

# 恢复数据库
docker-compose exec -T lowcode-postgres psql -U soybean lowcode_platform < backup.sql
```

### 性能监控
- 数据库连接数监控
- Redis内存使用监控
- API响应时间监控

## 安全注意事项

1. **生产环境**：请修改默认密码
2. **网络安全**：配置防火墙规则
3. **数据加密**：启用TLS连接
4. **访问控制**：限制数据库访问IP
5. **定期备份**：设置自动备份策略
