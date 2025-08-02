# Docker 部署配置说明文档

## 概述

本文档详细说明了 SoybeanAdmin NestJS 低代码平台的 Docker 容器化部署方案。该平台采用微服务架构，包含多个独立的服务组件，通过 Docker Compose 进行统一编排和管理。

## 服务架构

### 核心服务组件

```
低代码平台架构
├── frontend (前端服务)           # 端口: 9527
├── backend (主后端服务)          # 端口: 9528  
├── lowcode-designer (设计器)     # 端口: 9555
├── amis-lowcode-backend (业务后端) # 端口: 9522
├── lowcode-platform-backend (平台后端) # 端口: 3002
├── postgres (数据库)            # 端口: 25432
└── redis (缓存)                # 端口: 26379
```

### 服务依赖关系

```mermaid
graph TD
    A[Frontend] --> B[Backend]
    A --> C[Lowcode Designer]
    A --> D[Amis Backend]
    A --> E[Platform Backend]
    
    B --> F[PostgreSQL]
    D --> F
    E --> F
    
    B --> G[Redis]
    D --> G
    E --> G
    
    C --> E
    D --> E
```

## Docker Compose 配置

### 主配置文件 (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16.3-alpine
    container_name: soybean-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: soybean-admin-nest-backend
      POSTGRES_USER: soybean
      POSTGRES_PASSWORD: soybean@123.
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "25432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./deploy/postgres/init:/docker-entrypoint-initdb.d
    networks:
      - soybean-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U soybean -d soybean-admin-nest-backend"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7.2-alpine
    container_name: soybean-redis
    restart: unless-stopped
    command: redis-server --requirepass redis@123. --appendonly yes
    ports:
      - "26379:6379"
    volumes:
      - redis_data:/data
    networks:
      - soybean-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # 主后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: soybean-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 9528
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis@123.
      JWT_SECRET: JWT_SECRET-soybean-admin-nest!@#123.
      JWT_EXPIRES_IN: 7d
    ports:
      - "9528:9528"
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - soybean-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9528/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Amis 低代码后端服务
  amis-backend:
    build:
      context: ./amis-lowcode-backend
      dockerfile: Dockerfile
    container_name: soybean-amis-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 9522
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=amis
      JWT_SECRET: JWT_SECRET-soybean-admin-nest!@#123.
      JWT_EXPIRES_IN: 7d
      BACKEND_URL: http://backend:9528
      LOWCODE_PLATFORM_URL: http://lowcode-platform:3002
      CORS_ORIGIN: http://localhost:9527,http://127.0.0.1:9527,http://localhost:3002,http://127.0.0.1:3002,http://localhost:9555,http://127.0.0.1:9555
    ports:
      - "9522:9522"
    volumes:
      - amis_logs:/app/logs
    networks:
      - soybean-network
    depends_on:
      postgres:
        condition: service_healthy
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9522/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 低代码平台后端服务
  lowcode-platform:
    build:
      context: ./lowcode-platform-backend
      dockerfile: Dockerfile
    container_name: soybean-lowcode-platform
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=lowcode
      JWT_SECRET: JWT_SECRET-soybean-admin-nest!@#123.
      JWT_EXPIRES_IN: 7d
      BACKEND_URL: http://backend:9528
      AMIS_BACKEND_URL: http://amis-backend:9522
      CODE_GENERATION_PATH: /app/generated
      DOCKER_HOST: unix:///var/run/docker.sock
    ports:
      - "3002:3002"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - lowcode_generated:/app/generated
      - lowcode_uploads:/app/uploads
      - lowcode_logs:/app/logs
    networks:
      - soybean-network
    depends_on:
      postgres:
        condition: service_healthy
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 低代码设计器
  lowcode-designer:
    build:
      context: ./lowcode-designer
      dockerfile: Dockerfile
    container_name: soybean-lowcode-designer
    restart: unless-stopped
    environment:
      NODE_ENV: production
      VITE_API_BASE_URL: http://lowcode-platform:3002/api/v1
      VITE_AMIS_API_BASE_URL: http://amis-backend:9522/api/v1
    ports:
      - "9555:80"
    networks:
      - soybean-network
    depends_on:
      - lowcode-platform
      - amis-backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: soybean-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      VITE_SERVICE_BASE_URL: http://backend:9528
      VITE_OTHER_SERVICE_BASE_URL: '{"lowcode": "http://lowcode-platform:3002", "amis": "http://amis-backend:9522"}'
    ports:
      - "9527:80"
    networks:
      - soybean-network
    depends_on:
      - backend
      - lowcode-platform
      - amis-backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

