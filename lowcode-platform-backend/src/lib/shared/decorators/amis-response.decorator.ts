import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';
import { AmisResponseUtil } from '@lib/bounded-contexts/api-config/domain/amis-response.util';

export const AMIS_RESPONSE_KEY = 'amis_response';

/**
 * amis响应格式装饰器
 * 用于标记API接口需要返回amis格式的响应
 */
export function AmisResponse(options?: {
  dataKey?: string;
  description?: string;
  example?: any;
  schema?: any;
}) {
  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [
    SetMetadata(AMIS_RESPONSE_KEY, {
      dataKey: options?.dataKey,
      enabled: true
    })
  ];

  // 添加Swagger文档
  if (options?.description || options?.example || options?.schema) {
    const schema = options?.schema || AmisResponseUtil.generateAmisResponseSchema();
    const example = options?.example || AmisResponseUtil.getExamples().success;

    decorators.push(
      ApiResponse({
        status: 200,
        description: options?.description || 'Success response in amis format',
        schema,
        example
      } as ApiResponseOptions)
    );
  }

  return applyDecorators(...decorators);
}

/**
 * amis分页响应格式装饰器
 * 用于标记API接口需要返回amis分页格式的响应
 */
export function AmisPaginationResponse(options?: {
  description?: string;
  example?: any;
  itemSchema?: any;
}) {
  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [
    SetMetadata(AMIS_RESPONSE_KEY, {
      pagination: true,
      enabled: true
    })
  ];

  // 添加Swagger文档
  if (options?.description || options?.example || options?.itemSchema) {
    const schema = AmisResponseUtil.generateAmisPaginationSchema(options?.itemSchema);
    const example = options?.example || AmisResponseUtil.getExamples().pagination;

    decorators.push(
      ApiResponse({
        status: 200,
        description: options?.description || 'Paginated response in amis format',
        schema,
        example
      } as ApiResponseOptions)
    );
  }

  return applyDecorators(...decorators);
}

/**
 * amis错误响应格式装饰器
 */
export function AmisErrorResponse(status: number, message: string) {
  return ApiResponse({
    status,
    description: message,
    schema: AmisResponseUtil.generateAmisResponseSchema(),
    example: AmisResponseUtil.error(message, status)
  } as ApiResponseOptions);
}
