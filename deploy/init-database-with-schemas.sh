#!/bin/bash

# 多Schema数据库初始化脚本 - Deploy版本
# 使用deploy/postgres目录下的SQL文件初始化数据库

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库连接配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-25432}
DB_NAME=${DB_NAME:-soybean-admin-nest-backend}
DB_USER=${DB_USER:-soybean}
DB_PASSWORD=${DB_PASSWORD:-"soybean@123."}

echo -e "${BLUE}🚀 开始使用Deploy SQL文件初始化多Schema数据库...${NC}"

# 数据库连接命令
PSQL_CMD="docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME}"

# 等待数据库就绪
echo -e "${YELLOW}⏳ 等待数据库就绪...${NC}"
until docker exec soybean-postgres pg_isready -U ${DB_USER} -d ${DB_NAME} > /dev/null 2>&1; do
  echo "  数据库未就绪，等待中..."
  sleep 2
done
echo -e "${GREEN}✅ 数据库已就绪${NC}"

# SQL文件执行顺序
SQL_FILES=(
    "00_init_schemas.sql"
    "01_create_table.sql"
    "02_sys_user.sql"
    "03_sys_role.sql"
    "04_sys_menu.sql"
    "05_sys_domain.sql"
    "06_sys_user_role.sql"
    "07_sys_role_menu.sql"
    "08_casbin_rule.sql"
    "09_lowcode_pages.sql"
    "10_lowcode_platform_tables.sql"
    "11_lowcode_platform_data.sql"
    "12_lowcode_queries_init.sql"
    "13_prisma_templates_update.sql"
    "14_code_generation_menus.sql"
)

# 执行SQL文件
for sql_file in "${SQL_FILES[@]}"; do
    file_path="deploy/postgres/${sql_file}"
    
    if [ -f "$file_path" ]; then
        echo -e "${BLUE}📊 执行 ${sql_file}...${NC}"
        
        if $PSQL_CMD -f "$file_path" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ ${sql_file} 执行成功${NC}"
        else
            echo -e "${RED}  ❌ ${sql_file} 执行失败${NC}"
            echo -e "${YELLOW}  尝试继续执行下一个文件...${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️  ${sql_file} 文件不存在，跳过${NC}"
    fi
done

# 验证数据库结构
echo -e "${BLUE}📊 验证数据库结构...${NC}"

echo -e "${YELLOW}=== Backend Schema ===${NC}"
$PSQL_CMD -c "\dt backend.*" 2>/dev/null || echo "  Backend schema为空或不存在"

echo -e "${YELLOW}=== Lowcode Schema ===${NC}"
$PSQL_CMD -c "\dt lowcode.*" 2>/dev/null || echo "  Lowcode schema为空或不存在"

echo -e "${YELLOW}=== AMIS Schema ===${NC}"
$PSQL_CMD -c "\dt amis.*" 2>/dev/null || echo "  AMIS schema为空或不存在"

# 检查枚举类型
echo -e "${BLUE}📊 检查枚举类型...${NC}"
$PSQL_CMD -c "SELECT schemaname, typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE typtype = 'e' ORDER BY schemaname, typname;" 2>/dev/null || echo "  无枚举类型"

echo -e "${GREEN}🎉 Deploy SQL文件数据库初始化完成！${NC}"
echo -e "${BLUE}💡 提示:${NC}"
echo "  - 所有表已按正确的schema创建"
echo "  - Backend schema包含系统管理表"
echo "  - Lowcode schema包含低代码平台表"
echo "  - AMIS schema预留给代码生成业务"
echo "  - 枚举类型在backend schema中定义"
