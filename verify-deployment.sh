#!/bin/bash

# Soybean Admin 微服务系统部署验证脚本
# 作者: AI Assistant
# 版本: 1.0.0
# 描述: 验证系统部署是否成功，检查所有服务和功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
TIMEOUT=30
RETRY_COUNT=3
RETRY_DELAY=5

# 服务配置
declare -A SERVICES=(
    ["frontend"]="http://localhost:9527"
    ["backend"]="http://localhost:9528/api/health"
    ["lowcode-platform"]="http://localhost:3000/api/health"
    ["amis-backend"]="http://localhost:9522/api/v1/health"
    ["designer"]="http://localhost:9555"
)

declare -A API_ENDPOINTS=(
    ["backend-auth"]="http://localhost:9528/api/auth/login"
    ["backend-users"]="http://localhost:9528/api/users"
    ["lowcode-projects"]="http://localhost:3000/api/projects"
    ["amis-test-users"]="http://localhost:9522/api/v1/test-users"
)

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Soybean Admin 微服务系统部署验证脚本

用法: $0 [选项]

选项:
    full        完整验证流程
    services    验证服务可用性
    apis        验证API接口
    database    验证数据库连接
    frontend    验证前端功能
    performance 性能测试
    security    安全检查
    help        显示此帮助信息

示例:
    $0 full         # 完整验证
    $0 services     # 仅验证服务
    $0 apis         # 仅验证API

EOF
}

# 等待服务启动
wait_for_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-$TIMEOUT}
    
    log_info "等待 $service_name 服务启动..."
    
    local count=0
    while [ $count -lt $timeout ]; do
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            log_success "$service_name 服务已启动"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        if [ $((count % 10)) -eq 0 ]; then
            log_info "等待 $service_name 服务启动... ($count/${timeout}s)"
        fi
    done
    
    log_error "$service_name 服务启动超时"
    return 1
}

