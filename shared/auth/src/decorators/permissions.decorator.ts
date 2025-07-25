import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 * 标记需要特定权限才能访问的接口
 * 
 * @param permissions 需要的权限列表
 * 
 * @example
 * ```typescript
 * @Permissions('user:read', 'user:write')
 * @Get('users')
 * getUsers() {
 *   return { users: [] };
 * }
 * ```
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
