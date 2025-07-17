/**
 * amis接口规范工具类
 * 用于生成和验证符合amis规范的API响应格式
 */

export interface AmisResponse<T = any> {
  status: number;
  msg: string;
  data: T;
}

export interface AmisPaginationData<T = any> {
  options: T[];
  page: number;     // 页码，从1开始
  perPage: number;  // 每页数量，默认10
  total: number;
}

// 兼容旧版本的接口
export interface AmisPaginationDataLegacy<T = any> {
  options: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export class AmisResponseUtil {
  /**
   * 生成成功响应
   * @param data 响应数据
   * @param dataKey 数据包装的key名称（用于字符串和数组）
   */
  static success<T>(data: T, dataKey?: string): AmisResponse<T> {
    // 处理字符串类型
    if (typeof data === 'string') {
      const key = dataKey || 'text';
      return {
        status: 0,
        msg: '',
        data: {
          [key]: data
        } as T
      };
    }

    // 处理数组类型
    if (Array.isArray(data)) {
      const key = dataKey || 'items';
      return {
        status: 0,
        msg: '',
        data: {
          [key]: data
        } as T
      };
    }

    // 处理对象类型
    return {
      status: 0,
      msg: '',
      data: data || ({} as T)
    };
  }

  /**
   * 生成错误响应
   * @param message 错误消息
   * @param status 错误状态码，默认为1
   */
  static error(message: string, status: number = 1): AmisResponse<{}> {
    return {
      status,
      msg: message,
      data: {}
    };
  }

  /**
   * 生成分页表格响应
   * @param items 数据项
   * @param page 页码，从1开始
   * @param perPage 每页数量，默认10
   * @param total 总数
   */
  static pagination<T>(
    items: T[],
    page: number,
    perPage: number,
    total: number
  ): AmisResponse<AmisPaginationData<T>> {
    return {
      status: 0,
      msg: '',
      data: {
        options: items,
        page,
        perPage,
        total
      }
    };
  }

  /**
   * 生成分页表格响应（兼容旧版本参数名）
   * @param items 数据项
   * @param pageNum 页码
   * @param pageSize 每页大小
   * @param total 总数
   */
  static paginationLegacy<T>(
    items: T[],
    pageNum: number,
    pageSize: number,
    total: number
  ): AmisResponse<AmisPaginationDataLegacy<T>> {
    return {
      status: 0,
      msg: '',
      data: {
        options: items,
        pageNum,
        pageSize,
        total
      }
    };
  }

  /**
   * 验证数据是否需要包装
   * @param data 要验证的数据
   */
  static needsWrapping(data: any): boolean {
    return typeof data === 'string' || Array.isArray(data);
  }

  /**
   * 验证响应是否符合amis规范
   * @param response 响应对象
   */
  static isValidAmisResponse(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // 检查必需字段
    const hasStatus = typeof response.status === 'number';
    const hasMsg = typeof response.msg === 'string';
    const hasData = response.hasOwnProperty('data');

    if (!hasStatus || !hasMsg || !hasData) {
      return false;
    }

    // 检查data字段不能是字符串或数组（除非被包装）
    const data = response.data;
    if (typeof data === 'string' || Array.isArray(data)) {
      return false;
    }

    return true;
  }

  /**
   * 验证分页响应是否符合amis规范
   * @param response 分页响应对象
   */
  static isValidAmisPaginationResponse(response: any): boolean {
    if (!this.isValidAmisResponse(response)) {
      return false;
    }

    const data = response.data;
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查分页必需字段（新版本参数名）
    const hasOptions = Array.isArray(data.options);
    const hasPage = typeof data.page === 'number';
    const hasPerPage = typeof data.perPage === 'number';
    const hasTotal = typeof data.total === 'number';

    // 支持新版本参数名
    if (hasOptions && hasPage && hasPerPage && hasTotal) {
      return true;
    }

    // 兼容旧版本参数名
    const hasPageNum = typeof data.pageNum === 'number';
    const hasPageSize = typeof data.pageSize === 'number';

    return hasOptions && hasPageNum && hasPageSize && hasTotal;
  }

  /**
   * 生成amis响应的JSON Schema
   * @param dataSchema 数据部分的schema
   */
  static generateAmisResponseSchema(dataSchema?: any): any {
    return {
      type: 'object',
      required: ['status', 'msg', 'data'],
      properties: {
        status: {
          type: 'number',
          description: '状态码，0表示成功，非0表示失败'
        },
        msg: {
          type: 'string',
          description: '消息内容'
        },
        data: dataSchema || {
          type: 'object',
          description: '响应数据'
        }
      }
    };
  }

  /**
   * 生成amis分页响应的JSON Schema
   * @param itemSchema 数据项的schema
   */
  static generateAmisPaginationSchema(itemSchema?: any): any {
    return this.generateAmisResponseSchema({
      type: 'object',
      required: ['options', 'page', 'perPage', 'total'],
      properties: {
        options: {
          type: 'array',
          items: itemSchema || { type: 'object' },
          description: '数据列表'
        },
        page: {
          type: 'number',
          description: '当前页码，从1开始'
        },
        perPage: {
          type: 'number',
          description: '每页数量，默认10'
        },
        total: {
          type: 'number',
          description: '总数据量'
        }
      }
    });
  }

  /**
   * 生成amis分页响应的JSON Schema（兼容旧版本）
   * @param itemSchema 数据项的schema
   */
  static generateAmisPaginationSchemaLegacy(itemSchema?: any): any {
    return this.generateAmisResponseSchema({
      type: 'object',
      required: ['options', 'pageNum', 'pageSize', 'total'],
      properties: {
        options: {
          type: 'array',
          items: itemSchema || { type: 'object' },
          description: '数据列表'
        },
        pageNum: {
          type: 'number',
          description: '当前页码'
        },
        pageSize: {
          type: 'number',
          description: '每页大小'
        },
        total: {
          type: 'number',
          description: '总数据量'
        }
      }
    });
  }

  /**
   * 转换普通响应为amis格式
   * @param response 普通响应
   * @param dataKey 数据包装的key名称
   */
  static convertToAmisFormat(response: any, dataKey?: string): AmisResponse {
    if (this.isValidAmisResponse(response)) {
      return response;
    }

    // 如果响应已经有status、msg、data结构，直接返回
    if (response && typeof response === 'object' && 
        response.hasOwnProperty('status') && 
        response.hasOwnProperty('msg') && 
        response.hasOwnProperty('data')) {
      return response;
    }

    // 否则包装为amis格式
    return this.success(response, dataKey);
  }

  /**
   * 获取常用的amis响应示例
   */
  static getExamples() {
    return {
      success: {
        status: 0,
        msg: '',
        data: {
          id: '123',
          name: 'Example'
        }
      },
      error: {
        status: 1,
        msg: '操作失败',
        data: {}
      },
      stringData: {
        status: 0,
        msg: '',
        data: {
          text: 'Hello World'
        }
      },
      arrayData: {
        status: 0,
        msg: '',
        data: {
          items: ['item1', 'item2', 'item3']
        }
      },
      pagination: {
        status: 0,
        msg: '',
        data: {
          options: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ],
          page: 1,
          perPage: 10,
          total: 100
        }
      }
    };
  }
}
