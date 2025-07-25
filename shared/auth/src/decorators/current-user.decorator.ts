import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * 当前用户装饰器
 * 从JWT token中提取当前用户信息
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return { user };
 * }
 * 
 * // 只获取用户ID
 * @Get('my-data')
 * getMyData(@CurrentUser('uid') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    return data ? user?.[data] : user;
  },
);
