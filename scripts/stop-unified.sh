#!/bin/bash

# 统一JWT认证系统停止脚本

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

# 停止本地服务
stop_local_services() {
    log_info "停止本地服务..."
    
    services=("backend" "lowcode-platform-backend" "amis-lowcode-backend")
    
    for service in "${services[@]}"; do
        pid_file="logs/${service}.pid"
        
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            
            if kill -0 "$pid" 2>/dev/null; then
                log_info "停止 $service (PID: $pid)..."
                kill "$pid"
                
                # 等待进程结束
                timeout=10
                while kill -0 "$pid" 2>/dev/null && [ $timeout -gt 0 ]; do
                    sleep 1
                    timeout=$((timeout - 1))
                done
                
                if kill -0 "$pid" 2>/dev/null; then
                    log_warn "$service 未能正常停止，强制终止..."
                    kill -9 "$pid"
                fi
                
                log_info "$service 已停止"
            else
                log_warn "$service 进程不存在 (PID: $pid)"
            fi
            
            rm -f "$pid_file"
        else
            log_warn "$service PID文件不存在"
        fi
    done
    
    # 清理可能残留的进程
    log_info "清理残留进程..."
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "node.*dist/main" 2>/dev/null || true
    
    log_info "本地服务停止完成"
}

# 停止Docker服务
stop_docker_services() {
    log_info "停止Docker服务..."
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker未运行"
        exit 1
    fi
    
    # 检查docker-compose是否可用
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose 未安装"
        exit 1
    fi
    
    # 停止并删除容器
    log_info "停止Docker容器..."
    docker-compose -f docker-compose.unified.yml down
    
    # 可选：删除镜像
    if [ "$1" = "--remove-images" ]; then
        log_info "删除Docker镜像..."
        docker-compose -f docker-compose.unified.yml down --rmi all
    fi
    
    # 可选：删除卷
    if [ "$1" = "--remove-volumes" ]; then
        log_info "删除Docker卷..."
        docker-compose -f docker-compose.unified.yml down --volumes
    fi
    
    log_info "Docker服务停止完成"
}

# 清理日志文件
cleanup_logs() {
    log_info "清理日志文件..."
    
    if [ -d "logs" ]; then
        rm -f logs/*.log
        rm -f logs/*.pid
        log_info "日志文件清理完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "统一JWT认证系统停止脚本"
    echo ""
    echo "用法: $0 [选项] [模式]"
    echo ""
    echo "模式:"
    echo "  local   停止本地服务 (默认)"
    echo "  docker  停止Docker服务"
    echo "  all     停止所有服务"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示帮助信息"
    echo "  --cleanup-logs       清理日志文件"
    echo "  --remove-images      删除Docker镜像 (仅Docker模式)"
    echo "  --remove-volumes     删除Docker卷 (仅Docker模式)"
    echo ""
    echo "示例:"
    echo "  $0                          # 停止本地服务"
    echo "  $0 local                    # 停止本地服务"
    echo "  $0 docker                   # 停止Docker服务"
    echo "  $0 all                      # 停止所有服务"
    echo "  $0 docker --remove-images   # 停止Docker服务并删除镜像"
    echo "  $0 --cleanup-logs           # 停止服务并清理日志"
}

# 主函数
main() {
    local mode="local"
    local cleanup_logs_flag=false
    local remove_images=false
    local remove_volumes=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --cleanup-logs)
                cleanup_logs_flag=true
                shift
                ;;
            --remove-images)
                remove_images=true
                shift
                ;;
            --remove-volumes)
                remove_volumes=true
                shift
                ;;
            local|docker|all)
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
    
    log_info "开始停止统一JWT认证系统..."
    
    case $mode in
        "local")
            stop_local_services
            ;;
        "docker")
            local docker_args=""
            if [ "$remove_images" = true ]; then
                docker_args="--remove-images"
            elif [ "$remove_volumes" = true ]; then
                docker_args="--remove-volumes"
            fi
            stop_docker_services "$docker_args"
            ;;
        "all")
            stop_local_services
            stop_docker_services
            ;;
        *)
            log_error "未知的停止模式: $mode"
            exit 1
            ;;
    esac
    
    if [ "$cleanup_logs_flag" = true ]; then
        cleanup_logs
    fi
    
    log_info "停止完成！"
}

# 执行主函数
main "$@"
