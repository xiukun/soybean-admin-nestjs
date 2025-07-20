# Amis Lowcode Business Backend

基于NestJS + Fastify构建的Amis兼容低代码业务后端服务。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境
```bash
cp .env.example .env
# 编辑.env文件配置数据库连接
```

### 3. 初始化数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动服务
```bash
npm run start:dev
```

### 5. 访问应用
- API地址: http://localhost:3000/api/v1
- API文档: http://localhost:3000/api/v1/docs
- 健康检查: http://localhost:3000/api/v1/health

## 📁 项目结构

```
src/
├── base/          # 基础代码层（代码生成器生成）
├── biz/           # 业务代码层（开发者自定义）
├── shared/        # 共享模块
├── config/        # 配置文件
├── app.module.ts  # 应用模块
└── main.ts        # 应用入口
```

## 🔧 开发说明

- `src/base/` 目录中的文件由代码生成器自动生成，请勿手动修改
- `src/biz/` 目录用于存放自定义业务代码，可以继承和扩展base层的功能
- 所有API接口自动符合Amis框架的响应格式规范

## 📝 API规范

所有接口都遵循Amis标准响应格式：

```json
{
  "status": 0,
  "msg": "success",
  "data": { ... }
}
```

## 🛠️ 脚本命令

- `npm run start:dev` - 启动开发服务器
- `npm run build` - 构建项目
- `npm run start:prod` - 启动生产服务器
- `npm run prisma:generate` - 生成Prisma客户端
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开Prisma Studio
