#!/bin/bash

# 本地开发环境启动脚本
# 用于在本地环境启动所有微服务进行开发和测试

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

# 检查Node.js和npm
check_node() {
    print_section "检查Node.js环境"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装，请先安装Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm未安装，请先安装npm"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js版本: $NODE_VERSION"
    print_success "npm版本: $NPM_VERSION"
}

# 检查端口占用
check_ports() {
    print_section "检查端口占用情况"
    
    local ports=(9527 9528 9555 3000 9522)
    local port_names=("Frontend" "Backend" "Designer" "Lowcode-Platform" "Amis-Backend")
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
        print_warning "发现 ${#occupied_ports[@]} 个端口被占用"
        read -p "是否继续启动？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "启动已取消"
            exit 0
        fi
    fi
}

# 安装依赖
install_dependencies() {
    print_section "安装项目依赖"
    
    local services=("backend" "lowcode-platform-backend" "amis-lowcode-backend" "frontend" "lowcode-designer")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            print_info "安装 $service 依赖..."
            cd "$service"
            
            if [ -f "package.json" ]; then
                npm install
                print_success "$service 依赖安装完成"
            else
                print_warning "$service 目录下没有package.json文件"
            fi
            
            cd ..
        else
            print_warning "$service 目录不存在"
        fi
    done
}

# 初始化数据库
init_database() {
    print_section "初始化数据库"
    
    # 检查PostgreSQL是否运行
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_error "PostgreSQL未运行，请先启动PostgreSQL服务"
        print_info "可以使用以下命令启动PostgreSQL:"
        print_info "  macOS: brew services start postgresql"
        print_info "  Ubuntu: sudo systemctl start postgresql"
        print_info "  或者使用Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=soybean@123. postgres:16"
        exit 1
    fi
    
    print_success "PostgreSQL服务正在运行"
    
    # 初始化backend数据库
    if [ -d "backend" ]; then
        print_info "初始化backend数据库..."
        cd backend
        npm run prisma:generate
        npm run prisma:migrate:deploy
        npm run prisma:seed
        cd ..
        print_success "Backend数据库初始化完成"
    fi
    
    # 初始化lowcode-platform数据库
    if [ -d "lowcode-platform-backend" ]; then
        print_info "初始化lowcode-platform数据库..."
        cd lowcode-platform-backend
        npm run prisma:generate
        npm run prisma:migrate
        cd ..
        print_success "Lowcode-platform数据库初始化完成"
    fi
    
    # 初始化amis-backend数据库
    if [ -d "amis-lowcode-backend" ]; then
        print_info "初始化amis-backend数据库..."
        cd amis-lowcode-backend
        npm run prisma:generate
        cd ..
        print_success "Amis-backend数据库初始化完成"
    fi
}

# 启动服务
start_services() {
    print_section "启动微服务"
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动backend
    if [ -d "backend" ]; then
        print_info "启动Backend服务..."
        cd backend
        npm run start:dev > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../logs/backend.pid
        cd ..
        print_success "Backend服务已启动 (PID: $BACKEND_PID)"
    fi
    
    # 等待backend启动
    sleep 5
    
    # 启动lowcode-platform
    if [ -d "lowcode-platform-backend" ]; then
        print_info "启动Lowcode Platform服务..."
        cd lowcode-platform-backend
        npm run start:dev > ../logs/lowcode-platform.log 2>&1 &
        LOWCODE_PID=$!
        echo $LOWCODE_PID > ../logs/lowcode-platform.pid
        cd ..
        print_success "Lowcode Platform服务已启动 (PID: $LOWCODE_PID)"
    fi
    
    # 等待lowcode-platform启动
    sleep 5
    
    # 启动amis-backend
    if [ -d "amis-lowcode-backend" ]; then
        print_info "启动Amis Backend服务..."
        cd amis-lowcode-backend
        npm run start:dev > ../logs/amis-backend.log 2>&1 &
        AMIS_PID=$!
        echo $AMIS_PID > ../logs/amis-backend.pid
        cd ..
        print_success "Amis Backend服务已启动 (PID: $AMIS_PID)"
    fi
    
    # 启动frontend
    if [ -d "frontend" ]; then
        print_info "启动Frontend服务..."
        cd frontend
        npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        cd ..
        print_success "Frontend服务已启动 (PID: $FRONTEND_PID)"
    fi
    
    # 启动lowcode-designer
    if [ -d "lowcode-designer" ]; then
        print_info "启动Lowcode Designer服务..."
        cd lowcode-designer
        npm run dev > ../logs/lowcode-designer.log 2>&1 &
        DESIGNER_PID=$!
        echo $DESIGNER_PID > ../logs/lowcode-designer.pid
        cd ..
        print_success "Lowcode Designer服务已启动 (PID: $DESIGNER_PID)"
    fi
}

