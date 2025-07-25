# 统一JWT认证系统

## 概述

统一JWT认证系统为整个微服务架构提供了一致的身份验证和授权机制。该系统支持：

- 🔐 **统一的JWT Token管理** - 跨微服务的一致认证体验
- 🚀 **高性能缓存** - 基于Redis的Token缓存和黑名单机制
- 🔄 **Token刷新机制** - 自动刷新过期Token，提升用户体验
- 🛡️ **安全防护** - 防重放攻击、Token黑名单、会话管理
- 🌐 **跨服务认证** - 微服务间的安全通信机制
- 📊 **监控统计** - 完整的Token使用统计和监控

## 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ JWT Token   │ │◄──►│ │ JWT Guard   │ │◄──►│ │ JWT Service │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │  Order Service  │    │   Redis Cache   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ JWT Guard   │ │    │ │ JWT Guard   │ │    │ │ Token Store │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ Blacklist   │ │
└─────────────────┘    └─────────────────┘    │ │ Sessions    │ │
                                              │ └─────────────┘ │
                                              └─────────────────┘
```

## 核心组件

### 1. UnifiedJwtService

统一的JWT服务，提供Token的生成、验证、刷新和撤销功能。

```typescript
import { UnifiedJwtService } from '@lib/shared/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: UnifiedJwtService) {}

  async login(user: IAuthentication) {
    // 生成Token对
    const tokenPair = await this.jwtService.generateTokenPair(user);
    return tokenPair;
  }

  async refreshToken(refreshToken: string) {
    // 刷新Token
    return await this.jwtService.refreshToken(refreshToken);
  }

  async logout(token: string) {
    // 撤销Token
    await this.jwtService.revokeToken(token);
  }
}
```

### 2. JwtAuthGuard

统一的JWT认证守卫，自动验证请求中的JWT Token。

```typescript
import { JwtAuthGuard } from '@lib/infra/guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // 应用到整个控制器
export class UserController {
  
  @Get('profile')
  @Public() // 公开接口，跳过认证
  getPublicInfo() {
    return { message: 'Public information' };
  }

  @Get('private')
  getPrivateInfo(@Request() req) {
    // req.user 包含认证用户信息
    return { user: req.user };
  }
}
```

### 3. 跨服务认证

支持微服务间的安全通信。

```typescript
import { CrossServiceAuth, InternalServiceCall } from '@lib/infra/decorators';

@Controller('internal')
export class InternalController {
  
  @Post('sync-user')
  @InternalServiceCall(['user-service', 'admin-service'])
  async syncUser(@Body() userData: any) {
    // 只允许指定的服务调用
    return await this.userService.syncUser(userData);
  }

  @Get('user-stats')
  @CrossServiceAuth({
    allowedServices: ['analytics-service'],
    requireUserContext: true,
  })
  async getUserStats(@Request() req) {
    // 需要用户上下文的服务间调用
    const user = req.user; // 来自调用方的用户信息
    return await this.statsService.getUserStats(user.uid);
  }
}
```

## 配置说明

### 环境变量配置

```bash
# JWT 基础配置
JWT_SECRET=your-jwt-secret-key-at-least-32-characters
REFRESH_TOKEN_SECRET=your-refresh-secret-key-at-least-32-characters
JWT_EXPIRE_IN=7200  # 2小时
REFRESH_TOKEN_EXPIRE_IN=43200  # 12小时

# 微服务认证配置
SERVICE_SECRET=your-service-secret-key-at-least-32-characters
ENABLE_CROSS_SERVICE_AUTH=true

# 安全特性
ENABLE_TOKEN_BLACKLIST=true
ENABLE_SESSION_MANAGEMENT=true
```

### 模块配置

```typescript
import { UnifiedJwtModule } from '@lib/shared/jwt';

@Module({
  imports: [
    UnifiedJwtModule, // 导入统一JWT模块
    // 其他模块...
  ],
  // ...
})
export class AppModule {}
```

## API接口

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

响应：
```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "tokenType": "Bearer"
  }
}
```

#### 2. 刷新Token
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

#### 5. 获取Token统计
```http
GET /api/auth/token/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 6. 撤销所有Token
```http
DELETE /api/auth/token/revoke-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 使用示例

### 1. 基础认证

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@lib/infra/guard';
import { Public } from '@lib/infra/decorators';

@Controller('api')
@UseGuards(JwtAuthGuard) // 全局应用JWT认证
export class ApiController {
  
  @Get('public')
  @Public() // 公开接口
  getPublicData() {
    return { message: 'This is public data' };
  }

  @Get('private')
  getPrivateData(@Request() req) {
    return { 
      message: 'This is private data',
      user: req.user 
    };
  }
}
```

