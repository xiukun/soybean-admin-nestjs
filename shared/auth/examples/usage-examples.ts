import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import {
  // 装饰器
  Public,
  ApiJwtAuth,
  ApiAdminAuth,
  ApiSuperAdminAuth,
  CurrentUser,
  CurrentUserId,
  CurrentUsername,
  CurrentToken,
  ClientIp,
  UserAgent,
  Roles,
  Permissions,
  InternalService,
  CrossService,
  RateLimit,
  AuditLog,
  ValidatedAuth,
  // 守卫
  UnifiedJwtGuard,
  RolesGuard,
  PermissionsGuard,
  CrossServiceGuard,
  RateLimitGuard,
  // 拦截器
  AuditLogInterceptor,
  // 类型
  IAuthentication,
} from '../src';

/**
 * 用户控制器示例
 * 展示统一JWT认证系统的各种用法
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(UnifiedJwtGuard) // 全局应用JWT认证
export class UserController {

  // ==================== 基础认证示例 ====================

  /**
   * 公开接口 - 不需要认证
   */
  @Get('public')
  @Public()
  @ApiOperation({ summary: '获取公开用户信息' })
  getPublicUsers() {
    return { message: 'This is public user data' };
  }

  /**
   * 需要认证的接口
   */
  @Get('profile')
  @ApiJwtAuth({ summary: '获取用户资料' })
  getUserProfile(@CurrentUser() user: IAuthentication) {
    return {
      message: 'User profile',
      user: {
        id: user.uid,
        username: user.username,
        domain: user.domain,
      },
    };
  }

  /**
   * 获取当前用户信息 - 使用多个装饰器
   */
  @Get('me')
  @ApiJwtAuth()
  getCurrentUser(
    @CurrentUserId() userId: string,
    @CurrentUsername() username: string,
    @CurrentToken() token: string,
    @ClientIp() ip: string,
    @UserAgent() userAgent: string,
  ) {
    return {
      userId,
      username,
      tokenLength: token.length,
      clientIp: ip,
      userAgent,
    };
  }

  // ==================== 角色和权限示例 ====================

  /**
   * 管理员接口
   */
  @Get('admin')
  @ApiAdminAuth({ summary: '管理员专用接口' })
  getAdminData(@CurrentUser() user: IAuthentication) {
    return {
      message: 'Admin data',
      adminUser: user.username,
    };
  }

  /**
   * 超级管理员接口
   */
  @Get('super-admin')
  @ApiSuperAdminAuth({ summary: '超级管理员专用接口' })
  getSuperAdminData() {
    return { message: 'Super admin data' };
  }

  /**
   * 特定角色接口
   */
  @Get('moderator')
  @UseGuards(UnifiedJwtGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @ApiJwtAuth({ roles: ['moderator', 'admin'] })
  getModeratorData() {
    return { message: 'Moderator data' };
  }

  /**
   * 特定权限接口
   */
  @Post()
  @UseGuards(UnifiedJwtGuard, PermissionsGuard)
  @Permissions('user:create')
  @ApiJwtAuth({ permissions: ['user:create'] })
  @AuditLog({ action: 'create_user', resource: 'user' })
  createUser(@Body() userData: any, @CurrentUser() user: IAuthentication) {
    return {
      message: 'User created',
      createdBy: user.username,
      userData,
    };
  }

  // ==================== 限流示例 ====================

  /**
   * 限流接口 - 每分钟最多10次请求
   */
  @Post('send-email')
  @UseGuards(UnifiedJwtGuard, RateLimitGuard)
  @RateLimit({ maxRequests: 10, windowMs: 60000 })
  @ApiJwtAuth()
  sendEmail(@Body() emailData: any) {
    return { message: 'Email sent', emailData };
  }

  /**
   * 严格限流接口 - 每小时最多3次请求
   */
  @Post('reset-password')
  @UseGuards(UnifiedJwtGuard, RateLimitGuard)
  @RateLimit({ maxRequests: 3, windowMs: 3600000 })
  @ApiJwtAuth()
  @AuditLog({ action: 'reset_password', resource: 'user' })
  resetPassword(@Body() resetData: any, @CurrentUserId() userId: string) {
    return { message: 'Password reset initiated', userId };
  }

  // ==================== 审计日志示例 ====================

  /**
   * 带审计日志的更新接口
   */
  @Put(':id')
  @UseInterceptors(AuditLogInterceptor)
  @ApiJwtAuth()
  @AuditLog({ 
    action: 'update_user', 
    resource: 'user',
    description: 'Update user information'
  })
  updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user: IAuthentication,
  ) {
    return {
      message: 'User updated',
      userId: id,
      updatedBy: user.username,
      updateData,
    };
  }

  /**
   * 带审计日志的删除接口
   */
  @Delete(':id')
  @UseInterceptors(AuditLogInterceptor)
  @ApiAdminAuth()
  @AuditLog({ 
    action: 'delete_user', 
    resource: 'user',
    description: 'Delete user account'
  })
  deleteUser(@Param('id') id: string, @CurrentUser() user: IAuthentication) {
    return {
      message: 'User deleted',
      deletedUserId: id,
      deletedBy: user.username,
    };
  }

  // ==================== 组合装饰器示例 ====================

  /**
   * 验证装饰器组合 - 包含角色、权限、限流、审计
   */
  @Post('sensitive-operation')
  @ValidatedAuth({
    roles: ['admin', 'super-admin'],
    permissions: ['user:sensitive_operation'],
    rateLimit: { maxRequests: 5, windowMs: 300000 }, // 5分钟内最多5次
    audit: { action: 'sensitive_operation', resource: 'user' },
  })
  @UseInterceptors(AuditLogInterceptor)
  performSensitiveOperation(
    @Body() operationData: any,
    @CurrentUser() user: IAuthentication,
  ) {
    return {
      message: 'Sensitive operation completed',
      operatedBy: user.username,
      operationData,
    };
  }
}