# 等待服务启动
wait_for_services() {
    print_section "等待服务启动完成"
    
    local services=(
        "Backend:http://localhost:9528/v1/route/getConstantRoutes"
        "Lowcode-Platform:http://localhost:3000/api/v1/projects"
        "Amis-Backend:http://localhost:9522/health"
        "Frontend:http://localhost:9527"
        "Designer:http://localhost:9555"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name service_url <<< "$service_info"
        
        print_info "等待 $service_name 服务启动..."
        local attempt=1
        local max_attempts=30
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f "$service_url" >/dev/null 2>&1; then
                print_success "$service_name 服务启动成功"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_warning "$service_name 服务启动超时，请检查日志"
                break
            fi
            
            echo -n "."
            sleep 3
            ((attempt++))
        done
    done
}

# 显示服务状态
show_status() {
    print_section "服务状态"
    
    echo -e "${CYAN}服务访问地址：${NC}"
    echo -e "  🌐 前端应用: ${GREEN}http://localhost:9527${NC}"
    echo -e "  🎨 低代码设计器: ${GREEN}http://localhost:9555${NC}"
    echo -e "  🚀 主系统API: ${GREEN}http://localhost:9528${NC}"
    echo -e "  🔧 低代码平台API: ${GREEN}http://localhost:3000${NC}"
    echo -e "  📊 Amis业务API: ${GREEN}http://localhost:9522${NC}"
    echo -e "  📚 主系统API文档: ${GREEN}http://localhost:9528/api-docs${NC}"
    echo -e "  📚 低代码平台API文档: ${GREEN}http://localhost:3000/api-docs${NC}"
    echo -e "  📚 Amis业务API文档: ${GREEN}http://localhost:9522/api/v1/docs${NC}"
    echo ""
    
    echo -e "${CYAN}日志文件：${NC}"
    echo -e "  Backend: logs/backend.log"
    echo -e "  Lowcode Platform: logs/lowcode-platform.log"
    echo -e "  Amis Backend: logs/amis-backend.log"
    echo -e "  Frontend: logs/frontend.log"
    echo -e "  Designer: logs/lowcode-designer.log"
    echo ""
    
    echo -e "${CYAN}停止服务：${NC}"
    echo -e "  使用 ./stop-dev.sh 停止所有服务"
    echo -e "  或者使用 Ctrl+C 停止当前脚本"
    echo ""
}

# 停止服务函数
stop_services() {
    print_section "停止所有服务"
    
    local pid_files=("backend.pid" "lowcode-platform.pid" "amis-backend.pid" "frontend.pid" "lowcode-designer.pid")
    
    for pid_file in "${pid_files[@]}"; do
        if [ -f "logs/$pid_file" ]; then
            local pid=$(cat "logs/$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                print_success "已停止进程 $pid ($pid_file)"
            fi
            rm -f "logs/$pid_file"
        fi
    done
}

# 信号处理
trap stop_services EXIT INT TERM

# 主函数
main() {
    print_header "Soybean Admin 本地开发环境启动"
    
    check_node
    
    case "${1:-start}" in
        start)
            check_ports
            install_dependencies
            init_database
            start_services
            wait_for_services
            show_status
            
            print_info "按 Ctrl+C 停止所有服务"
            # 保持脚本运行
            while true; do
                sleep 1
            done
            ;;
        install)
            install_dependencies
            ;;
        init-db)
            init_database
            ;;
        stop)
            stop_services
            ;;
        *)
            echo "用法: $0 {start|install|init-db|stop}"
            echo ""
            echo "命令说明："
            echo "  start    - 启动所有服务（默认）"
            echo "  install  - 仅安装依赖"
            echo "  init-db  - 仅初始化数据库"
            echo "  stop     - 停止所有服务"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
