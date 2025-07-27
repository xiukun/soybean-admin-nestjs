#!/bin/bash

echo "🚀 启动低代码平台开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.dev.yml down

# 启动数据库服务
echo "🗄️ 启动数据库服务..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
timeout=60
counter=0
while ! docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ 数据库启动超时"
        exit 1
    fi
    echo "等待数据库启动... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

echo "✅ 数据库已就绪"

# 设置环境变量
export DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=lowcode"
export USE_REAL_DATABASE=true
export REDIS_HOST=localhost
export REDIS_PORT=26379
export REDIS_PASSWORD=123456
export REDIS_DB=2

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npm run prisma:generate

# 推送数据库架构
echo "📊 推送数据库架构..."
npx prisma db push --accept-data-loss

# 运行种子数据
echo "🌱 运行种子数据..."
npm run db:seed

echo "🎉 开发环境启动完成！"
echo ""
echo "📋 服务信息："
echo "  - PostgreSQL: localhost:25432"
echo "  - Redis: localhost:26379"
echo "  - 数据库: soybean-admin-nest-backend"
echo "  - Schema: lowcode"
echo ""
echo "🚀 启动开发服务器："
echo "  npm run start:dev"
echo ""
echo "🔍 查看数据库："
echo "  npm run prisma:studio"
echo ""
echo "🛑 停止服务："
echo "  docker-compose -f docker-compose.dev.yml down"
