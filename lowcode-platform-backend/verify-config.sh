#!/bin/bash

# 低代码平台配置验证脚本
# Low-code Platform Configuration Verification Script

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

# 检查文件是否存在
check_files() {
    print_section "检查配置文件"
    
    local files=(
        ".env:环境配置文件"
        "docker-compose.yml:Docker编排文件"
        "database/init/01-init-database.sql:数据库初始化脚本"
        "redis/redis.conf:Redis配置文件"
        "start-services.sh:服务启动脚本"
    )
    
    for file_info in "${files[@]}"; do
        IFS=':' read -r file desc <<< "$file_info"
        if [ -f "$file" ]; then
            print_success "$desc 存在"
        else
            print_error "$desc 不存在: $file"
        fi
    done
}

# 检查环境变量配置
check_env_config() {
    print_section "检查环境变量配置"
    
    if [ ! -f ".env" ]; then
        print_error ".env文件不存在"
        return 1
    fi
    
    # 检查关键配置项
    local required_vars=(
        "DATABASE_URL"
        "PORT"
        "JWT_SECRET"
        "REDIS_HOST"
        "REDIS_PORT"
        "REDIS_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            local value=$(grep "^${var}=" .env | cut -d'=' -f2- | tr -d '"')
            if [ -n "$value" ]; then
                print_success "$var 已配置"
            else
                print_warning "$var 配置为空"
            fi
        else
            print_error "$var 未配置"
        fi
    done
    
    # 检查数据库URL格式
    if grep -q "postgresql://soybean:soybean@123.@localhost:25432/lowcode_platform" .env; then
        print_success "数据库连接字符串格式正确"
    else
        print_warning "数据库连接字符串可能不正确"
    fi
    
    # 检查Redis配置
    if grep -q "REDIS_PORT=26379" .env; then
        print_success "Redis端口配置正确 (26379 - 共用主系统)"
    else
        print_warning "Redis端口配置可能不正确"
    fi

    # 检查Redis密码
    if grep -q "REDIS_PASSWORD=\"123456\"" .env; then
        print_success "Redis密码配置正确 (与主系统一致)"
    else
        print_warning "Redis密码配置可能不正确"
    fi
}

# 检查Docker配置
check_docker_config() {
    print_section "检查Docker配置"
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml文件不存在"
        return 1
    fi
    
    # 检查端口映射
    if grep -q "25433:5432" docker-compose.yml; then
        print_success "PostgreSQL端口映射正确 (25433:5432)"
    else
        print_warning "PostgreSQL端口映射可能不正确"
    fi
    
    # 检查是否移除了独立Redis服务
    if grep -q "lowcode-redis:" docker-compose.yml; then
        print_warning "发现独立Redis服务配置，应该已移除（共用主系统Redis）"
    else
        print_success "已正确移除独立Redis服务（共用主系统Redis）"
    fi
    
    if grep -q "3000:3000" docker-compose.yml; then
        print_success "Backend端口映射正确 (3000:3000)"
    else
        print_warning "Backend端口映射可能不正确"
    fi
    
    # 检查数据库配置
    if grep -q "POSTGRES_USER: soybean" docker-compose.yml; then
        print_success "数据库用户名配置正确"
    else
        print_warning "数据库用户名配置可能不正确"
    fi
    
    if grep -q "POSTGRES_PASSWORD: 'soybean@123.'" docker-compose.yml; then
        print_success "数据库密码配置正确"
    else
        print_warning "数据库密码配置可能不正确"
    fi
    
    if grep -q "POSTGRES_DB: lowcode_platform" docker-compose.yml; then
        print_success "数据库名称配置正确"
    else
        print_warning "数据库名称配置可能不正确"
    fi
}

# 检查端口占用
check_ports() {
    print_section "检查端口占用情况"

    local ports=(25433 3000)
    local port_names=("PostgreSQL" "Backend API")
    local port_status=()

    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}

        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "端口 $port ($name) 已被占用"
            port_status+=("occupied")
        else
            print_success "端口 $port ($name) 可用"
            port_status+=("available")
        fi
    done

    # 检查主系统Redis端口
    print_info "检查主系统Redis端口 (26379)..."
    if lsof -Pi :26379 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "主系统Redis服务正在运行 (端口26379)"
        # 测试连接
        if redis-cli -h localhost -p 26379 -a "123456" ping >/dev/null 2>&1; then
            print_success "Redis连接测试成功"
        else
            print_warning "Redis端口开放但连接失败，请检查密码配置"
        fi
    else
        print_warning "主系统Redis服务未运行，请先启动主系统"
    fi

    # 统计结果
    local available_count=0
    for status in "${port_status[@]}"; do
        if [ "$status" = "available" ]; then
            ((available_count++))
        fi
    done

    if [ $available_count -eq 2 ]; then
        print_success "所有必需端口都可用"
    elif [ $available_count -eq 0 ]; then
        print_error "所有端口都被占用"
    else
        print_warning "部分端口被占用，可能需要停止相关服务"
    fi
}

