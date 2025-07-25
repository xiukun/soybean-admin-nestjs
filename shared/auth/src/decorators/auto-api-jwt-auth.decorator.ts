import { applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiJwtAuth } from './api-jwt-auth.decorator';
import { IS_PUBLIC_KEY } from '../guards/unified-jwt.guard';

/**
 * 自动应用JWT认证的装饰器工厂
 * 根据方法或类是否标记为@Public()来决定是否应用JWT认证
 * 
 * 这个装饰器会在运行时检查目标方法或类是否有@Public()装饰器，
 * 如果没有，则自动应用@ApiJwtAuth()装饰器
 * 
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
 * 
 * @example
 * ```typescript
 * // 在控制器类上使用
 * @AutoApiJwtAuth()
 * @Controller('users')
 * export class UserController {
 *   @Public()
 *   @Get('public')
 *   getPublicData() {
 *     // 这个方法不会应用JWT认证
 *     return { data: 'public' };
 *   }
 * 
 *   @Get('protected')
 *   getProtectedData() {
 *     // 这个方法会自动应用JWT认证
 *     return { data: 'protected' };
 *   }
 * }
 * 
 * // 在方法上使用
 * @Controller('products')
 * export class ProductController {
 *   @AutoApiJwtAuth()
 *   @Get()
 *   getProducts() {
 *     // 这个方法会应用JWT认证
 *     return { products: [] };
 *   }
 * }
 * ```
 */
export const AutoApiJwtAuth = (scheme: string = 'JWT-auth') => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const reflector = new Reflector();
    
    // 检查是否为公开接口
    let isPublic = false;
    
    if (propertyKey && descriptor) {
      // 方法级别的装饰器
      isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, descriptor.value) || false;
      
      if (!isPublic) {
        // 如果不是公开接口，应用JWT认证装饰器
        const jwtAuthDecorator = ApiJwtAuth(scheme);
        jwtAuthDecorator(target, propertyKey, descriptor);
      }
    } else {
      // 类级别的装饰器
      isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, target) || false;
      
      if (!isPublic) {
        // 如果类不是公开的，为所有方法应用JWT认证装饰器
        const prototype = target.prototype;
        const methodNames = Object.getOwnPropertyNames(prototype).filter(
          name => name !== 'constructor' && typeof prototype[name] === 'function'
        );
        
        methodNames.forEach(methodName => {
          const method = prototype[methodName];
          const isMethodPublic = reflector.get<boolean>(IS_PUBLIC_KEY, method) || false;
          
          if (!isMethodPublic) {
            const jwtAuthDecorator = ApiJwtAuth(scheme);
            const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
            if (descriptor) {
              jwtAuthDecorator(prototype, methodName, descriptor);
            }
          }
        });
      }
    }
  };
};

/**
 * 智能JWT认证装饰器
 * 这是一个更智能的版本，它会在编译时分析装饰器元数据
 * 
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
 */
export const SmartApiJwtAuth = (scheme: string = 'JWT-auth') => {
  return applyDecorators(
    // 使用条件装饰器
    (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
      // 在这里我们无法直接访问Reflector，所以我们需要延迟检查
      // 这个装饰器会在Swagger文档生成时被调用
      
      // 检查是否有@Public装饰器的元数据
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, 
        propertyKey ? descriptor?.value : target
      );
      
      if (!isPublic) {
        // 如果不是公开接口，应用JWT认证装饰器
        const jwtAuthDecorator = ApiJwtAuth(scheme);
        if (propertyKey && descriptor) {
          jwtAuthDecorator(target, propertyKey, descriptor);
        } else {
          jwtAuthDecorator(target);
        }
      }
    }
  );
};

/**
 * 全局JWT认证装饰器
 * 用于在控制器类上应用，会自动为所有非@Public方法添加JWT认证
 * 
 * @param scheme JWT认证方案名称，默认为'JWT-auth'
 */
export const GlobalApiJwtAuth = (scheme: string = 'JWT-auth') => {
  return (constructor: Function) => {
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
