# 统一JWT认证系统

## 🎯 项目概述

本项目实现了一套统一的JWT认证体系，支持3个微服务的统一身份验证和授权：

- **backend** - 主后端服务 (端口: 3000/9528)
- **lowcode-platform-backend** - 低代码平台后端 (端口: 3001/3000)
- **amis-lowcode-backend** - Amis低代码后端 (端口: 3002/9522)

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    统一JWT认证系统                                │
├─────────────────────────────────────────────────────────────────┤
│  shared/auth/                                                   │
│  ├── config/jwt.config.ts          # 统一JWT配置                │
│  ├── services/unified-jwt.service.ts # 统一JWT服务               │
│  ├── strategies/unified-jwt.strategy.ts # 统一JWT策略            │
│  ├── guards/unified-jwt.guard.ts   # 统一JWT守卫                │
│  └── unified-auth.module.ts        # 统一认证模块               │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │   backend    │ │ lowcode-    │ │ amis-      │
        │              │ │ platform    │ │ lowcode    │
        │   :3000      │ │   :3001     │ │   :3002    │
        └──────────────┘ └─────────────┘ └────────────┘
                                │
                        ┌───────▼──────┐
                        │    Redis     │
                        │ Token Store  │
                        │   :6379      │
                        └──────────────┘
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd soybean-admin-nestjs

# 复制环境变量配置
cp .env.unified .env

# 编辑环境变量（重要：修改密钥）
vim .env
```

### 2. 本地开发启动

```bash
# 使用统一启动脚本
./scripts/start-unified.sh local

# 或者手动启动
npm install
npm run start:dev
```

### 3. Docker部署

```bash
# 使用统一启动脚本
./scripts/start-unified.sh docker

# 或者手动启动
docker-compose -f docker-compose.unified.yml up -d
```

### 4. 停止服务

```bash
# 停止本地服务
./scripts/stop-unified.sh local

# 停止Docker服务
./scripts/stop-unified.sh docker

# 停止所有服务
./scripts/stop-unified.sh all
```

## 🔧 配置说明

### 环境变量配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `JWT_SECRET` | JWT访问令牌密钥 | - | ✅ |
| `REFRESH_TOKEN_SECRET` | JWT刷新令牌密钥 | - | ✅ |
| `SERVICE_SECRET` | 服务间认证密钥 | - | ✅ |
| `JWT_EXPIRES_IN` | 访问令牌过期时间 | `2h` | ❌ |
| `REFRESH_TOKEN_EXPIRES_IN` | 刷新令牌过期时间 | `7d` | ❌ |
| `JWT_ISSUER` | JWT签发者 | `soybean-admin` | ❌ |
| `JWT_AUDIENCE` | JWT受众 | `soybean-admin-client` | ❌ |
| `ENABLE_TOKEN_BLACKLIST` | 启用令牌黑名单 | `true` | ❌ |
| `ENABLE_SESSION_MANAGEMENT` | 启用会话管理 | `true` | ❌ |

### 密钥安全要求

⚠️ **重要安全提醒**：

- 所有密钥长度必须至少32位
- 生产环境必须使用强密钥
- 不要在代码中硬编码密钥
- 定期轮换密钥

```bash
# 生成安全密钥示例
openssl rand -base64 32
```

## 📚 API文档

### 认证接口

#### 1. 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**响应：**
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresIn": 7200,
    "refreshTokenExpiresIn": 604800,
    "tokenType": "Bearer",
    "user": {
      "uid": "1",
      "username": "admin",
      "domain": "system"
    }
  }
}
```

#### 2. 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. 用户登出
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. 令牌统计
```http
GET /api/auth/token/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 6. 撤销所有令牌
```http
DELETE /api/auth/token/revoke-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 💻 开发指南

### 使用统一认证

#### 1. 在控制器中使用

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { UnifiedJwtGuard, Public, CurrentUser, IAuthentication } from '../../shared/auth/src';

@Controller('api')
@UseGuards(UnifiedJwtGuard)
export class ApiController {
  