# 网络配置
networks:
  soybean-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# 数据卷配置
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  backend_uploads:
    driver: local
  backend_logs:
    driver: local
  amis_logs:
    driver: local
  lowcode_generated:
    driver: local
  lowcode_uploads:
    driver: local
  lowcode_logs:
    driver: local
```

### 开发环境配置 (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  postgres:
    ports:
      - "25432:5432"
    environment:
      POSTGRES_DB: soybean-admin-nest-backend-dev
      POSTGRES_USER: soybean
      POSTGRES_PASSWORD: soybean@123.
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    ports:
      - "26379:6379"
    volumes:
      - redis_dev_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend-dev?schema=public
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  amis-backend:
    build:
      context: ./amis-lowcode-backend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend-dev?schema=amis
    volumes:
      - ./amis-lowcode-backend:/app
      - /app/node_modules
    command: npm run start:dev

  lowcode-platform:
    build:
      context: ./lowcode-platform-backend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend-dev?schema=lowcode
    volumes:
      - ./lowcode-platform-backend:/app
      - /app/node_modules
    command: npm run start:dev

  lowcode-designer:
    build:
      context: ./lowcode-designer
      dockerfile: Dockerfile.dev
    volumes:
      - ./lowcode-designer:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_dev_data:
  redis_dev_data:
```

## 各服务 Dockerfile 配置

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 创建必要的目录
RUN mkdir -p /app/uploads /app/logs

EXPOSE 9528

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9528/api/health || exit 1

# 启动脚本
COPY --from=builder /app/scripts/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
```

### Amis Backend Dockerfile

```dockerfile
# amis-lowcode-backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/logs

EXPOSE 9522

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9522/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
```

### Lowcode Platform Dockerfile

```dockerfile
# lowcode-platform-backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache curl docker-cli

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/generated /app/uploads /app/logs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Lowcode Designer Dockerfile

```dockerfile
# lowcode-designer/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 部署脚本

### 一键部署脚本 (deploy.sh)

```bash
#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_prerequisites() {
    log_info "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p deploy/postgres/init
    mkdir -p deploy/nginx
    mkdir -p logs
    mkdir -p uploads
    mkdir -p generated
    
    log_success "目录创建完成"
}

# 生成环境配置文件
generate_env_files() {
    log_info "生成环境配置文件..."
    
    # 生成 .env 文件
    cat > .env << EOF
# 数据库配置
POSTGRES_DB=soybean-admin-nest-backend
POSTGRES_USER=soybean
POSTGRES_PASSWORD=soybean@123.

# Redis 配置
REDIS_PASSWORD=redis@123.

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest!@#123.
JWT_EXPIRES_IN=7d

# 服务端口配置
FRONTEND_PORT=9527
BACKEND_PORT=9528
AMIS_BACKEND_PORT=9522
LOWCODE_PLATFORM_PORT=3002
LOWCODE_DESIGNER_PORT=9555
POSTGRES_PORT=25432
REDIS_PORT=26379
EOF
    
    log_success "环境配置文件生成完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建所有服务镜像
    docker-compose build --parallel
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建完成"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 先启动基础服务
    docker-compose up -d postgres redis
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 30
    
    # 启动后端服务
    docker-compose up -d backend amis-backend lowcode-platform
    
    # 等待后端服务启动
    log_info "等待后端服务启动..."
    sleep 20
    
    # 启动前端服务
    docker-compose up -d frontend lowcode-designer
    
    log_success "所有服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    services=("postgres" "redis" "backend" "amis-backend" "lowcode-platform" "frontend" "lowcode-designer")
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务启动失败"
        fi
    done
}

