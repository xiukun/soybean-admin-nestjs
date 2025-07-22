import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 基础响应DTO
 */
export abstract class BaseResponseDto<T = any> {
  @ApiProperty({
    description: '状态码，0表示成功，非0表示失败',
    example: 0,
  })
  status: number;

  @ApiProperty({
    description: '响应消息',
    example: 'success',
  })
  msg: string;

  @ApiPropertyOptional({
    description: '响应数据',
  })
  data?: T;
}

/**
 * 分页响应DTO
 */
export class PaginationResponseDto<T> extends BaseResponseDto<{
  items: T[];
  current: number;
  size: number;
  total: number;
  totalPages?: number;
}> {
  @ApiProperty({
    description: '分页数据',
  })
  declare data: {
    items: T[];
    current: number;
    size: number;
    total: number;
    totalPages?: number;
  };
}

/**
 * 列表响应DTO（兼容旧版本）
 */
export class ListResponseDto<T> extends BaseResponseDto<{
  items: T[];
  current: number;
  size: number;
  total: number;
  totalPages?: number;
}> {
  @ApiProperty({
    description: '列表数据',
  })
  declare data: {
    items: T[];
    current: number;
    size: number;
    total: number;
    totalPages?: number;
  };
}

/**
 * 单个实体响应DTO
 */
export class EntityResponseDto<T> extends BaseResponseDto<T> {
  @ApiProperty({
    description: '实体数据',
  })
  declare data: T;
}

/**
 * 删除响应DTO
 */
export class DeleteResponseDto extends BaseResponseDto<{
  id: string;
  deletedAt: string;
}> {
  @ApiProperty({
    description: '删除结果',
  })
  declare data: {
    id: string;
    deletedAt: string;
  };
}

/**
 * 批量创建响应DTO
 */
export class BatchCreateResponseDto<T> extends BaseResponseDto<{
  success: T[];
  failed: Array<{
    item: any;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}> {
  @ApiProperty({
    description: '批量创建结果',
  })
  declare data: {
    success: T[];
    failed: Array<{
      item: any;
      error: string;
    }>;
    total: number;
    successCount: number;
    failedCount: number;
  };
}

/**
 * 批量删除响应DTO
 */
export class BatchDeleteResponseDto extends BaseResponseDto<{
  deletedIds: string[];
  failedIds: Array<{
    id: string;
    error: string;
  }>;
  deletedCount: number;
  failedCount: number;
}> {
  @ApiProperty({
    description: '批量删除结果',
  })
  declare data: {
    deletedIds: string[];
    failedIds: Array<{
      id: string;
      error: string;
    }>;
    deletedCount: number;
    failedCount: number;
  };
}

/**
 * 错误响应DTO
 */
export class ErrorResponseDto extends BaseResponseDto<any> {
  @ApiProperty({
    description: '错误状态码',
    example: 1,
  })
  declare status: number;

  @ApiProperty({
    description: '错误消息',
    example: '操作失败',
  })
  declare msg: string;

  @ApiProperty({
    description: '错误详情',
    example: {},
  })
  declare data: any;
}

/**
 * 关系查询响应DTO
 */
export class RelationResponseDto<T> extends BaseResponseDto<{
  items: T[];
  total: number;
  current: number;
  size: number;
  relation: {
    type: string;
    sourceEntity: string;
    targetEntity: string;
    sourceField: string;
    targetField: string;
  };
}> {
  @ApiProperty({
    description: '关系查询结果',
  })
  declare data: {
    items: T[];
    total: number;
    current: number;
    size: number;
    relation: {
      type: string;
      sourceEntity: string;
      targetEntity: string;
      sourceField: string;
      targetField: string;
    };
  };
}

/**
 * 操作结果响应DTO
 */
export class OperationResultDto extends BaseResponseDto<{
  success: boolean;
  message?: string;
  affectedRows?: number;
  timestamp: string;
}> {
  @ApiProperty({
    description: '操作结果',
  })
  declare data: {
    success: boolean;
    message?: string;
    affectedRows?: number;
    timestamp: string;
  };
}

/**
 * 统计响应DTO
 */
export class StatisticsResponseDto extends BaseResponseDto<{
  total: number;
  active?: number;
  inactive?: number;
  [key: string]: any;
}> {
  @ApiProperty({
    description: '统计数据',
  })
  declare data: {
    total: number;
    active?: number;
    inactive?: number;
    [key: string]: any;
  };
}
