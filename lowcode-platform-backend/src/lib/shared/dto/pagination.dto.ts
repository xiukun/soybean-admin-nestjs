import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max } from 'class-validator';

/**
 * 统一分页请求参数
 * 符合低代码平台的分页参数规范
 */
export class PaginationParamsDto {
  @ApiProperty({
    description: '页码，从1开始',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: '页码必须是正整数' })
  @Min(1, { message: '页码不能小于1' })
  page: number = 1;

  @ApiProperty({
    description: '每页数量，默认10',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: '每页数量必须是正整数' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  perPage: number = 10;

  /**
   * 计算跳过的记录数
   */
  getSkip(): number {
    return (this.page - 1) * this.perPage;
  }

  /**
   * 获取限制数量
   */
  getLimit(): number {
    return this.perPage;
  }

  /**
   * 计算总页数
   */
  getTotalPages(total: number): number {
    return Math.ceil(total / this.perPage);
  }

  /**
   * 验证分页参数
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.page < 1) {
      errors.push('页码不能小于1');
    }

    if (this.perPage < 1) {
      errors.push('每页数量不能小于1');
    }

    if (this.perPage > 100) {
      errors.push('每页数量不能超过100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为amis分页响应格式
   */
  toAmisResponse<T>(items: T[], total: number) {
    return {
      status: 0,
      msg: '',
      data: {
        options: items,
        page: this.page,
        perPage: this.perPage,
        total,
        totalPages: this.getTotalPages(total)
      }
    };
  }
}

/**
 * 分页响应数据
 */
export class PaginationResponseDto<T = any> {
  @ApiProperty({ description: '数据列表' })
  options: T[];

  @ApiProperty({ description: '当前页码，从1开始', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量，默认10', example: 10 })
  perPage: number;

  @ApiProperty({ description: '总数据量', example: 100 })
  total: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;

  constructor(items: T[], page: number, perPage: number, total: number) {
    this.options = items;
    this.page = page;
    this.perPage = perPage;
    this.total = total;
    this.totalPages = Math.ceil(total / perPage);
  }
}

/**
 * 兼容旧版本的分页参数（用于向后兼容）
 */
export class LegacyPaginationParamsDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  pageNum: number = 1;

  @ApiProperty({
    description: '每页大小',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  /**
   * 转换为新版本分页参数
   */
  toNewFormat(): PaginationParamsDto {
    const params = new PaginationParamsDto();
    params.page = this.pageNum;
    params.perPage = this.pageSize;
    return params;
  }
}

/**
 * 搜索和分页参数组合
 */
export class SearchPaginationParamsDto extends PaginationParamsDto {
  @ApiProperty({
    description: '搜索关键词',
    required: false,
    example: 'keyword'
  })
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '排序字段',
    required: false,
    example: 'createdAt'
  })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    description: '排序方向',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 分页工具类
 */
export class PaginationUtil {
  /**
   * 创建分页参数
   */
  static createParams(page: number = 1, perPage: number = 10): PaginationParamsDto {
    const params = new PaginationParamsDto();
    params.page = page;
    params.perPage = perPage;
    return params;
  }

  /**
   * 创建分页响应
   */
  static createResponse<T>(
    items: T[],
    page: number,
    perPage: number,
    total: number
  ): PaginationResponseDto<T> {
    return new PaginationResponseDto(items, page, perPage, total);
  }

  /**
   * 创建amis格式的分页响应
   */
  static createAmisResponse<T>(
    items: T[],
    page: number,
    perPage: number,
    total: number
  ) {
    return {
      status: 0,
      msg: '',
      data: {
        options: items,
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }

  /**
   * 验证分页参数
   */
  static validateParams(page: number, perPage: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(page) || page < 1) {
      errors.push('页码必须是大于0的整数');
    }

    if (!Number.isInteger(perPage) || perPage < 1) {
      errors.push('每页数量必须是大于0的整数');
    }

    if (perPage > 100) {
      errors.push('每页数量不能超过100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 计算分页信息
   */
  static calculatePagination(page: number, perPage: number, total: number) {
    const totalPages = Math.ceil(total / perPage);
    const skip = (page - 1) * perPage;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      perPage,
      total,
      totalPages,
      skip,
      hasNext,
      hasPrev,
      isFirstPage: page === 1,
      isLastPage: page === totalPages
    };
  }
}