# 显示访问信息
show_access_info() {
    log_info "部署完成！访问信息："
    echo ""
    echo "🌐 前端管理界面: http://localhost:9527"
    echo "🎨 低代码设计器: http://localhost:9555"
    echo "📡 主后端API: http://localhost:9528"
    echo "🔧 Amis后端API: http://localhost:9522"
    echo "⚙️  平台后端API: http://localhost:3002"
    echo "🗄️  PostgreSQL: localhost:25432"
    echo "🔴 Redis: localhost:26379"
    echo ""
    echo "📋 查看服务状态: docker-compose ps"
    echo "📝 查看服务日志: docker-compose logs -f [service_name]"
    echo "🛑 停止所有服务: docker-compose down"
}

# 主函数
main() {
    log_info "开始部署 SoybeanAdmin NestJS 低代码平台..."
    
    check_prerequisites
    create_directories
    generate_env_files
    build_images
    start_services
    
    sleep 10
    check_services
    show_access_info
    
    log_success "部署完成！"
}

# 处理命令行参数
case "$1" in
    "build")
        build_images
        ;;
    "start")
        start_services
        ;;
    "stop")
        log_info "停止所有服务..."
        docker-compose down
        log_success "服务已停止"
        ;;
    "restart")
        log_info "重启所有服务..."
        docker-compose down
        docker-compose up -d
        log_success "服务已重启"
        ;;
    "logs")
        if [ -n "$2" ]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        ;;
    "status")
        check_services
        ;;
    "clean")
        log_warning "清理所有容器和镜像..."
        docker-compose down -v --rmi all
        log_success "清理完成"
        ;;
    *)
        main
        ;;
esac
```

### 数据库初始化脚本

```sql
-- deploy/postgres/init/01-init-schemas.sql
-- 创建数据库 schema
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS amis;
CREATE SCHEMA IF NOT EXISTS lowcode;

