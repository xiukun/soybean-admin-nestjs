import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

/**
 * 基础查询DTO
 * 所有查询DTO都应该继承此类
 */
export class BaseQueryDto {
  @ApiPropertyOptional({
    description: '当前页码，从1开始',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  current?: number = 1;

  @ApiPropertyOptional({
    description: '每页大小，默认10',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 10;

  @ApiPropertyOptional({
    description: '排序字段，格式：field:order',
    example: 'createdAt:desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: '搜索关键词',
    example: 'keyword',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * 分页查询DTO（兼容旧版本参数名）
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '排序字段',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: '搜索关键词',
    example: 'keyword',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

/**
 * 批量操作DTO
 */
export class BatchOperationDto {
  @ApiPropertyOptional({
    description: 'ID列表',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsOptional()
  ids?: string[];
}

/**
 * 日期范围查询DTO
 */
export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: '开始日期',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * 扩展查询DTO（包含日期范围）
 */
export class ExtendedQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: '开始日期',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '状态过滤',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: '创建者过滤',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
