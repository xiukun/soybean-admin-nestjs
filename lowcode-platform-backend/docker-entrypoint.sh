#!/bin/sh
set -e

echo "🚀 启动低代码平台后端服务..."
echo "🚀 Starting Low-Code Platform Backend Service..."

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

# 检查是否需要运行数据库迁移
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🔧 运行数据库迁移..."
  npx prisma db push --accept-data-loss
  echo "✅ 数据库迁移完成"

  # 运行种子数据
  if [ "$AUTO_INIT_DATA" = "true" ]; then
    echo "🌱 运行种子数据..."
    if npx prisma db seed; then
      echo "✅ 种子数据初始化完成"
    else
      echo "⚠️ 种子数据初始化失败（继续启动）"
    fi
  fi
fi

# 设置环境变量默认值
export NODE_ENV=${NODE_ENV:-production}
export PORT=${APP_PORT:-${PORT:-3002}}
export AUTO_INIT_DATA=${AUTO_INIT_DATA:-true}
export DOCKER_ENV=${DOCKER_ENV:-true}

echo "🌐 服务配置："
echo "  - 环境: $NODE_ENV"
echo "  - 端口: $PORT"
echo "  - 数据库: $DATABASE_URL"
echo "  - Redis: $REDIS_HOST:$REDIS_PORT"
echo "  - 自动初始化: $AUTO_INIT_DATA"
echo "  - Docker环境: $DOCKER_ENV"

# 启动应用
echo "🚀 启动应用服务器..."
exec node dist/main.js
