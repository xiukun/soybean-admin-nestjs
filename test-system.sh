#!/bin/bash

# 低代码平台系统测试脚本
# 用于验证系统各个组件是否正常运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 检查服务是否运行
check_service() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    
    log_info "Testing $service_name (port $port)..."
    
    if curl -s --max-time 10 "http://localhost:$port$endpoint" > /dev/null; then
        log_success "$service_name is running ✅"
        return 0
    else
        log_error "$service_name is not responding ❌"
        return 1
    fi
}

# 测试API端点
test_api() {
    local description="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    
    echo -n "  Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:$url")
    else
        response=$(curl -s -w "%{http_code}" -o /dev/null -X "$method" "http://localhost:$url")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response, expected $expected_status)${NC}"
        return 1
    fi
}

# 测试JSON响应
test_json_api() {
    local description="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "  Testing $description... "
    
    response=$(curl -s "http://localhost:$url")
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS (HTTP 200)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Invalid JSON or missing field)${NC}"
        return 1
    fi
}

# 主测试函数
main() {
    echo -e "${BLUE}🚀 Testing Low-Code Platform System...${NC}"
    echo ""
    
    local total_tests=0
    local passed_tests=0
    
    # 1. 测试 lowcode-platform-backend (端口 3003)
    echo "1. Testing lowcode-platform-backend (port 3003)..."
    echo "=================================================="
    
    if check_service "lowcode-platform-backend" "3003" "/"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_api "Projects List" "GET" "3003/api/v1/projects/paginated?current=1&size=5" "200"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_api "API Documentation" "GET" "3003/api-docs" "200"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    
    # 2. 测试 amis-lowcode-backend (端口 9522)
    echo "2. Testing amis-lowcode-backend (port 9522)..."
    echo "=============================================="
    
    if test_json_api "Health Check" "9522/api/v1/health" "status"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_json_api "API Info" "9522/api/v1" "name"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_api "Users List" "GET" "9522/api/v1/users?page=1&pageSize=5" "200"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_api "Roles List" "GET" "9522/api/v1/roles?page=1&pageSize=5" "200"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    
    # 3. 测试数据库连接 (如果可用)
    echo "3. Testing database connectivity..."
    echo "=================================="
    
    if command -v psql > /dev/null; then
        if PGPASSWORD='soybean@123.' psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend -c "SELECT 1;" > /dev/null 2>&1; then
            log_success "Database connection successful ✅"
            ((passed_tests++))
        else
            log_error "Database connection failed ❌"
        fi
        ((total_tests++))
    else
        log_warning "psql not available, skipping database test"
    fi
    
    echo ""
    
    # 4. 系统状态总结
    echo "4. System Status Summary..."
    echo "=========================="
    
    # 检查端口状态
    check_port() {
        local port="$1"
        local service="$2"
        
        if netstat -tuln | grep ":$port " > /dev/null 2>&1 || ss -tuln | grep ":$port " > /dev/null 2>&1; then
            log_success "$service: ✅ Running on port $port"
        else
            log_error "$service: ❌ Not running on port $port"
        fi
    }
    
    check_port "3003" "lowcode-platform-backend"
    check_port "9522" "amis-lowcode-backend"
    check_port "25432" "PostgreSQL Database"
    
    echo ""
    
    # 总结
    echo "📊 Test Results Summary:"
    echo "========================"
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $((total_tests - passed_tests))"
    
    if [ $passed_tests -eq $total_tests ]; then
        log_success "🎉 All tests passed! System is ready to use."
        echo ""
        echo "🌐 Access URLs:"
        echo "  • Frontend: http://localhost:5173"
        echo "  • Lowcode Platform Backend: http://localhost:3003"
        echo "  • Amis Dynamic Backend: http://localhost:9522"
        echo "  • API Documentation: http://localhost:3003/api-docs"
        echo "  • Amis API Documentation: http://localhost:9522/api/v1/docs"
        return 0
    else
        log_error "❌ Some tests failed. Please check the services."
        echo ""
        echo "🔧 Troubleshooting:"
        echo "  1. Make sure all services are started:"
        echo "     cd lowcode-platform-backend && npm run start:dev"
        echo "     cd amis-lowcode-backend && npm run start:dev"
        echo "  2. Check if PostgreSQL is running:"
        echo "     docker-compose up -d postgres"
        echo "  3. Verify environment variables are set correctly"
        return 1
    fi
}

# 帮助信息
show_help() {
    echo "Low-Code Platform System Test Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -q, --quick    Quick test (skip database tests)"
    echo ""
    echo "Examples:"
    echo "  $0                # Run full system test"
    echo "  $0 --quick       # Run quick test"
    echo "  $0 --verbose     # Run with verbose output"
}

# 处理命令行参数
VERBOSE=false
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quick)
            QUICK=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl > /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq > /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        echo ""
        echo "On Ubuntu/Debian: sudo apt-get install ${missing_deps[*]}"
        echo "On macOS: brew install ${missing_deps[*]}"
        exit 1
    fi
}

# 执行主程序
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    check_dependencies
    main "$@"
fi