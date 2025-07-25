/*
 * @Description: AMIS格式标准化拦截器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 02:00:00
 * @LastEditors: henry.xiukun
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AmisFormatConverter } from '../utils/amis-format-converter.util';
import { AMIS_RESPONSE_KEY } from '@decorators/amis-response.decorator';

/**
 * AMIS格式标准化拦截器
 * 自动将响应数据转换为AMIS标准格式
 */
@Injectable()
export class AmisFormatInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AmisFormatInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const amisMetadata = this.reflector.getAllAndOverride(AMIS_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有AMIS响应元数据，直接返回
    if (!amisMetadata?.enabled) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        try {
          // 如果数据已经是完整的AMIS响应格式，直接返回
          if (this.isCompleteAmisResponse(data)) {
            return this.validateAndConvertResponse(data, amisMetadata);
          }

          // 包装为AMIS响应格式
          const amisResponse = {
            status: 0,
            msg: '',
            data: this.convertDataToAmisFormat(data, amisMetadata),
          };

          return this.validateAndConvertResponse(amisResponse, amisMetadata);
        } catch (error) {
          this.logger.error(`AMIS格式转换失败: ${error.message}`, error.stack);
          
          // 返回错误响应
          return {
            status: 1,
            msg: `格式转换失败: ${error.message}`,
            data: {},
          };
        }
      }),
    );
  }

  /**
   * 检查是否为完整的AMIS响应格式
   */
  private isCompleteAmisResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.status === 'number' &&
      typeof data.msg === 'string' &&
      data.data !== undefined
    );
  }

  /**
   * 转换数据为AMIS格式
   */
  private convertDataToAmisFormat(data: any, metadata: any): any {
    if (!data) {
      return data;
    }

    // 如果指定了dataKey，处理字符串和数组类型
    if (metadata.dataKey) {
      if (typeof data === 'string') {
        return { [metadata.dataKey]: data };
      }
      
      if (Array.isArray(data)) {
        return { [metadata.dataKey]: data };
      }
    }

    // 处理分页数据
    if (metadata.pagination) {
      return AmisFormatConverter.autoConvertToAmis(data);
    }

    // 自动转换
    return AmisFormatConverter.autoConvertToAmis(data);
  }

  /**
   * 验证并转换响应数据
   */
  private validateAndConvertResponse(response: any, metadata: any): any {
    if (!response.data) {
      return response;
    }

    // 验证AMIS格式
    const validation = AmisFormatConverter.validateAmisFormat(response.data);
    
    if (!validation.isValid) {
      this.logger.warn(`AMIS格式验证失败: ${validation.errors.join(', ')}`);
      
      // 尝试自动修复
      try {
        response.data = AmisFormatConverter.autoConvertToAmis(response.data);
        this.logger.log('AMIS格式自动修复成功');
      } catch (error) {
        this.logger.error(`AMIS格式自动修复失败: ${error.message}`);
      }
    }

    if (validation.warnings.length > 0) {
      this.logger.warn(`AMIS格式警告: ${validation.warnings.join(', ')}`);
    }

    return response;
  }
}

/**
 * AMIS格式验证装饰器
 * 用于标记需要进行AMIS格式验证的接口
 */
export function AmisFormatValidation() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // 验证返回结果的AMIS格式
      if (result && result.data) {
        const validation = AmisFormatConverter.validateAmisFormat(result.data);
        
        if (!validation.isValid) {
          const logger = new Logger('AmisFormatValidation');
          logger.warn(`方法 ${propertyName} 返回的数据不符合AMIS格式: ${validation.errors.join(', ')}`);
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * AMIS格式自动转换装饰器
 * 用于自动转换方法返回值为AMIS格式
 */
export function AmisAutoConvert(options?: {
  dataKey?: string;
  pagination?: boolean;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // 如果已经是AMIS响应格式，直接返回
      if (result && typeof result.status === 'number' && result.data !== undefined) {
        return result;
      }
      
      // 转换为AMIS格式
      let convertedData = result;
      
      if (options?.dataKey && (typeof result === 'string' || Array.isArray(result))) {
        convertedData = { [options.dataKey]: result };
      } else if (options?.pagination) {
        convertedData = AmisFormatConverter.autoConvertToAmis(result);
      } else {
        convertedData = AmisFormatConverter.autoConvertToAmis(result);
      }
      
      return {
        status: 0,
        msg: '',
        data: convertedData,
      };
    };
    
    return descriptor;
  };
}
