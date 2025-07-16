import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/**
 * 应用Bearer认证装饰器
 * 用于Swagger文档中显示需要Bearer token认证的接口
 */
export function ApiJwtAuth() {
  return applyDecorators(
    ApiBearerAuth('bearer'), // 'bearer' 对应 Swagger 配置中的安全方案名称
    ApiSecurity('bearer'), // 添加安全要求
  );
}
