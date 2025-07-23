#!/bin/bash

# 设置测试数据脚本
# 用于创建API配置测试所需的数据

set -e

echo "🚀 开始设置API配置测试数据..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在lowcode-platform-backend目录下运行此脚本"
    exit 1
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ 数据库连接失败，请确保数据库正在运行"
    echo "   运行命令: docker-compose up -d postgres"
    exit 1
fi

echo "✅ 数据库连接正常"

# 运行数据库迁移（如果需要）
echo "📊 检查数据库结构..."
npx prisma db push --skip-generate > /dev/null 2>&1 || {
    echo "⚠️ 数据库结构更新可能失败，但继续执行..."
}

# 编译TypeScript脚本
echo "🔨 编译TypeScript脚本..."
npx tsc scripts/create-test-api-config.ts --outDir scripts/dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck || {
    echo "❌ TypeScript编译失败"
    exit 1
}

# 运行测试数据创建脚本
echo "📝 创建测试数据..."
node scripts/dist/create-test-api-config.js || {
    echo "❌ 测试数据创建失败"
    exit 1
}

# 验证API配置是否创建成功
echo "🔍 验证API配置..."
API_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"ApiConfig\" WHERE id = 'api-user-list';" 2>/dev/null | tail -n 1 | tr -d ' ')

if [ "$API_COUNT" -eq 1 ]; then
    echo "✅ API配置验证成功"
else
    echo "❌ API配置验证失败"
    exit 1
fi

# 显示测试信息
echo ""
echo "🎉 测试数据设置完成！"
echo ""
echo "📋 测试信息:"
echo "   API配置ID: api-user-list"
echo "   测试URL: http://localhost:9527/proxy-lowcodeService/api-configs/api-user-list/test"
echo "   方法: POST"
echo "   需要认证: Bearer Token"
echo ""
echo "🧪 测试命令示例:"
echo "curl -X POST \\"
echo "  http://localhost:9527/proxy-lowcodeService/api-configs/api-user-list/test \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"parameters\": {\"page\": 1, \"limit\": 10}}'"
echo ""
echo "💡 提示: 请确保低代码平台后端服务正在运行 (npm run start:dev)"

# 清理编译文件
rm -rf scripts/dist

echo "✨ 设置完成！"
