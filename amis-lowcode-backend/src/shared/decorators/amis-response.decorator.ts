import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

/**
 * Amis响应格式装饰器
 * 自动将响应包装为Amis标准格式: { status: number, msg: string, data?: any }
 */
export function AmisResponse() {
  return applyDecorators(UseInterceptors(ResponseInterceptor));
}
