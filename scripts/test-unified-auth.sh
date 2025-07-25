#!/bin/bash

# 统一JWT认证系统集成测试脚本
# 用于验证所有认证功能是否正常工作

set -e

echo "🧪 统一JWT认证系统集成测试"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试配置
BACKEND_URL="http://localhost:3000"
LOWCODE_URL="http://localhost:3001"
AMIS_URL="http://localhost:3002"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}测试 $TOTAL_TESTS: $test_name${NC}"
    
    if eval "$test_command"; then
        if [ "$?" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ 通过${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ 失败 - 状态码不匹配${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ 失败 - 命令执行错误${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 检查服务是否运行
check_service() {
    local service_name="$1"
    local service_url="$2"
    
    echo -e "\n${YELLOW}检查服务: $service_name${NC}"
    
    if curl -s -f "$service_url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name 服务运行正常${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name 服务未运行或不可访问${NC}"
        return 1
    fi
}

# 测试JWT token生成
test_jwt_generation() {
    echo -e "\n${BLUE}🔑 测试JWT Token生成${NC}"
    
    # 测试登录接口
    local login_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "admin123"
        }' 2>/dev/null)
    
    if echo "$login_response" | grep -q "token"; then
        echo -e "${GREEN}✅ JWT Token生成成功${NC}"
        # 提取token用于后续测试
        export TEST_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        return 0
    else
        echo -e "${RED}❌ JWT Token生成失败${NC}"
        echo "响应: $login_response"
        return 1
    fi
}

# 测试受保护的接口
test_protected_endpoint() {
    echo -e "\n${BLUE}🛡️ 测试受保护接口${NC}"
    
    if [ -z "$TEST_TOKEN" ]; then
        echo -e "${RED}❌ 没有可用的测试token${NC}"
        return 1
    fi
    
    local response=$(curl -s -w "%{http_code}" -X GET "$BACKEND_URL/api/users/profile" \
        -H "Authorization: Bearer $TEST_TOKEN" 2>/dev/null)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 受保护接口访问成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 受保护接口访问失败 (HTTP $http_code)${NC}"
        return 1
    fi
}

# 测试无token访问受保护接口
test_unauthorized_access() {
    echo -e "\n${BLUE}🚫 测试未授权访问${NC}"
    
    local response=$(curl -s -w "%{http_code}" -X GET "$BACKEND_URL/api/users/profile" 2>/dev/null)
    local http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        echo -e "${GREEN}✅ 未授权访问正确拒绝${NC}"
        return 0
    else
        echo -e "${RED}❌ 未授权访问处理异常 (HTTP $http_code)${NC}"
        return 1
    fi
}

# 测试公开接口
test_public_endpoint() {
    echo -e "\n${BLUE}🌐 测试公开接口${NC}"
    
    local response=$(curl -s -w "%{http_code}" -X GET "$BACKEND_URL/api/auth/public" 2>/dev/null)
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        echo -e "${GREEN}✅ 公开接口访问正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 公开接口访问异常 (HTTP $http_code)${NC}"
        return 1
    fi
}

# 测试Swagger文档访问
test_swagger_access() {
    echo -e "\n${BLUE}📖 测试Swagger文档访问${NC}"
    
    local response=$(curl -s -w "%{http_code}" -X GET "$BACKEND_URL/api" 2>/dev/null)
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Swagger文档访问成功${NC}"
        return 0
    else
        echo -e "${RED}❌ Swagger文档访问失败 (HTTP $http_code)${NC}"
        return 1
    fi
}

# 主测试流程
main() {
    echo -e "${YELLOW}开始统一JWT认证系统集成测试...${NC}"
    
    # 检查服务状态
    echo -e "\n${YELLOW}=== 服务状态检查 ===${NC}"
    check_service "Backend" "$BACKEND_URL" || {
        echo -e "${RED}Backend服务未运行，请先启动服务${NC}"
        echo "运行: cd backend && npm run start:dev"
        exit 1
    }
    
    # 执行认证功能测试
    echo -e "\n${YELLOW}=== JWT认证功能测试 ===${NC}"
    
    # 测试JWT生成
    if test_jwt_generation; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 测试受保护接口
    if test_protected_endpoint; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 测试未授权访问
    if test_unauthorized_access; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 测试公开接口
    if test_public_endpoint; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 测试Swagger文档
    if test_swagger_access; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 输出测试结果
    echo -e "\n${YELLOW}=== 测试结果汇总 ===${NC}"
    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有测试通过！统一JWT认证系统工作正常！${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ 有测试失败，请检查系统配置${NC}"
        exit 1
    fi
}

# 运行主函数
main "$@"