# 检查Docker环境
check_docker_env() {
    print_section "检查Docker环境"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        return 1
    else
        print_success "Docker已安装"
        docker --version
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装"
        return 1
    else
        print_success "Docker Compose已安装"
        docker-compose --version
    fi
    
    # 检查Docker服务状态
    if docker info >/dev/null 2>&1; then
        print_success "Docker服务正在运行"
    else
        print_error "Docker服务未运行"
        return 1
    fi
}

# 检查与主系统的一致性
check_consistency() {
    print_section "检查与主系统的一致性"
    
    local backend_env="../backend/.env"
    local backend_docker="../docker-compose.yml"
    
    if [ -f "$backend_env" ]; then
        print_info "检查与主系统backend的配置一致性..."
        
        # 检查数据库用户名
        if grep -q "soybean" "$backend_env" 2>/dev/null; then
            print_success "数据库用户名与主系统一致"
        else
            print_warning "无法验证数据库用户名一致性"
        fi
    else
        print_warning "未找到主系统backend的.env文件"
    fi
    
    if [ -f "$backend_docker" ]; then
        print_info "检查与主系统Docker配置的一致性..."
        
        # 检查数据库密码
        if grep -q "soybean@123." "$backend_docker" 2>/dev/null; then
            print_success "数据库密码与主系统一致"
        else
            print_warning "无法验证数据库密码一致性"
        fi
    else
        print_warning "未找到主系统的docker-compose.yml文件"
    fi
}

# 生成配置摘要
generate_summary() {
    print_section "配置摘要"
    
    echo -e "${CYAN}数据库配置：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 25432"
    echo -e "  数据库: lowcode_platform"
    echo -e "  用户: soybean"
    echo -e "  密码: soybean@123."
    echo -e ""
    
    echo -e "${CYAN}Redis配置（共用主系统）：${NC}"
    echo -e "  主机: localhost"
    echo -e "  端口: 26379"
    echo -e "  密码: 123456"
    echo -e "  数据库: 6"
    echo -e ""
    
    echo -e "${CYAN}后端服务：${NC}"
    echo -e "  端口: 3000"
    echo -e "  API文档: http://localhost:3000/api-docs"
    echo -e "  健康检查: http://localhost:3000/health"
    echo -e ""
    
    echo -e "${CYAN}启动命令：${NC}"
    echo -e "  ./start-services.sh start"
    echo -e ""
}

# 提供修复建议
provide_suggestions() {
    print_section "修复建议"
    
    echo -e "${YELLOW}如果发现配置问题，请按以下步骤修复：${NC}"
    echo -e ""
    echo -e "1. 检查.env文件配置："
    echo -e "   - 确保DATABASE_URL正确"
    echo -e "   - 确保Redis配置正确"
    echo -e ""
    echo -e "2. 检查docker-compose.yml文件："
    echo -e "   - 确保端口映射正确"
    echo -e "   - 确保环境变量正确"
    echo -e ""
    echo -e "3. 如果端口被占用："
    echo -e "   - 停止占用端口的服务"
    echo -e "   - 或修改端口映射"
    echo -e ""
    echo -e "4. 启动服务："
    echo -e "   ./start-services.sh start"
    echo -e ""
}

# 主函数
main() {
    print_header "低代码平台配置验证"
    
    check_files
    check_env_config
    check_docker_config
    check_ports
    check_docker_env
    check_consistency
    generate_summary
    provide_suggestions
    
    print_header "验证完成"
}

# 执行主函数
main "$@"
