import { Injectable, Scope } from '@nestjs/common';

/**
 * 租户上下文服务
 * 用于在请求生命周期内存储和获取当前租户信息
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string;

  /**
   * 设置当前请求的租户ID
   */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * 获取当前请求的租户ID
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * 检查是否已设置租户ID
   */
  hasTenantId(): boolean {
    return !!this.tenantId;
  }
}