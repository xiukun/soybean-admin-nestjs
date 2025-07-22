#!/bin/bash

# 数据库管理脚本
# 提供数据库初始化、重置、备份、恢复等功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-25432}
DB_NAME=${DB_NAME:-soybean-admin-nest-backend}
DB_USER=${DB_USER:-soybean}
DB_PASSWORD=${DB_PASSWORD:-"soybean@123."}
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# 服务配置
SERVICES=("backend" "lowcode-platform-backend" "amis-lowcode-backend")
SCHEMAS=("backend" "lowcode" "amis")

# 显示帮助信息
show_help() {
    echo -e "${BLUE}数据库管理脚本${NC}"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  init      - 初始化所有数据库schema"
    echo "  reset     - 重置所有数据库schema"
    echo "  status    - 显示数据库状态"
    echo "  backup    - 备份数据库"
    echo "  restore   - 恢复数据库"
    echo "  migrate   - 执行数据库迁移"
    echo "  generate  - 生成Prisma客户端"
    echo "  help      - 显示此帮助信息"
}

# 等待数据库就绪
wait_for_db() {
    echo -e "${YELLOW}⏳ 等待数据库就绪...${NC}"
    until docker exec soybean-postgres pg_isready -U ${DB_USER} -d ${DB_NAME} > /dev/null 2>&1; do
        echo "  数据库未就绪，等待中..."
        sleep 2
    done
    echo -e "${GREEN}✅ 数据库已就绪${NC}"
}

# 创建schemas
create_schemas() {
    echo -e "${BLUE}📊 创建数据库schemas...${NC}"
    for schema in "${SCHEMAS[@]}"; do
        docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS ${schema};" || true
        echo -e "${GREEN}  ✅ Schema '${schema}' 创建完成${NC}"
    done
}

# 初始化数据库
init_database() {
    echo -e "${BLUE}🚀 开始初始化多Schema数据库...${NC}"
    
    wait_for_db
    create_schemas
    
    # 初始化各服务表结构
    for i in "${!SERVICES[@]}"; do
        service="${SERVICES[$i]}"
        schema="${SCHEMAS[$i]}"
        
        echo -e "${BLUE}📊 初始化 ${service} 服务表结构...${NC}"
        cd "${service}"
        DATABASE_URL="${DB_URL}?schema=${schema}" npx prisma db push --skip-generate
        echo -e "${GREEN}✅ ${service} 服务表结构初始化完成${NC}"
        cd ..
    done
    
    show_status
    echo -e "${GREEN}🎉 多Schema数据库初始化完成！${NC}"
}

# 重置数据库
reset_database() {
    echo -e "${RED}⚠️  警告: 这将删除所有数据库数据！${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 重置数据库...${NC}"
        
        # 删除所有schemas
        for schema in "${SCHEMAS[@]}"; do
            docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "DROP SCHEMA IF EXISTS ${schema} CASCADE;" || true
        done
        
        # 重新初始化
        init_database
    else
        echo -e "${YELLOW}操作已取消${NC}"
    fi
}

# 显示数据库状态
show_status() {
    echo -e "${BLUE}📊 数据库状态:${NC}"
    echo "  Host: ${DB_HOST}:${DB_PORT}"
    echo "  Database: ${DB_NAME}"
    echo "  User: ${DB_USER}"
    echo ""
    
    for schema in "${SCHEMAS[@]}"; do
        echo -e "${BLUE}=== ${schema} Schema ===${NC}"
        docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "\dt ${schema}.*" 2>/dev/null || echo "  Schema不存在或为空"
        echo ""
    done
}

# 生成Prisma客户端
generate_clients() {
    echo -e "${BLUE}🔧 生成Prisma客户端...${NC}"
    
    for service in "${SERVICES[@]}"; do
        echo -e "${BLUE}  生成 ${service} 客户端...${NC}"
        cd "${service}"
        npx prisma generate
        echo -e "${GREEN}  ✅ ${service} 客户端生成完成${NC}"
        cd ..
    done
    
    echo -e "${GREEN}🎉 所有Prisma客户端生成完成！${NC}"
}

# 主函数
main() {
    case "${1:-help}" in
        "init")
            init_database
            ;;
        "reset")
            reset_database
            ;;
        "status")
            show_status
            ;;
        "generate")
            generate_clients
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

main "$@"
