# 开发环境搭建指南

## 概述

本文档详细说明了 SoybeanAdmin NestJS 低代码平台的本地开发环境搭建流程。该平台采用微服务架构，包含前端、后端、低代码设计器等多个服务组件，需要配置相应的开发环境和依赖。

## 系统要求

### 硬件要求
- **CPU**: 4核心及以上
- **内存**: 16GB 及以上（推荐 32GB）
- **存储**: 50GB 可用空间（SSD 推荐）
- **网络**: 稳定的互联网连接

### 操作系统支持
- **Windows**: Windows 10/11 (推荐使用 WSL2)
- **macOS**: macOS 10.15 及以上
- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+

## 基础环境安装

### 1. Node.js 环境

#### 安装 Node.js (推荐使用 nvm)

**Windows (使用 nvm-windows):**
```bash
# 下载并安装 nvm-windows
# https://github.com/coreybutler/nvm-windows/releases

# 安装 Node.js 18
nvm install 18.19.0
nvm use 18.19.0

# 验证安装
node --version
npm --version
```

**macOS/Linux (使用 nvm):**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载终端配置
source ~/.bashrc

# 安装 Node.js 18
nvm install 18.19.0
nvm use 18.19.0
nvm alias default 18.19.0

# 验证安装
node --version  # v18.19.0
npm --version   # 10.2.3
```

#### 配置 npm 镜像源（可选）
```bash
# 使用淘宝镜像源
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
```

### 2. 包管理器 pnpm

```bash
# 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version

# 配置 pnpm 镜像源（可选）
pnpm config set registry https://registry.npmmirror.com
```

### 3. 数据库环境

#### PostgreSQL 安装

**Windows:**
```bash
# 下载并安装 PostgreSQL
# https://www.postgresql.org/download/windows/

# 或使用 Chocolatey
choco install postgresql

# 启动服务
net start postgresql-x64-14
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install postgresql@16

# 启动服务
brew services start postgresql@16

# 创建数据库用户
createuser -s soybean
```

**Linux (Ubuntu):**
```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户
sudo -u postgres createuser -s soybean
sudo -u postgres psql -c "ALTER USER soybean PASSWORD 'soybean@123.';"
```

#### 创建开发数据库
```sql
-- 连接到 PostgreSQL
psql -U soybean -h localhost

-- 创建数据库
CREATE DATABASE "soybean-admin-nest-backend-dev";

-- 创建 schema
\c soybean-admin-nest-backend-dev
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS amis;
CREATE SCHEMA IF NOT EXISTS lowcode;

-- 安装扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Redis 安装

**Windows:**
```bash
# 下载并安装 Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# 或使用 WSL2 安装 Linux 版本
wsl --install
# 在 WSL2 中按照 Linux 安装步骤
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install redis

# 启动服务
brew services start redis

# 测试连接
redis-cli ping
```

**Linux (Ubuntu):**
```bash
# 安装 Redis
sudo apt update
sudo apt install redis-server

# 启动服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli ping
```

### 4. 开发工具

#### Git 版本控制
```bash
# Windows
winget install Git.Git

# macOS
brew install git

# Linux
sudo apt install git

# 配置 Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Docker (可选，用于容器化开发)
```bash
# 安装 Docker Desktop
# Windows/macOS: https://www.docker.com/products/docker-desktop
# Linux: https://docs.docker.com/engine/install/

# 验证安装
docker --version
docker-compose --version
```

## 项目环境配置

### 1. 克隆项目代码

```bash
# 克隆主项目
git clone <repository-url> soybean-admin-nestjs
cd soybean-admin-nestjs

# 查看项目结构
ls -la
```

### 2. 环境变量配置

#### 创建环境配置文件

**Backend 环境配置:**
```bash
# backend/.env.development
NODE_ENV=development
PORT=9528

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@localhost:5432/soybean-admin-nest-backend-dev?schema=public

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest-dev!@#123.
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=debug
LOG_DIR=./logs

# 跨域配置
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527,http://localhost:3002,http://127.0.0.1:3002
```

**Amis Backend 环境配置:**
```bash
# amis-lowcode-backend/.env.development
NODE_ENV=development
PORT=9522

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@localhost:5432/soybean-admin-nest-backend-dev?schema=amis

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest-dev!@#123.
JWT_EXPIRES_IN=7d

# 服务间通信
BACKEND_URL=http://localhost:9528
LOWCODE_PLATFORM_URL=http://localhost:3002