-- 设置权限
GRANT ALL PRIVILEGES ON SCHEMA public TO soybean;
GRANT ALL PRIVILEGES ON SCHEMA amis TO soybean;
GRANT ALL PRIVILEGES ON SCHEMA lowcode TO soybean;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 设置默认搜索路径
ALTER DATABASE "soybean-admin-nest-backend" SET search_path TO public, amis, lowcode;
```

### Nginx 配置

```nginx
# deploy/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # 基本配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 前端服务配置
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
        }
        
        # SPA 路由支持
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
        
        # API 代理
        location /api/ {
            proxy_pass http://backend:9528;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # 低代码平台 API 代理
        location /lowcode-api/ {
            rewrite ^/lowcode-api/(.*) /api/v1/$1 break;
            proxy_pass http://lowcode-platform:3002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Amis API 代理
        location /amis-api/ {
            rewrite ^/amis-api/(.*) /api/v1/$1 break;
            proxy_pass http://amis-backend:9522;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 部署流程

### 1. 环境准备

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 项目部署

```bash
# 克隆项目
git clone <repository-url>
cd soybean-admin-nestjs

# 赋予部署脚本执行权限
chmod +x deploy.sh

# 执行一键部署
./deploy.sh

# 或者手动部署
docker-compose up -d
```

### 3. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 检查健康状态
curl http://localhost:9527/health
curl http://localhost:9528/api/health
curl http://localhost:9522/api/v1/health
curl http://localhost:3002/api/v1/health
```

## 运维管理

### 服务管理命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart backend

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f backend

# 进入容器
docker-compose exec backend sh

# 更新服务
docker-compose pull
docker-compose up -d --force-recreate
```

### 数据备份与恢复

```bash
# 数据库备份
docker-compose exec postgres pg_dump -U soybean soybean-admin-nest-backend > backup.sql

# 数据库恢复
docker-compose exec -T postgres psql -U soybean soybean-admin-nest-backend < backup.sql

# 数据卷备份
docker run --rm -v soybean-admin-nestjs_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# 数据卷恢复
docker run --rm -v soybean-admin-nestjs_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

### 监控和日志

```bash
# 查看资源使用情况
docker stats

# 查看容器详细信息
docker-compose exec backend cat /proc/meminfo
docker-compose exec backend df -h

# 日志轮转配置
# 在 docker-compose.yml 中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 性能优化

### 1. 资源限制配置

```yaml
# 在 docker-compose.yml 中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. 数据库优化

```sql
-- PostgreSQL 性能优化配置
-- 在 postgresql.conf 中设置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 3. Redis 优化

```bash
# Redis 配置优化
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 故障排查

### 常见问题及解决方案

#### 1. 服务启动失败

```bash
# 检查服务状态
docker-compose ps

# 查看详细错误日志
docker-compose logs backend

# 检查端口占用
netstat -tulpn | grep :9528

# 重启服务
docker-compose restart backend
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U soybean

# 检查数据库连接
docker-compose exec postgres psql -U soybean -d soybean-admin-nest-backend -c "SELECT version();"

# 重置数据库密码
docker-compose exec postgres psql -U postgres -c "ALTER USER soybean PASSWORD 'soybean@123.';"
```

#### 3. 内存不足

```bash
# 检查内存使用
docker stats --no-stream

# 清理未使用的镜像和容器
docker system prune -a

# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理 Docker 数据
docker system df
docker system prune -a --volumes

# 清理日志文件
sudo find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;
```

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_retries=5
    local retry_interval=10
    
    echo "检查 $service_name 健康状态..."
    
    for i in $(seq 1 $max_retries); do
        if curl -f -s "$health_url" > /dev/null; then
            echo "✅ $service_name 健康检查通过"
            return 0
        else
            echo "❌ $service_name 健康检查失败 (尝试 $i/$max_retries)"
            if [ $i -lt $max_retries ]; then
                sleep $retry_interval
            fi
        fi
    done
    
    echo "🚨 $service_name 健康检查最终失败"
    return 1
}

# 检查所有服务
echo "开始系统健康检查..."

check_service_health "Frontend" "http://localhost:9527/health"
check_service_health "Backend" "http://localhost:9528/api/health"
check_service_health "Amis Backend" "http://localhost:9522/api/v1/health"
check_service_health "Lowcode Platform" "http://localhost:3002/api/v1/health"
check_service_health "Lowcode Designer" "http://localhost:9555"

echo "健康检查完成"
```

## 安全配置

### 1. 网络安全

```yaml
# docker-compose.yml 网络安全配置
networks:
  soybean-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: soybean-br0
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
    internal: false  # 设置为 true 可禁止外网访问
```

### 2. 容器安全

```yaml
# 安全配置示例
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    user: "1000:1000"  # 非 root 用户运行
```

### 3. 密钥管理

```bash
# 使用 Docker Secrets 管理敏感信息
echo "soybean@123." | docker secret create postgres_password -
echo "JWT_SECRET-soybean-admin-nest!@#123." | docker secret create jwt_secret -

# 在 docker-compose.yml 中使用
secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### 4. SSL/TLS 配置

```nginx
# nginx-ssl.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # 其他安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 扩展配置

### 1. 负载均衡配置

```yaml
# docker-compose.lb.yml
version: '3.8'

services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend-1
      - frontend-2
    networks:
      - soybean-network

  frontend-1:
    extends:
      file: docker-compose.yml
      service: frontend
    container_name: soybean-frontend-1

  frontend-2:
    extends:
      file: docker-compose.yml
      service: frontend
    container_name: soybean-frontend-2

  backend-1:
    extends:
      file: docker-compose.yml
      service: backend
    container_name: soybean-backend-1

  backend-2:
    extends:
      file: docker-compose.yml
      service: backend
    container_name: soybean-backend-2
```

### 2. 监控配置

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - soybean-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3002"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - soybean-network

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - soybean-network

volumes:
  prometheus_data:
  grafana_data:
```

## 更新和维护

### 1. 版本更新流程

```bash
#!/bin/bash
# update.sh

# 备份当前版本
backup_current_version() {
    echo "备份当前版本..."
    docker-compose exec postgres pg_dump -U soybean soybean-admin-nest-backend > backup-$(date +%Y%m%d-%H%M%S).sql
    docker commit soybean-backend soybean-backend:backup-$(date +%Y%m%d-%H%M%S)
}

# 更新代码
update_code() {
    echo "更新代码..."
    git fetch origin
    git checkout main
    git pull origin main
}

# 重新构建镜像
rebuild_images() {
    echo "重新构建镜像..."
    docker-compose build --no-cache
}

# 滚动更新服务
rolling_update() {
    echo "执行滚动更新..."
    
    # 更新后端服务
    docker-compose up -d --no-deps backend
    sleep 30
    
    # 更新前端服务
    docker-compose up -d --no-deps frontend
    sleep 10
    
    # 更新其他服务
    docker-compose up -d --no-deps amis-backend lowcode-platform lowcode-designer
}

# 验证更新
verify_update() {
    echo "验证更新..."
    ./health-check.sh
}

# 主更新流程
main() {
    backup_current_version
    update_code
    rebuild_images
    rolling_update
    verify_update
    echo "更新完成！"
}

main
```

### 2. 定期维护任务

```bash
#!/bin/bash
# maintenance.sh

# 清理旧的镜像和容器
cleanup_docker() {
    echo "清理 Docker 资源..."
    docker image prune -f
    docker container prune -f
    docker volume prune -f
    docker network prune -f
}

# 数据库维护
maintain_database() {
    echo "数据库维护..."
    docker-compose exec postgres psql -U soybean -d soybean-admin-nest-backend -c "VACUUM ANALYZE;"
    docker-compose exec postgres psql -U soybean -d soybean-admin-nest-backend -c "REINDEX DATABASE \"soybean-admin-nest-backend\";"
}

# 日志轮转
rotate_logs() {
    echo "日志轮转..."
    find ./logs -name "*.log" -size +100M -exec truncate -s 0 {} \;
}

# 备份数据
backup_data() {
    echo "备份数据..."
    mkdir -p backups/$(date +%Y%m%d)
    docker-compose exec postgres pg_dump -U soybean soybean-admin-nest-backend > backups/$(date +%Y%m%d)/database.sql
    
    # 保留最近30天的备份
    find backups -type d -mtime +30 -exec rm -rf {} \;
}

# 执行维护任务
echo "开始定期维护..."
cleanup_docker
maintain_database
rotate_logs
backup_data
echo "维护完成！"
```

## 总结

本文档提供了 SoybeanAdmin NestJS 低代码平台的完整 Docker 部署方案，包括：

1. **完整的服务架构配置** - 涵盖所有微服务组件
2. **详细的 Dockerfile 配置** - 针对每个服务优化的容器配置
3. **一键部署脚本** - 简化部署流程的自动化脚本
4. **运维管理工具** - 服务管理、监控、备份等工具
5. **安全配置指南** - 网络安全、容器安全、密钥管理
6. **性能优化建议** - 资源限制、数据库优化等
7. **故障排查手册** - 常见问题的解决方案
8. **扩展配置示例** - 负载均衡、监控系统配置

通过本文档，您可以快速部署和维护一个生产级别的低代码平台环境。

---

**文档版本**: v1.0.0  
**更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin 运维团队
