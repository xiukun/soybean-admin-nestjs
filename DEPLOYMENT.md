# 低代码平台部署指南

本文档提供了低代码平台的完整部署指南，包括开发环境、测试环境和生产环境的部署方案。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 系统要求

### 最低要求
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0 (可选，用于缓存)
- **内存**: >= 4GB
- **磁盘空间**: >= 10GB

### 推荐配置
- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.6.0
- **PostgreSQL**: >= 15.0
- **Redis**: >= 7.0
- **内存**: >= 8GB
- **磁盘空间**: >= 50GB

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd soybean-admin-nestjs
```

### 2. 安装依赖
```bash
# 安装根目录依赖
pnpm install

# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../lowcode-platform-backend
pnpm install

# 安装 Amis 后端依赖
cd ../amis-lowcode-backend
pnpm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env
cp frontend/.env.example frontend/.env
cp lowcode-platform-backend/.env.example lowcode-platform-backend/.env
cp amis-lowcode-backend/.env.example amis-lowcode-backend/.env

# 编辑环境变量
vim .env
```

### 4. 启动数据库
```bash
# 使用 Docker 启动 PostgreSQL 和 Redis
docker-compose up -d postgres redis
```

### 5. 初始化数据库
```bash
cd lowcode-platform-backend
pnpm prisma:migrate
pnpm prisma:seed
```

### 6. 启动服务
```bash
# 启动所有服务
pnpm dev

# 或者分别启动
pnpm dev:frontend    # 前端服务 (http://localhost:3200)
pnpm dev:backend     # 低代码后端 (http://localhost:3000)
pnpm dev:amis        # Amis 后端 (http://localhost:3001)
```

## 开发环境部署

### 1. 环境配置
```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_CORS=true

# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/lowcode_dev"
REDIS_URL="redis://localhost:6379"

# JWT 配置
JWT_SECRET="your-dev-jwt-secret"
JWT_EXPIRES_IN="7d"

# 文件上传配置
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="10MB"
```

### 2. 开发工具配置
```bash
# 安装开发工具
pnpm add -D @types/node typescript ts-node nodemon

# 配置 VSCode 调试
mkdir .vscode
cat > .vscode/launch.json << EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/lowcode-platform-backend/src/main.ts",
      "outFiles": ["\${workspaceFolder}/lowcode-platform-backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
EOF
```

### 3. 热重载配置
```bash
# 配置 nodemon
cat > lowcode-platform-backend/nodemon.json << EOF
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/main.ts"
}
EOF
```

## 生产环境部署

### 1. 构建应用
```bash
# 构建前端
cd frontend
pnpm build

# 构建后端
cd ../lowcode-platform-backend
pnpm build

cd ../amis-lowcode-backend
pnpm build
```

### 2. 生产环境配置
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false
ENABLE_CORS=false

# 数据库配置
DATABASE_URL="postgresql://username:password@db-host:5432/lowcode_prod"
REDIS_URL="redis://redis-host:6379"

# 安全配置
JWT_SECRET="your-production-jwt-secret-very-long-and-secure"
JWT_EXPIRES_IN="24h"
BCRYPT_ROUNDS=12

# 性能配置
CACHE_TTL=3600
ENABLE_COMPRESSION=true
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000

# 监控配置
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_TIMEOUT=5000
```

### 3. 使用 PM2 部署
```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'lowcode-backend',
      script: './lowcode-platform-backend/dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'amis-backend',
      script: './amis-lowcode-backend/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/amis-error.log',
      out_file: './logs/amis-out.log',
      log_file: './logs/amis-combined.log',
      time: true
    }
  ]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx 配置
```nginx
# /etc/nginx/sites-available/lowcode-platform
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Amis API 代理
    location /amis-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
    
    # 限制文件上传大小
    client_max_body_size 100M;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

## Docker 部署

### 1. 构建镜像
```bash
# 构建前端镜像
docker build -f frontend/Dockerfile -t lowcode-frontend:latest .

# 构建后端镜像
docker build -f lowcode-platform-backend/Dockerfile -t lowcode-backend:latest .

# 构建 Amis 后端镜像
docker build -f amis-lowcode-backend/Dockerfile -t amis-backend:latest .
```

### 2. Docker Compose 部署
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lowcode_prod
      POSTGRES_USER: lowcode
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lowcode"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  lowcode-backend:
    image: lowcode-backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://lowcode:${POSTGRES_PASSWORD}@postgres:5432/lowcode_prod
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  amis-backend:
    image: amis-backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://lowcode:${POSTGRES_PASSWORD}@postgres:5432/lowcode_prod
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: lowcode-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - lowcode-backend
      - amis-backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. 启动生产环境
```bash
# 设置环境变量
export POSTGRES_PASSWORD="your-secure-postgres-password"
export REDIS_PASSWORD="your-secure-redis-password"
export JWT_SECRET="your-very-secure-jwt-secret"

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## Kubernetes 部署

### 1. 创建命名空间
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: lowcode-platform
```

### 2. 配置 ConfigMap 和 Secret
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: lowcode-config
  namespace: lowcode-platform
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  ENABLE_SWAGGER: "false"
  ENABLE_CORS: "false"
  CACHE_TTL: "3600"
  ENABLE_COMPRESSION: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: lowcode-secrets
  namespace: lowcode-platform
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

### 3. 部署数据库
```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: lowcode-platform
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: lowcode_prod
        - name: POSTGRES_USER
          value: lowcode
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: lowcode-platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
```

