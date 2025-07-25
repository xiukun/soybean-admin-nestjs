#!/bin/bash

# 快速启动脚本 - 直接运行backend服务

echo "🚀 快速启动统一JWT认证系统"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️ 端口 $port 已被占用${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 端口 $port 可用${NC}"
        return 0
    fi
}

# 启动基础服务
start_infrastructure() {
    echo -e "\n${BLUE}📦 启动基础设施服务...${NC}"
    
    # 只启动数据库和Redis
    docker-compose -f docker-compose.simple.yml -p soybean-admin-nest up -d postgres redis
    
    echo "⏳ 等待数据库和Redis启动..."
    sleep 15
    
    # 检查服务状态
    if docker-compose -f docker-compose.simple.yml -p soybean-admin-nest ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ 基础设施服务启动成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 基础设施服务启动失败${NC}"
        return 1
    fi
}

# 启动backend服务
start_backend() {
    echo -e "\n${BLUE}🔧 启动Backend服务...${NC}"
    
    # 检查端口
    if ! check_port 3000; then
        echo -e "${RED}请先停止占用端口3000的服务${NC}"
        return 1
    fi
    
    # 进入backend目录
    cd backend
    
    # 设置环境变量
    export NODE_ENV=development
    export DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
    export DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
    export REDIS_URL="redis://localhost:26379"
    export JWT_SECRET="soybean-admin-jwt-secret-key-change-in-production-environment-32chars"
    export JWT_ACCESS_TOKEN_SECRET="soybean-admin-jwt-secret-key-change-in-production-environment-32chars"
    export JWT_REFRESH_TOKEN_SECRET="soybean-admin-refresh-secret-key-change-in-production-environment-32chars"
    export JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
    export JWT_REFRESH_TOKEN_EXPIRES_IN="7d"
    export CORS_ORIGIN="http://localhost:3200,http://localhost:5173"
    export ENABLE_SWAGGER="true"
    export SWAGGER_PATH="/api"
    
    echo "🔧 同步数据库模式..."
    if npx prisma db push; then
        echo -e "${GREEN}✅ 数据库模式同步成功${NC}"
    else
        echo -e "${YELLOW}⚠️ 数据库模式同步失败，但继续启动...${NC}"
    fi
    
    echo "🚀 启动Backend服务..."
    npm run start:dev &
    BACKEND_PID=$!
    
    # 等待服务启动
    echo "⏳ 等待Backend服务启动..."
    for i in {1..30}; do
        if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend服务启动成功！${NC}"
            echo -e "${BLUE}🌐 API文档: http://localhost:3000/api${NC}"
            echo -e "${BLUE}🏥 健康检查: http://localhost:3000/health${NC}"
            return 0
        fi
        echo "等待中... ($i/30)"
        sleep 2
    done
    
    echo -e "${RED}❌ Backend服务启动超时${NC}"
    return 1
}

# 显示状态
show_status() {
    echo -e "\n${BLUE}📊 系统状态${NC}"
    echo "=================================="
    
    # Docker服务状态
    echo -e "\n${YELLOW}Docker服务:${NC}"
    docker-compose -f docker-compose.simple.yml -p soybean-admin-nest ps
    
    # 端口检查
    echo -e "\n${YELLOW}端口状态:${NC}"
    echo "PostgreSQL (25432): $(lsof -Pi :25432 -sTCP:LISTEN -t >/dev/null && echo '✅ 运行中' || echo '❌ 未运行')"
    echo "Redis (26379): $(lsof -Pi :26379 -sTCP:LISTEN -t >/dev/null && echo '✅ 运行中' || echo '❌ 未运行')"
    echo "Backend (3000): $(lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null && echo '✅ 运行中' || echo '❌ 未运行')"
    
    # API测试
    echo -e "\n${YELLOW}API测试:${NC}"
    if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "健康检查: ✅ 正常"
        echo "API文档: 🌐 http://localhost:3000/api"
    else
        echo "健康检查: ❌ 失败"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}开始快速启动流程...${NC}"
    
    # 启动基础设施
    if start_infrastructure; then
        echo -e "${GREEN}✅ 基础设施就绪${NC}"
    else
        echo -e "${RED}❌ 基础设施启动失败${NC}"
        exit 1
    fi
    
    # 启动backend
    if start_backend; then
        echo -e "${GREEN}✅ Backend服务就绪${NC}"
    else
        echo -e "${RED}❌ Backend服务启动失败${NC}"
        exit 1
    fi
    
    # 显示状态
    show_status
    
    echo -e "\n${GREEN}🎉 统一JWT认证系统启动完成！${NC}"
    echo -e "${BLUE}💡 按 Ctrl+C 停止服务${NC}"
    
    # 保持脚本运行
    wait
}

# 信号处理
cleanup() {
    echo -e "\n${YELLOW}🛑 正在停止服务...${NC}"
    
    # 停止backend进程
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # 停止Docker服务
    docker-compose -f docker-compose.simple.yml -p soybean-admin-nest down
    
    echo -e "${GREEN}✅ 服务已停止${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 运行主函数
main "$@"
