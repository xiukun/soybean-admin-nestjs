import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

/**
 * 统一的JWT认证装饰器
 * 自动为Swagger文档添加JWT认证要求和相关响应
 * 
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
 * 
 * @example
 * ```typescript
 * @ApiJwtAuth()
 * @Get('protected')
 * getProtectedData() {
 *   return { data: 'protected' };
 * }
 * 
 * // 使用自定义方案名称
 * @ApiJwtAuth('custom-jwt')
 * @Get('custom-protected')
 * getCustomProtectedData() {
 *   return { data: 'custom protected' };
 * }
 * ```
 */
export const ApiJwtAuth = (scheme: string = 'JWT-auth') => {
  return applyDecorators(
    // 添加Bearer认证要求
    ApiBearerAuth(scheme),
    
    // 添加401未授权响应
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing JWT token',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            example: 1,
            description: 'Error status code'
          },
          msg: {
            type: 'string',
            example: 'Unauthorized',
            description: 'Error message'
          },
          data: {
            type: 'object',
            nullable: true,
            example: null,
            description: 'Response data (null for errors)'
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Invalid or missing JWT token'
              },
              statusCode: {
                type: 'number',
                example: 401
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-07-24T09:46:43.110Z'
              },
              path: {
                type: 'string',
                example: '/api/v1/protected-endpoint'
              },
              method: {
                type: 'string',
                example: 'GET'
              }
            }
          }
        }
      }
    }),
    
    // 添加403禁止访问响应
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            example: 1,
            description: 'Error status code'
          },
          msg: {
            type: 'string',
            example: 'Forbidden',
            description: 'Error message'
          },
          data: {
            type: 'object',
            nullable: true,
            example: null,
            description: 'Response data (null for errors)'
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Access denied. Required roles: admin'
              },
              statusCode: {
                type: 'number',
                example: 403
              },
              requiredRoles: {
                type: 'array',
                items: { type: 'string' },
                example: ['admin']
              },
              userRoles: {
                type: 'array',
                items: { type: 'string' },
                example: ['user']
              }
            }
          }
        }
      }
    })
  );
};