/**
 * 内部服务控制器示例
 * 展示跨服务调用的用法
 */
@ApiTags('Internal')
@Controller('internal')
export class InternalController {

  /**
   * 内部服务调用 - 只允许特定服务调用
   */
  @Post('sync-user')
  @UseGuards(CrossServiceGuard)
  @InternalService(['user-service', 'admin-service'])
  syncUser(@Body() userData: any) {
    return {
      message: 'User synced',
      userData,
    };
  }

  /**
   * 跨服务调用 - 需要用户上下文
   */
  @Get('user-stats')
  @UseGuards(CrossServiceGuard)
  @CrossService({
    allowedServices: ['analytics-service'],
    requireUserContext: true,
  })
  getUserStats(@CurrentUser() user: IAuthentication) {
    return {
      message: 'User stats',
      userId: user.uid,
      username: user.username,
    };
  }
}

/**
 * 服务使用示例
 * 展示如何在服务中使用JWT功能
 */
export class ExampleService {
  constructor(
    private readonly jwtService: any, // UnifiedJwtService
    private readonly httpService: any, // HttpService
  ) {}

  /**
   * 生成用户令牌
   */
  async generateUserToken(user: IAuthentication) {
    const tokenPair = await this.jwtService.generateTokenPair(user);
    return tokenPair;
  }

  /**
   * 验证令牌
   */
  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * 刷新令牌
   */
  async refreshUserToken(refreshToken: string) {
    try {
      const newTokenPair = await this.jwtService.refreshToken(refreshToken);
      return newTokenPair;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * 撤销用户所有令牌
   */
  async revokeAllUserTokens(userId: string) {
    await this.jwtService.revokeAllUserTokens(userId);
  }

  /**
   * 跨服务调用示例
   */
  async callOtherService(userContext: IAuthentication) {
    // 生成服务认证头
    const authHeaders = {
      'x-service-id': 'user-service',
      'x-service-name': 'user-service',
      'x-service-signature': 'generated-signature',
      'x-service-timestamp': Date.now().toString(),
      'x-service-nonce': 'random-nonce',
      'x-user-context': Buffer.from(JSON.stringify(userContext)).toString('base64'),
    };

    // 调用其他服务
    const response = await this.httpService.post(
      'http://other-service/api/internal/data',
      { data: 'some data' },
      { headers: authHeaders }
    ).toPromise();

    return response.data;
  }
}
