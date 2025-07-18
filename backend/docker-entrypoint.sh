#!/bin/sh
set -e

echo "🚀 启动 Soybean Admin Backend 服务..."
echo "🚀 Starting Soybean Admin Backend Service..."

# 等待数据库就绪
echo "⏳ 等待数据库连接..."
until nc -z postgres 5432; do
  echo "数据库未就绪，等待中..."
  sleep 2
done
echo "✅ 数据库连接成功"

# 等待 Redis 就绪
echo "⏳ 等待 Redis 连接..."
until nc -z redis 6379; do
  echo "Redis 未就绪，等待中..."
  sleep 2
done
echo "✅ Redis 连接成功"

# 生成 Prisma 客户端（如果需要）
if [ ! -d "node_modules/.prisma" ]; then
  echo "🔧 生成 Prisma 客户端..."
  pnpm prisma:generate
  echo "✅ Prisma 客户端生成完成"
fi

# 同步数据库模式
echo "🔧 同步数据库模式..."
npx prisma db push --accept-data-loss
echo "✅ 数据库模式同步完成"

# 运行数据库种子（如果需要）
if [ "$RUN_SEEDS" = "true" ]; then
  echo "🌱 运行数据库种子..."
  pnpm prisma:seed
  echo "✅ 数据库种子完成"
fi

# 设置环境变量默认值
export NODE_ENV=${NODE_ENV:-production}
export APP_PORT=${APP_PORT:-9528}

echo "🌐 服务配置："
echo "  - 环境: $NODE_ENV"
echo "  - 端口: $APP_PORT"
echo "  - 数据库: $DATABASE_URL"
echo "  - Redis: $REDIS_HOST:$REDIS_PORT"

# 启动应用
echo "🚀 启动应用服务器..."
exec pm2-runtime ./ecosystem.config.js
