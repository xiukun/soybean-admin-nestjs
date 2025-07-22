import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { ResponseFormatInterceptor } from '../interceptors/response-format.interceptor';

/**
 * 统一API响应格式装饰器
 * 自动格式化响应为标准格式
 */
export function ApiResponse(options?: {
  format?: 'standard' | 'amis';
  description?: string;
  status?: number;
}) {
  const decorators = [
    UseInterceptors(new ResponseFormatInterceptor(options?.format || 'standard')),
  ];

  if (options?.description || options?.status) {
    decorators.push(
      SwaggerApiResponse({
        status: options.status || 200,
        description: options.description || 'Success',
        schema: {
          type: 'object',
          properties: options?.format === 'amis' ? {
            status: { type: 'number', example: 0 },
            msg: { type: 'string', example: 'success' },
            data: { type: 'object' },
          } : {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Success' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      })
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Amis兼容响应格式装饰器
 */
export function AmisResponse(options?: {
  description?: string;
  status?: number;
}) {
  return ApiResponse({
    ...options,
    format: 'amis',
  });
}
