#!/bin/bash

# 低代码设计器本地构建脚本
# 在本地编译 lowcode-designer 并复制静态资源到 static-designer 目录

set -e

echo "🔨 开始构建低代码设计器..."

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

# 检查 lowcode-designer 目录是否存在
if [ ! -d "lowcode-designer" ]; then
    echo -e "${RED}❌ lowcode-designer 目录不存在${NC}"
    exit 1
fi

# 检查 Node.js 和 pnpm 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装，请先安装 pnpm${NC}"
    exit 1
fi

echo -e "${BLUE}📦 进入 lowcode-designer 目录...${NC}"
cd lowcode-designer

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 安装依赖...${NC}"
    pnpm install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi

# 清理之前的构建
if [ -d "dist" ]; then
    echo -e "${YELLOW}🧹 清理之前的构建...${NC}"
    rm -rf dist
fi

# 构建项目
echo -e "${BLUE}🔨 开始构建项目...${NC}"
pnpm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败，dist 目录不存在${NC}"
    exit 1
fi

# 返回项目根目录
cd ..

# 创建或清理 static-designer 目录
if [ -d "static-designer" ]; then
    echo -e "${YELLOW}🧹 清理 static-designer 目录...${NC}"
    rm -rf static-designer/*
else
    echo -e "${BLUE}📁 创建 static-designer 目录...${NC}"
    mkdir -p static-designer
fi

# 复制构建产物到 static-designer 目录
echo -e "${BLUE}📋 复制静态资源...${NC}"
cp -r lowcode-designer/dist/* static-designer/

# 验证复制结果
if [ -f "static-designer/index.html" ]; then
    echo -e "${GREEN}✅ 静态资源复制成功${NC}"
    
    # 显示文件列表
    echo -e "${BLUE}📄 static-designer 目录内容:${NC}"
    ls -la static-designer/
    
    # 显示文件大小
    echo -e "${BLUE}📊 目录大小:${NC}"
    du -sh static-designer/
else
    echo -e "${RED}❌ 静态资源复制失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 低代码设计器构建完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步操作:${NC}"
echo "  1. 运行 Docker 构建: docker-compose build lowcode-designer"
echo "  2. 启动服务: docker-compose up -d lowcode-designer"
echo "  3. 或者一键启动: ./start-services.sh"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 静态资源已保存在 static-designer/ 目录"
echo "  - Docker 构建将直接使用这些预编译的资源"
echo "  - 避免了在容器中编译，解决内存溢出问题"
echo ""