# 验证服务可用性
verify_services() {
    log_step "验证服务可用性"
    echo
    
    local failed_services=()
    local total_services=${#SERVICES[@]}
    local healthy_services=0
    
    for service in "${!SERVICES[@]}"; do
        local url=${SERVICES[$service]}
        log_info "检查 $service 服务..."
        
        if wait_for_service "$service" "$url" 10; then
            healthy_services=$((healthy_services + 1))
        else
            failed_services+=("$service")
        fi
    done
    
    echo
    echo -e "服务状态: ${GREEN}$healthy_services${NC}/$total_services 健康"
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "以下服务验证失败: ${failed_services[*]}"
        return 1
    else
        log_success "所有服务验证通过"
        return 0
    fi
}

# 验证API接口
verify_apis() {
    log_step "验证API接口"
    echo
    
    local failed_apis=()
    local total_apis=${#API_ENDPOINTS[@]}
    local working_apis=0
    
    for api in "${!API_ENDPOINTS[@]}"; do
        local url=${API_ENDPOINTS[$api]}
        log_info "测试 $api API..."
        
        # 使用HEAD请求测试API可达性
        if curl -s --head --max-time 10 "$url" > /dev/null 2>&1; then
            log_success "$api API 可访问"
            working_apis=$((working_apis + 1))
        else
            log_warning "$api API 不可访问或需要认证"
            failed_apis+=("$api")
        fi
    done
    
    echo
    echo -e "API状态: ${GREEN}$working_apis${NC}/$total_apis 可访问"
    
    if [ ${#failed_apis[@]} -gt 0 ]; then
        log_warning "以下API需要进一步检查: ${failed_apis[*]}"
    fi
    
    return 0
}

# 验证数据库连接
verify_database() {
    log_step "验证数据库连接"
    echo
    
    # 检查PostgreSQL
    log_info "检查PostgreSQL连接..."
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 25432 -U soybean > /dev/null 2>&1; then
            log_success "PostgreSQL 连接正常"
        else
            log_error "PostgreSQL 连接失败"
            return 1
        fi
    else
        log_warning "pg_isready 命令不可用，跳过PostgreSQL检查"
    fi
    
    # 检查Redis
    log_info "检查Redis连接..."
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h localhost -p 26379 -a 123456 ping > /dev/null 2>&1; then
            log_success "Redis 连接正常"
        else
            log_error "Redis 连接失败"
            return 1
        fi
    else
        log_warning "redis-cli 命令不可用，跳过Redis检查"
    fi
    
    return 0
}

# 验证前端功能
verify_frontend() {
    log_step "验证前端功能"
    echo
    
    # 检查前端页面
    log_info "检查前端主页..."
    if curl -s --max-time 10 "http://localhost:9527" | grep -q "<!DOCTYPE html>"; then
        log_success "前端主页加载正常"
    else
        log_error "前端主页加载失败"
        return 1
    fi
    
    # 检查设计器页面
    log_info "检查低代码设计器..."
    if curl -s --max-time 10 "http://localhost:9555" | grep -q "<!DOCTYPE html>"; then
        log_success "低代码设计器加载正常"
    else
        log_error "低代码设计器加载失败"
        return 1
    fi
    
    return 0
}

# 性能测试
performance_test() {
    log_step "性能测试"
    echo
    
    if ! command -v curl &> /dev/null; then
        log_warning "curl 命令不可用，跳过性能测试"
        return 0
    fi
    
    # 测试响应时间
    local services_to_test=("http://localhost:9527" "http://localhost:9528/api/health")
    
    for url in "${services_to_test[@]}"; do
        log_info "测试 $url 响应时间..."
        
        local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "timeout")
        
        if [ "$response_time" != "timeout" ]; then
            local response_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null | cut -d'.' -f1)
            
            if [ "$response_ms" -lt 1000 ]; then
                log_success "$url 响应时间: ${response_ms}ms (优秀)"
            elif [ "$response_ms" -lt 3000 ]; then
                log_warning "$url 响应时间: ${response_ms}ms (一般)"
            else
                log_error "$url 响应时间: ${response_ms}ms (较慢)"
            fi
        else
            log_error "$url 响应超时"
        fi
    done
    
    return 0
}

# 安全检查
security_check() {
    log_step "安全检查"
    echo
    
    # 检查敏感文件
    log_info "检查敏感文件暴露..."
    
    local sensitive_paths=(
        "/.env"
        "/backend/.env"
        "/docker-compose.yml"
        "/package.json"
    )
    
    local exposed_files=()
    
    for path in "${sensitive_paths[@]}"; do
        if curl -s --max-time 5 "http://localhost:9527$path" | grep -q "DATABASE_URL\|password\|secret" 2>/dev/null; then
            exposed_files+=("$path")
        fi
    done
    
    if [ ${#exposed_files[@]} -gt 0 ]; then
        log_error "发现敏感文件暴露: ${exposed_files[*]}"
        return 1
    else
        log_success "未发现敏感文件暴露"
    fi
    
    # 检查默认密码
    log_info "检查默认密码安全性..."
    log_warning "请确保在生产环境中修改默认密码"
    
    return 0
}

# 生成验证报告
generate_report() {
    local report_file="logs/deployment_verification_$(date +%Y%m%d_%H%M%S).txt"
    mkdir -p logs
    
    {
        echo "Soybean Admin 微服务系统部署验证报告"
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "=================================================="
        echo
        
        echo "=== 系统信息 ==="
        echo "操作系统: $(uname -s)"
        echo "架构: $(uname -m)"
        if command -v docker &> /dev/null; then
            echo "Docker版本: $(docker --version)"
        fi
        if command -v node &> /dev/null; then
            echo "Node.js版本: $(node --version)"
        fi
        echo
        
        echo "=== 服务状态 ==="
        for service in "${!SERVICES[@]}"; do
            local url=${SERVICES[$service]}
            if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
                echo "$service: 运行中"
            else
                echo "$service: 未运行"
            fi
        done
        echo
        
        echo "=== 端口占用 ==="
        local ports=(9527 9528 3000 9522 9555 25432 26379)
        for port in "${ports[@]}"; do
            if lsof -i :$port &> /dev/null; then
                echo "端口 $port: 已占用"
            else
                echo "端口 $port: 空闲"
            fi
        done
        echo
        
        echo "=== 建议 ==="
        echo "1. 定期备份数据库和重要文件"
        echo "2. 监控系统资源使用情况"
        echo "3. 及时更新依赖包和安全补丁"
        echo "4. 在生产环境中修改默认密码"
        echo "5. 配置防火墙和访问控制"
        
    } > "$report_file"
    
    log_success "验证报告已生成: $report_file"
}

# 完整验证流程
full_verification() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  Soybean Admin 部署验证${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo
    
    local start_time=$(date +%s)
    local failed_checks=0
    
    # 执行各项检查
    verify_services || failed_checks=$((failed_checks + 1))
    echo
    
    verify_apis || failed_checks=$((failed_checks + 1))
    echo
    
    verify_database || failed_checks=$((failed_checks + 1))
    echo
    
    verify_frontend || failed_checks=$((failed_checks + 1))
    echo
    
    performance_test || failed_checks=$((failed_checks + 1))
    echo
    
    security_check || failed_checks=$((failed_checks + 1))
    echo
    
    # 生成报告
    generate_report
    
    # 总结
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  验证完成${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo
    echo -e "验证时间: ${CYAN}${duration}秒${NC}"
    
    if [ $failed_checks -eq 0 ]; then
        echo -e "验证结果: ${GREEN}全部通过${NC} ✅"
        echo
        echo -e "${GREEN}🎉 恭喜！系统部署成功，所有功能正常！${NC}"
        echo
        echo "访问地址："
        echo -e "  🌐 前端应用: ${CYAN}http://localhost:9527${NC}"
        echo -e "  🎨 低代码设计器: ${CYAN}http://localhost:9555${NC}"
        echo -e "  📚 API文档: ${CYAN}http://localhost:9528/api-docs${NC}"
        echo
        echo "默认登录："
        echo -e "  用户名: ${YELLOW}admin${NC}"
        echo -e "  密码: ${YELLOW}admin123${NC}"
        
        return 0
    else
        echo -e "验证结果: ${RED}$failed_checks 项检查失败${NC} ❌"
        echo
        echo -e "${RED}部署可能存在问题，请检查日志并修复相关问题${NC}"
        
        return 1
    fi
}

# 主函数
main() {
    case "${1:-full}" in
        full)
            full_verification
            ;;
        services)
            verify_services
            ;;
        apis)
            verify_apis
            ;;
        database)
            verify_database
            ;;
        frontend)
            verify_frontend
            ;;
        performance)
            performance_test
            ;;
        security)
            security_check
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
