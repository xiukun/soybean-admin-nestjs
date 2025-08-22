#!/bin/bash

# 低代码平台快速启动脚本
# 自动初始化数据库、安装依赖、启动服务

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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# 检查必要的命令是否存在
check_prerequisites() {
    local missing_commands=()
    
    if ! command -v node &> /dev/null; then
        missing_commands+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_commands+=("npm")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_commands+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_commands+=("docker-compose")
    fi
    
    if [ ${#missing_commands[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All prerequisites are installed"
}

# 检查环境文件
check_env_files() {
    log_step "Checking environment files..."
    
    # 检查lowcode-platform-backend的.env文件
    if [ ! -f "lowcode-platform-backend/.env" ]; then
        log_warning ".env file not found in lowcode-platform-backend, creating from example..."
        if [ -f "lowcode-platform-backend/.env.example" ]; then
            cp lowcode-platform-backend/.env.example lowcode-platform-backend/.env
            log_success "Created .env file for lowcode-platform-backend"
        else
            log_warning "No .env.example found, creating basic .env file..."
            cat > lowcode-platform-backend/.env << EOF
NODE_ENV=development
PORT=3003
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=lowcode"
JWT_SECRET="lowcode-platform-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
EOF
            log_success "Created basic .env file for lowcode-platform-backend"
        fi
    fi
    
    # 检查amis-lowcode-backend的.env文件
    if [ ! -f "amis-lowcode-backend/.env" ]; then
        log_warning ".env file not found in amis-lowcode-backend, creating from example..."
        if [ -f "amis-lowcode-backend/.env.example" ]; then
            cp amis-lowcode-backend/.env.example amis-lowcode-backend/.env
            log_success "Created .env file for amis-lowcode-backend"
        else
            log_warning "No .env.example found, creating basic .env file..."
            cat > amis-lowcode-backend/.env << EOF
NODE_ENV=development
PORT=9522
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=amis"
JWT_SECRET="amis-backend-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
AUTO_INIT_DATA=true
EOF
            log_success "Created basic .env file for amis-lowcode-backend"
        fi
    fi
    
    log_success "Environment files checked"
}

# 启动数据库
start_database() {
    log_step "Starting PostgreSQL database..."
    
    # 检查数据库是否已经在运行
    if docker ps | grep -q "postgres"; then
        log_success "PostgreSQL is already running"
        return 0
    fi
    
    # 启动数据库
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d postgres
    else
        # 如果没有docker-compose.yml，使用单独的docker命令
        docker run --name lowcode-postgres \
            -e POSTGRES_PASSWORD="soybean@123." \
            -e POSTGRES_USER=soybean \
            -e POSTGRES_DB=soybean-admin-nest-backend \
            -p 25432:5432 \
            -d postgres:13
    fi
    
    # 等待数据库启动
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # 检查数据库连接
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if PGPASSWORD='soybean@123.' psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend -c "SELECT 1;" > /dev/null 2>&1; then
            log_success "Database is ready"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Database failed to start after $max_attempts attempts"
    return 1
}

# 安装依赖
install_dependencies() {
    log_step "Installing dependencies..."
    
    # 安装lowcode-platform-backend依赖
    if [ -d "lowcode-platform-backend" ]; then
        log_info "Installing lowcode-platform-backend dependencies..."
        cd lowcode-platform-backend
        npm install
        cd ..
        log_success "lowcode-platform-backend dependencies installed"
    fi
    
    # 安装amis-lowcode-backend依赖
    if [ -d "amis-lowcode-backend" ]; then
        log_info "Installing amis-lowcode-backend dependencies..."
        cd amis-lowcode-backend
        npm install
        cd ..
        log_success "amis-lowcode-backend dependencies installed"
    fi
    
    # 安装frontend依赖
    if [ -d "frontend" ]; then
        log_info "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        log_success "frontend dependencies installed"
    fi
}

# 初始化数据库
init_database() {
    log_step "Initializing database..."
    
    # 初始化lowcode-platform-backend数据库
    if [ -d "lowcode-platform-backend" ]; then
        log_info "Initializing lowcode-platform-backend database..."
        cd lowcode-platform-backend
        
        # 生成Prisma客户端
        npx prisma generate
        
        # 运行数据库迁移
        npx prisma migrate dev --name init
        
        # 运行种子数据
        npm run db:seed
        
        cd ..
        log_success "lowcode-platform-backend database initialized"
    fi
    
    # 初始化amis-lowcode-backend数据库
    if [ -d "amis-lowcode-backend" ]; then
        log_info "Initializing amis-lowcode-backend database..."
        cd amis-lowcode-backend
        
        # 生成Prisma客户端
        npx prisma generate
        
        # 运行数据库迁移
        npx prisma migrate dev --name init
        
        # 运行种子数据
        npm run prisma:seed
        
        cd ..
        log_success "amis-lowcode-backend database initialized"
    fi
}

# 启动服务
start_services() {
    log_step "Starting services..."
    
    # 启动lowcode-platform-backend
    if [ -d "lowcode-platform-backend" ]; then
        log_info "Starting lowcode-platform-backend on port 3003..."
        cd lowcode-platform-backend
        npm run start:dev &
        cd ..
        sleep 5
    fi
    
    # 启动amis-lowcode-backend
    if [ -d "amis-lowcode-backend" ]; then
        log_info "Starting amis-lowcode-backend on port 9522..."
        cd amis-lowcode-backend
        npm run start:dev &
        cd ..
        sleep 5
    fi
    
    log_success "Backend services started"
    log_info "You can now start the frontend manually:"
    log_info "  cd frontend && npm run dev"
}

# 验证系统
verify_system() {
    log_step "Verifying system..."
    
    # 等待服务完全启动
    sleep 10
    
    # 运行系统测试
    if [ -f "./test-system.sh" ]; then
        chmod +x ./test-system.sh
        ./test-system.sh
    else
        log_warning "System test script not found, performing basic checks..."
        
        # 基础检查
        local lowcode_backend_ok=false
        local amis_backend_ok=false
        
        if curl -s http://localhost:3003 > /dev/null; then
            log_success "lowcode-platform-backend is responding"
            lowcode_backend_ok=true
        else
            log_error "lowcode-platform-backend is not responding"
        fi
        
        if curl -s http://localhost:9522/api/v1/health > /dev/null; then
            log_success "amis-lowcode-backend is responding"
            amis_backend_ok=true
        else
            log_error "amis-lowcode-backend is not responding"
        fi
        
        if [ "$lowcode_backend_ok" = true ] && [ "$amis_backend_ok" = true ]; then
            log_success "Basic system verification passed"
        else
            log_error "System verification failed"
            return 1
        fi
    fi
}

# 显示最终信息
show_final_info() {
    echo ""
    echo -e "${CYAN}🎉 Low-Code Platform Setup Complete!${NC}"
    echo ""
    echo -e "${YELLOW}📍 Service URLs:${NC}"
    echo "  • lowcode-platform-backend: http://localhost:3003"
    echo "  • amis-lowcode-backend: http://localhost:9522"
    echo "  • API Documentation: http://localhost:3003/api-docs"
    echo "  • Amis API Documentation: http://localhost:9522/api/v1/docs"
    echo ""
    echo -e "${YELLOW}🚀 Next Steps:${NC}"
    echo "  1. Start the frontend: cd frontend && npm run dev"
    echo "  2. Open frontend: http://localhost:5173"
    echo "  3. Test system: ./test-system.sh"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "  • Development Requirements: .qodo/07-低代码平台开发需求.md"
    echo "  • Task Planning: .qodo/08-开发任务分解计划.md"
    echo "  • Testing Guide: .qodo/09-测试验证方案.md"
    echo ""
    echo -e "${GREEN}✨ Happy coding!${NC}"
}

# 主函数
main() {
    echo -e "${CYAN}"
    echo "┌─────────────────────────────────────────┐"
    echo "│     Low-Code Platform Setup Script     │"
    echo "│           Quick Start Guide            │"
    echo "└─────────────────────────────────────────┘"
    echo -e "${NC}"
    echo ""
    
    check_prerequisites
    check_env_files
    start_database
    install_dependencies
    init_database
    start_services
    verify_system
    show_final_info
}

# 处理命令行参数
case "${1:-}" in
    --help|-h)
        echo "Low-Code Platform Setup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --db-only      Only setup database"
        echo "  --no-verify    Skip system verification"
        echo "  --clean        Clean and restart everything"
        echo ""
        echo "This script will:"
        echo "  1. Check prerequisites"
        echo "  2. Setup environment files"
        echo "  3. Start PostgreSQL database"
        echo "  4. Install dependencies"
        echo "  5. Initialize database with seed data"
        echo "  6. Start backend services"
        echo "  7. Verify system is working"
        exit 0
        ;;
    --db-only)
        log_step "Setting up database only..."
        check_prerequisites
        check_env_files
        start_database
        init_database
        log_success "Database setup complete"
        exit 0
        ;;
    --clean)
        log_step "Cleaning and restarting everything..."
        docker-compose down 2>/dev/null || true
        docker stop lowcode-postgres 2>/dev/null || true
        docker rm lowcode-postgres 2>/dev/null || true
        pkill -f "nest start" 2>/dev/null || true
        main
        ;;
    --no-verify)
        check_prerequisites
        check_env_files
        start_database
        install_dependencies
        init_database
        start_services
        show_final_info
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac