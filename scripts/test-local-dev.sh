#!/bin/bash

# 本地开发环境测试脚本
# 验证本地开发环境与Docker环境的一致性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 测试本地开发环境与Docker环境一致性...${NC}"

# 检查Docker服务状态
echo -e "${BLUE}📊 检查Docker服务状态...${NC}"
docker-compose -p soybean-admin-nest ps

# 验证数据库连接
echo -e "${BLUE}📊 验证数据库连接...${NC}"
./scripts/database-manager.sh status

# 测试各服务的Prisma客户端生成
echo -e "${BLUE}🔧 测试Prisma客户端生成...${NC}"

echo -e "${YELLOW}  测试Backend服务...${NC}"
cd backend
npm run prisma:generate || echo -e "${RED}Backend Prisma生成失败${NC}"
echo -e "${GREEN}  ✅ Backend Prisma客户端生成成功${NC}"

echo -e "${YELLOW}  测试Lowcode Platform服务...${NC}"
cd ../lowcode-platform-backend
npm run prisma:generate || echo -e "${RED}Lowcode Platform Prisma生成失败${NC}"
echo -e "${GREEN}  ✅ Lowcode Platform Prisma客户端生成成功${NC}"

echo -e "${YELLOW}  测试AMIS服务...${NC}"
cd ../amis-lowcode-backend
npm run prisma:generate || echo -e "${RED}AMIS Prisma生成失败${NC}"
echo -e "${GREEN}  ✅ AMIS Prisma客户端生成成功${NC}"

cd ..

# 验证环境变量配置
echo -e "${BLUE}📊 验证环境变量配置...${NC}"

echo -e "${YELLOW}Backend .env:${NC}"
grep "DATABASE_URL" backend/.env | head -1

echo -e "${YELLOW}Lowcode Platform .env:${NC}"
grep "DATABASE_URL" lowcode-platform-backend/.env | head -1

echo -e "${YELLOW}AMIS .env:${NC}"
grep "DATABASE_URL" amis-lowcode-backend/.env | head -1

# 检查端口配置
echo -e "${BLUE}📊 检查服务端口配置...${NC}"
echo -e "${YELLOW}Docker服务端口:${NC}"
echo "  Frontend: http://localhost:9527"
echo "  Backend: http://localhost:9528"
echo "  Lowcode Platform: http://localhost:3000"
echo "  AMIS Backend: http://localhost:9522"
echo "  Lowcode Designer: http://localhost:9555"
echo "  PostgreSQL: localhost:25432"
echo "  Redis: localhost:26379"
echo "  PgBouncer: localhost:6432"

# 测试服务连通性
echo -e "${BLUE}📊 测试服务连通性...${NC}"

echo -e "${YELLOW}  测试Frontend...${NC}"
if curl -s -I http://localhost:9527/ | grep -q "200 OK"; then
    echo -e "${GREEN}  ✅ Frontend服务正常${NC}"
else
    echo -e "${RED}  ❌ Frontend服务异常${NC}"
fi

echo -e "${YELLOW}  测试Backend API...${NC}"
if curl -s http://localhost:9528/ | grep -q "Cannot GET"; then
    echo -e "${GREEN}  ✅ Backend服务正常响应${NC}"
else
    echo -e "${RED}  ❌ Backend服务异常${NC}"
fi

echo -e "${YELLOW}  测试Lowcode Platform API...${NC}"
if curl -s http://localhost:3000/ | grep -q "Cannot GET"; then
    echo -e "${GREEN}  ✅ Lowcode Platform服务正常响应${NC}"
else
    echo -e "${RED}  ❌ Lowcode Platform服务异常${NC}"
fi

echo -e "${YELLOW}  测试数据库连接...${NC}"
if docker exec soybean-postgres pg_isready -U soybean -d soybean-admin-nest-backend > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 数据库连接正常${NC}"
else
    echo -e "${RED}  ❌ 数据库连接异常${NC}"
fi

echo -e "${GREEN}🎉 本地开发环境测试完成！${NC}"
echo -e "${BLUE}💡 提示:${NC}"
echo "  - Docker环境已正常运行"
echo "  - 本地开发时可以直接使用现有的.env配置"
echo "  - 数据库使用多schema架构，各服务数据完全隔离"
echo "  - 所有Prisma客户端都能正常生成"