### 2. 服务间调用

```typescript
import { ServiceAuthUtil } from '@lib/infra/middleware';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async callOrderService(userId: string, userContext: IAuthentication) {
    // 生成服务认证头
    const authHeaders = ServiceAuthUtil.generateAuthHeaders(
      'user-service',
      'user-service',
      userContext
    );

    // 调用其他服务
    const response = await this.httpService.post(
      'http://order-service/api/internal/create-order',
      { userId },
      { headers: authHeaders }
    ).toPromise();

    return response.data;
  }
}
```

### 3. 自定义认证逻辑

```typescript
import { UnifiedJwtService } from '@lib/shared/jwt';

@Injectable()
export class CustomAuthService {
  constructor(private readonly jwtService: UnifiedJwtService) {}

  async customLogin(credentials: any) {
    // 自定义认证逻辑
    const user = await this.validateCredentials(credentials);
    
    if (user) {
      // 生成Token
      const tokenPair = await this.jwtService.generateTokenPair({
        uid: user.id,
        username: user.username,
        domain: user.domain,
      });
      
      return tokenPair;
    }
    
    throw new UnauthorizedException('Invalid credentials');
  }

  async getTokenStats(userId: string) {
    return await this.jwtService.getTokenStatistics(userId);
  }
}
```

## 安全特性

### 1. Token黑名单

系统自动维护Token黑名单，已撤销的Token无法再次使用：

```typescript
// 撤销单个Token
await jwtService.revokeToken(token);

// 撤销用户所有Token
await jwtService.revokeAllUserTokens(userId);
```

### 2. 防重放攻击

服务间调用使用nonce和时间戳防止重放攻击：

```typescript
const headers = {
  'x-service-id': 'user-service',
  'x-service-name': 'user-service',
  'x-service-signature': 'calculated-signature',
  'x-service-timestamp': Date.now().toString(),
  'x-service-nonce': 'random-nonce',
};
```

### 3. 会话管理

系统维护用户会话信息，支持会话过期和强制下线：

```typescript
// 检查用户会话
const sessionExists = await redis.exists(`session:${userId}`);

// 更新会话活动时间
await redis.hset(`session:${userId}`, 'lastAccess', Date.now());
```

## 监控和统计

### Token使用统计

```typescript
const stats = await jwtService.getTokenStatistics(userId);
console.log({
  totalTokens: stats.totalTokens,
  activeTokens: stats.activeTokens,
  blacklistedTokens: stats.blacklistedTokens,
  userTokens: stats.userTokens,
});
```

### 性能监控

系统提供详细的性能监控指标：

- Token生成/验证耗时
- Redis操作耗时
- 认证成功/失败率
- 并发用户数
- Token刷新频率

## 故障排除

### 常见问题

1. **Token验证失败**
   - 检查JWT_SECRET配置
   - 确认Token未过期
   - 验证Token格式正确

2. **跨服务认证失败**
   - 检查SERVICE_SECRET配置
   - 确认服务已注册
   - 验证时间戳差异

3. **Redis连接问题**
   - 检查Redis连接配置
   - 确认Redis服务运行正常
   - 验证网络连通性

### 调试模式

开启调试模式获取详细日志：

```bash
LOG_LEVEL=debug
ENABLE_REQUEST_LOG=true
```

## 最佳实践

1. **密钥管理**
   - 使用强密钥（至少32位）
   - 定期轮换密钥
   - 不要在代码中硬编码密钥

2. **Token生命周期**
   - 设置合理的过期时间
   - 使用刷新Token机制
   - 及时撤销不需要的Token

3. **安全配置**
   - 启用HTTPS传输
   - 配置CORS策略
   - 启用安全头部

4. **监控告警**
   - 监控认证失败率
   - 设置异常登录告警
   - 跟踪Token使用趋势

5. **性能优化**
   - 合理配置缓存TTL
   - 使用连接池
   - 定期清理过期数据
