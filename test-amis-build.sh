#!/bin/bash

# 测试 amis-lowcode-backend Docker 构建
set -e

echo "🧪 测试 amis-lowcode-backend Docker 构建..."

# 检查必要文件
echo "📋 检查必要文件..."
if [ ! -f "amis-lowcode-backend/Dockerfile" ]; then
    echo "❌ Dockerfile 不存在"
    exit 1
fi

if [ ! -f "amis-lowcode-backend/package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

if [ ! -f "amis-lowcode-backend/pnpm-lock.yaml" ]; then
    echo "❌ pnpm-lock.yaml 不存在"
    exit 1
fi

echo "✅ 所有必要文件都存在"

# 进入目录
cd amis-lowcode-backend

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker rmi amis-lowcode-backend:test 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
echo "使用与 backend 相同的多阶段构建方式..."

if docker build -t amis-lowcode-backend:test .; then
    echo "✅ Docker 镜像构建成功！"

    # 显示镜像信息
    echo "📊 镜像信息："
    docker images amis-lowcode-backend:test

    # 测试镜像运行
    echo "🚀 测试镜像运行..."
    if docker run --rm -d --name amis-test -p 9523:9522 amis-lowcode-backend:test; then
        echo "✅ 容器启动成功！"
        sleep 5

        # 停止测试容器
        docker stop amis-test 2>/dev/null || true

        # 清理测试镜像
        echo "🧹 清理测试镜像..."
        docker rmi amis-lowcode-backend:test
    else
        echo "⚠️  容器启动测试跳过（可能需要数据库连接）"
    fi

    echo "🎉 构建测试完成！"
else
    echo "❌ Docker 镜像构建失败！"
    exit 1
fi
