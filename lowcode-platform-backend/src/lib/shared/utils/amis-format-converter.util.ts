/*
 * @Description: AMIS格式转换工具
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 02:00:00
 * @LastEditors: henry.xiukun
 */

/**
 * AMIS格式转换工具类
 * 用于将旧格式的响应数据转换为AMIS标准格式
 */
export class AmisFormatConverter {
  /**
   * 将旧的分页格式转换为AMIS标准格式
   * @param data 旧格式数据 {items: T[], current: number, size: number, total: number}
   * @returns AMIS格式数据 {options: T[], page: number, perPage: number, total: number}
   */
  static convertPaginationToAmis<T>(data: {
    items?: T[];
    records?: T[];
    current?: number;
    page?: number;
    size?: number;
    perPage?: number;
    total: number;
    totalPages?: number;
  }): {
    options: T[];
    page: number;
    perPage: number;
    total: number;
    totalPages?: number;
  } {
    // 处理数据列表字段
    const options = data.items || data.records || [];
    
    // 处理页码字段
    const page = data.page || data.current || 1;
    
    // 处理每页大小字段
    const perPage = data.perPage || data.size || 10;
    
    return {
      options,
      page,
      perPage,
      total: data.total,
      ...(data.totalPages && { totalPages: data.totalPages }),
    };
  }

  /**
   * 将AMIS格式转换为旧的分页格式（用于兼容）
   * @param data AMIS格式数据
   * @returns 旧格式数据
   */
  static convertAmisToLegacy<T>(data: {
    options: T[];
    page: number;
    perPage: number;
    total: number;
    totalPages?: number;
  }): {
    items: T[];
    current: number;
    size: number;
    total: number;
    totalPages?: number;
  } {
    return {
      items: data.options,
      current: data.page,
      size: data.perPage,
      total: data.total,
      ...(data.totalPages && { totalPages: data.totalPages }),
    };
  }

  /**
   * 将数组数据转换为AMIS格式
   * @param data 数组数据
   * @param dataKey 数据键名，默认为'options'
   * @returns AMIS格式数据
   */
  static convertArrayToAmis<T>(data: T[], dataKey: string = 'options'): Record<string, T[]> {
    return {
      [dataKey]: data,
    };
  }

  /**
   * 检查数据是否已经是AMIS格式
   * @param data 待检查的数据
   * @returns 是否为AMIS格式
   */
  static isAmisFormat(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查分页格式
    if (data.options && Array.isArray(data.options) && 
        typeof data.page === 'number' && 
        typeof data.perPage === 'number' && 
        typeof data.total === 'number') {
      return true;
    }

    // 检查数组格式
    if (data.options && Array.isArray(data.options)) {
      return true;
    }

    return false;
  }

  /**
   * 检查数据是否为旧格式
   * @param data 待检查的数据
   * @returns 是否为旧格式
   */
  static isLegacyFormat(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查旧分页格式
    if ((data.items || data.records) && Array.isArray(data.items || data.records) && 
        (typeof data.current === 'number' || typeof data.page === 'number') && 
        (typeof data.size === 'number' || typeof data.perPage === 'number') && 
        typeof data.total === 'number') {
      return true;
    }

    // 检查旧数组格式
    if (data.items && Array.isArray(data.items)) {
      return true;
    }

    return false;
  }

  /**
   * 自动转换数据格式为AMIS标准格式
   * @param data 原始数据
   * @returns AMIS格式数据
   */
  static autoConvertToAmis<T>(data: any): any {
    if (!data) {
      return data;
    }

    // 如果已经是AMIS格式，直接返回
    if (this.isAmisFormat(data)) {
      return data;
    }

    // 如果是旧格式，进行转换
    if (this.isLegacyFormat(data)) {
      return this.convertPaginationToAmis(data);
    }

    // 如果是纯数组，转换为AMIS格式
    if (Array.isArray(data)) {
      return this.convertArrayToAmis(data);
    }

    // 其他情况直接返回
    return data;
  }

  /**
   * 批量转换响应数据
   * @param responses 响应数据数组
   * @returns 转换后的响应数据数组
   */
  static batchConvertToAmis(responses: any[]): any[] {
    return responses.map(response => {
      if (response && response.data) {
        return {
          ...response,
          data: this.autoConvertToAmis(response.data),
        };
      }
      return response;
    });
  }

  /**
   * 验证AMIS格式的完整性
   * @param data AMIS格式数据
   * @returns 验证结果
   */
  static validateAmisFormat(data: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('数据必须是对象类型');
      return { isValid: false, errors, warnings };
    }

    // 检查分页格式
    if (data.options !== undefined) {
      if (!Array.isArray(data.options)) {
        errors.push('options字段必须是数组类型');
      }

      if (data.page !== undefined && typeof data.page !== 'number') {
        errors.push('page字段必须是数字类型');
      }

      if (data.perPage !== undefined && typeof data.perPage !== 'number') {
        errors.push('perPage字段必须是数字类型');
      }

      if (data.total !== undefined && typeof data.total !== 'number') {
        errors.push('total字段必须是数字类型');
      }

      // 检查分页参数的合理性
      if (typeof data.page === 'number' && data.page < 1) {
        warnings.push('page应该从1开始');
      }

      if (typeof data.perPage === 'number' && data.perPage < 1) {
        warnings.push('perPage应该大于0');
      }

      if (typeof data.total === 'number' && data.total < 0) {
        warnings.push('total应该大于等于0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成AMIS格式的示例数据
   * @param itemCount 数据项数量
   * @param page 页码
   * @param perPage 每页大小
   * @returns AMIS格式示例数据
   */
  static generateAmisExample(itemCount: number = 3, page: number = 1, perPage: number = 10): any {
    const options = Array.from({ length: itemCount }, (_, index) => ({
      id: page * perPage - perPage + index + 1,
      name: `Item ${page * perPage - perPage + index + 1}`,
      value: `value_${page * perPage - perPage + index + 1}`,
    }));

    return {
      options,
      page,
      perPage,
      total: 100, // 示例总数
    };
  }
}