# 跨域配置
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527,http://localhost:3002,http://127.0.0.1:3002,http://localhost:9555,http://127.0.0.1:9555
```

**Lowcode Platform 环境配置:**
```bash
# lowcode-platform-backend/.env.development
NODE_ENV=development
PORT=3002

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@localhost:5432/soybean-admin-nest-backend-dev?schema=lowcode

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest-dev!@#123.
JWT_EXPIRES_IN=7d

# 服务间通信
BACKEND_URL=http://localhost:9528
AMIS_BACKEND_URL=http://localhost:9522

# 代码生成配置
CODE_GENERATION_PATH=./generated
TEMPLATE_PATH=./resources/templates

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

**Frontend 环境配置:**
```bash
# frontend/.env.development
# 开发环境配置
VITE_APP_TITLE=SoybeanAdmin 低代码平台
VITE_APP_DESC=基于 Vue3、Vite、TypeScript、NaiveUI 的低代码平台

# API 服务地址
VITE_SERVICE_BASE_URL=http://localhost:9528
VITE_OTHER_SERVICE_BASE_URL={"lowcode": "http://localhost:3002", "amis": "http://localhost:9522"}

# 路由配置
VITE_ROUTE_HOME_PATH=/dashboard/analysis
VITE_ROUTE_LOGIN_PATH=/login

# 构建配置
VITE_BUILD_COMPRESS=gzip
VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE=false
```

**Lowcode Designer 环境配置:**
```bash
# lowcode-designer/.env.development
# API 配置
VITE_API_BASE_URL=http://localhost:3002/api/v1
VITE_AMIS_API_BASE_URL=http://localhost:9522/api/v1

# 应用配置
VITE_APP_TITLE=低代码设计器
VITE_APP_VERSION=1.0.0

# 开发配置
VITE_BUILD_MODE=development
```

### 3. 依赖安装

#### 安装所有服务依赖
```bash
# 在项目根目录执行
./scripts/install-deps.sh

# 或手动安装各服务依赖
cd frontend && pnpm install && cd ..
cd backend && pnpm install && cd ..
cd lowcode-designer && pnpm install && cd ..
cd amis-lowcode-backend && pnpm install && cd ..
cd lowcode-platform-backend && pnpm install && cd ..
```

#### 创建依赖安装脚本
```bash
#!/bin/bash
# scripts/install-deps.sh

echo "🚀 开始安装项目依赖..."

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    exit 1
fi

# 安装各服务依赖
services=("frontend" "backend" "lowcode-designer" "amis-lowcode-backend" "lowcode-platform-backend")

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        echo "📦 安装 $service 依赖..."
        cd "$service"
        pnpm install
        if [ $? -eq 0 ]; then
            echo "✅ $service 依赖安装成功"
        else
            echo "❌ $service 依赖安装失败"
            exit 1
        fi
        cd ..
    else
        echo "⚠️  $service 目录不存在，跳过"
    fi
done

echo "🎉 所有依赖安装完成！"
```

### 4. 数据库初始化

#### 运行数据库迁移
```bash
# Backend 数据库迁移
cd backend
pnpm prisma:migrate:dev
pnpm prisma:generate
pnpm prisma:seed

# Amis Backend 数据库迁移
cd ../amis-lowcode-backend
pnpm prisma:migrate:dev
pnpm prisma:generate

# Lowcode Platform 数据库迁移
cd ../lowcode-platform-backend
pnpm prisma:migrate:dev
pnpm prisma:generate
```

#### 创建数据库初始化脚本
```bash
#!/bin/bash
# scripts/init-database.sh

echo "🗄️ 开始初始化数据库..."

# 检查数据库连接
check_db_connection() {
    local service=$1
    local db_url=$2
    
    echo "检查 $service 数据库连接..."
    if psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ $service 数据库连接成功"
        return 0
    else
        echo "❌ $service 数据库连接失败"
        return 1
    fi
}

# 初始化各服务数据库
init_service_db() {
    local service=$1
    echo "🔧 初始化 $service 数据库..."
    
    cd "$service"
    
    # 运行 Prisma 迁移
    pnpm prisma:migrate:dev --name init
    
    # 生成 Prisma 客户端
    pnpm prisma:generate
    
    # 运行种子数据（如果存在）
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        pnpm prisma:seed
    fi
    
    cd ..
    echo "✅ $service 数据库初始化完成"
}

# 检查数据库连接
check_db_connection "Backend" "postgresql://soybean:soybean@123.@localhost:5432/soybean-admin-nest-backend-dev"

# 初始化各服务数据库
services=("backend" "amis-lowcode-backend" "lowcode-platform-backend")

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        init_service_db "$service"
    else
        echo "⚠️  $service 目录不存在，跳过"
    fi
done

echo "🎉 数据库初始化完成！"
```

