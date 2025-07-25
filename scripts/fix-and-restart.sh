#!/bin/bash

# 修复Docker配置并重启服务

echo "🔧 修复Docker配置问题..."

# 停止所有服务
echo "⏹️ 停止现有服务..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest down

# 清理Docker缓存
echo "🧹 清理Docker缓存..."
docker system prune -f

# 重新构建并启动服务
echo "🚀 重新构建并启动服务..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest ps

# 检查backend日志
echo "📋 检查backend日志..."
docker-compose -f docker-compose.simple.yml -p soybean-admin-nest logs --tail=10 backend

echo "✅ 修复完成！"
