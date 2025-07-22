# 代码生成器使用指南

## 🎯 概述

低代码平台代码生成器是一个强大的工具，可以从实体定义自动生成完整的业务代码，包括：

- **后端代码**：NestJS 控制器、服务、模块、DTO
- **数据库模式**：Prisma Schema 更新
- **前端页面**：Amis 页面配置
- **API文档**：Swagger 文档
- **版本控制**：自动 Git 提交和分支管理

## 🚀 快速开始

### 1. 环境准备

确保已安装以下依赖：
- Node.js 18+
- PostgreSQL 14+
- Git（用于版本控制集成）

### 2. 启动服务

```bash
# 启动后端服务
cd lowcode-platform-backend
npm run start:dev

# 启动前端服务
cd ../frontend
npm run dev
```

### 3. 访问代码生成器

打开浏览器访问：`http://localhost:3200`

在左侧菜单中找到 **低代码平台** → **代码生成器**

## 📋 功能特性

### 🔧 代码生成功能

1. **实体选择**
   - 支持多选实体
   - 实时预览选中的实体信息
   - 智能依赖分析

2. **目标项目配置**
   - 支持多种项目类型（NestJS、React、Vue、Angular）
   - 自动路径配置
   - 项目验证功能

3. **生成选项**
   - 覆盖现有文件
   - 自动创建目录
   - 代码格式化
   - 预览模式（不实际生成文件）

4. **Git 集成**
   - 自动提交生成的代码
   - 创建功能分支
   - 推送到远程仓库
   - 自定义提交信息

### 🎛️ 目标项目管理

1. **项目配置**
   - 项目类型和框架设置
   - 输出路径配置
   - 模板选择

2. **项目验证**
   - 路径有效性检查
   - 依赖项验证
   - 配置完整性检查

3. **统计信息**
   - 项目基本信息
   - 支持的功能特性
   - 生成历史统计

## 🛠️ 使用步骤

### 步骤1：创建实体

1. 进入 **低代码平台** → **实体管理**
2. 点击 **新增实体** 创建业务实体
3. 添加字段、设置类型和约束
4. 配置实体关系（如需要）

### 步骤2：配置目标项目

1. 进入 **低代码平台** → **目标项目管理**
2. 检查或添加目标项目配置
3. 验证项目配置的有效性

### 步骤3：生成代码

1. 进入 **低代码平台** → **代码生成器**
2. 选择要生成代码的实体
3. 选择目标项目
4. 配置生成选项
5. 可选：启用 Git 集成
6. 点击 **生成代码**

### 步骤4：验证结果

1. 检查生成的文件
2. 运行代码验证
3. 测试 API 功能
4. 查看 Git 提交记录

## 📁 生成的文件结构

以 `TestUser` 实体为例，生成的文件结构如下：

```
amis-lowcode-backend/
├── src/
│   ├── base/
│   │   ├── controllers/
│   │   │   └── test-user.base.controller.ts    # 基础控制器
│   │   ├── services/
│   │   │   └── test-user.base.service.ts       # 基础服务
│   │   └── dto/
│   │       └── test-user.dto.ts                # 数据传输对象
│   ├── biz/
│   │   ├── controllers/
│   │   │   └── test-user.controller.ts         # 业务控制器
│   │   ├── services/
│   │   │   └── test-user.service.ts            # 业务服务
│   │   └── modules/
│   │       └── test-user.module.ts             # 模块定义
│   └── config/
│       └── pages/
│           └── test-user-page.json             # Amis 页面配置
└── prisma/
    └── schema.prisma                           # 数据库模式（更新）
```

## 🔧 高级配置

### 自定义模板

1. 模板位置：`lowcode-platform-backend/src/resources/templates/`
2. 支持的模板类型：
   - `entity-base-controller.hbs`
   - `entity-base-service.hbs`
   - `entity-controller.hbs`
   - `entity-module.hbs`
   - `amis-page.hbs`

### Git 集成配置

```javascript
// 代码生成时的 Git 配置示例
{
  "git": {
    "enabled": true,
    "autoCommit": true,
    "createBranch": true,
    "branchName": "feature/generated-code-user-management",
    "push": false,
    "author": {
      "name": "Code Generator",
      "email": "generator@example.com"
    }
  }
}
```

### 目标项目配置

```javascript
// 目标项目配置示例
{
  "name": "my-custom-project",
  "displayName": "我的自定义项目",
  "type": "nestjs",
  "framework": "NestJS",
  "language": "typescript",
  "path": "/path/to/project",
  "config": {
    "outputPaths": {
      "controllers": "src/controllers",
      "services": "src/services",
      "modules": "src/modules",
      "dto": "src/dto",
      "schemas": "prisma/schema.prisma",
      "pages": "src/pages"
    }
  }
}
```

## 🐛 故障排除

### 常见问题

1. **生成失败：路径不存在**
   - 检查目标项目路径是否正确
   - 确保有写入权限

2. **Git 提交失败**
   - 检查 Git 配置
   - 确保工作目录是 Git 仓库

3. **模板编译错误**
   - 检查模板语法
   - 验证数据格式

### 日志查看

```bash
# 查看后端日志
cd lowcode-platform-backend
npm run start:dev

# 查看生成器状态
curl http://localhost:3100/api/v1/code-generation/status
```

## 🔄 更新和维护

### 更新模板

1. 修改 `src/resources/templates/` 中的模板文件
2. 重启服务以加载新模板
3. 清除模板缓存：`POST /api/v1/code-generation/clear-cache`

### 数据库迁移

```bash
# 生成 Prisma 迁移
npx prisma migrate dev --name add-new-feature

# 应用迁移
npx prisma migrate deploy
```

## 📚 API 参考

### 代码生成 API

- `POST /api/v1/code-generation/generate` - 生成代码
- `POST /api/v1/code-generation/preview` - 预览代码
- `GET /api/v1/code-generation/status` - 获取状态
- `POST /api/v1/code-generation/clear-cache` - 清除缓存

### 目标项目 API

- `GET /api/v1/target-projects` - 获取项目列表
- `POST /api/v1/target-projects` - 创建项目
- `GET /api/v1/target-projects/:id/validate` - 验证项目
- `GET /api/v1/target-projects/:id/statistics` - 获取统计

## 🤝 贡献指南

欢迎贡献代码和建议！请查看项目的贡献指南了解更多信息。

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 LICENSE 文件。
