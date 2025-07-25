# 🚀 统一JWT认证系统 - 快速启动指南

## 📋 前置要求

- Node.js 20.11.1+
- Docker & Docker Compose
- pnpm (推荐) 或 npm

## ⚡ 一键启动

### 1. 克隆项目
```bash
git clone <repository-url>
cd soybean-admin-nestjs
```

### 2. Docker部署 (推荐)
```bash
# 一键启动所有服务
./scripts/start-unified.sh docker

# 查看服务状态
docker-compose -f docker-compose.unified.yml ps
```

### 3. 本地开发
```bash
# 安装依赖
pnpm install

# 启动数据库服务
docker-compose -f docker-compose.unified.yml up -d postgres redis

# 启动后端服务
cd backend && pnpm start:dev

# 启动低代码平台
cd lowcode-platform-backend && pnpm start:dev

# 启动AMIS后端
cd amis-lowcode-backend && pnpm start:dev
```

## 🔧 环境配置

### 统一环境变量 (.env.unified)
```bash
# JWT配置
JWT_ACCESS_TOKEN_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# 数据库配置
DATABASE_URL=postgresql://postgres:password@localhost:25432/soybean_admin
REDIS_URL=redis://localhost:26379

# 服务端口
BACKEND_PORT=3000
LOWCODE_PORT=3001
AMIS_PORT=3002
```

## 📡 服务访问

| 服务 | 地址 | 描述 |
|------|------|------|
| Backend API | http://localhost:3000 | 主要后端服务 |
| Swagger文档 | http://localhost:3000/api | API文档 |
| 低代码平台 | http://localhost:3001 | 低代码后端服务 |
| AMIS后端 | http://localhost:3002 | AMIS组件后端 |

## 🔐 认证使用

### 1. 获取Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

### 2. 使用Token访问受保护接口
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 刷新Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🛠️ 开发指南

### 在控制器中使用认证
```typescript
import { Controller, Get } from '@nestjs/common';
import { AutoApiJwtAuth, Public, Roles, CurrentUser } from '@shared/auth';

@AutoApiJwtAuth() // 自动应用JWT认证到所有接口
@Controller('users')
export class UserController {
  
  @Public() // 公开接口，无需认证
  @Get('public')
  getPublicData() {
    return { message: 'This is public data' };
  }
  
  @Get('profile') // 需要认证
  getProfile(@CurrentUser() user: any) {
    return { user };
  }
  
  @Roles('admin') // 需要admin角色
  @Get('admin-only')
  getAdminData() {
    return { message: 'Admin only data' };
  }
}
```

### 权限控制
```typescript
import { Permissions } from '@shared/auth';

@Permissions('user:read', 'user:write')
@Get('protected')
getProtectedData() {
  return { message: 'You have the required permissions' };
}
```

## 🐳 Docker命令

```bash
# 构建所有服务
docker-compose -f docker-compose.unified.yml build

# 启动所有服务
docker-compose -f docker-compose.unified.yml up -d

# 查看日志
docker-compose -f docker-compose.unified.yml logs -f

# 停止所有服务
docker-compose -f docker-compose.unified.yml down

# 重建并启动
docker-compose -f docker-compose.unified.yml up --build -d
```

## 🔍 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   # 修改 .env.unified 中的端口配置
   ```

2. **数据库连接失败**
   ```bash
   # 确保数据库服务运行
   docker-compose -f docker-compose.unified.yml up -d postgres
   # 检查数据库连接
   docker-compose -f docker-compose.unified.yml logs postgres
   ```

3. **JWT Token无效**
   ```bash
   # 检查JWT密钥配置
   # 确保 .env.unified 中的JWT_ACCESS_TOKEN_SECRET已设置
   ```

### 日志查看
```bash
# 查看特定服务日志
docker-compose -f docker-compose.unified.yml logs backend
docker-compose -f docker-compose.unified.yml logs lowcode-backend
docker-compose -f docker-compose.unified.yml logs amis-backend

# 实时查看日志
docker-compose -f docker-compose.unified.yml logs -f --tail=100
```

## 📚 更多资源

- [完整文档](./README.md)
- [API文档](http://localhost:3000/api)
- [验证报告](./VERIFICATION_REPORT.md)
- [架构设计](./docs/ARCHITECTURE.md)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看 [故障排除](#-故障排除) 部分
2. 检查服务日志
3. 确认环境配置正确
4. 提交Issue并附上错误日志

---

🎉 **恭喜！** 您的统一JWT认证系统已经启动并运行！
