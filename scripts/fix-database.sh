#!/bin/bash

# 数据库修复脚本 - 解决Backend服务启动失败问题

echo "🔧 修复数据库连接问题"
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Docker服务状态
check_docker_services() {
    echo -e "${BLUE}📊 检查Docker服务状态...${NC}"
    
    if docker-compose -f docker-compose.simple.yml -p soybean-admin-nest ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Docker服务运行正常${NC}"
        return 0
    else
        echo -e "${RED}❌ Docker服务未运行，正在启动...${NC}"
        docker-compose -f docker-compose.simple.yml -p soybean-admin-nest up -d postgres redis
        sleep 10
        return 1
    fi
}

# 创建数据库和用户
setup_database() {
    echo -e "${BLUE}🗄️ 设置数据库...${NC}"
    
    # 连接到PostgreSQL并创建数据库
    docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec postgres psql -U postgres -c "
        -- 创建数据库（如果不存在）
        SELECT 'CREATE DATABASE soybean_admin' 
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'soybean_admin')\\gexec
        
        -- 创建backend schema（如果不存在）
        \\c soybean_admin;
        CREATE SCHEMA IF NOT EXISTS backend;
        
        -- 授权给postgres用户
        GRANT ALL PRIVILEGES ON DATABASE soybean_admin TO postgres;
        GRANT ALL PRIVILEGES ON SCHEMA backend TO postgres;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA backend TO postgres;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA backend TO postgres;
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA backend TO postgres;
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库设置完成${NC}"
        return 0
    else
        echo -e "${RED}❌ 数据库设置失败${NC}"
        return 1
    fi
}

# 测试数据库连接
test_database_connection() {
    echo -e "${BLUE}🔍 测试数据库连接...${NC}"
    
    # 使用正确的连接字符串测试
    local test_result=$(docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec postgres \
        psql -U postgres -d soybean_admin -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
    
    if [ "$test_result" -eq 1 ]; then
        echo -e "${GREEN}✅ 数据库连接测试成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 数据库连接测试失败${NC}"
        return 1
    fi
}

# 更新环境变量
update_env_variables() {
    echo -e "${BLUE}⚙️ 更新环境变量...${NC}"
    
    # 确保.env文件中的配置正确
    cd ..
    
    # 检查当前DATABASE_URL
    local current_db_url=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
    echo "当前数据库URL: $current_db_url"
    
    # 如果URL不正确，更新它
    if [[ "$current_db_url" != *"postgres:password@localhost:25432/soybean_admin"* ]]; then
        echo -e "${YELLOW}⚠️ 更新数据库URL配置...${NC}"
        
        # 备份原文件
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        
        # 更新配置
        sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"|' .env
        
        # 添加DIRECT_DATABASE_URL如果不存在
        if ! grep -q "^DIRECT_DATABASE_URL=" .env; then
            echo 'DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"' >> .env
        else
            sed -i '' 's|^DIRECT_DATABASE_URL=.*|DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"|' .env
        fi
        
        echo -e "${GREEN}✅ 环境变量已更新${NC}"
    else
        echo -e "${GREEN}✅ 环境变量配置正确${NC}"
    fi
    
    cd backend
}

# 重新生成Prisma客户端
regenerate_prisma() {
    echo -e "${BLUE}🔄 重新生成Prisma客户端...${NC}"
    
    # 清理旧的客户端
    rm -rf node_modules/.prisma
    rm -rf node_modules/@prisma/client
    
    # 重新生成
    if npx prisma generate; then
        echo -e "${GREEN}✅ Prisma客户端生成成功${NC}"
    else
        echo -e "${RED}❌ Prisma客户端生成失败${NC}"
        return 1
    fi
    
    # 推送数据库模式
    echo -e "${BLUE}📤 推送数据库模式...${NC}"
    if npx prisma db push --accept-data-loss; then
        echo -e "${GREEN}✅ 数据库模式推送成功${NC}"
    else
        echo -e "${YELLOW}⚠️ 数据库模式推送失败，但继续...${NC}"
    fi
}

# 启动Backend服务
start_backend() {
    echo -e "${BLUE}🚀 启动Backend服务...${NC}"
    
    # 杀死可能存在的进程
    pkill -f "nest start base-system" 2>/dev/null
    
    # 启动服务
    echo -e "${BLUE}正在启动Backend服务...${NC}"
    npm run start:dev &
    BACKEND_PID=$!
    
    # 等待服务启动
    echo -e "${BLUE}⏳ 等待服务启动...${NC}"
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

# 显示最终状态
show_final_status() {
    echo -e "\n${BLUE}📊 最终系统状态${NC}"
    echo "=================================="
    
    # Docker服务状态
    echo -e "\n${YELLOW}Docker服务:${NC}"
    docker-compose -f docker-compose.simple.yml -p soybean-admin-nest ps
    
    # 数据库连接测试
    echo -e "\n${YELLOW}数据库连接:${NC}"
    if docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec postgres \
        psql -U postgres -d soybean_admin -c "SELECT 'Database OK' as status;" 2>/dev/null | grep -q "Database OK"; then
        echo "✅ 数据库连接正常"
    else
        echo "❌ 数据库连接异常"
    fi
    
    # API测试
    echo -e "\n${YELLOW}API服务:${NC}"
    if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ API服务正常"
        echo "🌐 API文档: http://localhost:3000/api"
        echo "🏥 健康检查: http://localhost:3000/health"
    else
        echo "❌ API服务异常"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}开始修复数据库连接问题...${NC}"
    
    # 检查Docker服务
    check_docker_services
    
    # 设置数据库
    if setup_database; then
        echo -e "${GREEN}✅ 数据库设置完成${NC}"
    else
        echo -e "${YELLOW}⚠️ 数据库设置可能有问题，但继续...${NC}"
    fi
    
    # 测试数据库连接
    if test_database_connection; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败，请检查配置${NC}"
        exit 1
    fi
    
    # 更新环境变量
    update_env_variables
    
    # 重新生成Prisma客户端
    if regenerate_prisma; then
        echo -e "${GREEN}✅ Prisma配置完成${NC}"
    else
        echo -e "${RED}❌ Prisma配置失败${NC}"
        exit 1
    fi
    
    # 启动Backend服务
    if start_backend; then
        echo -e "${GREEN}✅ Backend服务启动成功${NC}"
    else
        echo -e "${RED}❌ Backend服务启动失败${NC}"
        exit 1
    fi
    
    # 显示最终状态
    show_final_status
    
    echo -e "\n${GREEN}🎉 数据库修复完成！Backend服务已成功启动！${NC}"
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
    pkill -f "nest start base-system" 2>/dev/null
    
    echo -e "${GREEN}✅ 服务已停止${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 运行主函数
main "$@"
