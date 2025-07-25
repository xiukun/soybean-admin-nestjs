#!/bin/bash

# 简化的统一微服务系统启动脚本

echo "🚀 启动统一JWT认证微服务系统"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 停止现有服务
echo -e "${BLUE}1. 停止现有服务...${NC}"
pkill -f "nest start" 2>/dev/null || true
docker-compose -f docker-compose.unified.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# 2. 启动基础设施服务
echo -e "${BLUE}2. 启动基础设施服务...${NC}"
docker-compose -f docker-compose.simple.yml up -d postgres redis
sleep 10

# 3. 创建数据库
echo -e "${BLUE}3. 初始化数据库...${NC}"
docker-compose -f docker-compose.simple.yml exec -T postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS soybean_admin;" 2>/dev/null || echo "数据库可能已存在"
docker-compose -f docker-compose.simple.yml exec -T postgres psql -U postgres -d soybean_admin -c "CREATE SCHEMA IF NOT EXISTS backend;" 2>/dev/null

# 4. 启动Backend服务
echo -e "${BLUE}4. 启动Backend服务...${NC}"
cd backend

# 设置环境变量
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export REDIS_HOST=localhost
export REDIS_PORT=26379
export REDIS_PASSWORD=
export REDIS_DB=0
export JWT_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
export JWT_ACCESS_TOKEN_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
export JWT_REFRESH_TOKEN_SECRET=soybean-admin-refresh-secret-key-change-in-production-environment-32chars
export JWT_ACCESS_TOKEN_EXPIRES_IN=15m
export JWT_REFRESH_TOKEN_EXPIRES_IN=7d
export CORS_ORIGIN=http://localhost:3200,http://localhost:5173
export ENABLE_SWAGGER=true
export SWAGGER_PATH=/api

# 生成Prisma客户端并推送数据库模式
echo -e "${YELLOW}生成Prisma客户端...${NC}"
npx prisma generate > /dev/null 2>&1
echo -e "${YELLOW}推送数据库模式...${NC}"
npx prisma db push --accept-data-loss > /dev/null 2>&1

# 启动Backend服务
echo -e "${YELLOW}启动Backend服务...${NC}"
npm run start:dev &
BACKEND_PID=$!
cd ..

# 5. 启动Lowcode Platform Backend
echo -e "${BLUE}5. 启动Lowcode Platform Backend...${NC}"
cd lowcode-platform-backend

# 设置环境变量
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export REDIS_URL="redis://localhost:26379"
export JWT_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
export SERVICE_SECRET=soybean-admin-service-secret-key-change-in-production-environment-32chars
export CORS_ORIGIN=http://localhost:3200,http://localhost:5173

# 启动服务
echo -e "${YELLOW}启动Lowcode Platform Backend...${NC}"
npm run start:dev &
LOWCODE_PID=$!
cd ..

# 6. 启动AMIS Lowcode Backend
echo -e "${BLUE}6. 启动AMIS Lowcode Backend...${NC}"
cd amis-lowcode-backend

# 设置环境变量
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
export REDIS_URL="redis://localhost:26379"
export JWT_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
export SERVICE_SECRET=soybean-admin-service-secret-key-change-in-production-environment-32chars
export CORS_ORIGIN=http://localhost:3200,http://localhost:5173

# 启动服务
echo -e "${YELLOW}启动AMIS Lowcode Backend...${NC}"
npm run start:dev &
AMIS_PID=$!
cd ..

# 7. 等待服务启动
echo -e "${BLUE}7. 等待服务启动...${NC}"
sleep 30

# 8. 验证服务状态
echo -e "${BLUE}8. 验证服务状态...${NC}"

# 检查Backend服务
if curl -s -f http://127.0.0.1:9528/v1 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend服务 (端口9528): 正常运行${NC}"
else
    echo -e "${RED}❌ Backend服务 (端口9528): 启动失败${NC}"
fi

# 检查Lowcode Platform Backend
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Lowcode Platform Backend (端口3001): 正常运行${NC}"
else
    echo -e "${RED}❌ Lowcode Platform Backend (端口3001): 启动失败${NC}"
fi

# 检查AMIS Lowcode Backend
if curl -s -f http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AMIS Lowcode Backend (端口3002): 正常运行${NC}"
else
    echo -e "${RED}❌ AMIS Lowcode Backend (端口3002): 启动失败${NC}"
fi

# 9. 显示系统信息
echo -e "\n${GREEN}🎉 统一JWT认证微服务系统启动完成！${NC}"
echo -e "\n${BLUE}📋 服务信息:${NC}"
echo -e "Backend服务:              http://127.0.0.1:9528"
echo -e "Backend API文档:          http://127.0.0.1:9528/api-docs"
echo -e "Lowcode Platform:         http://localhost:3001"
echo -e "AMIS Lowcode Backend:     http://localhost:3002"
echo -e "PostgreSQL:               localhost:25432"
echo -e "Redis:                    localhost:26379"

echo -e "\n${BLUE}🔧 管理命令:${NC}"
echo -e "查看Backend日志:          tail -f backend/logs/*.log"
echo -e "停止所有服务:             pkill -f 'nest start'"
echo -e "重启数据库:               docker-compose -f docker-compose.simple.yml restart postgres"

echo -e "\n${YELLOW}💡 按 Ctrl+C 停止所有服务${NC}"

# 信号处理
cleanup() {
    echo -e "\n${YELLOW}🛑 正在停止所有服务...${NC}"
    
    # 停止Node.js进程
    kill $BACKEND_PID 2>/dev/null || true
    kill $LOWCODE_PID 2>/dev/null || true
    kill $AMIS_PID 2>/dev/null || true
    
    # 停止所有nest进程
    pkill -f "nest start" 2>/dev/null || true
    
    # 停止Docker服务
    docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
    
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 保持脚本运行
wait
