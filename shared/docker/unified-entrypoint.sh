#!/bin/sh

# 统一的Docker启动脚本
# 支持多个微服务的统一启动和初始化

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

# 环境变量默认值
SERVICE_NAME=${SERVICE_NAME:-"unknown-service"}
NODE_ENV=${NODE_ENV:-"production"}
PORT=${PORT:-3000}
AUTO_INIT_DATA=${AUTO_INIT_DATA:-"true"}
FIRST_RUN_DETECTION=${FIRST_RUN_DETECTION:-"true"}
DOCKER_ENV=${DOCKER_ENV:-"true"}
RUN_MIGRATIONS=${RUN_MIGRATIONS:-"true"}
WAIT_FOR_SERVICES=${WAIT_FOR_SERVICES:-"true"}
HEALTH_CHECK_ENABLED=${HEALTH_CHECK_ENABLED:-"true"}

log_section "启动 $SERVICE_NAME 服务"

log_info "环境配置:"
log_info "  服务名称: $SERVICE_NAME"
log_info "  运行环境: $NODE_ENV"
log_info "  端口: $PORT"
log_info "  自动初始化数据: $AUTO_INIT_DATA"
log_info "  首次运行检测: $FIRST_RUN_DETECTION"
log_info "  Docker环境: $DOCKER_ENV"
log_info "  运行迁移: $RUN_MIGRATIONS"

# 等待依赖服务
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=${4:-30}
    local attempt=1

    log_info "等待 $service_name 服务 ($host:$port)..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            log_success "$service_name 服务已就绪"
            return 0
        fi
        
        log_info "等待 $service_name 服务... (尝试 $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name 服务在 $((max_attempts * 2)) 秒后仍未就绪"
    return 1
}

# 等待依赖服务
if [ "$WAIT_FOR_SERVICES" = "true" ]; then
    log_section "等待依赖服务"
    
    # 等待PostgreSQL
    if [ -n "$DATABASE_URL" ]; then
        # 从DATABASE_URL中提取主机和端口
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
            wait_for_service "$DB_HOST" "$DB_PORT" "PostgreSQL" 60
        else
            log_warning "无法从DATABASE_URL解析数据库连接信息"
        fi
    fi
    
    # 等待Redis
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
        wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis" 30
    fi
    
    # 等待其他服务（根据服务名称）
    case "$SERVICE_NAME" in
        "lowcode-platform")
            # 低代码平台可能需要等待主后端
            if [ -n "$BACKEND_URL" ]; then
                BACKEND_HOST=$(echo "$BACKEND_URL" | sed -n 's|http://\([^:]*\):.*|\1|p')
                BACKEND_PORT=$(echo "$BACKEND_URL" | sed -n 's|http://[^:]*:\([0-9]*\).*|\1|p')
                if [ -n "$BACKEND_HOST" ] && [ -n "$BACKEND_PORT" ]; then
                    wait_for_service "$BACKEND_HOST" "$BACKEND_PORT" "Backend" 60
                fi
            fi
            ;;
        "amis-lowcode")
            # Amis低代码可能需要等待低代码平台
            if [ -n "$LOWCODE_PLATFORM_URL" ]; then
                PLATFORM_HOST=$(echo "$LOWCODE_PLATFORM_URL" | sed -n 's|http://\([^:]*\):.*|\1|p')
                PLATFORM_PORT=$(echo "$LOWCODE_PLATFORM_URL" | sed -n 's|http://[^:]*:\([0-9]*\).*|\1|p')
                if [ -n "$PLATFORM_HOST" ] && [ -n "$PLATFORM_PORT" ]; then
                    wait_for_service "$PLATFORM_HOST" "$PLATFORM_PORT" "Lowcode Platform" 60
                fi
            fi
            ;;
    esac
fi

# 检查必要的文件和目录
log_section "检查应用文件"

# 检查必要的文件
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        log_success "$description 存在: $file"
    else
        log_error "$description 不存在: $file"
        return 1
    fi
}

