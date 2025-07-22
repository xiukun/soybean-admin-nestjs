import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

/**
 * Amis响应装饰器选项
 */
export interface AmisResponseOptions {
  description?: string;
  status?: number;
  type?: any;
}

/**
 * Amis响应格式装饰器
 * 自动将响应包装为Amis标准格式: { status: number, msg: string, data?: any }
 */
export function AmisResponse(options: AmisResponseOptions = {}) {
  const {
    description = '操作成功',
    status = 200,
    type
  } = options;

  const decorators = [
    UseInterceptors(ResponseInterceptor),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            description: '状态码，0表示成功',
            example: 0
          },
          msg: {
            type: 'string',
            description: '响应消息',
            example: description
          },
          data: {
            description: '响应数据',
            ...(type && { type })
          }
        }
      }
    } as ApiResponseOptions)
  ];

  return applyDecorators(...decorators);
}

/**
 * Amis分页响应装饰器
 * 专门用于分页数据的响应
 */
export function AmisPaginationResponse(options: AmisResponseOptions = {}) {
  const {
    description = '分页数据获取成功',
    status = 200
  } = options;

  return applyDecorators(
    UseInterceptors(ResponseInterceptor),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            description: '状态码，0表示成功',
            example: 0
          },
          msg: {
            type: 'string',
            description: '响应消息',
            example: description
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                description: '数据列表',
                items: { type: 'object' }
              },
              total: {
                type: 'number',
                description: '总数量',
                example: 100
              },
              current: {
                type: 'number',
                description: '当前页码',
                example: 1
              },
              size: {
                type: 'number',
                description: '每页大小',
                example: 10
              }
            }
          }
        }
      }
    } as ApiResponseOptions)
  );
}
