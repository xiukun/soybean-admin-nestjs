#!/bin/bash

# 微服务系统启动脚本
# 支持完整的微服务系统启动、停止、重启和状态检查

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

print_section() {
    echo -e "${YELLOW}"
    echo "--------------------------------------------------"
    echo "  $1"
    echo "--------------------------------------------------"
    echo -e "${NC}"
}

# 检查Docker和Docker Compose
check_docker() {
    print_section "检查Docker环境"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    print_success "Docker环境检查通过"
}

# 检查端口占用
check_ports() {
    print_section "检查端口占用情况"
    
    local ports=(9527 9528 9555 3000 9522 25432 26379 6432)
    local port_names=("Frontend" "Backend" "Designer" "Lowcode-Platform" "Amis-Backend" "PostgreSQL" "Redis" "PgBouncer")
    local occupied_ports=()
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "端口 $port ($name) 已被占用"
            occupied_ports+=("$port")
        else
            print_success "端口 $port ($name) 可用"
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        print_warning "发现 ${#occupied_ports[@]} 个端口被占用，可能影响服务启动"
        read -p "是否继续启动？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "启动已取消"
            exit 0
        fi
    fi
}

# 创建必要的目录
create_directories() {
    print_section "创建必要的目录"
    
    local dirs=(
        "logs"
        "amis-logs"
        "uploads"
        "generated-code"
        "amis-generated"
        "deploy/postgres"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "创建目录: $dir"
        else
            print_info "目录已存在: $dir"
        fi
    done
}

# 启动基础设施服务
start_infrastructure() {
    print_section "启动基础设施服务"
    
    print_info "启动PostgreSQL和Redis..."
    docker-compose up -d postgres redis pgbouncer
    
    print_info "等待数据库服务启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend >/dev/null 2>&1; then
            print_success "PostgreSQL启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "PostgreSQL启动超时"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_info "等待Redis服务启动..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T redis redis-cli -a "123456" ping >/dev/null 2>&1; then
            print_success "Redis启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Redis启动超时"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# 启动后端服务
start_backend_services() {
    print_section "启动后端服务"
    
    print_info "启动主后端服务..."
    docker-compose up -d backend
    
    print_info "等待主后端服务启动..."
    wait_for_service "backend" "http://localhost:9528/v1/route/getConstantRoutes" 60
    
    print_info "启动低代码平台服务..."
    docker-compose up -d lowcode-platform
    
    print_info "等待低代码平台服务启动..."
    wait_for_service "lowcode-platform" "http://localhost:3000/api/v1/projects" 60
    
    print_info "启动Amis后端服务..."
    docker-compose up -d amis-backend
    
    print_info "等待Amis后端服务启动..."
    wait_for_service "amis-backend" "http://localhost:9522/api/v1/health" 60
}

# 启动前端服务
start_frontend_services() {
    print_section "启动前端服务"
    
    print_info "启动前端应用..."
    docker-compose up -d frontend
    
    print_info "启动低代码设计器..."
    docker-compose up -d lowcode-designer
    
    print_success "前端服务启动完成"
}

# 等待服务启动
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_wait=${3:-60}
    local attempt=1
    
    while [ $attempt -le $max_wait ]; do
        if curl -f "$health_url" >/dev/null 2>&1; then
            print_success "$service_name 服务启动成功"
            return 0
        fi
        
        if [ $attempt -eq $max_wait ]; then
            print_warning "$service_name 服务启动超时，但继续启动其他服务"
            return 1
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
}

# 显示服务状态
show_status() {
    print_section "服务状态"
    
    echo -e "${CYAN}Docker容器状态：${NC}"
    docker-compose ps
    echo ""
    
    echo -e "${CYAN}服务访问地址：${NC}"
    echo -e "  🌐 前端应用: ${GREEN}http://localhost:9527${NC}"
    echo -e "  🎨 低代码设计器: ${GREEN}http://localhost:9555${NC}"
    echo -e "  🚀 主系统API: ${GREEN}http://localhost:9528${NC}"
    echo -e "  🔧 低代码平台API: ${GREEN}http://localhost:3000${NC}"
    echo -e "  📊 Amis业务API: ${GREEN}http://localhost:9522${NC}"
    echo -e "  📚 主系统API文档: ${GREEN}http://localhost:9528/api-docs${NC}"
    echo -e "  📚 低代码平台API文档: ${GREEN}http://localhost:3000/api-docs${NC}"
    echo -e "  📚 Amis业务API文档: ${GREEN}http://localhost:9522/api/v1/docs${NC}"
    echo -e "  🗄️  PostgreSQL: ${GREEN}localhost:25432${NC}"
    echo -e "  🔴 Redis: ${GREEN}localhost:26379${NC}"
    echo -e "  🔗 PgBouncer: ${GREEN}localhost:6432${NC}"
    echo ""
    
    echo -e "${CYAN}数据库连接信息：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 25432"
    echo -e "  数据库: soybean-admin-nest-backend"
    echo -e "  用户名: soybean"
    echo -e "  密码: soybean@123."
    echo ""
}

# 停止所有服务
stop_services() {
    print_section "停止所有服务"
    
    print_info "停止微服务系统..."
    docker-compose down
    
    print_success "所有服务已停止"
}

# 重启所有服务
restart_services() {
    stop_services
    sleep 3
    start_all_services
}

# 启动所有服务
start_all_services() {
    create_directories
    start_infrastructure
    start_backend_services
    start_frontend_services
    show_status
}

# 健康检查
health_check() {
    print_section "服务健康检查"
    
    local services=(
        "frontend:http://localhost:9527"
        "backend:http://localhost:9528/v1/route/getConstantRoutes"
        "lowcode-platform:http://localhost:3000/api/v1/projects"
        "amis-backend:http://localhost:9522/api/v1/health"
        "lowcode-designer:http://localhost:9555"
    )
    
    local healthy=0
    local total=${#services[@]}
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name service_url <<< "$service_info"
        
        if curl -f "$service_url" >/dev/null 2>&1; then
            print_success "$service_name 服务健康"
            ((healthy++))
        else
            print_error "$service_name 服务异常"
        fi
    done
    
    echo ""
    if [ $healthy -eq $total ]; then
        print_success "所有服务运行正常！($healthy/$total)"
    else
        print_warning "部分服务异常 ($healthy/$total)"
    fi
}

# 主函数
main() {
    print_header "Soybean Admin 微服务系统管理"
    
    check_docker
    
    case "${1:-start}" in
        start)
            check_ports
            start_all_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        infrastructure)
            create_directories
            start_infrastructure
            show_status
            ;;
        backend)
            start_backend_services
            show_status
            ;;
        frontend)
            start_frontend_services
            show_status
            ;;
        *)
            echo "用法: $0 {start|stop|restart|status|health|infrastructure|backend|frontend}"
            echo ""
            echo "命令说明："
            echo "  start          - 启动所有服务（默认）"
            echo "  stop           - 停止所有服务"
            echo "  restart        - 重启所有服务"
            echo "  status         - 显示服务状态"
            echo "  health         - 健康检查"
            echo "  infrastructure - 仅启动基础设施服务"
            echo "  backend        - 仅启动后端服务"
            echo "  frontend       - 仅启动前端服务"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
