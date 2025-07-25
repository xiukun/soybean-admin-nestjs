#!/bin/bash

# 统一部署管理脚本
# 支持开发、测试、生产环境的一键部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_section() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

# 显示帮助信息
show_help() {
    echo "Soybean Admin 统一部署脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start [env]     启动服务 (dev|test|prod)"
    echo "  stop            停止所有服务"
    echo "  restart [env]   重启服务"
    echo "  build           构建所有镜像"
    echo "  logs [service]  查看日志"
    echo "  status          查看服务状态"
    echo "  clean           清理资源"
    echo "  backup          备份数据"
    echo "  restore [file]  恢复数据"
    echo "  health          健康检查"
    echo "  init            初始化环境"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -v, --verbose   详细输出"
    echo "  -f, --force     强制执行"
    echo ""
    echo "示例:"
    echo "  $0 start prod   # 启动生产环境"
    echo "  $0 logs backend # 查看后端日志"
    echo "  $0 backup       # 备份数据"
}

# 检查依赖
check_dependencies() {
    log_section "检查依赖"
    
    local deps=("docker" "docker-compose" "curl" "jq")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
            log_error "缺少依赖: $dep"
        else
            log_success "依赖检查通过: $dep"
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "请安装缺少的依赖: ${missing_deps[*]}"
        exit 1
    fi
}

# 检查环境文件
check_env_files() {
    log_section "检查环境配置"
    
    local env_files=(
        ".env"
        "backend/.env"
        "lowcode-platform-backend/.env"
        "amis-lowcode-backend/.env"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            log_success "环境文件存在: $env_file"
        else
            log_warning "环境文件不存在: $env_file"
            if [ -f "$env_file.example" ]; then
                cp "$env_file.example" "$env_file"
                log_success "已从示例文件创建: $env_file"
            fi
        fi
    done
}

# 选择Docker Compose文件
get_compose_file() {
    local env=${1:-"dev"}
    
    case "$env" in
        "dev"|"development")
            echo "docker-compose.yml"
            ;;
        "test"|"testing")
            echo "docker-compose.test.yml"
            ;;
        "prod"|"production")
            echo "docker-compose.unified.yml"
            ;;
        *)
            log_warning "未知环境: $env，使用默认配置"
            echo "docker-compose.yml"
            ;;
    esac
}

# 构建镜像
build_images() {
    log_section "构建Docker镜像"
    
    local compose_file=$(get_compose_file "${1:-prod}")
    
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose文件不存在: $compose_file"
        exit 1
    fi
    
    log_info "使用配置文件: $compose_file"
    
    # 构建所有服务
    docker-compose -f "$compose_file" build --no-cache
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    local env=${1:-"dev"}
    local compose_file=$(get_compose_file "$env")
    
    log_section "启动服务 ($env 环境)"
    
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose文件不存在: $compose_file"
        exit 1
    fi
    
    log_info "使用配置文件: $compose_file"
    
    # 创建网络（如果不存在）
    docker network create soybean-admin 2>/dev/null || true
    
    # 启动服务
    docker-compose -f "$compose_file" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services_health "$compose_file"
    
    log_success "服务启动完成"
    show_service_urls
}

# 停止服务
stop_services() {
    log_section "停止服务"
    
    # 尝试停止所有可能的compose文件
    local compose_files=("docker-compose.yml" "docker-compose.unified.yml" "docker-compose.test.yml")
    
    for compose_file in "${compose_files[@]}"; do
        if [ -f "$compose_file" ]; then
            log_info "停止服务: $compose_file"
            docker-compose -f "$compose_file" down
        fi
    done
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    local env=${1:-"dev"}
    
    log_section "重启服务"
    
    stop_services
    sleep 5
    start_services "$env"
}

# 查看日志
show_logs() {
    local service=${1:-""}
    local lines=${2:-100}
    local compose_file=$(get_compose_file "prod")
    
    if [ -n "$service" ]; then
        log_info "查看 $service 服务日志 (最近 $lines 行)"
        docker-compose -f "$compose_file" logs --tail="$lines" -f "$service"
    else
        log_info "查看所有服务日志 (最近 $lines 行)"
        docker-compose -f "$compose_file" logs --tail="$lines" -f
    fi
}

