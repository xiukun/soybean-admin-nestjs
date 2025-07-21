#!/bin/bash

# 低代码平台状态检查脚本
# 检查所有服务的运行状态和配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔍 低代码平台状态检查${NC}"
echo -e "${BLUE}项目根目录: $PROJECT_ROOT${NC}"
echo ""

# 检查函数
check_service() {
    local service_name=$1
    local port=$2
    local path=$3
    
    echo -n "检查 $service_name (端口 $port): "
    
    if curl -s "http://localhost:$port$path" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 运行中${NC}"
        return 0
    else
        echo -e "${RED}✗ 未运行${NC}"
        return 1
    fi
}

check_directory() {
    local dir_name=$1
    local dir_path=$2
    
    echo -n "检查 $dir_name 目录: "
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✓ 存在${NC}"
        return 0
    else
        echo -e "${RED}✗ 不存在${NC}"
        return 1
    fi
}

check_file() {
    local file_name=$1
    local file_path=$2
    
    echo -n "检查 $file_name: "
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓ 存在${NC}"
        return 0
    else
        echo -e "${RED}✗ 不存在${NC}"
        return 1
    fi
}

check_npm_dependencies() {
    local project_name=$1
    local project_path=$2
    
    echo -n "检查 $project_name 依赖: "
    
    if [ -d "$project_path/node_modules" ]; then
        echo -e "${GREEN}✓ 已安装${NC}"
        return 0
    else
        echo -e "${RED}✗ 未安装${NC}"
        return 1
    fi
}

# 开始检查
echo -e "${YELLOW}📁 目录结构检查${NC}"
echo "----------------------------------------"

# 检查主要目录
check_directory "主后端" "$PROJECT_ROOT/backend"
check_directory "低代码平台后端" "$PROJECT_ROOT/lowcode-platform-backend"
check_directory "Amis业务后端" "$PROJECT_ROOT/amis-lowcode-backend"
check_directory "前端" "$PROJECT_ROOT/frontend"

echo ""
echo -e "${YELLOW}📦 依赖检查${NC}"
echo "----------------------------------------"

# 检查依赖安装
check_npm_dependencies "主后端" "$PROJECT_ROOT/backend"
check_npm_dependencies "低代码平台后端" "$PROJECT_ROOT/lowcode-platform-backend"
check_npm_dependencies "前端" "$PROJECT_ROOT/frontend"

if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ]; then
    check_npm_dependencies "Amis业务后端" "$PROJECT_ROOT/amis-lowcode-backend"
fi

echo ""
echo -e "${YELLOW}⚙️  配置文件检查${NC}"
echo "----------------------------------------"

# 检查配置文件
check_file "主后端环境配置" "$PROJECT_ROOT/backend/.env"
check_file "低代码平台后端环境配置" "$PROJECT_ROOT/lowcode-platform-backend/.env"
check_file "前端环境配置" "$PROJECT_ROOT/frontend/.env"

if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ]; then
    check_file "Amis业务后端环境配置" "$PROJECT_ROOT/amis-lowcode-backend/.env"
    check_file "Amis业务后端Prisma配置" "$PROJECT_ROOT/amis-lowcode-backend/prisma/schema.prisma"
fi

echo ""
echo -e "${YELLOW}🚀 服务状态检查${NC}"
echo "----------------------------------------"

# 检查服务运行状态
services_running=0
total_services=0

# 主后端服务 (端口 9527)
if check_service "主后端服务" "9527" "/api"; then
    ((services_running++))
fi
((total_services++))

# 低代码平台后端 (端口 9521)
if check_service "低代码平台后端" "9521" "/api/v1"; then
    ((services_running++))
fi
((total_services++))

# Amis业务后端 (端口 9521，不同路径)
if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ]; then
    if check_service "Amis业务后端" "9521" "/api/v1/health"; then
        ((services_running++))
    fi
    ((total_services++))
fi

# 前端服务 (端口 9527)
if check_service "前端服务" "9527" "/"; then
    ((services_running++))
fi
((total_services++))

echo ""
echo -e "${YELLOW}🗄️  数据库连接检查${NC}"
echo "----------------------------------------"

# 检查数据库连接 (如果服务运行中)
if curl -s "http://localhost:9521/api/v1/health" > /dev/null 2>&1; then
    echo -n "检查低代码平台数据库连接: "
    if curl -s "http://localhost:9521/api/v1/health" | grep -q "ok"; then
        echo -e "${GREEN}✓ 连接正常${NC}"
    else
        echo -e "${RED}✗ 连接异常${NC}"
    fi
fi

