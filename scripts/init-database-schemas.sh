#!/bin/bash

# 多Schema数据库初始化脚本
# 为微服务系统初始化所有必要的数据库schema

set -e

echo "🚀 开始初始化多Schema数据库..."

# 数据库连接配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-25432}
DB_NAME=${DB_NAME:-soybean-admin-nest-backend}
DB_USER=${DB_USER:-soybean}
DB_PASSWORD=${DB_PASSWORD:-"soybean@123."}

# 构建数据库连接URL
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "📊 数据库连接信息:"
echo "  Host: ${DB_HOST}:${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
until docker exec soybean-postgres pg_isready -U ${DB_USER} -d ${DB_NAME} > /dev/null 2>&1; do
  echo "  数据库未就绪，等待中..."
  sleep 2
done
echo "✅ 数据库已就绪"

# 创建schemas
echo "📊 创建数据库schemas..."
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS backend;" || true
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS lowcode;" || true
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS amis;" || true
echo "✅ Schemas创建完成"

# 初始化Backend服务表结构
echo "📊 初始化Backend服务表结构..."
cd backend
DATABASE_URL="${DB_URL}?schema=backend" npx prisma db push --skip-generate
echo "✅ Backend服务表结构初始化完成"

# 初始化Lowcode Platform服务表结构
echo "📊 初始化Lowcode Platform服务表结构..."
cd ../lowcode-platform-backend
DATABASE_URL="${DB_URL}?schema=lowcode" npx prisma db push --skip-generate
echo "✅ Lowcode Platform服务表结构初始化完成"

# 初始化AMIS服务表结构
echo "📊 初始化AMIS服务表结构..."
cd ../amis-lowcode-backend
DATABASE_URL="${DB_URL}?schema=amis" npx prisma db push --skip-generate
echo "✅ AMIS服务表结构初始化完成"

# 验证表结构
echo "📊 验证数据库表结构..."
cd ..
echo "=== Backend Schema ==="
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "\dt backend.*"
echo ""
echo "=== Lowcode Schema ==="
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "\dt lowcode.*"
echo ""
echo "=== AMIS Schema ==="
docker exec soybean-postgres psql -U ${DB_USER} -d ${DB_NAME} -c "\dt amis.*"

echo "🎉 多Schema数据库初始化完成！"
