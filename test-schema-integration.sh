#!/bin/bash

# 测试Prisma Schema重构后的数据库集成
# 验证所有服务的表能够正确创建且无冲突

set -e

echo "🔧 测试Prisma Schema重构后的数据库集成..."

# 数据库连接配置
DB_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"

echo "📊 重置数据库..."
cd backend
DATABASE_URL="$DB_URL" npx prisma db push --force-reset --skip-generate
echo "✅ Backend服务表创建完成"

echo "📊 检查Backend服务表..."
cd ..
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dt public.*" | grep -E "(sys_|casbin_rule)"

echo "📊 添加Lowcode Platform服务表..."
cd lowcode-platform-backend
DATABASE_URL="$DB_URL" npx prisma db push --skip-generate
echo "✅ Lowcode Platform服务表创建完成"

echo "📊 检查Lowcode Platform服务表..."
cd ..
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dt public.*" | grep "lowcode_"

echo "📊 添加AMIS服务表..."
cd amis-lowcode-backend
DATABASE_URL="$DB_URL" npx prisma db push --skip-generate
echo "✅ AMIS服务表创建完成"

echo "📊 检查AMIS服务表..."
cd ..
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dt amis.*"

echo "📊 最终数据库表统计..."
echo "=== PUBLIC SCHEMA ==="
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dt public.*"
echo ""
echo "=== AMIS SCHEMA ==="
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dt amis.*"

echo "📊 检查枚举类型..."
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "\dT"

echo "🎉 数据库集成测试完成！"
