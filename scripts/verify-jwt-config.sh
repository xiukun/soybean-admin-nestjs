#!/bin/bash

# JWT配置验证脚本
# 检查所有服务的JWT密钥是否一致

set -e

echo "🔐 JWT配置一致性验证"
echo "=================================="

# 定义标准JWT密钥
STANDARD_JWT_SECRET="JWT_SECRET-soybean-admin-nest!@#123."
STANDARD_REFRESH_SECRET="REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123."

# 检查函数
check_jwt_config() {
    local file_path="$1"
    local service_name="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "⚠️  $service_name: 配置文件不存在 ($file_path)"
        return 1
    fi
    
    local jwt_secret=$(grep "JWT_SECRET" "$file_path" | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    
    if [ "$jwt_secret" = "$STANDARD_JWT_SECRET" ]; then
        echo "✅ $service_name: JWT密钥配置正确"
        return 0
    else
        echo "❌ $service_name: JWT密钥不匹配"
        echo "   期望: $STANDARD_JWT_SECRET"
        echo "   实际: $jwt_secret"
        return 1
    fi
}

# 检查各个服务的配置
echo "检查各服务JWT配置..."
echo ""

# 1. 主后端 (通过代码检查)
echo "📋 检查主后端 (backend)..."
if grep -q "$STANDARD_JWT_SECRET" backend/libs/config/src/security.config.ts; then
    echo "✅ Backend: JWT密钥配置正确"
else
    echo "❌ Backend: JWT密钥配置不正确"
fi

# 2. 低代码平台后端
echo "📋 检查低代码平台后端..."
check_jwt_config "lowcode-platform-backend/.env" "Lowcode Platform"

# 3. Amis后端
echo "📋 检查Amis后端..."
check_jwt_config "amis-lowcode-backend/.env" "Amis Backend"

# 4. Docker Compose配置
echo "📋 检查Docker Compose配置..."
if grep -q "$STANDARD_JWT_SECRET" docker-compose.yml; then
    echo "✅ Docker Compose: JWT密钥配置正确"
else
    echo "❌ Docker Compose: JWT密钥配置不正确"
fi

echo ""
echo "🔍 检查示例配置文件..."

# 检查示例文件
check_jwt_config "lowcode-platform-backend/.env.example" "Lowcode Platform Example"
check_jwt_config "amis-lowcode-backend/.env.example" "Amis Backend Example"

echo ""
echo "📊 验证完成！"
echo "=================================="

# 提供修复建议
echo ""
echo "💡 如果发现不一致的配置，请运行以下命令修复："
echo "   1. 停止所有容器: docker-compose -p soybean-admin-nest down"
echo "   2. 重新构建服务: docker-compose -p soybean-admin-nest build --no-cache"
echo "   3. 重新启动服务: docker-compose -p soybean-admin-nest up -d"
