#!/bin/bash

# 低代码平台服务启动脚本
# Low-code Platform Services Startup Script

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    print_success "Docker环境检查通过"
}

# 检查端口是否被占用
check_ports() {
    print_section "检查端口占用情况"

    local ports=(3000)
    local port_names=("Backend API")

    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}

        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "端口 $port ($name) 已被占用"
            echo "占用进程："
            lsof -Pi :$port -sTCP:LISTEN
            echo ""
        else
            print_success "端口 $port ($name) 可用"
        fi
    done

    # 检查主系统Redis是否可用
    print_info "检查主系统Redis服务 (端口26379)..."
    if docker run --rm --network host redis:7.2-alpine redis-cli -h localhost -p 26379 -a "123456" ping >/dev/null 2>&1; then
        print_success "主系统Redis服务可用"
    else
        print_warning "主系统Redis服务不可用，请确保主系统已启动"
    fi
}

# 创建必要的目录
create_directories() {
    print_section "创建必要的目录"
    
    local dirs=(
        "logs"
        "logs/postgres"
        "database"
        "database/init"
        "redis"
        "uploads"
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

# 检查配置文件
check_config_files() {
    print_section "检查配置文件"
    
    if [ ! -f ".env" ]; then
        print_warning ".env文件不存在，将从.env.example复制"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "已复制.env.example到.env"
        else
            print_error ".env.example文件也不存在，请手动创建.env文件"
            exit 1
        fi
    else
        print_success ".env文件存在"
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml文件不存在"
        exit 1
    else
        print_success "docker-compose.yml文件存在"
    fi
}

# 检查数据库服务
check_database() {
    print_section "检查数据库服务"

    print_info "检查主系统PostgreSQL数据库连接..."
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker run --rm --network host postgres:16.3 pg_isready -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend >/dev/null 2>&1; then
            print_success "主系统PostgreSQL数据库连接成功"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            print_error "无法连接到主系统PostgreSQL数据库"
            print_warning "请确保主系统已启动并且PostgreSQL服务正在运行"
            print_info "可以通过以下命令启动主系统："
            print_info "cd ../backend && docker-compose up -d postgres"
            return 1
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# 检查Redis服务
check_redis() {
    print_section "检查Redis服务"

    print_info "检查主系统Redis服务连接..."
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker run --rm --network host redis:7.2-alpine redis-cli -h localhost -p 26379 -a "123456" ping >/dev/null 2>&1; then
            print_success "主系统Redis服务连接成功"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            print_error "无法连接到主系统Redis服务"
            print_warning "请确保主系统已启动并且Redis服务正在运行"
            print_info "可以通过以下命令启动主系统："
            print_info "cd ../backend && docker-compose up -d redis"
            return 1
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# 运行数据库迁移
run_migrations() {
    print_section "运行数据库迁移"
    
    if [ -f "prisma/schema.prisma" ]; then
        print_info "生成Prisma客户端..."
        npm run prisma:generate
        
        print_info "运行数据库迁移..."
        npm run prisma:migrate
        
        print_success "数据库迁移完成"
    else
        print_warning "未找到Prisma schema文件，跳过迁移"
    fi
}

# 启动后端服务
start_backend() {
    print_section "启动后端服务"
    
    print_info "构建并启动后端服务..."
    docker-compose up -d lowcode-backend
    
    print_info "等待后端服务启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            print_success "后端服务启动成功"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "后端服务启动超时"
            exit 1
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
}

# 显示服务状态
show_status() {
    print_section "服务状态"

    echo -e "${CYAN}服务访问地址：${NC}"
    echo -e "  🗄️  PostgreSQL: localhost:25432 (共用主系统)"
    echo -e "  🔴 Redis: localhost:26379 (共用主系统)"
    echo -e "  🚀 Backend API: http://localhost:3000"
    echo -e "  📚 API文档: http://localhost:3000/api-docs"
    echo -e ""

    echo -e "${CYAN}数据库连接信息（共用主系统）：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 25432"
    echo -e "  数据库: soybean-admin-nest-backend"
    echo -e "  用户名: soybean"
    echo -e "  密码: soybean@123."
    echo -e ""

    echo -e "${CYAN}Redis连接信息（共用主系统）：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 26379"
    echo -e "  密码: 123456"
    echo -e "  数据库: 6"
    echo -e ""

    echo -e "${CYAN}Docker容器状态：${NC}"
    docker-compose ps
}

# 停止服务
stop_services() {
    print_section "停止服务"
    
    print_info "停止所有服务..."
    docker-compose down
    
    print_success "所有服务已停止"
}

# 重启服务
restart_services() {
    print_section "重启服务"
    
    stop_services
    sleep 2
    start_all_services
}

# 启动所有服务
start_all_services() {
    create_directories
    check_config_files
    check_database
    check_redis
    start_backend
    show_status
}

# 主函数
main() {
    print_header "低代码平台服务管理"
    
    check_docker
    check_ports
    
    case "${1:-start}" in
        start)
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
        check-deps)
            create_directories
            check_config_files
            check_database
            check_redis
            ;;
        *)
            echo "用法: $0 {start|stop|restart|status|check-deps}"
            echo ""
            echo "命令说明："
            echo "  start      - 启动所有服务（默认）"
            echo "  stop       - 停止所有服务"
            echo "  restart    - 重启所有服务"
            echo "  status     - 显示服务状态"
            echo "  check-deps - 检查依赖服务（数据库和Redis）"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
