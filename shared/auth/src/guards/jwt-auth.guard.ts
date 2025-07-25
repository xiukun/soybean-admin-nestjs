import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

// 公开接口装饰器的元数据键
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 统一的JWT认证守卫
 * 用于所有微服务的JWT认证保护
 */
@Injectable()
export class UnifiedJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * 检查是否可以激活路由
   * @param context 执行上下文
   * @returns 是否可以访问
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    // 执行JWT认证
    return super.canActivate(context);
  }

  /**
   * 处理认证请求
   * @param err 错误信息
   * @param user 用户信息
   * @param info 附加信息
   * @param context 执行上下文
   * @returns 用户信息
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 如果有错误或没有用户信息，抛出未授权异常
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const url = request.url;
      const method = request.method;
      
      // 记录认证失败的详细信息
      const errorMessage = err?.message || info?.message || 'Invalid or missing JWT token';
      
      throw err || new UnauthorizedException({
        message: errorMessage,
        error: 'Unauthorized',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: url,
        method: method,
      });
    }
    
    return user;
  }

  /**
   * 获取请求中的JWT token
   * @param request 请求对象
   * @returns JWT token
   */
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
