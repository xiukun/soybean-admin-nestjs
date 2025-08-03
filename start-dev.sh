#!/bin/bash

# SoybeanAdmin NestJS 低代码平台开发环境启动脚本
# Development Environment Startup Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_message "等待 ${service_name} 启动..." $YELLOW
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url > /dev/null 2>&1; then
            print_message "✅ ${service_name} 启动成功!" $GREEN
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_message "❌ ${service_name} 启动超时" $RED
    return 1
}

print_message "🚀 SoybeanAdmin NestJS 低代码平台开发环境启动" $BLUE
print_message "=================================================" $BLUE

# 1. 检查必要的工具
print_message "\n📋 检查开发环境..." $YELLOW

if ! command_exists node; then
    print_message "❌ Node.js 未安装，请先安装 Node.js 18+" $RED
    exit 1
fi

if ! command_exists pnpm; then
    print_message "❌ pnpm 未安装，请先安装 pnpm" $RED
    print_message "安装命令: npm install -g pnpm" $YELLOW
    exit 1
fi

if ! command_exists docker; then
    print_message "❌ Docker 未安装，请先安装 Docker" $RED
    exit 1
fi

print_message "✅ 开发环境检查通过" $GREEN

# 2. 检查数据库一致性
print_message "\n📋 检查数据库一致性..." $YELLOW
if ! node scripts/check-database-consistency.js; then
    print_message "❌ 数据库一致性检查失败，请修复后重试" $RED
    exit 1
fi

# 3. 安装依赖
print_message "\n📦 安装项目依赖..." $YELLOW
pnpm install

# 4. 启动数据库服务
print_message "\n🗄️  启动数据库服务..." $YELLOW

if check_port 25432; then
    print_message "✅ PostgreSQL 已在运行 (端口 25432)" $GREEN
else
    print_message "启动 PostgreSQL..." $YELLOW
    docker-compose up -d postgres
    sleep 5
fi

if check_port 26379; then
    print_message "✅ Redis 已在运行 (端口 26379)" $GREEN
else
    print_message "启动 Redis..." $YELLOW
    docker-compose up -d redis
    sleep 3
fi

# 5. 初始化数据库
print_message "\n🔧 初始化数据库..." $YELLOW

# 设置数据库连接环境变量
export DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend"
export PGPASSWORD="soybean@123."

cd deploy
if [ -f "setup-lowcode-platform.sh" ]; then
    chmod +x setup-lowcode-platform.sh
    ./setup-lowcode-platform.sh
else
    print_message "⚠️  数据库初始化脚本不存在，跳过初始化" $YELLOW
fi
cd ..

# 6. 生成 Prisma 客户端
print_message "\n🔧 生成 Prisma 客户端..." $YELLOW

print_message "生成 Backend Prisma 客户端..." $YELLOW
cd backend && pnpm run prisma:generate && cd ..

print_message "生成 Lowcode Platform Prisma 客户端..." $YELLOW
cd lowcode-platform-backend && pnpm run prisma:generate && cd ..

if [ -d "amis-lowcode-backend" ]; then
    print_message "生成 Amis Backend Prisma 客户端..." $YELLOW
    cd amis-lowcode-backend && pnpm run prisma:generate && cd ..
fi

# 7. 启动后端服务
print_message "\n🚀 启动后端服务..." $YELLOW

# 启动主后端服务
print_message "启动 Backend Service (端口 9528)..." $YELLOW
cd backend
pnpm run start:dev &
BACKEND_PID=$!
cd ..

# 启动低代码平台后端
print_message "启动 Lowcode Platform Backend (端口 3002)..." $YELLOW
cd lowcode-platform-backend
pnpm run start:dev &
LOWCODE_PID=$!
cd ..

# 启动 Amis 后端 (如果存在)
if [ -d "amis-lowcode-backend" ] && [ -f "amis-lowcode-backend/package.json" ]; then
    print_message "启动 Amis Lowcode Backend (端口 9522)..." $YELLOW
    cd amis-lowcode-backend
    pnpm run start:dev &
    AMIS_PID=$!
    cd ..
fi

# 等待后端服务启动
sleep 10

# 检查后端服务状态
wait_for_service "http://localhost:9528/v1/route/getConstantRoutes" "Backend Service"
wait_for_service "http://localhost:3002/health" "Lowcode Platform Backend"

if [ -n "$AMIS_PID" ]; then
    wait_for_service "http://localhost:9522/api/v1/health" "Amis Lowcode Backend"
fi

# 8. 启动前端服务
print_message "\n🎨 启动前端服务..." $YELLOW

print_message "启动 Frontend (端口 9527)..." $YELLOW
cd frontend
pnpm run dev &
FRONTEND_PID=$!
cd ..

# 启动低代码设计器 (如果存在)
if [ -d "lowcode-designer" ] && [ -f "lowcode-designer/package.json" ]; then
    print_message "启动 Lowcode Designer (端口 9555)..." $YELLOW
    cd lowcode-designer
    pnpm run dev &
    DESIGNER_PID=$!
    cd ..
fi

# 等待前端服务启动
sleep 5
wait_for_service "http://localhost:9527" "Frontend"

if [ -n "$DESIGNER_PID" ]; then
    wait_for_service "http://localhost:9555" "Lowcode Designer"
fi

# 9. 显示启动完成信息
print_message "\n🎉 所有服务启动完成!" $GREEN
print_message "=================================================" $GREEN
print_message "📱 前端管理界面: http://localhost:9527" $GREEN
print_message "🔧 后端 API 文档: http://localhost:9528/api-docs" $GREEN
print_message "⚙️  低代码平台 API: http://localhost:3002/api-docs" $GREEN

if [ -n "$AMIS_PID" ]; then
    print_message "🎯 Amis 后端 API: http://localhost:9522/api/v1/docs" $GREEN
fi

if [ -n "$DESIGNER_PID" ]; then
    print_message "🎨 低代码设计器: http://localhost:9555" $GREEN
fi

print_message "\n📊 数据库管理:" $BLUE
print_message "   PostgreSQL: localhost:25432" $BLUE
print_message "   Redis: localhost:26379" $BLUE

print_message "\n🔑 默认登录信息:" $BLUE
print_message "   用户名: Soybean" $BLUE
print_message "   密码: soybean123" $BLUE

print_message "\n⚠️  按 Ctrl+C 停止所有服务" $YELLOW

# 10. 等待用户中断
trap 'print_message "\n🛑 正在停止所有服务..." $YELLOW; kill $BACKEND_PID $LOWCODE_PID $FRONTEND_PID $AMIS_PID $DESIGNER_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done