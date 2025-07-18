#!/bin/bash

# 低代码平台开发环境设置脚本
# Development Environment Setup Script for Low-Code Platform

set -e

echo "🚀 开始设置低代码平台开发环境..."
echo "🚀 Starting Low-Code Platform Development Environment Setup..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+ 版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+ 版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 npm 版本
echo "📋 检查 npm 版本..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 检查 PostgreSQL
echo "📋 检查 PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL 客户端未安装，某些功能可能无法使用"
    echo "   请安装 PostgreSQL 或确保数据库连接可用"
else
    echo "✅ PostgreSQL 客户端已安装"
fi

# 检查环境变量文件
echo "📋 检查环境配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 复制环境变量模板..."
        cp .env.example .env
        echo "⚠️ 请编辑 .env 文件配置数据库连接等信息"
    else
        echo "📝 创建基础环境变量文件..."
        cat > .env << EOF
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/lowcode_platform"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS 配置
CORS_ORIGIN="http://localhost:9527,http://localhost:9528"

# 速率限制配置
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW=60000

# Redis 配置 (可选)
REDIS_URL="redis://localhost:6379"

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# 日志配置
LOG_LEVEL=debug
EOF
        echo "✅ 已创建 .env 文件，请根据需要修改配置"
    fi
else
    echo "✅ 环境变量文件已存在"
fi

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
if [ -f "prisma/schema.prisma" ]; then
    npm run prisma:generate
    echo "✅ Prisma 客户端生成完成"
else
    echo "⚠️ 未找到 Prisma schema 文件"
fi

# 验证 TypeScript 配置
echo "🔧 验证 TypeScript 配置..."
npm run check-imports
if [ $? -eq 0 ]; then
    echo "✅ TypeScript 配置验证通过"
else
    echo "⚠️ TypeScript 配置有问题，请检查"
fi

# 验证路径别名配置
echo "🔧 验证路径别名配置..."
if [ -f "scripts/validate-path-aliases.js" ]; then
    npm run validate-aliases || echo "⚠️ 路径别名验证有警告，请查看报告"
else
    echo "⚠️ 路径别名验证脚本不存在"
fi

# 检查代码质量工具
echo "🔧 检查代码质量工具..."
if command -v eslint &> /dev/null; then
    echo "✅ ESLint 已安装"
else
    echo "⚠️ ESLint 未全局安装，将使用项目本地版本"
fi

if command -v prettier &> /dev/null; then
    echo "✅ Prettier 已安装"
else
    echo "⚠️ Prettier 未全局安装，将使用项目本地版本"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads
mkdir -p generated
mkdir -p backups
echo "✅ 目录创建完成"

# 设置 Git hooks (如果在 Git 仓库中)
if [ -d ".git" ]; then
    echo "🔧 设置 Git hooks..."
    if [ -f "node_modules/.bin/husky" ]; then
        npx husky install
        echo "✅ Git hooks 设置完成"
    else
        echo "⚠️ Husky 未安装，跳过 Git hooks 设置"
    fi
else
    echo "⚠️ 不在 Git 仓库中，跳过 Git hooks 设置"
fi

# 显示开发命令
echo ""
echo "🎉 开发环境设置完成！"
echo ""
echo "📚 常用开发命令："
echo "  npm run start:dev     - 启动开发服务器"
echo "  npm run build         - 构建项目"
echo "  npm test              - 运行测试"
echo "  npm run lint          - 代码质量检查"
echo "  npm run format        - 代码格式化"
echo "  npm run update-imports - 更新导入路径"
echo "  npm run validate-aliases - 验证路径别名"
echo ""
echo "🌐 服务地址："
echo "  API 服务: http://localhost:3000"
echo "  API 文档: http://localhost:3000/api-docs"
echo "  健康检查: http://localhost:3000/health"
echo "  性能指标: http://localhost:3000/health/metrics"
echo ""
echo "📖 更多信息请查看："
echo "  - README.md - 项目概述"
echo "  - DEVELOPMENT_WORKFLOW.md - 开发工作流"
echo "  - PATH_ALIASES.md - 路径别名使用指南"
echo "  - FASTIFY.md - Fastify 使用指南"
echo ""
echo "🚀 现在可以运行 'npm run start:dev' 启动开发服务器！"
