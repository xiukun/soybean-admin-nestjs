# 后端服务快速启动指南

## 🚀 解决API配置404错误

当前前端请求 `/api-configs/project/{projectId}/lowcode-paginated` 接口返回404错误，这是因为后端服务没有启动。

## 📋 启动步骤

### 1. 进入后端目录

```bash
cd soybean-admin-nestjs/lowcode-platform-backend
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 3. 环境配置

创建 `.env` 文件（如果不存在）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/lowcode_platform"

# 应用配置
NODE_ENV=development
PORT=3000

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. 数据库设置

#### 选项A: 使用Docker（推荐）

```bash
# 启动PostgreSQL和Redis
docker-compose up -d postgres redis
```

#### 选项B: 本地安装

确保本地已安装PostgreSQL，然后创建数据库：

```sql
CREATE DATABASE lowcode_platform;
```

### 5. 数据库迁移

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 可选：填充示例数据
npx prisma db seed
```

### 6. 启动开发服务器

```bash
# 开发模式启动（推荐）
npm run start:dev

# 或使用 pnpm
pnpm start:dev
```

### 7. 验证服务启动

服务启动后，你应该看到类似输出：

```
[Nest] INFO [NestApplication] Nest application successfully started +2ms
[Nest] INFO [NestApplication] Application is running on: http://localhost:3000
```

## 🧪 测试API接口

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 测试API配置接口

```bash
# 测试基础路由
curl http://localhost:3000/api/v1/api-configs/test

# 测试项目API配置列表
curl "http://localhost:3000/api/v1/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=10"
```

### 3. 查看Swagger文档

访问 `http://localhost:3000/api` 查看完整的API文档。

## 🔧 常见问题解决

### 问题1: 端口被占用

```bash
# 查找占用3000端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改端口
export PORT=3001
npm run start:dev
```

### 问题2: 数据库连接失败

检查 `.env` 文件中的数据库连接字符串：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/lowcode_platform"
```

确保：
- PostgreSQL服务正在运行
- 数据库用户名和密码正确
- 数据库名称存在

### 问题3: Prisma相关错误

```bash
# 重新生成Prisma客户端
npx prisma generate

# 重置数据库（谨慎使用）
npx prisma migrate reset
```

### 问题4: 依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📊 服务状态检查

### 1. 检查服务进程

```bash
# 检查Node.js进程
ps aux | grep node

# 检查端口监听
netstat -tlnp | grep :3000
```

### 2. 检查日志

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

### 3. 检查数据库连接

```bash
# 使用Prisma Studio查看数据
npx prisma studio
```

## 🚀 生产环境部署

### 1. 构建应用

```bash
npm run build
```

### 2. 启动生产服务

```bash
npm run start:prod
```

### 3. 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name lowcode-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs lowcode-backend
```

## 🔄 开发工作流

### 1. 代码修改后自动重启

开发模式下，代码修改会自动触发服务重启：

```bash
npm run start:dev
```

### 2. 数据库模式更改

修改 `prisma/schema.prisma` 后：

```bash
# 创建新的迁移
npx prisma migrate dev --name describe-your-changes

# 生成客户端
npx prisma generate
```

### 3. 添加新的API接口

1. 在 `src/api/lowcode/` 下创建控制器
2. 在相应的模块中注册控制器
3. 重启服务测试

## ✅ 验证清单

启动后端服务后，确认以下项目：

- [ ] 服务在 `http://localhost:3000` 正常运行
- [ ] 健康检查接口 `/health` 返回正常
- [ ] Swagger文档 `/api` 可以访问
- [ ] 数据库连接正常
- [ ] API配置接口返回数据而不是404错误

## 🎯 下一步

服务启动成功后：

1. 前端页面应该能正常加载API配置数据
2. 不再出现404错误
3. 可以正常使用所有API配置功能

如果仍有问题，请检查：
- 前端代理配置是否正确
- 后端路由是否正确注册
- 数据库中是否有测试数据
