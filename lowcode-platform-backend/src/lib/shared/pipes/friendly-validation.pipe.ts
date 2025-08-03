import { ValidationPipe, ValidationPipeOptions, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { FriendlyValidationException } from '../exceptions/validation.exception';

/**
 * 友好的验证管道 - 提供更好的错误信息
 */
export class FriendlyValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      // 默认配置
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // 自定义异常工厂
      exceptionFactory: (errors: ValidationError[]) => {
        return FriendlyValidationException.fromValidationErrors(errors);
      },
      // 合并用户提供的选项
      ...options,
    });
  }

  /**
   * 重写 transform 方法以提供更好的错误处理
   */
  async transform(value: any, metadata: ArgumentMetadata) {
    try {
      return await super.transform(value, metadata);
    } catch (error) {
      // 如果是我们的友好验证异常，直接抛出
      if (error instanceof FriendlyValidationException) {
        throw error;
      }
      
      // 如果是其他类型的 BadRequestException，尝试转换
      if (error instanceof BadRequestException) {
        const response = error.getResponse() as any;
        
        // 检查是否包含验证错误信息
        if (response && response.message && Array.isArray(response.message)) {
          // 尝试解析为 ValidationError 格式
          const validationErrors = this.parseErrorMessages(response.message);
          if (validationErrors.length > 0) {
            throw FriendlyValidationException.fromValidationErrors(validationErrors);
          }
        }
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }

  /**
   * 解析错误消息为 ValidationError 格式
   */
  private parseErrorMessages(messages: string[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];
    
    for (const message of messages) {
      // 尝试从消息中提取字段名和约束
      const match = message.match(/^(\w+)\s+(.+)$/);
      if (match) {
        const [, property, constraint] = match;
        const validationError = new ValidationError();
        validationError.property = property;
        validationError.constraints = { custom: constraint };
        validationError.value = undefined;
        validationErrors.push(validationError);
      } else {
        // 如果无法解析，创建一个通用错误
        const validationError = new ValidationError();
        validationError.property = 'unknown';
        validationError.constraints = { custom: message };
        validationError.value = undefined;
        validationErrors.push(validationError);
      }
    }
    
    return validationErrors;
  }
}

/**
 * 创建友好验证管道的工厂函数
 */
export function createFriendlyValidationPipe(options?: ValidationPipeOptions): FriendlyValidationPipe {
  return new FriendlyValidationPipe(options);
}

/**
 * 预定义的验证管道配置
 */
export const FRIENDLY_VALIDATION_PIPE_OPTIONS = {
  // 严格模式 - 用于生产环境
  strict: {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    disableErrorMessages: false,
    transformOptions: {
      enableImplicitConversion: true,
      excludeExtraneousValues: true,
    },
  } as ValidationPipeOptions,
  
  // 宽松模式 - 用于开发环境
  lenient: {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    forbidUnknownValues: false,
    disableErrorMessages: false,
    transformOptions: {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    },
  } as ValidationPipeOptions,
  
  // 调试模式 - 提供详细的错误信息
  debug: {
    transform: true,
    whitelist: false,
    forbidNonWhitelisted: false,
    forbidUnknownValues: false,
    disableErrorMessages: false,
    validationError: {
      target: true,
      value: true,
    },
    transformOptions: {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    },
  } as ValidationPipeOptions,
};