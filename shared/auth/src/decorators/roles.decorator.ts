import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * 标记需要特定角色才能访问的接口
 * 
 * @param roles 需要的角色列表
 * 
 * @example
 * ```typescript
 * @Roles('admin', 'moderator')
 * @Get('admin-only')
 * getAdminData() {
 *   return { data: 'admin data' };
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
