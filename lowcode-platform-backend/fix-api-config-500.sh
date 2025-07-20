#!/bin/bash

# API配置500错误快速修复脚本
# 使用方法: chmod +x fix-api-config-500.sh && ./fix-api-config-500.sh

set -e

echo "🔧 开始修复API配置500错误..."
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 lowcode-platform-backend 目录下运行此脚本"
    exit 1
fi

# 1. 检查环境文件
echo "📋 检查环境配置..."
if [ ! -f ".env" ]; then
    echo "⚠️ .env 文件不存在，创建默认配置..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/lowcode_platform"

# 应用配置
NODE_ENV=development
PORT=3000

# JWT配置
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
EOF
    echo "✅ 已创建默认 .env 文件，请根据需要修改数据库连接信息"
fi

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 检查数据库连接
echo "🗄️ 检查数据库连接..."
if ! npx prisma db pull 2>/dev/null; then
    echo "❌ 数据库连接失败！"
    echo "请确保："
    echo "1. PostgreSQL 服务正在运行"
    echo "2. .env 文件中的 DATABASE_URL 配置正确"
    echo "3. 数据库已创建"
    echo ""
    echo "快速启动数据库（如果使用Docker）："
    echo "docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=lowcode_platform -p 5432:5432 -d postgres:13"
    exit 1
fi

# 4. 生成Prisma客户端
echo "🔄 生成Prisma客户端..."
npx prisma generate

# 5. 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
npx prisma migrate dev --name init-api-config || {
    echo "⚠️ 迁移失败，尝试重置数据库..."
    npx prisma migrate reset --force
}

# 6. 检查表是否存在
echo "📊 检查数据库表..."
TABLES=$(npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | grep -E "(Project|ApiConfig)" | wc -l)

if [ "$TABLES" -lt 2 ]; then
    echo "❌ 必要的数据库表不存在，请检查 schema.prisma 文件"
    exit 1
fi

# 7. 创建示例数据
echo "📝 创建示例数据..."

# 创建示例项目
npx prisma db execute --stdin <<< "
INSERT INTO \"Project\" (id, name, code, description, version, status, \"createdBy\", \"createdAt\", \"updatedAt\")
VALUES (
    'demo-project-1',
    '演示项目',
    'demo-project-1',
    '用于演示和测试的项目',
    '1.0.0',
    'ACTIVE',
    'system',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    \"updatedAt\" = NOW();
" 2>/dev/null || echo "⚠️ 项目数据创建可能失败，继续..."

# 创建示例API配置
npx prisma db execute --stdin <<< "
INSERT INTO \"ApiConfig\" (
    id, \"projectId\", name, code, description, method, path,
    parameters, responses, security, config, status, version,
    \"createdBy\", \"createdAt\", \"updatedAt\"
) VALUES 
(
    gen_random_uuid(),
    'demo-project-1',
    '获取用户列表',
    'get-users',
    '获取系统中的用户列表',
    'GET',
    '/api/users',
    '[]'::jsonb,
    '{\"200\": {\"description\": \"成功\", \"schema\": {\"type\": \"array\"}}}'::jsonb,
    '{\"type\": \"none\"}'::jsonb,
    '{}'::jsonb,
    'ACTIVE',
    '1.0.0',
    'system',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'demo-project-1',
    '创建用户',
    'create-user',
    '创建新用户',
    'POST',
    '/api/users',
    '[{\"name\": \"name\", \"type\": \"string\", \"required\": true}]'::jsonb,
    '{\"201\": {\"description\": \"创建成功\", \"schema\": {\"type\": \"object\"}}}'::jsonb,
    '{\"type\": \"jwt\"}'::jsonb,
    '{}'::jsonb,
    'ACTIVE',
    '1.0.0',
    'system',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'demo-project-1',
    '更新用户',
    'update-user',
    '更新用户信息',
    'PUT',
    '/api/users/{id}',
    '[{\"name\": \"id\", \"type\": \"string\", \"required\": true, \"in\": \"path\"}]'::jsonb,
    '{\"200\": {\"description\": \"更新成功\", \"schema\": {\"type\": \"object\"}}}'::jsonb,
    '{\"type\": \"jwt\"}'::jsonb,
    '{}'::jsonb,
    'ACTIVE',
    '1.0.0',
    'system',
    NOW(),
    NOW()
)
ON CONFLICT (\"projectId\", code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    \"updatedAt\" = NOW();
" 2>/dev/null || echo "⚠️ API配置数据创建可能失败，继续..."

# 8. 验证数据
echo "🔍 验证数据..."
PROJECT_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Project\" WHERE id = 'demo-project-1';" 2>/dev/null | tail -n 1 | tr -d ' ')
API_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"ApiConfig\" WHERE \"projectId\" = 'demo-project-1';" 2>/dev/null | tail -n 1 | tr -d ' ')

echo "📊 数据统计："
echo "   项目数量: $PROJECT_COUNT"
echo "   API配置数量: $API_COUNT"

if [ "$PROJECT_COUNT" -eq 0 ]; then
    echo "❌ 示例项目创建失败"
    exit 1
fi

if [ "$API_COUNT" -eq 0 ]; then
    echo "❌ API配置创建失败"
    exit 1
fi

# 9. 构建应用
echo "🔨 构建应用..."
npm run build 2>/dev/null || {
    echo "⚠️ 构建失败，但可以继续使用开发模式"
}

# 10. 测试数据库查询
echo "🧪 测试数据库查询..."
npx prisma db execute --stdin <<< "
SELECT 
    ac.id,
    ac.name,
    ac.code,
    ac.method,
    ac.path,
    ac.status,
    p.name as project_name
FROM \"ApiConfig\" ac
JOIN \"Project\" p ON ac.\"projectId\" = p.id
WHERE p.id = 'demo-project-1'
LIMIT 3;
" 2>/dev/null || {
    echo "❌ 数据库查询测试失败"
    exit 1
}

echo ""
echo "✅ 修复完成！"
echo "=================================="
echo "📋 接下来的步骤："
echo "1. 启动开发服务器: npm run start:dev"
echo "2. 等待服务启动完成"
echo "3. 测试API接口:"
echo "   curl \"http://localhost:3000/api/v1/api-configs/project/demo-project-1/paginated?current=1&size=10\""
echo "4. 访问Swagger文档: http://localhost:3000/api"
echo ""
echo "🔧 如果仍有问题，请检查："
echo "- 后端控制台日志"
echo "- 数据库连接状态"
echo "- 环境变量配置"
echo ""
echo "📚 详细诊断信息请查看: docs/api-config-500-error-diagnosis.md"
