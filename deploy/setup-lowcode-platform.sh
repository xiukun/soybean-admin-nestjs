#!/bin/bash

# 低代码平台设置脚本
# Low-code Platform Setup Script

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_environment() {
    log_info "检查环境变量..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 环境变量未设置"
        log_info "请设置 DATABASE_URL，例如："
        log_info "export DATABASE_URL='postgresql://username:password@localhost:5432/database'"
        exit 1
    fi
    
    log_success "环境变量检查完成"
}

# 检查 PostgreSQL 连接
check_database_connection() {
    log_info "检查数据库连接..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql 命令未找到，请安装 PostgreSQL 客户端"
        exit 1
    fi
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_error "无法连接到数据库，请检查 DATABASE_URL"
        exit 1
    fi
    
    log_success "数据库连接正常"
}

# 执行 SQL 文件
execute_sql_file() {
    local file_path="$1"
    local description="$2"
    
    if [ ! -f "$file_path" ]; then
        log_warning "文件不存在: $file_path"
        return 1
    fi
    
    log_info "执行: $description"
    log_info "文件: $file_path"
    
    if psql "$DATABASE_URL" -f "$file_path"; then
        log_success "✅ $description 完成"
        return 0
    else
        log_error "❌ $description 失败"
        return 1
    fi
}

# 主安装流程
main_installation() {
    log_info "开始低代码平台安装..."
    
    # 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    POSTGRES_DIR="$SCRIPT_DIR/postgres"
    
    # 检查 postgres 目录是否存在
    if [ ! -d "$POSTGRES_DIR" ]; then
        log_error "postgres 目录不存在: $POSTGRES_DIR"
        exit 1
    fi
    
    # SQL 文件执行顺序
    declare -a sql_files=(
        "00_init_schemas.sql:初始化数据库 Schema"
        "01_create_table.sql:创建基础表结构"
        "04_sys_menu.sql:创建基础菜单数据"
        "10_lowcode_platform_tables.sql:创建低代码平台表结构"
        "17_prisma_schema_updates.sql:更新数据库结构（确保兼容性）"
        "16_lowcode_platform_pages.sql:创建低代码页面配置"
        "14_code_generation_menus.sql:创建低代码平台菜单"
    )
    
    # 执行 SQL 文件
    local failed_files=()
    
    for sql_entry in "${sql_files[@]}"; do
        IFS=':' read -r filename description <<< "$sql_entry"
        file_path="$POSTGRES_DIR/$filename"
        
        if ! execute_sql_file "$file_path" "$description"; then
            failed_files+=("$filename")
        fi
        
        # 添加短暂延迟
        sleep 1
    done
    
    # 检查是否有失败的文件
    if [ ${#failed_files[@]} -gt 0 ]; then
        log_error "以下文件执行失败:"
        for failed_file in "${failed_files[@]}"; do
            log_error "  - $failed_file"
        done
        exit 1
    fi
    
    log_success "🎉 低代码平台安装完成！"
}

# 验证安装
verify_installation() {
    log_info "验证安装结果..."
    
    # 检查低代码平台菜单
    local menu_count
    menu_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM backend.sys_menu WHERE route_name LIKE 'lowcode%';" | tr -d ' ')
    
    if [ "$menu_count" -gt 0 ]; then
        log_success "✅ 发现 $menu_count 个低代码平台菜单项"
    else
        log_error "❌ 未发现低代码平台菜单项"
        return 1
    fi
    
    # 检查低代码页面
    local page_count
    page_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM backend.sys_lowcode_page WHERE code LIKE 'lowcode%';" | tr -d ' ')
    
    if [ "$page_count" -gt 0 ]; then
        log_success "✅ 发现 $page_count 个低代码页面配置"
    else
        log_error "❌ 未发现低代码页面配置"
        return 1
    fi
    
    # 检查权限配置
    local permission_count
    permission_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM backend.sys_role_menu rm JOIN backend.sys_menu m ON rm.menu_id = m.id WHERE m.route_name LIKE 'lowcode%';" | tr -d ' ')
    
    if [ "$permission_count" -gt 0 ]; then
        log_success "✅ 发现 $permission_count 个权限配置"
    else
        log_error "❌ 未发现权限配置"
        return 1
    fi
    
    log_success "🎯 安装验证通过！"
}

# 显示安装后信息
show_post_installation_info() {
    log_info "安装后信息:"
    echo
    log_info "📋 低代码平台功能模块:"
    echo "   1. 项目管理 - 创建项目：定义项目基本信息和配置"
    echo "   2. 实体管理 - 设计实体：创建业务实体和数据模型"
    echo "   3. 字段管理 - 管理字段：定义字段类型、验证规则、UI配置"
    echo "   4. 关系管理 - 配置关系：设置实体间的关联关系"
    echo "   5. 查询管理 - 编写查询：创建复杂的数据查询逻辑"
    echo "   6. API配置 - 配置API：定义RESTful API接口"
    echo "   7. API测试 - 测试API：在线测试API功能"
    echo "   8. 模板管理 - 管理模板：维护代码生成模板"
    echo "   9. 代码生成器 - 生成代码：一键生成NestJS业务服务"
    echo "   10. 目标项目管理 - 管理代码生成的目标项目"
    echo
    log_info "🔐 权限配置:"
    echo "   - 超级管理员角色已自动分配所有权限"
    echo "   - 如需为其他角色分配权限，请参考 README_LOWCODE_SETUP.md"
    echo
    log_info "📚 文档:"
    echo "   - 详细设置指南: deploy/postgres/README_LOWCODE_SETUP.md"
    echo "   - AMIS 文档: https://aisuda.bce.baidu.com/amis/zh-CN/docs/index"
    echo
    log_info "🚀 下一步:"
    echo "   1. 重启后端服务以加载新的菜单配置"
    echo "   2. 登录系统查看低代码平台菜单"
    echo "   3. 开始使用低代码平台功能"
}

# 主函数
main() {
    echo "=================================================="
    echo "🚀 低代码平台设置脚本"
    echo "   Low-code Platform Setup Script"
    echo "=================================================="
    echo
    
    # 检查环境
    check_environment
    check_database_connection
    
    # 执行安装
    main_installation
    
    # 验证安装
    verify_installation
    
    # 显示安装后信息
    show_post_installation_info
    
    echo
    log_success "🎉 低代码平台设置完成！"
    echo "=================================================="
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
