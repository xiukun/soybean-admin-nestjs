/**
 * 统一API响应工具类
 * 参考backend项目的ApiRes实现，提供统一的响应格式
 */

export const RESPONSE_SUCCESS_CODE = 200;
export const RESPONSE_SUCCESS_MSG = 'success';

/**
 * 标准API响应格式
 */
export class ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;

  private constructor(code: number, data: any, message: string = RESPONSE_SUCCESS_MSG) {
    this.code = code;
    this.data = data;
    this.message = message;
  }

  /**
   * 成功响应
   */
  static success<T>(data: T, message: string = RESPONSE_SUCCESS_MSG): ApiResponse<T> {
    return new ApiResponse(RESPONSE_SUCCESS_CODE, data, message);
  }

  /**
   * 成功响应（无数据）
   */
  static ok(message: string = RESPONSE_SUCCESS_MSG): ApiResponse<null> {
    return new ApiResponse(RESPONSE_SUCCESS_CODE, null, message);
  }

  /**
   * 错误响应
   */
  static error<T = null>(code: number, message: string): ApiResponse<T> {
    return new ApiResponse(code, null, message);
  }

  /**
   * 自定义响应
   */
  static custom<T>(code: number, data: T, message: string): ApiResponse<T> {
    return new ApiResponse(code, data, message);
  }
}

/**
 * 分页数据接口
 */
export interface PaginationData<T> {
  current: number;
  size: number;
  total: number;
  records: T[];
}

/**
 * 分页响应工具类
 */
export class PaginationResponse {
  /**
   * 创建分页响应
   */
  static create<T>(
    records: T[],
    current: number,
    size: number,
    total: number,
    message: string = RESPONSE_SUCCESS_MSG
  ): ApiResponse<PaginationData<T>> {
    const paginationData: PaginationData<T> = {
      current,
      size,
      total,
      records,
    };
    return ApiResponse.success(paginationData, message);
  }

  /**
   * 创建简单分页数据（不包装在ApiResponse中）
   * 用于直接返回分页格式的接口
   */
  static simple<T>(
    records: T[],
    current: number,
    size: number,
    total: number
  ): PaginationData<T> {
    return {
      current,
      size,
      total,
      records,
    };
  }
}

/**
 * 列表响应工具类
 */
export class ListResponse {
  /**
   * 创建列表响应
   */
  static create<T>(
    items: T[],
    message: string = RESPONSE_SUCCESS_MSG
  ): ApiResponse<T[]> {
    return ApiResponse.success(items, message);
  }

  /**
   * 创建简单列表数据（不包装在ApiResponse中）
   * 用于直接返回数组格式的接口
   */
  static simple<T>(items: T[]): T[] {
    return items;
  }
}