if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ] && curl -s "http://localhost:9521/api/v1/health" > /dev/null 2>&1; then
    echo -n "检查Amis业务数据库连接: "
    if curl -s "http://localhost:9521/api/v1/health" | grep -q "ok"; then
        echo -e "${GREEN}✓ 连接正常${NC}"
    else
        echo -e "${RED}✗ 连接异常${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}📊 API接口检查${NC}"
echo "----------------------------------------"

# 检查关键API接口
if curl -s "http://localhost:9521/api/v1" > /dev/null 2>&1; then
    echo -n "检查低代码平台API: "
    if curl -s "http://localhost:9521/api/v1" | grep -q "Low-code Platform"; then
        echo -e "${GREEN}✓ 正常响应${NC}"
    else
        echo -e "${YELLOW}⚠ 响应异常${NC}"
    fi
    
    echo -n "检查模板管理API: "
    if curl -s "http://localhost:9521/api/v1/templates" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 可访问${NC}"
    else
        echo -e "${RED}✗ 不可访问${NC}"
    fi
    
    echo -n "检查代码生成API: "
    if curl -s "http://localhost:9521/api/v1/code-generation" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 可访问${NC}"
    else
        echo -e "${RED}✗ 不可访问${NC}"
    fi
fi

if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ] && curl -s "http://localhost:9521/api/v1/health" > /dev/null 2>&1; then
    echo -n "检查Amis业务API: "
    if curl -s "http://localhost:9521/api/v1" | grep -q "Amis"; then
        echo -e "${GREEN}✓ 正常响应${NC}"
    else
        echo -e "${YELLOW}⚠ 响应异常${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}📚 文档访问检查${NC}"
echo "----------------------------------------"

# 检查API文档
if curl -s "http://localhost:9521/api/v1/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 低代码平台API文档: http://localhost:9521/api/v1/docs${NC}"
else
    echo -e "${RED}✗ 低代码平台API文档不可访问${NC}"
fi

if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ] && curl -s "http://localhost:9521/api/v1/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Amis业务API文档: http://localhost:9521/api/v1/docs${NC}"
else
    echo -e "${RED}✗ Amis业务API文档不可访问${NC}"
fi

echo ""
echo -e "${YELLOW}📋 总结报告${NC}"
echo "========================================"

echo -e "服务运行状态: ${services_running}/${total_services} 个服务正在运行"

if [ $services_running -eq $total_services ]; then
    echo -e "${GREEN}🎉 所有服务运行正常！${NC}"
    echo ""
    echo -e "${BLUE}🌐 访问地址:${NC}"
    echo -e "  前端管理界面: ${GREEN}http://localhost:9527${NC}"
    echo -e "  低代码平台API: ${GREEN}http://localhost:9521/api/v1${NC}"
    echo -e "  API文档: ${GREEN}http://localhost:9521/api/v1/docs${NC}"
    if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ]; then
        echo -e "  Amis业务API: ${GREEN}http://localhost:9521/api/v1${NC}"
    fi
    echo ""
    echo -e "${BLUE}🚀 可以开始使用低代码平台进行开发！${NC}"
elif [ $services_running -gt 0 ]; then
    echo -e "${YELLOW}⚠️  部分服务未运行，请检查配置和启动状态${NC}"
    echo ""
    echo -e "${BLUE}💡 启动建议:${NC}"
    echo -e "  1. 检查环境配置文件 (.env)"
    echo -e "  2. 确保数据库服务正在运行"
    echo -e "  3. 检查端口占用情况"
    echo -e "  4. 查看服务日志排查问题"
else
    echo -e "${RED}❌ 所有服务都未运行${NC}"
    echo ""
    echo -e "${BLUE}🔧 启动步骤:${NC}"
    echo -e "  1. cd backend && npm run start:dev"
    echo -e "  2. cd lowcode-platform-backend && npm run start:dev"
    if [ -d "$PROJECT_ROOT/amis-lowcode-backend" ]; then
        echo -e "  3. cd amis-lowcode-backend && npm run start:dev"
    fi
    echo -e "  4. cd frontend && npm run dev"
fi

echo ""
echo -e "${BLUE}📝 如需创建Amis业务后端，请运行:${NC}"
echo -e "  ${YELLOW}./scripts/create-amis-backend.sh${NC}"

echo ""
echo -e "${BLUE}📖 详细文档:${NC}"
echo -e "  架构说明: ${YELLOW}docs/lowcode-architecture-and-code-generation.md${NC}"
echo -e "  实施指南: ${YELLOW}docs/lowcode-complete-implementation-guide.md${NC}"
echo -e "  脚手架文档: ${YELLOW}docs/lowcode-backend-scaffold.md${NC}"