## 开发服务启动

### 1. 启动后端服务

#### 启动主后端服务
```bash
cd backend
pnpm start:dev

# 或使用 npm
npm run start:dev
```

#### 启动 Amis 后端服务
```bash
cd amis-lowcode-backend
pnpm start:dev
```

#### 启动低代码平台后端
```bash
cd lowcode-platform-backend
pnpm start:dev
```

### 2. 启动前端服务

#### 启动主前端应用
```bash
cd frontend
pnpm dev

# 访问地址: http://localhost:9527
```

#### 启动低代码设计器
```bash
cd lowcode-designer
pnpm dev

# 访问地址: http://localhost:9555
```

### 3. 一键启动脚本

```bash
#!/bin/bash
# scripts/start-dev.sh

echo "🚀 启动开发环境..."

# 检查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  端口 $port 已被占用 ($service)"
        return 1
    else
        echo "✅ 端口 $port 可用 ($service)"
        return 0
    fi
}

# 检查所有端口
ports=(9527 9528 9522 3002 9555)
services=("Frontend" "Backend" "Amis Backend" "Lowcode Platform" "Lowcode Designer")

for i in "${!ports[@]}"; do
    check_port "${ports[$i]}" "${services[$i]}"
done

# 启动服务函数
start_service() {
    local service_dir=$1
    local service_name=$2
    local port=$3
    
    echo "🔧 启动 $service_name..."
    
    cd "$service_dir"
    
    # 后台启动服务
    if [ "$service_name" = "Frontend" ] || [ "$service_name" = "Lowcode Designer" ]; then
        pnpm dev > "../logs/${service_name,,}.log" 2>&1 &
    else
        pnpm start:dev > "../logs/${service_name,,}.log" 2>&1 &
    fi
    
    local pid=$!
    echo "$pid" > "../logs/${service_name,,}.pid"
    
    cd ..
    
    # 等待服务启动
    echo "⏳ 等待 $service_name 启动..."
    sleep 10
    
    # 检查服务是否启动成功
    if curl -f -s "http://localhost:$port" > /dev/null 2>&1 || \
       curl -f -s "http://localhost:$port/api/health" > /dev/null 2>&1; then
        echo "✅ $service_name 启动成功 (端口: $port)"
    else
        echo "❌ $service_name 启动失败"
    fi
}

# 创建日志目录
mkdir -p logs

# 启动所有服务
start_service "backend" "Backend" 9528
start_service "amis-lowcode-backend" "Amis Backend" 9522
start_service "lowcode-platform-backend" "Lowcode Platform" 3002
start_service "frontend" "Frontend" 9527
start_service "lowcode-designer" "Lowcode Designer" 9555

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📋 服务访问地址:"
echo "   🌐 前端管理界面: http://localhost:9527"
echo "   🎨 低代码设计器: http://localhost:9555"
echo "   📡 主后端API: http://localhost:9528"
echo "   🔧 Amis后端API: http://localhost:9522"
echo "   ⚙️  平台后端API: http://localhost:3002"
echo ""
echo "📝 查看日志: tail -f logs/[service].log"
echo "🛑 停止服务: ./scripts/stop-dev.sh"
```

### 4. 停止开发服务脚本

```bash
#!/bin/bash
# scripts/stop-dev.sh

echo "🛑 停止开发环境..."

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name,,}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "🔧 停止 $service_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # 强制杀死进程（如果还在运行）
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            
            echo "✅ $service_name 已停止"
        else
            echo "⚠️  $service_name 进程不存在"
        fi
        
        rm -f "$pid_file"
    else
        echo "⚠️  $service_name PID 文件不存在"
    fi
}

# 停止所有服务
services=("Frontend" "Backend" "Amis Backend" "Lowcode Platform" "Lowcode Designer")

for service in "${services[@]}"; do
    stop_service "$service"
done

# 清理端口占用
echo "🧹 清理端口占用..."
ports=(9527 9528 9522 3002 9555)

for port in "${ports[@]}"; do
    pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔧 清理端口 $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null || true
    fi
done

echo "🎉 开发环境已停止！"
```

