#!/bin/bash

# 启动所有服务脚本
# Start All Services Script

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

# 检查Docker环境
check_docker() {
    print_section "检查Docker环境"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker服务未运行"
        exit 1
    fi
    
    print_success "Docker环境检查通过"
}

# 启动主系统服务
start_main_system() {
    print_section "启动主系统服务"
    
    print_info "启动主系统数据库和Redis..."
    docker-compose up -d postgres redis
    
    print_info "等待数据库启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend >/dev/null 2>&1; then
            print_success "主系统数据库启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "主系统数据库启动超时"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_info "等待Redis启动..."
    attempt=1
    max_attempts=15
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T redis redis-cli -a "123456" ping >/dev/null 2>&1; then
            print_success "主系统Redis启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "主系统Redis启动超时"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# 启动主系统后端
start_main_backend() {
    print_section "启动主系统后端"
    
    print_info "启动主系统后端服务..."
    docker-compose up -d backend
    
    print_info "等待后端服务启动..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:9528/health >/dev/null 2>&1; then
            print_success "主系统后端服务启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "主系统后端服务启动超时，但继续启动其他服务"
            break
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
}

# 启动前端服务
start_frontend() {
    print_section "启动前端服务"
    
    print_info "启动前端服务..."
    docker-compose up -d frontend
    
    print_success "前端服务启动完成"
}

# 启动低代码平台后端
start_lowcode_backend() {
    print_section "启动低代码平台后端"
    
    print_info "切换到低代码平台目录..."
    cd lowcode-platform-backend
    
    print_info "启动低代码平台后端服务..."
    docker-compose up -d lowcode-backend
    
    print_info "等待低代码平台后端服务启动..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/v1/projects >/dev/null 2>&1; then
            print_success "低代码平台后端服务启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "低代码平台后端服务启动超时"
            break
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
    
    cd ..
}

# 显示服务状态
show_status() {
    print_section "服务状态"
    
    echo -e "${CYAN}主系统服务：${NC}"
    docker-compose ps
    echo -e ""
    
    echo -e "${CYAN}低代码平台服务：${NC}"
    cd lowcode-platform-backend && docker-compose ps && cd ..
    echo -e ""
    
    echo -e "${CYAN}服务访问地址：${NC}"
    echo -e "  🌐 前端应用: http://localhost:9527"
    echo -e "  🚀 主系统API: http://localhost:9528"
    echo -e "  🔧 低代码平台API: http://localhost:3000"
    echo -e "  📚 主系统API文档: http://localhost:9528/api-docs"
    echo -e "  📚 低代码平台API文档: http://localhost:3000/api-docs"
    echo -e "  🗄️  PostgreSQL: localhost:25432"
    echo -e "  🔴 Redis: localhost:26379"
    echo -e ""
    
    echo -e "${CYAN}数据库连接信息：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 25432"
    echo -e "  数据库: soybean-admin-nest-backend"
    echo -e "  用户名: soybean"
    echo -e "  密码: soybean@123."
    echo -e ""
}

# 停止所有服务
stop_all_services() {
    print_section "停止所有服务"
    
    print_info "停止低代码平台服务..."
    cd lowcode-platform-backend && docker-compose down && cd ..
    
    print_info "停止主系统服务..."
    docker-compose down
    
    print_success "所有服务已停止"
}

# 重启所有服务
restart_all_services() {
    stop_all_services
    sleep 3
    start_all_services
}

# 启动所有服务
start_all_services() {
    start_main_system
    start_main_backend
    start_frontend
    start_lowcode_backend
    show_status
}

# 主函数
main() {
    print_header "Soybean Admin 全栈服务启动"
    
    check_docker
    
    case "${1:-start}" in
        start)
            start_all_services
            ;;
        stop)
            stop_all_services
            ;;
        restart)
            restart_all_services
            ;;
        status)
            show_status
            ;;
        main-only)
            start_main_system
            start_main_backend
            start_frontend
            show_status
            ;;
        lowcode-only)
            start_main_system
            start_lowcode_backend
            show_status
            ;;
        *)
            echo "用法: $0 {start|stop|restart|status|main-only|lowcode-only}"
            echo ""
            echo "命令说明："
            echo "  start        - 启动所有服务（默认）"
            echo "  stop         - 停止所有服务"
            echo "  restart      - 重启所有服务"
            echo "  status       - 显示服务状态"
            echo "  main-only    - 仅启动主系统服务"
            echo "  lowcode-only - 仅启动低代码平台服务"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
