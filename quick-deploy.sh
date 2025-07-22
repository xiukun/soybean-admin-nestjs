#!/bin/bash

# Soybean Admin 微服务系统快速部署脚本
# 作者: AI Assistant
# 版本: 1.0.0
# 描述: 一键部署整个微服务系统

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

# 显示帮助信息
show_help() {
    cat << EOF
Soybean Admin 微服务系统快速部署脚本

用法: $0 [选项]

选项:
    install     安装所有依赖
    build       构建所有服务
    start       启动所有服务
    stop        停止所有服务
    restart     重启所有服务
    status      查看服务状态
    logs        查看服务日志
    clean       清理构建文件和缓存
    full        完整部署流程 (install + build + start)
    help        显示此帮助信息

示例:
    $0 full         # 完整部署
    $0 start        # 启动服务
    $0 logs         # 查看日志
    $0 status       # 查看状态

EOF
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 20.11.1+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    log_info "Node.js 版本: $NODE_VERSION"
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
    
    PNPM_VERSION=$(pnpm -v)
    log_info "pnpm 版本: $PNPM_VERSION"
    
    # 检查 Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_info "Docker 版本: $DOCKER_VERSION"
    else
        log_warning "Docker 未安装，将使用本地开发模式"
    fi
    
    # 检查 Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | sed 's/,//')
        log_info "Docker Compose 版本: $COMPOSE_VERSION"
    fi
    
    log_success "系统要求检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装根目录依赖
    log_info "安装根目录依赖..."
    pnpm install
    
    # 安装各服务依赖
    services=("backend" "frontend" "lowcode-platform-backend" "amis-lowcode-backend" "lowcode-designer")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            log_info "安装 $service 依赖..."
            cd "$service"
            pnpm install
            cd ..
        else
            log_warning "$service 目录不存在，跳过"
        fi
    done
    
    log_success "依赖安装完成"
}

# 构建服务
build_services() {
    log_info "构建所有服务..."
    
    # 构建后端服务
    services=("backend" "lowcode-platform-backend" "amis-lowcode-backend")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            log_info "构建 $service..."
            cd "$service"
            
            # 生成 Prisma 客户端
            if [ -f "prisma/schema.prisma" ]; then
                pnpm prisma:generate
            fi
            
            # 构建项目
            pnpm build
            cd ..
            log_success "$service 构建完成"
        fi
    done
    
    # 构建前端服务
    frontend_services=("frontend" "lowcode-designer")
    
    for service in "${frontend_services[@]}"; do
        if [ -d "$service" ]; then
            log_info "构建 $service..."
            cd "$service"
            pnpm build
            cd ..
            log_success "$service 构建完成"
        fi
    done
    
    log_success "所有服务构建完成"
}

# 启动服务
start_services() {
    log_info "启动所有服务..."
    
    # 检查是否有 Docker
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        log_info "使用 Docker Compose 启动服务..."
        docker-compose up -d
        
        # 等待服务启动
        log_info "等待服务启动..."
        sleep 10
        
        # 检查服务状态
        docker-compose ps
        
    else
        log_info "使用本地开发模式启动服务..."
        
        # 启动数据库服务（如果有 Docker）
        if command -v docker &> /dev/null; then
            log_info "启动数据库服务..."
            docker run -d --name postgres-soybean \
                -e POSTGRES_USER=soybean \
                -e POSTGRES_PASSWORD=soybean@123. \
                -e POSTGRES_DB=soybean-admin-nest-backend \
                -p 25432:5432 \
                postgres:16-alpine || log_warning "数据库可能已经在运行"
                
            docker run -d --name redis-soybean \
                -p 26379:6379 \
                redis:7-alpine || log_warning "Redis可能已经在运行"
        fi
        
        # 使用开发脚本启动
        if [ -f "start-dev.sh" ]; then
            chmod +x start-dev.sh
            ./start-dev.sh start
        else
            log_warning "start-dev.sh 不存在，请手动启动各服务"
        fi
    fi
    
    log_success "服务启动完成"
    show_access_info
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose down
    else
        if [ -f "stop-dev.sh" ]; then
            chmod +x stop-dev.sh
            ./stop-dev.sh
        else
            log_warning "stop-dev.sh 不存在，请手动停止各服务"
        fi
    fi
    
    log_success "服务停止完成"
}

# 重启服务
restart_services() {
    log_info "重启所有服务..."
    stop_services
    sleep 5
    start_services
}

# 查看服务状态
show_status() {
    log_info "查看服务状态..."
    
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose ps
    else
        log_info "检查本地服务状态..."
        
        # 检查端口占用
        ports=(9527 9528 3000 9522 9555 25432 26379)
        port_names=("Frontend" "Backend" "Lowcode Platform" "Amis Backend" "Designer" "PostgreSQL" "Redis")
        
        for i in "${!ports[@]}"; do
            port=${ports[$i]}
            name=${port_names[$i]}
            
            if lsof -i :$port &> /dev/null; then
                log_success "$name (端口 $port): 运行中"
            else
                log_warning "$name (端口 $port): 未运行"
            fi
        done
    fi
}

# 查看日志
show_logs() {
    log_info "查看服务日志..."
    
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose logs -f --tail=100
    else
        log_info "本地开发模式日志位置:"
        echo "  - Backend: logs/backend.log"
        echo "  - Lowcode Platform: logs/lowcode-platform.log"
        echo "  - Amis Backend: logs/amis-backend.log"
        
        if [ -f "logs/backend.log" ]; then
            tail -f logs/backend.log
        fi
    fi
}

# 清理
clean_all() {
    log_info "清理构建文件和缓存..."
    
    # 清理 node_modules
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理构建文件
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理日志
    rm -rf logs/*.log 2>/dev/null || true
    
    # 清理 Docker 资源
    if command -v docker &> /dev/null; then
        docker system prune -f
    fi
    
    log_success "清理完成"
}

# 显示访问信息
show_access_info() {
    cat << EOF

🎉 部署完成！访问地址：

🌐 前端应用:           http://localhost:9527
🎨 低代码设计器:       http://localhost:9555
📚 主系统API文档:      http://localhost:9528/api-docs
📚 低代码平台API文档:  http://localhost:3000/api-docs
📚 业务API文档:        http://localhost:9522/api/v1/docs

🔧 管理工具:
📊 数据库:             localhost:25432 (用户: soybean, 密码: soybean@123.)
🗄️  Redis:             localhost:26379 (密码: 123456)

📝 默认登录账号:
   用户名: admin
   密码: admin123

EOF
}

# 完整部署流程
full_deploy() {
    log_info "开始完整部署流程..."
    
    check_requirements
    install_dependencies
    build_services
    start_services
    
    log_success "完整部署流程完成！"
}

# 主函数
main() {
    case "${1:-help}" in
        install)
            check_requirements
            install_dependencies
            ;;
        build)
            build_services
            ;;
        start)
            start_services
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
        logs)
            show_logs
            ;;
        clean)
            clean_all
            ;;
        full)
            full_deploy
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