  @Get('public')
  @Public() // 公开接口，跳过认证
  getPublicData() {
    return { message: 'This is public data' };
  }

  @Get('private')
  getPrivateData(@CurrentUser() user: IAuthentication) {
    return { 
      message: 'This is private data',
      user: user 
    };
  }
}
```

#### 2. 在模块中导入

```typescript
import { Module } from '@nestjs/common';
import { UnifiedAuthModule } from '../../shared/auth/src';

@Module({
  imports: [
    UnifiedAuthModule.forRoot(), // 导入统一认证模块
    // 其他模块...
  ],
  // ...
})
export class AppModule {}
```

#### 3. 使用JWT服务

```typescript
import { Injectable } from '@nestjs/common';
import { UnifiedJwtService, IAuthentication } from '../../shared/auth/src';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: UnifiedJwtService) {}

  async login(credentials: any): Promise<any> {
    // 验证用户凭据
    const user: IAuthentication = await this.validateUser(credentials);
    
    // 生成令牌对
    const tokenPair = await this.jwtService.generateTokenPair(user);
    
    return tokenPair;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return await this.jwtService.refreshToken(refreshToken);
  }

  async logout(token: string): Promise<void> {
    await this.jwtService.revokeToken(token);
  }
}
```

### 服务间调用

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ServiceAuthUtil } from '../../shared/auth/src';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async callOtherService(userContext: IAuthentication) {
    // 生成服务认证头
    const authHeaders = ServiceAuthUtil.generateAuthHeaders(
      'user-service',
      'user-service',
      userContext
    );

    // 调用其他服务
    const response = await this.httpService.post(
      'http://other-service/api/internal/data',
      { data: 'some data' },
      { headers: authHeaders }
    ).toPromise();

    return response.data;
  }
}
```

## 🔍 监控和调试

### 健康检查

所有服务都提供健康检查端点：

```bash
# 检查服务状态
curl http://localhost:3000/health  # backend
curl http://localhost:3001/health  # lowcode-platform-backend
curl http://localhost:3002/health  # amis-lowcode-backend
```

### 日志查看

```bash
# 本地开发日志
tail -f logs/*.log

# Docker日志
docker-compose -f docker-compose.unified.yml logs -f

# 特定服务日志
docker-compose -f docker-compose.unified.yml logs -f backend
```

### 令牌统计

```bash
# 获取令牌使用统计
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/auth/token/statistics
```

## 🛠️ 故障排除

### 常见问题

1. **JWT验证失败**
   ```bash
   # 检查密钥配置
   echo $JWT_SECRET | wc -c  # 应该 >= 32
   
   # 检查令牌格式
   echo "YOUR_TOKEN" | base64 -d
   ```

2. **Redis连接失败**
   ```bash
   # 检查Redis连接
   redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   
   # 检查Redis配置
   redis-cli -h $REDIS_HOST -p $REDIS_PORT info
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库连接
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **服务启动失败**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   
   # 检查环境变量
   env | grep JWT
   env | grep DATABASE
   env | grep REDIS
   ```

### 调试模式

```bash
# 启用详细日志
export LOG_LEVEL=debug
export ENABLE_REQUEST_LOG=true

# 启动调试模式
./scripts/start-unified.sh --verbose local
```

## 📈 性能优化

### Redis优化

```bash
# Redis配置优化
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 数据库优化

```sql
-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
```

## 🔒 安全最佳实践

1. **密钥管理**
   - 使用环境变量存储密钥
   - 定期轮换密钥
   - 使用密钥管理服务

2. **网络安全**
   - 启用HTTPS
   - 配置防火墙
   - 使用VPN或私有网络

3. **监控告警**
   - 监控异常登录
   - 设置失败率告警
   - 跟踪令牌使用趋势

4. **访问控制**
   - 实施最小权限原则
   - 定期审查权限
   - 使用角色基础访问控制

## 📞 支持和贡献

### 获取帮助

- 查看文档：`docs/UNIFIED_JWT_AUTH.md`
- 提交Issue：GitHub Issues
- 联系维护者：[email]

### 贡献代码

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
