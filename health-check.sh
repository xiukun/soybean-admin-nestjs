#!/bin/bash

# 微服务健康检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}"
    echo "=================================================="
    echo "  $1"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查单个服务健康状态
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-10}
    
    local start_time=$(date +%s%3N)
    
    if curl -f -s --max-time $timeout "$health_url" > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        print_success "$service_name 服务健康 (${response_time}ms)"
        return 0
    else
        print_error "$service_name 服务异常"
        return 1
    fi
}

# 获取服务详细信息
get_service_info() {
    local service_name=$1
    local info_url=$2
    
    local response=$(curl -f -s --max-time 5 "$info_url" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        echo "    详细信息: $response"
    fi
}

# 检查所有服务
check_all_services() {
    print_header "微服务健康检查"
    
    local services=(
        "Backend:http://localhost:9528/v1/route/getConstantRoutes:http://localhost:9528/v1"
        "Lowcode-Platform:http://localhost:3000/health:http://localhost:3000/api/v1/projects"
        "Amis-Backend:http://localhost:9522/health:http://localhost:9522"
        "Frontend:http://localhost:9527:http://localhost:9527"
        "Designer:http://localhost:9555:http://localhost:9555"
    )
    
    local healthy_count=0
    local total_count=${#services[@]}
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name health_url info_url <<< "$service_info"
        
        if check_service_health "$service_name" "$health_url"; then
            ((healthy_count++))
            if [ "$1" = "--verbose" ] && [ -n "$info_url" ]; then
                get_service_info "$service_name" "$info_url"
            fi
        fi
        
        echo ""
    done
    
    echo -e "${CYAN}健康检查总结：${NC}"
    if [ $healthy_count -eq $total_count ]; then
        print_success "所有服务运行正常！($healthy_count/$total_count)"
    elif [ $healthy_count -gt 0 ]; then
        print_warning "部分服务异常 ($healthy_count/$total_count)"
    else
        print_error "所有服务都异常！"
    fi
    
    return $((total_count - healthy_count))
}

# 检查特定服务
check_specific_service() {
    local service_name=$1
    
    case "$service_name" in
        backend)
            check_service_health "Backend" "http://localhost:9528/v1/route/getConstantRoutes"
            ;;
        lowcode-platform)
            check_service_health "Lowcode-Platform" "http://localhost:3000/health"
            ;;
        amis-backend)
            check_service_health "Amis-Backend" "http://localhost:9522/health"
            ;;
        frontend)
            check_service_health "Frontend" "http://localhost:9527"
            ;;
        designer)
            check_service_health "Designer" "http://localhost:9555"
            ;;
        *)
            print_error "未知服务: $service_name"
            echo "可用服务: backend, lowcode-platform, amis-backend, frontend, designer"
            exit 1
            ;;
    esac
}

# 监控模式
monitor_services() {
    local interval=${1:-30}
    
    print_header "微服务监控模式 (每${interval}秒检查一次)"
    print_info "按 Ctrl+C 停止监控"
    
    while true; do
        echo ""
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 执行健康检查..."
        check_all_services
        
        echo ""
        print_info "等待 ${interval} 秒后进行下次检查..."
        sleep $interval
    done
}

# 显示服务状态
show_service_status() {
    print_header "服务状态概览"
    
    local ports=(9527 9528 9555 3000 9522)
    local port_names=("Frontend" "Backend" "Designer" "Lowcode-Platform" "Amis-Backend")
    
    echo -e "${CYAN}端口占用情况：${NC}"
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -ti:$port)
            print_success "端口 $port ($name) - PID: $pid"
        else
            print_error "端口 $port ($name) - 未占用"
        fi
    done
    
    echo ""
    echo -e "${CYAN}进程信息：${NC}"
    if [ -d "logs" ]; then
        local pid_files=("backend.pid" "lowcode-platform.pid" "amis-backend.pid" "frontend.pid" "lowcode-designer.pid")
        
        for pid_file in "${pid_files[@]}"; do
            if [ -f "logs/$pid_file" ]; then
                local pid=$(cat "logs/$pid_file")
                local service_name=${pid_file%.pid}
                
                if kill -0 "$pid" 2>/dev/null; then
                    print_success "$service_name - PID: $pid (运行中)"
                else
                    print_error "$service_name - PID: $pid (已停止)"
                fi
            fi
        done
    else
        print_info "未找到logs目录，可能服务未通过start-dev.sh启动"
    fi
}

# 主函数
main() {
    case "${1:-check}" in
        check)
            check_all_services "$2"
            ;;
        service)
            if [ -z "$2" ]; then
                print_error "请指定服务名称"
                echo "用法: $0 service <service_name>"
                exit 1
            fi
            check_specific_service "$2"
            ;;
        monitor)
            monitor_services "$2"
            ;;
        status)
            show_service_status
            ;;
        *)
            echo "用法: $0 {check|service|monitor|status} [options]"
            echo ""
            echo "命令说明："
            echo "  check [--verbose]     - 检查所有服务健康状态（默认）"
            echo "  service <name>        - 检查特定服务"
            echo "  monitor [interval]    - 监控模式，定期检查服务状态"
            echo "  status                - 显示服务状态概览"
            echo ""
            echo "示例："
            echo "  $0 check --verbose    - 详细健康检查"
            echo "  $0 service backend    - 检查backend服务"
            echo "  $0 monitor 60         - 每60秒监控一次"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
