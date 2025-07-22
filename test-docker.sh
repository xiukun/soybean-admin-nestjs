#!/bin/bash

# Docker完整性功能测试脚本
# 用于测试Docker Compose部署的微服务系统

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

# 检查Docker环境
check_docker_environment() {
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
    
    # 显示Docker版本信息
    DOCKER_VERSION=$(docker --version)
    COMPOSE_VERSION=$(docker-compose --version)
    print_info "Docker版本: $DOCKER_VERSION"
    print_info "Docker Compose版本: $COMPOSE_VERSION"
}

# 清理现有容器和网络
cleanup_existing() {
    print_section "清理现有容器和网络"
    
    print_info "停止并删除现有容器..."
    docker-compose down --remove-orphans --volumes || true
    
    print_info "清理未使用的Docker资源..."
    docker system prune -f || true
    
    print_success "清理完成"
}

# 构建Docker镜像
build_images() {
    print_section "构建Docker镜像"
    
    print_info "开始构建所有服务的Docker镜像..."
    docker-compose build --no-cache --parallel
    
    print_success "Docker镜像构建完成"
    
    # 显示构建的镜像
    print_info "构建的镜像列表:"
    docker images | grep -E "(soybean|lowcode|amis)" || true
}

# 启动服务
start_services() {
    print_section "启动微服务系统"
    
    print_info "启动所有服务..."
    docker-compose up -d
    
    print_success "服务启动命令已执行"
}

# 等待服务启动
wait_for_services() {
    print_section "等待服务启动完成"
    
    local services=(
        "postgres:PostgreSQL数据库"
        "redis:Redis缓存"
        "backend:主系统后端"
        "lowcode-platform:低代码平台"
        "amis-backend:Amis业务后端"
        "frontend:前端应用"
        "lowcode-designer:低代码设计器"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name service_desc <<< "$service_info"
        
        print_info "等待 $service_desc 启动..."
        local attempt=1
        local max_attempts=60  # 增加等待时间
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose ps "$service_name" | grep -q "Up"; then
                print_success "$service_desc 启动成功"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_error "$service_desc 启动超时"
                docker-compose logs "$service_name" | tail -20
                return 1
            fi
            
            echo -n "."
            sleep 5
            ((attempt++))
        done
    done
}

# 健康检查
health_check() {
    print_section "服务健康检查"
    
    local health_endpoints=(
        "http://localhost:9528/v1/route/getConstantRoutes:主系统后端"
        "http://localhost:3000/health:低代码平台"
        "http://localhost:9522/health:Amis业务后端"
        "http://localhost:9527:前端应用"
        "http://localhost:9555:低代码设计器"
    )
    
    local healthy_count=0
    local total_count=${#health_endpoints[@]}
    
    for endpoint_info in "${health_endpoints[@]}"; do
        IFS=':' read -r endpoint service_name <<< "$endpoint_info"
        
        print_info "检查 $service_name 健康状态..."
        
        local attempt=1
        local max_attempts=12  # 1分钟
        local is_healthy=false
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s --max-time 10 "$endpoint" > /dev/null 2>&1; then
                print_success "$service_name 健康检查通过"
                ((healthy_count++))
                is_healthy=true
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_error "$service_name 健康检查失败"
                break
            fi
            
            echo -n "."
            sleep 5
            ((attempt++))
        done
        
        if [ "$is_healthy" = false ]; then
            print_warning "显示 $service_name 的日志:"
            docker-compose logs --tail=10 | grep -i error || true
        fi
    done
    
    echo ""
    if [ $healthy_count -eq $total_count ]; then
        print_success "所有服务健康检查通过！($healthy_count/$total_count)"
        return 0
    else
        print_warning "部分服务健康检查失败 ($healthy_count/$total_count)"
        return 1
    fi
}

# 功能测试
functional_test() {
    print_section "功能测试"
    
    # 测试主系统API
    print_info "测试主系统API..."
    if curl -f -s "http://localhost:9528/v1/route/getConstantRoutes" > /dev/null; then
        print_success "主系统API响应正常"
    else
        print_error "主系统API测试失败"
    fi
    
    # 测试低代码平台API
    print_info "测试低代码平台API..."
    if curl -f -s "http://localhost:3000/api/v1/projects" > /dev/null; then
        print_success "低代码平台API响应正常"
    else
        print_error "低代码平台API测试失败"
    fi
    
    # 测试Amis业务API
    print_info "测试Amis业务API..."
    if curl -f -s "http://localhost:9522/health" > /dev/null; then
        print_success "Amis业务API响应正常"
    else
        print_error "Amis业务API测试失败"
    fi
    
    # 测试前端应用
    print_info "测试前端应用..."
    if curl -f -s "http://localhost:9527" > /dev/null; then
        print_success "前端应用响应正常"
    else
        print_error "前端应用测试失败"
    fi
    
    # 测试设计器
    print_info "测试低代码设计器..."
    if curl -f -s "http://localhost:9555" > /dev/null; then
        print_success "低代码设计器响应正常"
    else
        print_error "低代码设计器测试失败"
    fi
}

# 显示系统状态
show_system_status() {
    print_section "系统状态概览"
    
    echo -e "${CYAN}容器状态：${NC}"
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
    
    echo -e "${CYAN}资源使用情况：${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" || true
    echo ""
    
    echo -e "${CYAN}管理命令：${NC}"
    echo -e "  查看日志: docker-compose logs -f [service_name]"
    echo -e "  停止服务: docker-compose down"
    echo -e "  重启服务: docker-compose restart [service_name]"
    echo -e "  进入容器: docker-compose exec [service_name] /bin/bash"
    echo ""
}

# 清理资源
cleanup() {
    print_section "清理测试资源"
    
    if [ "$1" = "--keep-running" ]; then
        print_info "保持服务运行，跳过清理"
        return 0
    fi
    
    print_info "停止所有服务..."
    docker-compose down
    
    print_success "测试资源清理完成"
}

# 主函数
main() {
    print_header "Docker微服务系统完整性测试"
    
    case "${1:-full}" in
        full)
            check_docker_environment
            cleanup_existing
            build_images
            start_services
            wait_for_services
            health_check
            functional_test
            show_system_status
            
            echo ""
            print_info "测试完成！服务将继续运行。"
            print_info "使用 'docker-compose down' 停止所有服务"
            print_info "使用 './test-docker.sh cleanup' 清理资源"
            ;;
        build)
            check_docker_environment
            build_images
            ;;
        start)
            check_docker_environment
            start_services
            wait_for_services
            show_system_status
            ;;
        test)
            health_check
            functional_test
            ;;
        status)
            show_system_status
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "用法: $0 {full|build|start|test|status|cleanup}"
            echo ""
            echo "命令说明："
            echo "  full     - 完整测试流程（默认）"
            echo "  build    - 仅构建Docker镜像"
            echo "  start    - 仅启动服务"
            echo "  test     - 仅执行健康检查和功能测试"
            echo "  status   - 显示系统状态"
            echo "  cleanup  - 清理测试资源"
            exit 1
            ;;
    esac
}

# 信号处理
trap 'echo ""; print_info "测试被中断"' INT TERM

# 执行主函数
main "$@"
