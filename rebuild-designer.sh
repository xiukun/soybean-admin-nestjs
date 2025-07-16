#!/bin/bash

# 快速重建低代码设计器脚本
# 重新构建设计器并更新 Docker 容器

set -e

echo "🔄 快速重建低代码设计器..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 构建设计器
echo -e "${BLUE}🔨 步骤 1: 构建低代码设计器...${NC}"
./build-designer.sh

# 2. 停止现有的设计器容器
echo -e "${BLUE}🛑 步骤 2: 停止现有的设计器容器...${NC}"
docker-compose stop lowcode-designer || true

# 3. 重新构建 Docker 镜像
echo -e "${BLUE}🐳 步骤 3: 重新构建 Docker 镜像...${NC}"
docker-compose build --no-cache lowcode-designer

# 4. 启动设计器容器
echo -e "${BLUE}🚀 步骤 4: 启动设计器容器...${NC}"
docker-compose up -d lowcode-designer

# 5. 等待服务启动
echo -e "${BLUE}⏳ 步骤 5: 等待服务启动...${NC}"
sleep 10

# 6. 检查服务状态
echo -e "${BLUE}🔍 步骤 6: 检查服务状态...${NC}"
if docker-compose ps lowcode-designer | grep -q "Up"; then
    echo -e "${GREEN}✅ 低代码设计器重建成功！${NC}"
    echo ""
    echo -e "${GREEN}🌐 访问地址: http://localhost:9555${NC}"
    echo ""
    
    # 显示容器状态
    echo -e "${BLUE}📊 容器状态:${NC}"
    docker-compose ps lowcode-designer
    
    # 显示最近的日志
    echo ""
    echo -e "${BLUE}📝 最近的日志:${NC}"
    docker-compose logs --tail=10 lowcode-designer
else
    echo -e "${RED}❌ 设计器启动失败${NC}"
    echo ""
    echo -e "${YELLOW}📝 错误日志:${NC}"
    docker-compose logs --tail=20 lowcode-designer
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 重建完成！${NC}"
