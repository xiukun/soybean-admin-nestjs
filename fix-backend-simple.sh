#!/bin/bash

# 简化的Backend修复脚本

echo "🔧 修复Backend服务启动问题"
echo "=========================="

# 1. 确保Docker服务运行
echo "1. 检查Docker服务..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest up -d postgres redis
sleep 5

# 2. 创建数据库
echo "2. 创建数据库..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec -T postgres psql -U postgres -c "CREATE DATABASE soybean_admin;" 2>/dev/null || echo "数据库可能已存在"

# 3. 创建backend schema
echo "3. 创建backend schema..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec -T postgres psql -U postgres -d soybean_admin -c "CREATE SCHEMA IF NOT EXISTS backend;" 2>/dev/null

# 4. 测试数据库连接
echo "4. 测试数据库连接..."
if docker-compose -f docker-compose.simple.yml -p soybean-admin-nest exec -T postgres psql -U postgres -d soybean_admin -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 5. 进入backend目录并设置环境变量
echo "5. 设置环境变量..."
cd backend

# 创建临时.env文件
cat > .env << EOF
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:25432/soybean_admin?schema=public"
REDIS_HOST=localhost
REDIS_PORT=26379
REDIS_PASSWORD=
REDIS_DB=0
JWT_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
JWT_ACCESS_TOKEN_SECRET=soybean-admin-jwt-secret-key-change-in-production-environment-32chars
JWT_REFRESH_TOKEN_SECRET=soybean-admin-refresh-secret-key-change-in-production-environment-32chars
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3200,http://localhost:5173
ENABLE_SWAGGER=true
SWAGGER_PATH=/api
EOF

# 6. 重新生成Prisma客户端
echo "6. 重新生成Prisma客户端..."
npx prisma generate

# 7. 推送数据库模式
echo "7. 推送数据库模式..."
npx prisma db push --accept-data-loss

# 8. 启动Backend服务
echo "8. 启动Backend服务..."
echo "正在启动服务，请等待..."

# 杀死可能存在的进程
pkill -f "nest start base-system" 2>/dev/null

# 启动服务
npm run start:dev &
BACKEND_PID=$!

# 等待服务启动
echo "等待服务启动..."
for i in {1..30}; do
    if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Backend服务启动成功！"
        echo "🌐 API文档: http://localhost:3000/api"
        echo "🏥 健康检查: http://localhost:3000/health"
        echo ""
        echo "🎉 修复完成！服务已成功启动！"
        echo "💡 按 Ctrl+C 停止服务"
        
        # 保持脚本运行
        wait $BACKEND_PID
        exit 0
    fi
    echo "等待中... ($i/30)"
    sleep 2
done

echo "❌ Backend服务启动超时"
echo "请检查日志获取更多信息"
exit 1