### 4. 部署应用
```yaml
# backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lowcode-backend
  namespace: lowcode-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lowcode-backend
  template:
    metadata:
      labels:
        app: lowcode-backend
    spec:
      containers:
      - name: lowcode-backend
        image: lowcode-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: lowcode-config
        - secretRef:
            name: lowcode-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: lowcode-backend
  namespace: lowcode-platform
spec:
  selector:
    app: lowcode-backend
  ports:
  - port: 3000
    targetPort: 3000
```

### 5. 配置 Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lowcode-ingress
  namespace: lowcode-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: lowcode-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: lowcode-backend
            port:
              number: 3000
      - path: /amis-api
        pathType: Prefix
        backend:
          service:
            name: amis-backend
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

## 环境变量配置

### 核心配置
```bash
# 应用配置
NODE_ENV=production                    # 运行环境
PORT=3000                             # 服务端口
LOG_LEVEL=info                        # 日志级别

# 数据库配置
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"

# 安全配置
JWT_SECRET="your-jwt-secret"          # JWT 密钥
JWT_EXPIRES_IN="24h"                  # JWT 过期时间
BCRYPT_ROUNDS=12                      # 密码加密轮数

# 功能开关
ENABLE_SWAGGER=false                  # Swagger 文档
ENABLE_CORS=false                     # 跨域支持
ENABLE_CACHE=true                     # 缓存功能
ENABLE_COMPRESSION=true               # 响应压缩

# 性能配置
CACHE_TTL=3600                        # 缓存过期时间
RATE_LIMIT_MAX=1000                   # 速率限制
RATE_LIMIT_WINDOW=900000              # 速率限制窗口

# 文件上传
UPLOAD_PATH="./uploads"               # 上传路径
MAX_FILE_SIZE="100MB"                 # 最大文件大小

# 监控配置
ENABLE_METRICS=true                   # 指标收集
METRICS_PORT=9090                     # 指标端口
HEALTH_CHECK_TIMEOUT=5000             # 健康检查超时
```

## 数据库配置

### 1. PostgreSQL 优化
```sql
-- postgresql.conf 优化配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 2. 数据库索引优化
```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_projects_created_at ON projects(created_at);
CREATE INDEX CONCURRENTLY idx_entities_project_id ON entities(project_id);
CREATE INDEX CONCURRENTLY idx_fields_entity_id ON fields(entity_id);
CREATE INDEX CONCURRENTLY idx_templates_status ON templates(status);
CREATE INDEX CONCURRENTLY idx_templates_category ON templates(category);

-- 复合索引
CREATE INDEX CONCURRENTLY idx_entities_project_status ON entities(project_id, status);
CREATE INDEX CONCURRENTLY idx_fields_entity_type ON fields(entity_id, type);
```

### 3. 数据库备份
```bash
#!/bin/bash
# backup.sh - 数据库备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="lowcode_prod"
DB_USER="lowcode"
DB_HOST="localhost"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump"

# 压缩备份文件
gzip "$BACKUP_DIR/backup_$DATE.dump"

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.dump.gz"
```

## 监控和日志

### 1. 日志配置
```typescript
// logger.config.ts
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
};
```

### 2. Prometheus 监控
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lowcode-backend'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### 3. Grafana 仪表板
```json
{
  "dashboard": {
    "title": "Low-code Platform Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库状态
systemctl status postgresql
docker logs postgres-container

# 检查连接配置
psql -h localhost -U lowcode -d lowcode_prod

# 检查防火墙
sudo ufw status
sudo iptables -L
```

#### 2. 内存不足
```bash
# 检查内存使用
free -h
top -p $(pgrep -f "node")

# 调整 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 3. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3000
lsof -i :3000

# 终止占用进程
kill -9 <PID>
```

#### 4. 权限问题
```bash
# 检查文件权限
ls -la uploads/
ls -la logs/

# 修复权限
chown -R node:node uploads/
chmod -R 755 uploads/
```

### 性能调优

#### 1. Node.js 优化
```bash
# 设置环境变量
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# 启用集群模式
pm2 start ecosystem.config.js --env production
```

#### 2. 数据库优化
```sql
-- 分析慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 优化表结构
VACUUM ANALYZE;
REINDEX DATABASE lowcode_prod;
```

#### 3. 缓存优化
```typescript
// 配置 Redis 缓存
const cacheConfig = {
  ttl: 3600, // 1 hour
  max: 1000, // max items
  updateAgeOnGet: true,
  updateAgeOnHas: true
};
```

### 日志分析

#### 1. 错误日志分析
```bash
# 查看错误日志
tail -f logs/error.log

# 统计错误类型
grep "ERROR" logs/combined.log | awk '{print $4}' | sort | uniq -c

# 查找特定错误
grep -n "Database connection failed" logs/error.log
```

#### 2. 性能日志分析
```bash
# 分析响应时间
grep "duration" logs/combined.log | awk '{print $6}' | sort -n | tail -10

# 统计 API 调用
grep "GET\|POST\|PUT\|DELETE" logs/combined.log | awk '{print $3}' | sort | uniq -c
```

## 安全建议

### 1. 网络安全
- 使用 HTTPS 加密传输
- 配置防火墙规则
- 启用 DDoS 防护
- 定期更新 SSL 证书

### 2. 应用安全
- 定期更新依赖包
- 使用强密码策略
- 启用 JWT 令牌过期
- 实施 API 速率限制

### 3. 数据安全
- 定期备份数据库
- 加密敏感数据
- 实施访问控制
- 审计日志记录

### 4. 服务器安全
- 定期更新系统
- 禁用不必要的服务
- 配置入侵检测
- 监控系统资源

---

如需更多帮助，请参考：
- [API 文档](./API.md)
- [开发指南](./DEVELOPMENT.md)
- [故障排除指南](./TROUBLESHOOTING.md)
- [安全指南](./SECURITY.md)