## IDE 配置

### 1. Visual Studio Code 配置

#### 推荐扩展
```json
// .vscode/extensions.json
{
  "recommendations": [
    "vue.volar",
    "vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### 工作区配置
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  "[vue]": {
    "editor.defaultFormatter": "vue.volar"
  },
  
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  
  "files.associations": {
    "*.env.*": "dotenv"
  },
  
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/logs": true
  },
  
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/logs/**": true
  }
}
```

#### 调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/dist/main.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "node",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
```

#### 任务配置
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Install Dependencies",
      "type": "shell",
      "command": "./scripts/install-deps.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Development",
      "type": "shell",
      "command": "./scripts/start-dev.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Stop Development",
      "type": "shell",
      "command": "./scripts/stop-dev.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Database Migration",
      "type": "shell",
      "command": "./scripts/init-database.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### 2. WebStorm 配置

#### 项目配置
```javascript
// .idea/runConfigurations/Backend_Dev.xml
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Backend Dev" type="NodeJSConfigurationType" 
                 application-parameters="--watch" path-to-js-file="dist/main.js" 
                 working-dir="$PROJECT_DIR$/backend">
    <envs>
      <env name="NODE_ENV" value="development" />
    </envs>
  </configuration>
</component>
```

## 开发工作流

### 1. 日常开发流程

```bash
# 1. 更新代码
git pull origin main

# 2. 安装/更新依赖
./scripts/install-deps.sh

# 3. 数据库迁移（如有需要）
./scripts/init-database.sh

# 4. 启动开发环境
./scripts/start-dev.sh

# 5. 开始开发...

# 6. 停止开发环境
./scripts/stop-dev.sh
```

### 2. 代码提交流程

```bash
# 1. 检查代码质量
cd frontend && pnpm lint && cd ..
cd backend && pnpm lint && cd ..

# 2. 运行测试
cd backend && pnpm test && cd ..

# 3. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin feature/new-feature
```

### 3. 分支管理策略

```bash
# 主分支
main          # 生产环境分支
develop       # 开发环境分支

# 功能分支
feature/*     # 新功能开发
bugfix/*      # 问题修复
hotfix/*      # 紧急修复
release/*     # 版本发布

# 创建功能分支
git checkout -b feature/user-management
git push -u origin feature/user-management

# 合并到开发分支
git checkout develop
git merge feature/user-management
git push origin develop
```

## 常见问题解决

### 1. 端口占用问题

```bash
# 查看端口占用
lsof -i :9527
netstat -tulpn | grep :9527

# 杀死占用进程
kill -9 <PID>

# 或使用脚本清理
./scripts/clean-ports.sh
```

### 2. 依赖安装问题

```bash
# 清理 node_modules
find . -name "node_modules" -type d -exec rm -rf {} +

# 清理 pnpm 缓存
pnpm store prune

# 重新安装依赖
./scripts/install-deps.sh
```

### 3. 数据库连接问题

```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 重启 PostgreSQL 服务
sudo systemctl restart postgresql

# 检查数据库连接
psql -U soybean -h localhost -d soybean-admin-nest-backend-dev -c "SELECT version();"
```

### 4. 内存不足问题

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或在 package.json 中配置
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' vite"
  }
}
```

## 性能优化建议

### 1. 开发环境优化

```bash
# 启用 pnpm 的 shamefully-hoist
echo "shamefully-hoist=true" >> .npmrc

# 使用本地缓存
echo "store-dir=~/.pnpm-store" >> .npmrc

# 启用并行安装
echo "side-effects-cache=true" >> .npmrc
```

### 2. 构建优化

```javascript
// vite.config.ts 优化配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['naive-ui', '@vueuse/core']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'naive-ui']
  }
})
```

### 3. 开发服务器优化

```javascript
// vite.config.ts 开发服务器配置
export default defineConfig({
  server: {
    hmr: {
      overlay: false
    },
    host: '0.0.0.0',
    port: 9527,
    open: true,
    cors: true
  }
})
```

## 团队协作配置

### 1. Git Hooks 配置

```bash
# 安装 husky
pnpm add -D husky

# 初始化 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"

# 添加 commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### 2. 代码规范配置

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "stylelint --fix",
      "prettier --write"
    ]
  }
}
```

### 3. 提交规范配置

```javascript
// commit