# 查看服务状态
show_status() {
    log_section "服务状态"
    
    local compose_file=$(get_compose_file "prod")
    
    if [ -f "$compose_file" ]; then
        docker-compose -f "$compose_file" ps
    else
        log_warning "未找到Docker Compose文件"
        docker ps --filter "name=soybean-"
    fi
}

# 健康检查
check_services_health() {
    local compose_file=${1:-$(get_compose_file "prod")}
    
    log_section "服务健康检查"
    
    local services=("backend:9528" "lowcode-platform:3000" "amis-backend:9522")
    local healthy_count=0
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        
        log_info "检查 $service_name 服务 (端口 $port)..."
        
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s "http://localhost:$port/health" >/dev/null 2>&1; then
                log_success "$service_name 服务健康"
                healthy_count=$((healthy_count + 1))
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "$service_name 服务不健康"
            else
                sleep 2
            fi
            
            attempt=$((attempt + 1))
        done
    done
    
    log_info "健康服务数量: $healthy_count/${#services[@]}"
}

# 显示服务URL
show_service_urls() {
    log_section "服务访问地址"
    
    echo -e "${CYAN}🌐 Web服务:${NC}"
    echo "  主后端API:        http://localhost:9528"
    echo "  主后端文档:       http://localhost:9528/api-docs"
    echo "  低代码平台API:    http://localhost:3000"
    echo "  低代码平台文档:   http://localhost:3000/api-docs"
    echo "  Amis后端API:      http://localhost:9522"
    echo "  Amis后端文档:     http://localhost:9522/api-docs"
    echo ""
    echo -e "${CYAN}🔧 基础设施:${NC}"
    echo "  PostgreSQL:       localhost:5432"
    echo "  Redis:            localhost:6379"
    echo ""
    echo -e "${CYAN}📊 监控:${NC}"
    echo "  健康检查:         http://localhost:9528/health"
    echo "  性能指标:         http://localhost:9528/health/metrics"
}

# 清理资源
clean_resources() {
    log_section "清理资源"
    
    log_warning "这将删除所有容器、镜像和数据卷！"
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 停止所有服务
        stop_services
        
        # 删除容器
        docker container prune -f
        
        # 删除镜像
        docker image prune -a -f
        
        # 删除数据卷
        docker volume prune -f
        
        # 删除网络
        docker network prune -f
        
        log_success "资源清理完成"
    else
        log_info "取消清理操作"
    fi
}

# 备份数据
backup_data() {
    log_section "备份数据"
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_info "备份目录: $backup_dir"
    
    # 备份数据库
    log_info "备份PostgreSQL数据库..."
    docker exec soybean-postgres pg_dumpall -U soybean > "$backup_dir/database.sql"
    
    # 备份Redis数据
    log_info "备份Redis数据..."
    docker exec soybean-redis redis-cli --rdb - > "$backup_dir/redis.rdb"
    
    # 备份生成的代码
    if [ -d "generated-code" ]; then
        log_info "备份生成的代码..."
        tar -czf "$backup_dir/generated-code.tar.gz" generated-code/
    fi
    
    # 备份日志
    if [ -d "logs" ]; then
        log_info "备份日志文件..."
        tar -czf "$backup_dir/logs.tar.gz" logs/
    fi
    
    log_success "备份完成: $backup_dir"
}

# 初始化环境
init_environment() {
    log_section "初始化环境"
    
    # 检查依赖
    check_dependencies
    
    # 检查环境文件
    check_env_files
    
    # 创建必要的目录
    local dirs=("logs" "generated-code" "uploads" "backups")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "创建目录: $dir"
        fi
    done
    
    # 设置权限
    chmod +x scripts/*.sh 2>/dev/null || true
    
    log_success "环境初始化完成"
}

# 主函数
main() {
    local command=${1:-"help"}
    local arg1=${2:-""}
    local arg2=${3:-""}
    
    case "$command" in
        "start")
            check_dependencies
            check_env_files
            start_services "$arg1"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            check_dependencies
            restart_services "$arg1"
            ;;
        "build")
            check_dependencies
            build_images "$arg1"
            ;;
        "logs")
            show_logs "$arg1" "$arg2"
            ;;
        "status")
            show_status
            ;;
        "health")
            check_services_health
            ;;
        "clean")
            clean_resources
            ;;
        "backup")
            backup_data
            ;;
        "init")
            init_environment
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
