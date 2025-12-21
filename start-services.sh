#!/bin/bash

# Damai Lowcode Admin 服务启动脚本
# 包含前端、后端和低代码设计器

set -e

echo "🚀 启动 Damai Lowcode Admin 服务..."

# 检查 Docker 和 Docker Compose 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 static-designer 目录是否存在
if [ ! -d "static-designer" ] || [ ! -f "static-designer/index.html" ]; then
    echo "⚠️  static-designer 目录不存在或为空"
    echo "🔨 正在构建低代码设计器..."
    ./build-designer.sh
fi

echo "📦 构建并启动所有服务..."

# 构建并启动服务
docker-compose up --build -d

echo "⏳ 等待服务启动..."

# 等待服务健康检查
echo "🔍 检查服务状态..."
sleep 10

# 显示服务状态
docker-compose ps

echo ""
echo "🎉 服务启动完成！"
echo ""
echo "📋 服务访问地址："
echo "  🌐 前端管理系统:     http://localhost:9527"
echo "  🎨 低代码设计器:     http://localhost:9555"
echo "  🔧 后端 API:        http://localhost:9528"
echo "  📚 API 文档:        http://localhost:9528/api-docs"
echo "  🗄️  PostgreSQL:     localhost:25432"
echo "  🔴 Redis:           localhost:26379"
echo "  🔗 PgBouncer:       localhost:6432"
echo ""
echo "📝 默认登录信息："
echo "  用户名: admin"
echo "  密码: 123456"
echo ""
echo "🛠️  管理命令："
echo "  查看日志: docker-compose logs -f [service_name]"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart [service_name]"
echo ""
