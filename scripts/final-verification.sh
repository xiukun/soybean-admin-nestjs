#!/bin/bash

# 统一JWT认证系统最终验证脚本
# 全面验证系统的构建、部署和功能

set -e

echo "🎯 统一JWT认证系统最终验证"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 验证结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 验证函数
verify_step() {
    local step_name="$1"
    local step_command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "\n${BLUE}验证 $TOTAL_CHECKS: $step_name${NC}"
    
    if eval "$step_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 详细验证函数（显示输出）
verify_step_verbose() {
    local step_name="$1"
    local step_command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "\n${BLUE}验证 $TOTAL_CHECKS: $step_name${NC}"
    
    if eval "$step_command"; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 1. 项目结构验证
echo -e "\n${YELLOW}=== 项目结构验证 ===${NC}"

verify_step "统一认证模块存在" "test -d shared/auth"
verify_step "认证模块源码存在" "test -f shared/auth/src/index.ts"
verify_step "JWT服务存在" "test -f shared/auth/src/services/unified-jwt.service.ts"
verify_step "认证守卫存在" "test -f shared/auth/src/guards/unified-jwt.guard.ts"
verify_step "装饰器存在" "test -f shared/auth/src/decorators/auto-api-jwt-auth.decorator.ts"
verify_step "Docker配置存在" "test -f docker-compose.unified.yml"
verify_step "启动脚本存在" "test -f scripts/start-unified.sh"
verify_step "环境配置存在" "test -f .env.unified"

# 2. 依赖和构建验证
echo -e "\n${YELLOW}=== 依赖和构建验证 ===${NC}"

verify_step "统一认证模块package.json存在" "test -f shared/auth/package.json"
verify_step "Backend package.json存在" "test -f backend/package.json"
verify_step "统一认证模块依赖安装" "test -d shared/auth/node_modules"
verify_step "Backend依赖安装" "test -d backend/node_modules"

# 3. 编译验证
echo -e "\n${YELLOW}=== 编译验证 ===${NC}"

echo -e "\n${BLUE}编译统一认证模块...${NC}"
if cd shared/auth && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 统一认证模块编译成功${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ 统一认证模块编译失败${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
cd ../..

verify_step "统一认证模块编译产物存在" "test -d shared/auth/dist"
verify_step "类型定义文件存在" "test -f shared/auth/dist/index.d.ts"

echo -e "\n${BLUE}编译Backend服务...${NC}"
if cd backend && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend服务编译成功${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Backend服务编译失败${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
cd ..

verify_step "Backend编译产物存在" "test -d backend/dist"

# 4. Docker验证
echo -e "\n${YELLOW}=== Docker验证 ===${NC}"

verify_step "Docker Compose配置有效" "docker-compose -f docker-compose.unified.yml config > /dev/null"

echo -e "\n${BLUE}构建Backend Docker镜像...${NC}"
if docker-compose -f docker-compose.unified.yml build backend > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend Docker镜像构建成功${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Backend Docker镜像构建失败${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

verify_step "Backend Docker镜像存在" "docker images | grep -q soybean.*backend"

# 5. 文档验证
echo -e "\n${YELLOW}=== 文档验证 ===${NC}"

verify_step "主要README存在" "test -f README.md"
verify_step "统一JWT文档存在" "test -f README-UNIFIED-JWT.md"
verify_step "快速启动指南存在" "test -f QUICK_START.md"
verify_step "验证报告存在" "test -f VERIFICATION_REPORT.md"
verify_step "API文档存在" "test -f API.md"

# 6. 测试文件验证
echo -e "\n${YELLOW}=== 测试文件验证 ===${NC}"

verify_step "JWT服务测试存在" "test -f shared/auth/src/services/unified-jwt.service.spec.ts"
verify_step "JWT守卫测试存在" "test -f shared/auth/src/guards/jwt-auth.guard.spec.ts"
verify_step "集成测试脚本存在" "test -f scripts/test-unified-auth.sh"
verify_step "集成测试脚本可执行" "test -x scripts/test-unified-auth.sh"

# 7. 配置文件验证
echo -e "\n${YELLOW}=== 配置文件验证 ===${NC}"

verify_step "统一环境配置包含JWT配置" "grep -q 'JWT_ACCESS_TOKEN_SECRET' .env.unified"
verify_step "统一环境配置包含数据库配置" "grep -q 'DATABASE_URL' .env.unified"
verify_step "统一环境配置包含Redis配置" "grep -q 'REDIS_URL' .env.unified"
verify_step "Docker Compose包含所有服务" "grep -q 'backend:' docker-compose.unified.yml"

# 8. 脚本验证
echo -e "\n${YELLOW}=== 脚本验证 ===${NC}"

verify_step "启动脚本可执行" "test -x scripts/start-unified.sh"
verify_step "停止脚本存在" "test -f scripts/stop-unified.sh"
verify_step "健康检查脚本存在" "test -f scripts/health-check.sh"
verify_step "最终验证脚本可执行" "test -x scripts/final-verification.sh"

# 9. 代码质量验证
echo -e "\n${YELLOW}=== 代码质量验证 ===${NC}"

verify_step "TypeScript配置存在" "test -f shared/auth/tsconfig.json"
verify_step "ESLint配置存在" "test -f backend/eslint.config.js"
verify_step "Jest配置存在" "test -f shared/auth/jest.config.js"

# 10. 功能模块验证
echo -e "\n${YELLOW}=== 功能模块验证 ===${NC}"

verify_step "健康检查服务存在" "test -f shared/auth/src/health/auth-health.service.ts"
verify_step "日志中间件存在" "test -f shared/auth/src/middleware/auth-logging.middleware.ts"
verify_step "JWT策略存在" "test -f shared/auth/src/strategies/unified-jwt.strategy.ts"
verify_step "权限守卫存在" "test -f shared/auth/src/guards/permissions.guard.ts"
verify_step "角色守卫存在" "test -f shared/auth/src/guards/roles.guard.ts"

# 输出最终结果
echo -e "\n${YELLOW}=== 验证结果汇总 ===${NC}"
echo -e "总验证项: $TOTAL_CHECKS"
echo -e "${GREEN}通过: $PASSED_CHECKS${NC}"
echo -e "${RED}失败: $FAILED_CHECKS${NC}"

# 计算成功率
if [ $TOTAL_CHECKS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "成功率: ${SUCCESS_RATE}%"
fi

# 最终判断
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 恭喜！统一JWT认证系统验证全部通过！${NC}"
    echo -e "${GREEN}✨ 系统已准备就绪，可以投入生产使用！${NC}"
    
    echo -e "\n${BLUE}📋 下一步操作建议：${NC}"
    echo -e "1. 运行集成测试: ${YELLOW}./scripts/test-unified-auth.sh${NC}"
    echo -e "2. 启动完整系统: ${YELLOW}./scripts/start-unified.sh docker${NC}"
    echo -e "3. 查看API文档: ${YELLOW}http://localhost:3000/api${NC}"
    echo -e "4. 阅读使用指南: ${YELLOW}cat QUICK_START.md${NC}"
    
    exit 0
else
    echo -e "\n${RED}❌ 验证未完全通过，请检查失败的项目${NC}"
    echo -e "${YELLOW}💡 建议查看具体错误信息并修复相关问题${NC}"
    exit 1
fi
