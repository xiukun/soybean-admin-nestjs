#!/bin/bash

# 停止本地开发环境脚本

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

# 停止服务
stop_services() {
    print_header "停止Soybean Admin开发服务"
    
    local services=("backend" "lowcode-platform" "amis-backend" "frontend" "lowcode-designer")
    local stopped_count=0
    
    for service in "${services[@]}"; do
        local pid_file="logs/${service}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                print_success "已停止 $service 服务 (PID: $pid)"
                ((stopped_count++))
            else
                print_info "$service 服务已经停止"
            fi
            
            rm -f "$pid_file"
        else
            print_info "$service 服务未运行"
        fi
    done
    
    # 额外检查端口占用
    local ports=(9527 9528 9555 3000 9522)
    local port_names=("Frontend" "Backend" "Designer" "Lowcode-Platform" "Amis-Backend")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 "$pid" 2>/dev/null || true
            print_success "强制停止端口 $port 上的进程 ($name)"
            ((stopped_count++))
        fi
    done
    
    if [ $stopped_count -gt 0 ]; then
        print_success "总共停止了 $stopped_count 个服务/进程"
    else
        print_info "没有发现运行中的服务"
    fi
    
    # 清理日志文件（可选）
    if [ "$1" = "--clean" ]; then
        print_info "清理日志文件..."
        rm -f logs/*.log
        print_success "日志文件已清理"
    fi
}

# 主函数
main() {
    # 创建logs目录（如果不存在）
    mkdir -p logs
    
    stop_services "$1"
    
    echo ""
    print_info "所有开发服务已停止"
    print_info "使用 ./start-dev.sh 重新启动服务"
    
    if [ "$1" != "--clean" ]; then
        print_info "使用 ./stop-dev.sh --clean 停止服务并清理日志"
    fi
}

# 执行主函数
main "$@"
