import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

// 公开接口装饰器的元数据键
const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公开接口装饰器
 * 标记不需要JWT认证的接口
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 统一的JWT认证装饰器
 * 自动为Swagger文档添加JWT认证要求和相关响应
 * 
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
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

/**
 * 全局JWT认证装饰器
 * 用于在控制器类上应用，会自动为所有非@Public方法添加JWT认证
 *
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
 */
export const GlobalApiJwtAuth = (scheme: string = 'JWT-auth') => {
  return <T extends new (...args: any[]) => any>(constructor: T): T => {
    // 获取原型上的所有方法
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);

    methodNames.forEach(methodName => {
      if (methodName === 'constructor') return;

      const method = prototype[methodName];
      if (typeof method !== 'function') return;

      // 检查方法是否标记为公开
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, method);

      if (!isPublic) {
        // 为非公开方法应用JWT认证装饰器
        const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
        if (descriptor) {
          const jwtAuthDecorator = ApiJwtAuth(scheme);
          jwtAuthDecorator(prototype, methodName, descriptor);
        }
      }
    });

    return constructor;
  };
};
