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

## 🧪 测试和验证

### 单元测试

```bash
# 运行JWT服务单元测试
cd shared/auth
npm test

# 运行覆盖率测试
npm run test:cov
```

### 性能测试

```bash
# 运行性能测试
npm run test:performance

# 自定义性能测试参数
TEST_CONCURRENCY=20 TEST_ITERATIONS=200 npm run test:performance
```

### 健康检查

```bash
# 检查服务健康状态
npm run health:check

# 或直接访问
curl http://localhost:3000/auth/health
```

### 监控指标

```bash
# 获取Prometheus格式指标
curl http://localhost:3000/auth/health/metrics

# 获取JWT统计信息（需要管理员权限）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/auth/health/stats
```

## 🔧 高级配置

### 自定义装饰器组合

```typescript
// 创建自定义验证装饰器
export const ApiSecureEndpoint = (options?: {
  roles?: string[];
  permissions?: string[];
  rateLimit?: number;
}) => {
  return applyDecorators(
    ValidatedAuth({
      roles: options?.roles,
      permissions: options?.permissions,
      rateLimit: options?.rateLimit ? {
        maxRequests: options.rateLimit,
        windowMs: 60000,
      } : undefined,
      audit: {
        action: 'secure_operation',
        resource: 'sensitive_data',
      },
    }),
    UseInterceptors(AuditLogInterceptor),
  );
};

// 使用自定义装饰器
@Post('sensitive-data')
@ApiSecureEndpoint({
  roles: ['admin'],
  permissions: ['data:write'],
  rateLimit: 5,
})
async handleSensitiveData() {
  // 处理敏感数据
}
```

### 跨服务调用工具

```typescript
import { ServiceAuthUtil } from '../../shared/auth/src';

// 生成服务认证头
const authHeaders = ServiceAuthUtil.generateAuthHeaders(
  'user-service',
  'user-service',
  userContext
);

// 使用axios进行跨服务调用
const response = await axios.post(
  'http://other-service/api/internal/sync',
  data,
  { headers: authHeaders }
);
```

### 自定义限流策略

```typescript
// 基于用户角色的限流
@Post('upload')
@RateLimit({
  maxRequests: 100,
  windowMs: 60000,
  keyGenerator: (context) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // VIP用户更高的限流阈值
    if (user?.roles?.includes('vip')) {
      return `rate_limit:vip:${user.uid}`;
    }

    return `rate_limit:normal:${user?.uid || request.ip}`;
  },
})
async uploadFile() {
  // 文件上传逻辑
}
```

## 📊 性能优化建议

### Redis优化

```bash
# Redis配置优化
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### JWT配置优化

```bash
# 生产环境推荐配置
JWT_EXPIRES_IN=15m          # 短期访问令牌
REFRESH_TOKEN_EXPIRES_IN=7d # 长期刷新令牌
ENABLE_TOKEN_BLACKLIST=true # 启用黑名单
ENABLE_SESSION_MANAGEMENT=true # 启用会话管理
```

### 监控告警

```yaml
# Prometheus告警规则示例
groups:
  - name: jwt_auth
    rules:
      - alert: HighJWTErrorRate
        expr: rate(jwt_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "JWT认证错误率过高"

      - alert: JWTServiceDown
        expr: up{job="jwt-auth"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "JWT认证服务不可用"
```

## 📞 支持和贡献

### 获取帮助

- 📖 查看文档：`shared/auth/README.md`
- 🐛 提交Issue：GitHub Issues
- 💬 讨论问题：GitHub Discussions
- 📧 联系维护者：[email]

### 贡献代码

1. Fork项目
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建Pull Request

### 开发指南

```bash
# 设置开发环境
git clone <repository-url>
cd soybean-admin-nestjs
cp .env.unified .env

# 安装依赖
npm install

# 启动开发服务
npm run start:unified local

# 运行测试
npm test
npm run test:performance

# 代码检查
npm run lint
npm run format
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🎉 总结

统一JWT认证系统为整个微服务架构提供了：

- ✅ **统一的认证体验** - 所有服务使用相同的JWT实现
- ✅ **高性能缓存** - 基于Redis的Token管理
- ✅ **安全防护** - 黑名单、会话管理、防重放攻击
- ✅ **跨服务认证** - 安全的微服务间通信
- ✅ **完整的监控** - 健康检查、指标收集、审计日志
- ✅ **易于维护** - 统一的代码库和配置管理
- ✅ **高度可扩展** - 支持自定义装饰器和守卫

现在您可以在所有微服务中享受一致、安全、高性能的JWT认证体验！🚀
