#!/bin/bash

# 统一JWT认证系统启动脚本
# 支持本地开发和Docker部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查环境变量
check_env() {
    log_info "检查环境变量..."
    
    # 必需的环境变量
    required_vars=(
        "JWT_SECRET"
        "REFRESH_TOKEN_SECRET"
        "SERVICE_SECRET"
        "DATABASE_URL"
        "REDIS_HOST"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "缺少必需的环境变量:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        log_error "请检查 .env.unified 文件或设置环境变量"
        exit 1
    fi
    
    # 验证密钥长度
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET 长度必须至少32位"
        exit 1
    fi
    
    if [ ${#REFRESH_TOKEN_SECRET} -lt 32 ]; then
        log_error "REFRESH_TOKEN_SECRET 长度必须至少32位"
        exit 1
    fi
    
    if [ ${#SERVICE_SECRET} -lt 32 ]; then
        log_error "SERVICE_SECRET 长度必须至少32位"
        exit 1
    fi
    
    log_info "环境变量检查通过"
}

# 检查依赖服务
check_dependencies() {
    log_info "检查依赖服务..."
    
    # 检查Redis连接
    if command -v redis-cli &> /dev/null; then
        if ! redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &> /dev/null; then
            log_warn "Redis服务不可用，某些功能可能受限"
        else
            log_info "Redis连接正常"
        fi
    else
        log_warn "redis-cli 未安装，跳过Redis连接检查"
    fi
    
    # 检查PostgreSQL连接
    if command -v psql &> /dev/null; then
        if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            log_warn "PostgreSQL数据库不可用"
        else
            log_info "PostgreSQL连接正常"
        fi
    else
        log_warn "psql 未安装，跳过数据库连接检查"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    if [ ! -d "node_modules" ]; then
        log_info "安装根目录依赖..."
        npm install
    fi
    
    # 安装各个服务的依赖
    services=("backend" "lowcode-platform-backend" "amis-lowcode-backend")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            log_info "安装 $service 依赖..."
            cd "$service"
            if [ ! -d "node_modules" ]; then
                npm install
            fi
            cd ..
        fi
    done
    
    log_info "依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建共享认证模块
    log_info "构建共享认证模块..."
    cd shared/auth
    if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
        npm run build 2>/dev/null || log_warn "共享认证模块构建失败"
    fi
    cd ../..
    
    # 构建各个服务
    services=("backend" "lowcode-platform-backend" "amis-lowcode-backend")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            log_info "构建 $service..."
            cd "$service"
            if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
                npm run build 2>/dev/null || log_warn "$service 构建失败"
            fi
            cd ..
        fi
    done
    
    log_info "项目构建完成"
}

# 启动服务
start_services() {
    local mode=$1
    
    case $mode in
        "local")
            start_local_services
            ;;
        "docker")
            start_docker_services
            ;;
        *)
            log_error "未知的启动模式: $mode"
            exit 1
            ;;
    esac
}

# 本地启动服务
start_local_services() {
    log_info "本地启动服务..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动各个服务
    services=("backend:3000" "lowcode-platform-backend:3001" "amis-lowcode-backend:3002")
    
    for service_port in "${services[@]}"; do
        IFS=':' read -r service port <<< "$service_port"
        
        if [ -d "$service" ]; then
            log_info "启动 $service (端口: $port)..."
            cd "$service"
            
            # 设置端口环境变量
            export PORT=$port
            
            # 后台启动服务
            nohup npm run start:prod > "../logs/${service}.log" 2>&1 &
            echo $! > "../logs/${service}.pid"
            
            cd ..
            
            # 等待服务启动
            sleep 5
            
            # 检查服务是否启动成功
            if curl -f "http://localhost:$port/health" &> /dev/null; then
                log_info "$service 启动成功 (http://localhost:$port)"
            else
                log_warn "$service 可能启动失败，请检查日志: logs/${service}.log"
            fi
        fi
    done
    
    log_info "所有服务启动完成"
    log_info "查看日志: tail -f logs/*.log"
    log_info "停止服务: ./scripts/stop-unified.sh"
}

# Docker启动服务
start_docker_services() {
    log_info "Docker启动服务..."
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker未运行，请先启动Docker"
        exit 1
    fi
    
    # 检查docker-compose是否可用
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose 未安装"
        exit 1
    fi
    
    # 停止现有容器
    log_info "停止现有容器..."
    docker-compose -f docker-compose.unified.yml down
    
    # 构建并启动服务
    log_info "构建并启动Docker服务..."
    docker-compose -f docker-compose.unified.yml up --build -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker-compose -f docker-compose.unified.yml ps
    
    # 检查服务健康状态
    services=("backend:9528" "lowcode-platform:3000" "amis-backend:9522")
    
    for service_port in "${services[@]}"; do
        IFS=':' read -r service port <<< "$service_port"
        
        if curl -f "http://localhost:$port/health" &> /dev/null; then
            log_info "$service 健康检查通过 (http://localhost:$port)"
        else
            log_warn "$service 健康检查失败"
        fi
    done
    
    log_info "Docker服务启动完成"
    log_info "查看日志: docker-compose -f docker-compose.unified.yml logs -f"
    log_info "停止服务: docker-compose -f docker-compose.unified.yml down"
}

# 显示帮助信息
show_help() {
    echo "统一JWT认证系统启动脚本"
    echo ""
    echo "用法: $0 [选项] <模式>"
    echo ""
    echo "模式:"
    echo "  local   本地启动模式"
    echo "  docker  Docker启动模式"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -v, --verbose  详细输出"
    echo "  --no-build     跳过构建步骤"
    echo "  --no-deps      跳过依赖检查"
    echo ""
    echo "示例:"
    echo "  $0 local                # 本地启动"
    echo "  $0 docker               # Docker启动"
    echo "  $0 --no-build local     # 本地启动（跳过构建）"
}

# 主函数
main() {
    local mode=""
    local skip_build=false
    local skip_deps=false
    local verbose=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            --no-build)
                skip_build=true
                shift
                ;;
            --no-deps)
                skip_deps=true
                shift
                ;;
            local|docker)
                mode=$1
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查模式参数
    if [ -z "$mode" ]; then
        log_error "请指定启动模式 (local 或 docker)"
        show_help
        exit 1
    fi
    
    # 加载环境变量
    if [ -f ".env.unified" ]; then
        log_info "加载环境变量文件: .env.unified"
        export $(cat .env.unified | grep -v '^#' | xargs)
    elif [ -f ".env" ]; then
        log_info "加载环境变量文件: .env"
        export $(cat .env | grep -v '^#' | xargs)
    else
        log_warn "未找到环境变量文件，使用系统环境变量"
    fi
    
    # 执行启动流程
    log_info "开始启动统一JWT认证系统..."
    
    if [ "$skip_deps" = false ]; then
        check_env
        check_dependencies
        install_dependencies
    fi
    
    if [ "$skip_build" = false ]; then
        build_project
    fi
    
    start_services "$mode"
    
    log_info "启动完成！"
}

# 执行主函数
main "$@"