# 检查必要的目录
check_directory() {
    local dir=$1
    local description=$2
    local create_if_missing=${3:-false}
    
    if [ -d "$dir" ]; then
        log_success "$description 存在: $dir"
    elif [ "$create_if_missing" = "true" ]; then
        mkdir -p "$dir"
        log_success "创建 $description: $dir"
    else
        log_error "$description 不存在: $dir"
        return 1
    fi
}

# 检查应用文件
check_file "package.json" "Package配置文件"
check_directory "dist" "构建输出目录"
check_directory "node_modules" "依赖模块目录"

# 检查和创建运行时目录
check_directory "logs" "日志目录" true
check_directory "uploads" "上传目录" true
check_directory "generated" "生成文件目录" true

# 生成Prisma客户端（如果需要）
log_section "Prisma客户端检查"

if [ -f "prisma/schema.prisma" ]; then
    if [ ! -d "node_modules/.prisma" ] || [ ! -f "node_modules/.prisma/client/index.js" ]; then
        log_info "生成Prisma客户端..."
        if command -v pnpm >/dev/null 2>&1; then
            pnpm prisma generate
        else
            npx prisma generate
        fi
        log_success "Prisma客户端生成完成"
    else
        log_success "Prisma客户端已存在"
    fi
else
    log_warning "未找到Prisma schema文件，跳过客户端生成"
fi

# 数据库迁移和初始化
if [ "$RUN_MIGRATIONS" = "true" ]; then
    log_section "数据库迁移"
    
    if [ -f "prisma/schema.prisma" ]; then
        log_info "运行数据库迁移..."
        
        # 在Docker环境中使用db push，在生产环境中使用migrate deploy
        if [ "$NODE_ENV" = "production" ] && [ "$DOCKER_ENV" = "true" ]; then
            log_info "Docker生产环境：使用db push同步数据库结构"
            if command -v pnpm >/dev/null 2>&1; then
                pnpm prisma db push --accept-data-loss
            else
                npx prisma db push --accept-data-loss
            fi
        else
            log_info "使用migrate deploy部署迁移"
            if command -v pnpm >/dev/null 2>&1; then
                pnpm prisma migrate deploy
            else
                npx prisma migrate deploy
            fi
        fi
        
        log_success "数据库迁移完成"
    else
        log_warning "未找到Prisma schema文件，跳过数据库迁移"
    fi
fi

# 健康检查
if [ "$HEALTH_CHECK_ENABLED" = "true" ]; then
    log_section "启动前健康检查"
    
    # 检查端口是否可用
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        log_warning "端口 $PORT 已被占用"
    else
        log_success "端口 $PORT 可用"
    fi
    
    # 检查内存使用情况
    if command -v free >/dev/null 2>&1; then
        MEMORY_INFO=$(free -h | grep "Mem:")
        log_info "内存使用情况: $MEMORY_INFO"
    fi
    
    # 检查磁盘空间
    if command -v df >/dev/null 2>&1; then
        DISK_INFO=$(df -h . | tail -1)
        log_info "磁盘使用情况: $DISK_INFO"
    fi
fi

# 设置信号处理
cleanup() {
    log_info "接收到停止信号，正在优雅关闭..."
    if [ -n "$APP_PID" ]; then
        kill -TERM "$APP_PID" 2>/dev/null || true
        wait "$APP_PID" 2>/dev/null || true
    fi
    log_success "服务已停止"
    exit 0
}

trap cleanup TERM INT

# 启动应用
log_section "启动应用"

log_info "启动 $SERVICE_NAME 服务..."
log_info "监听端口: $PORT"
log_info "进程ID: $$"

# 根据环境选择启动方式
if [ "$NODE_ENV" = "development" ]; then
    log_info "开发模式启动"
    if command -v pnpm >/dev/null 2>&1; then
        exec pnpm start:dev
    else
        exec npm run start:dev
    fi
else
    log_info "生产模式启动"
    if [ -f "dist/main.js" ]; then
        exec node dist/main.js &
        APP_PID=$!
        log_success "$SERVICE_NAME 服务已启动 (PID: $APP_PID)"
        wait "$APP_PID"
    else
        log_error "未找到构建输出文件: dist/main.js"
        exit 1
    fi
fi
