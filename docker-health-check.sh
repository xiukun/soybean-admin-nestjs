#!/bin/bash

# Docker服务健康检查脚本
# Docker Services Health Check Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo -e "${BLUE}$(printf '%.0s-' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# 获取docker-compose命令
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# 检查容器状态
check_container_status() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        print_success "$service_name 容器运行正常"
        return 0
    else
        print_error "$service_name 容器未运行或状态异常"
        return 1
    fi
}

# 检查服务健康状态
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-5}
    
    if curl -f --max-time $timeout "$health_url" >/dev/null 2>&1; then
        print_success "$service_name 服务健康检查通过"
        return 0
    else
        print_error "$service_name 服务健康检查失败"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    print_section "检查数据库服务"
    
    # 检查PostgreSQL容器
    check_container_status "soybean-postgres" "PostgreSQL"
    
    # 检查PostgreSQL连接
    if docker exec soybean-postgres pg_isready -U soybean -d soybean-admin-nest-backend >/dev/null 2>&1; then
        print_success "PostgreSQL 数据库连接正常"
    else
        print_error "PostgreSQL 数据库连接失败"
        return 1
    fi
    
    # 检查PgBouncer
    check_container_status "soybean-pgbouncer" "PgBouncer"
}

# 检查Redis服务
check_redis() {
    print_section "检查Redis服务"
    
    # 检查Redis容器
    check_container_status "soybean-redis" "Redis"
    
    # 检查Redis连接
    if docker exec soybean-redis redis-cli -a "123456" ping >/dev/null 2>&1; then
        print_success "Redis 服务连接正常"
    else
        print_error "Redis 服务连接失败"
        return 1
    fi
}

# 检查后端服务
check_backend_services() {
    print_section "检查后端服务"
    
    # 检查主后端
    check_container_status "soybean-backend" "主后端"
    check_service_health "主后端API" "http://localhost:9528/health"
    
    # 检查AMIS后端
    check_container_status "soybean-amis-backend" "AMIS后端"
    check_service_health "AMIS后端API" "http://localhost:9522/api/v1/health"
    
    # 检查低代码平台后端
    check_container_status "soybean-lowcode-platform" "低代码平台后端"
    check_service_health "低代码平台API" "http://localhost:3000/api/v1/health"
}

# 检查前端服务
check_frontend_services() {
    print_section "检查前端服务"
    
    # 检查前端应用
    check_container_status "soybean-frontend" "前端应用"
    check_service_health "前端应用" "http://localhost:9527" 10
    
    # 检查低代码设计器
    check_container_status "soybean-lowcode-designer" "低代码设计器"
    check_service_health "低代码设计器" "http://localhost:9555" 10
}

# 检查服务间连通性
check_service_connectivity() {
    print_section "检查服务间连通性"
    
    # 检查主后端到数据库的连接
    if docker exec soybean-backend curl -f http://postgres:5432 >/dev/null 2>&1; then
        print_success "主后端到数据库连接正常"
    else
        print_warning "主后端到数据库连接检查失败（可能是正常的，因为PostgreSQL不提供HTTP接口）"
    fi
    
    # 检查低代码平台到主后端的连接
    if docker exec soybean-lowcode-platform curl -f http://backend:9528/health >/dev/null 2>&1; then
        print_success "低代码平台到主后端连接正常"
    else
        print_error "低代码平台到主后端连接失败"
    fi
    
    # 检查低代码平台到AMIS后端的连接
    if docker exec soybean-lowcode-platform curl -f http://amis-backend:9522/api/v1/health >/dev/null 2>&1; then
        print_success "低代码平台到AMIS后端连接正常"
    else
        print_error "低代码平台到AMIS后端连接失败"
    fi
}

# 显示详细状态
show_detailed_status() {
    print_section "详细服务状态"
    local compose_cmd=$(get_compose_cmd)
    
    echo -e "${CYAN}Docker Compose 服务状态：${NC}"
    $compose_cmd ps
    echo -e ""
    
    echo -e "${CYAN}容器资源使用情况：${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo -e ""
}

# 生成问题诊断报告
generate_diagnostic_report() {
    print_section "问题诊断报告"
    
    echo -e "${CYAN}容器日志（最后20行）：${NC}"
    
    local containers=("soybean-postgres" "soybean-redis" "soybean-backend" "soybean-amis-backend" "soybean-lowcode-platform" "soybean-frontend" "soybean-lowcode-designer")
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$container"; then
            echo -e "\n${YELLOW}=== $container 日志 ===${NC}"
            docker logs --tail 20 "$container" 2>&1 | head -20
        else
            echo -e "\n${RED}=== $container 容器未运行 ===${NC}"
        fi
    done
}

# 主健康检查函数
run_health_check() {
    local failed_checks=0
    
    check_database || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_backend_services || ((failed_checks++))
    check_frontend_services || ((failed_checks++))
    check_service_connectivity || ((failed_checks++))
    
    if [ $failed_checks -eq 0 ]; then
        print_success "所有服务健康检查通过！"
        return 0
    else
        print_error "有 $failed_checks 项检查失败"
        return 1
    fi
}

# 主函数
main() {
    print_header "Soybean Admin Docker 服务健康检查"
    
    case "${1:-check}" in
        check)
            run_health_check
            ;;
        status)
            show_detailed_status
            ;;
        diagnose)
            run_health_check
            show_detailed_status
            generate_diagnostic_report
            ;;
        logs)
            generate_diagnostic_report
            ;;
        *)
            echo "用法: $0 {check|status|diagnose|logs}"
            echo ""
            echo "命令说明："
            echo "  check    - 运行健康检查（默认）"
            echo "  status   - 显示详细服务状态"
            echo "  diagnose - 运行完整诊断（健康检查+状态+日志）"
            echo "  logs     - 显示容器日志"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
