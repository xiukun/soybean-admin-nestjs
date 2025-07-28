#!/bin/bash

# 低代码平台项目管理系统 - Git提交脚本
# 按模块化方式提交代码

echo "🚀 开始低代码平台项目管理系统的Git提交..."

# 检查Git状态
echo "📋 检查Git状态..."
git status

# 添加所有更改的文件
echo "📁 添加文件到暂存区..."

# 1. 数据库和后端相关
echo "🗄️  提交数据库和后端更改..."
git add lowcode-platform-backend/
git commit -m "feat: 数据库模型重构和Prisma配置优化

- 更新Prisma schema，添加项目管理相关模型
- 优化数据库连接配置
- 添加项目状态管理和部署状态跟踪
- 实现协作功能的数据模型"

# 2. 前端核心功能
echo "🎨 提交前端核心功能..."
git add frontend/src/views/lowcode/project/index.vue
git add frontend/src/views/lowcode/project/composables/
git add frontend/src/views/lowcode/project/components/
git commit -m "feat: 实现项目管理核心功能

- 实现项目激活/停用功能
- 添加实时部署监控
- 集成代码生成服务
- 实现项目模板管理
- 添加导入导出功能
- 实现协作功能和权限管理"

# 3. 性能优化
echo "⚡ 提交性能优化相关代码..."
git add frontend/src/views/lowcode/project/composables/useProjectPerformance.ts
git add frontend/src/views/lowcode/project/components/VirtualProjectList.vue
git commit -m "perf: 项目管理性能优化

- 实现虚拟滚动优化大量项目渲染
- 添加防抖搜索功能
- 实现分页和过滤优化
- 优化项目列表加载性能"

# 4. 国际化和类型定义
echo "🌐 提交国际化和类型定义..."
git add frontend/src/locales/
git add frontend/src/views/lowcode/project/types/
git add frontend/src/views/lowcode/project/utils/
git commit -m "feat: 国际化支持和类型定义优化

- 添加项目管理相关翻译键
- 修复国际化类型定义问题
- 添加工具函数和类型扩展
- 优化错误处理机制"

# 5. 测试用例
echo "🧪 提交测试用例..."
git add frontend/src/views/lowcode/project/__tests__/
git commit -m "test: 添加模块化测试用例

- 添加项目管理组件测试
- 实现性能优化功能测试
- 添加虚拟滚动组件测试
- 实现API接口测试
- 添加测试配置和运行脚本"

# 6. 配置文件和脚本
echo "⚙️  提交配置文件和脚本..."
git add scripts/
git add package*.json
git commit -m "chore: 更新配置文件和构建脚本

- 添加Git提交脚本
- 更新项目依赖
- 优化构建配置"

echo "✅ 所有模块提交完成！"

# 创建版本标签
echo "🏷️  创建版本标签..."
git tag -a v2.0.0 -m "低代码平台项目管理系统 v2.0.0

主要功能:
- 项目激活停用管理
- 实时部署监控  
- 代码生成集成
- 模板管理
- 导入导出功能
- 协作功能
- 性能优化
- 国际化支持
- 模块化测试"

echo "🎉 Git提交和版本管理完成！"
echo "📝 版本: v2.0.0"
echo "🔗 可以使用 'git push origin main --tags' 推送到远程仓库"