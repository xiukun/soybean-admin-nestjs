#!/bin/bash

# amis低代码后端开发环境初始化脚本
# Amis Low-code Backend Development Environment Initialization Script

set -e

echo "🚀 amis低代码后端开发环境初始化..."
echo "🚀 Amis Low-code Backend Development Environment Initialization..."

# 设置环境变量
export NODE_ENV=${NODE_ENV:-development}
export AUTO_INIT_DATA=${AUTO_INIT_DATA:-true}
export DOCKER_ENV=${DOCKER_ENV:-false}

echo "📋 环境配置:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - AUTO_INIT_DATA: $AUTO_INIT_DATA"
echo "  - DOCKER_ENV: $DOCKER_ENV"

# 检查必要的环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 环境变量未设置"
    echo "请在 .env 文件中设置 DATABASE_URL"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 检查数据库连接
echo "🔍 检查数据库连接..."
if npx prisma db pull --preview-feature 2>/dev/null; then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败，请检查 DATABASE_URL 配置"
    exit 1
fi

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 检查是否需要运行迁移
echo "🔍 检查数据库迁移状态..."
if [ -d "prisma/migrations" ]; then
    echo "🔄 运行数据库迁移..."
    npx prisma migrate deploy
else
    echo "🔧 推送数据库模式..."
    npx prisma db push
fi

# 运行种子数据（如果启用）
if [ "$AUTO_INIT_DATA" = "true" ]; then
    echo "🌱 运行种子数据..."
    if npx prisma db seed; then
        echo "✅ 种子数据运行完成"
    else
        echo "⚠️ 种子数据运行失败，但继续启动"
    fi
fi

echo "🎉 amis低代码后端开发环境初始化完成!"
echo "🎉 Amis Low-code Backend Development Environment Initialization Complete!"
echo ""
echo "现在可以运行以下命令启动开发服务器:"
echo "npm run start:dev"
echo ""
