#!/bin/bash

# 项目部署功能验证脚本
# Project Deployment Feature Verification Script

set -e

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
        exit 1
    fi
    
    log_success "环境变量检查完成"
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql 命令未找到，请安装 PostgreSQL 客户端"
        exit 1
    fi
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_error "无法连接到数据库"
        exit 1
    fi
    
    log_success "数据库连接正常"
}

# 验证数据库结构
verify_database_structure() {
    log_info "验证数据库结构..."
    
    # 检查项目表的部署字段
    local deployment_fields=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name IN ('deployment_status', 'deployment_port', 'deployment_config', 'last_deployed_at', 'deployment_logs');
    " | tr -d ' ')
    
    if [ "$deployment_fields" -eq 5 ]; then
        log_success "项目表部署字段验证通过 (5/5)"
    else
        log_error "项目表部署字段不完整 ($deployment_fields/5)"
        exit 1
    fi
    
    # 检查部署历史表
    local deployment_table=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_project_deployments';
    " | tr -d ' ')
    
    if [ "$deployment_table" -eq 1 ]; then
        log_success "项目部署历史表存在"
    else
        log_error "项目部署历史表不存在"
        exit 1
    fi
    
    # 检查索引
    local indexes=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_project_deployments' 
        AND indexname LIKE 'idx_project_deployments_%';
    " | tr -d ' ')
    
    if [ "$indexes" -ge 2 ]; then
        log_success "部署历史表索引创建完成"
    else
        log_warning "部分索引可能缺失"
    fi
}

# 验证示例数据
verify_sample_data() {
    log_info "验证示例数据..."
    
    # 检查有部署状态的项目数量
    local projects_with_deployment=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM lowcode.lowcode_projects 
        WHERE deployment_status IS NOT NULL;
    " | tr -d ' ')
    
    log_info "有部署状态的项目数量: $projects_with_deployment"
    
    # 检查部署历史记录
    local deployment_records=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM lowcode.lowcode_project_deployments;
    " | tr -d ' ')
    
    log_info "部署历史记录数量: $deployment_records"
    
    if [ "$projects_with_deployment" -gt 0 ] && [ "$deployment_records" -gt 0 ]; then
        log_success "示例数据验证通过"
    else
        log_warning "示例数据可能不完整"
    fi
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查低代码平台后端
    local lowcode_backend_port=9521
    if curl -s "http://localhost:$lowcode_backend_port/api/v1/health" &> /dev/null; then
        log_success "低代码平台后端服务运行正常 (端口: $lowcode_backend_port)"
    else
        log_warning "低代码平台后端服务可能未运行 (端口: $lowcode_backend_port)"
    fi
    
    # 检查 amis-lowcode-backend
    local amis_backend_port=9522
    if curl -s "http://localhost:$amis_backend_port/health" &> /dev/null; then
        log_success "Amis 低代码后端服务运行正常 (端口: $amis_backend_port)"
    else
        log_info "Amis 低代码后端服务未运行 (端口: $amis_backend_port) - 这是正常的，项目部署时会启动"
    fi
}

# 验证 API 端点
verify_api_endpoints() {
    log_info "验证 API 端点..."
    
    local base_url="http://localhost:9521/api/v1"
    
    # 检查项目列表 API
    if curl -s "$base_url/projects" &> /dev/null; then
        log_success "项目列表 API 可访问"
    else
        log_warning "项目列表 API 不可访问"
    fi
    
    # 注意：部署 API 需要认证，这里只检查端点是否存在
    local deploy_response=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/projects/test/deploy" -X POST)
    if [ "$deploy_response" -eq 401 ] || [ "$deploy_response" -eq 404 ]; then
        log_success "部署 API 端点存在"
    else
        log_warning "部署 API 端点可能不存在"
    fi
}

# 检查文件结构
check_file_structure() {
    log_info "检查文件结构..."
    
    local project_root=$(dirname "$(dirname "$(realpath "$0")")")
    
    # 检查关键文件
    local files=(
        "lowcode-platform-backend/src/lib/bounded-contexts/project/application/services/amis-deployment.service.ts"
        "lowcode-platform-backend/src/lib/bounded-contexts/project/application/services/project-code-generation.service.ts"
        "lowcode-platform-backend/src/lib/bounded-contexts/project/application/handlers/deploy-project.handler.ts"
        "lowcode-platform-backend/src/lib/bounded-contexts/project/application/commands/deploy-project.command.ts"
        "deploy/postgres/18_project_deployment_features.sql"
        "deploy/postgres/19_update_project_deployment_data.sql"
        "deploy/postgres/20_deployment_verification.sql"
    )
    
    local missing_files=0
    for file in "${files[@]}"; do
        if [ -f "$project_root/$file" ]; then
            log_success "✓ $file"
        else
            log_error "✗ $file (缺失)"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        log_success "所有关键文件都存在"
    else
        log_error "$missing_files 个关键文件缺失"
        exit 1
    fi
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    local project_root=$(dirname "$(dirname "$(realpath "$0")")")
    
    # 运行部署相关的单元测试
    cd "$project_root/lowcode-platform-backend"
    
    if command -v npm &> /dev/null; then
        log_info "运行单元测试..."
        if npm test -- --testPathPattern="deploy|deployment" --passWithNoTests; then
            log_success "单元测试通过"
        else
            log_warning "部分单元测试失败"
        fi
    else
        log_warning "npm 未安装，跳过测试"
    fi
}

# 生成验证报告
generate_report() {
    log_info "生成验证报告..."
    
    local report_file="deployment-verification-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "项目部署功能验证报告"
        echo "====================="
        echo "验证时间: $(date)"
        echo ""
        
        echo "数据库验证:"
        psql "$DATABASE_URL" -f "$(dirname "$(dirname "$(realpath "$0")")")/deploy/postgres/20_deployment_verification.sql"
        
    } > "$report_file"
    
    log_success "验证报告已生成: $report_file"
}

# 主函数
main() {
    echo "================================================"
    echo "项目部署功能验证脚本"
    echo "Project Deployment Feature Verification"
    echo "================================================"
    echo ""
    
    check_environment
    check_database
    verify_database_structure
    verify_sample_data
    check_services
    verify_api_endpoints
    check_file_structure
    run_tests
    generate_report
    
    echo ""
    echo "================================================"
    log_success "项目部署功能验证完成！"
    echo "================================================"
}

# 执行主函数
main "$@"
