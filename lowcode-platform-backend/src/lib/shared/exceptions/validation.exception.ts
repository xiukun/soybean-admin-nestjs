import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * 友好的验证错误信息接口
 */
export interface FriendlyValidationError {
  /** 字段名 */
  field: string;
  /** 字段的中文名称 */
  fieldLabel?: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 当前值 */
  value?: any;
  /** 约束条件 */
  constraints?: Record<string, any>;
}

/**
 * 验证异常类 - 提供友好的错误信息
 */
export class FriendlyValidationException extends HttpException {
  constructor(
    public readonly validationErrors: FriendlyValidationError[],
    message: string = '请求参数验证失败'
  ) {
    super(
      {
        message,
        code: 'VALIDATION_FAILED',
        errors: validationErrors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * 从 class-validator 的 ValidationError 创建友好的验证异常
   */
  static fromValidationErrors(errors: ValidationError[]): FriendlyValidationException {
    const friendlyErrors = FriendlyValidationException.transformValidationErrors(errors);
    return new FriendlyValidationException(friendlyErrors);
  }

  /**
   * 转换 class-validator 的错误为友好的错误信息
   */
  private static transformValidationErrors(
    errors: ValidationError[],
    parentPath: string = ''
  ): FriendlyValidationError[] {
    const friendlyErrors: FriendlyValidationError[] = [];

    for (const error of errors) {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
      const fieldLabel = this.getFieldLabel(error.property);

      // 处理嵌套验证错误
      if (error.children && error.children.length > 0) {
        friendlyErrors.push(
          ...this.transformValidationErrors(error.children, fieldPath)
        );
      }

      // 处理当前字段的约束错误
      if (error.constraints) {
        for (const [constraintKey, constraintMessage] of Object.entries(error.constraints)) {
          friendlyErrors.push({
            field: fieldPath,
            fieldLabel,
            message: this.getFriendlyMessage(error.property, constraintKey, constraintMessage, error.value),
            code: constraintKey.toUpperCase(),
            value: error.value,
            constraints: { [constraintKey]: constraintMessage },
          });
        }
      }
    }

    return friendlyErrors;
  }

  /**
   * 获取字段的中文标签
   */
  private static getFieldLabel(fieldName: string): string {
    const fieldLabels: Record<string, string> = {
      // 通用字段
      'name': '名称',
      'code': '代码',
      'description': '描述',
      'status': '状态',
      'category': '分类',
      'tableName': '表名',
      'projectId': '项目ID',
      'entityId': '实体ID',
      'fieldId': '字段ID',
      'templateId': '模板ID',
      
      // 实体相关字段
      'diagramPosition': '图表位置',
      'config': '配置',
      'commonFieldOptions': '通用字段选项',
      
      // 字段相关
      'dataType': '数据类型',
      'length': '长度',
      'precision': '精度',
      'scale': '小数位数',
      'nullable': '可为空',
      'defaultValue': '默认值',
      'comment': '注释',
      'indexed': '索引',
      'unique': '唯一',
      'primaryKey': '主键',
      'autoIncrement': '自增',
      
      // API相关
      'method': '请求方法',
      'path': '路径',
      'authRequired': '需要认证',
      'queryConfig': '查询配置',
      'responseConfig': '响应配置',
      
      // 模板相关
      'content': '模板内容',
      'variables': '变量',
      'framework': '框架',
      'architecture': '架构',
      
      // 分页相关
      'current': '当前页',
      'size': '页面大小',
      'page': '页码',
      'perPage': '每页数量',
      'limit': '限制数量',
    };

    return fieldLabels[fieldName] || fieldName;
  }

  /**
   * 获取友好的错误消息
   */
  private static getFriendlyMessage(
    fieldName: string,
    constraintKey: string,
    originalMessage: string,
    value?: any
  ): string {
    const fieldLabel = this.getFieldLabel(fieldName);
    
    // 根据约束类型生成友好的错误消息
    switch (constraintKey) {
      case 'isNotEmpty':
        return `${fieldLabel}不能为空`;
      
      case 'isString':
        return `${fieldLabel}必须是字符串类型`;
      
      case 'isNumber':
        return `${fieldLabel}必须是数字类型`;
      
      case 'isBoolean':
        return `${fieldLabel}必须是布尔类型`;
      
      case 'isEmail':
        return `${fieldLabel}必须是有效的邮箱地址`;
      
      case 'isUuid':
        return `${fieldLabel}必须是有效的UUID格式`;
      
      case 'isEnum':
        return `${fieldLabel}的值不在允许的选项中`;
      
      case 'minLength':
        const minLength = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}长度不能少于${minLength}个字符`;
      
      case 'maxLength':
        const maxLength = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}长度不能超过${maxLength}个字符`;
      
      case 'min':
        const minValue = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}不能小于${minValue}`;
      
      case 'max':
        const maxValue = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}不能大于${maxValue}`;
      
      case 'isArray':
        return `${fieldLabel}必须是数组类型`;
      
      case 'isObject':
        return `${fieldLabel}必须是对象类型`;
      
      case 'matches':
        return `${fieldLabel}格式不正确`;
      
      case 'isOptional':
        return `${fieldLabel}是可选字段`;
      
      case 'whitelistValidation':
        return `${fieldLabel}包含不允许的属性`;
      
      case 'isDateString':
        return `${fieldLabel}必须是有效的日期格式`;
      
      case 'isUrl':
        return `${fieldLabel}必须是有效的URL地址`;
      
      case 'isPhoneNumber':
        return `${fieldLabel}必须是有效的手机号码`;
      
      case 'isPositive':
        return `${fieldLabel}必须是正数`;
      
      case 'isNegative':
        return `${fieldLabel}必须是负数`;
      
      case 'isDivisibleBy':
        return `${fieldLabel}必须能被指定数字整除`;
      
      case 'isAlpha':
        return `${fieldLabel}只能包含字母`;
      
      case 'isAlphanumeric':
        return `${fieldLabel}只能包含字母和数字`;
      
      case 'isDecimal':
        return `${fieldLabel}必须是小数`;
      
      case 'isInt':
        return `${fieldLabel}必须是整数`;
      
      case 'isJSON':
        return `${fieldLabel}必须是有效的JSON格式`;
      
      case 'isJWT':
        return `${fieldLabel}必须是有效的JWT令牌`;
      
      case 'isBase64':
        return `${fieldLabel}必须是有效的Base64编码`;
      
      case 'isHexColor':
        return `${fieldLabel}必须是有效的十六进制颜色值`;
      
      case 'isMimeType':
        return `${fieldLabel}必须是有效的MIME类型`;
      
      case 'arrayMinSize':
        const arrayMinSize = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}至少需要${arrayMinSize}个元素`;
      
      case 'arrayMaxSize':
        const arrayMaxSize = this.extractNumberFromMessage(originalMessage);
        return `${fieldLabel}最多只能有${arrayMaxSize}个元素`;
      
      case 'arrayNotEmpty':
        return `${fieldLabel}不能是空数组`;
      
      case 'arrayUnique':
        return `${fieldLabel}中的元素必须唯一`;
      
      default:
        // 如果没有匹配的友好消息，返回原始消息但加上字段标签
        return `${fieldLabel}: ${originalMessage}`;
    }
  }

  /**
   * 从错误消息中提取数字
   */
  private static extractNumberFromMessage(message: string): string {
    const match = message.match(/\d+/);
    return match ? match[0] : '未知';
  }

  /**
   * 获取简化的错误摘要
   */
  getErrorSummary(): string {
    if (this.validationErrors.length === 0) {
      return '验证失败';
    }

    if (this.validationErrors.length === 1) {
      return this.validationErrors[0].message;
    }

    const fieldCount = new Set(this.validationErrors.map(e => e.field)).size;
    return `${fieldCount}个字段验证失败：${this.validationErrors.map(e => e.fieldLabel || e.field).join('、')}`;
  }

  /**
   * 获取按字段分组的错误信息
   */
  getErrorsByField(): Record<string, FriendlyValidationError[]> {
    const errorsByField: Record<string, FriendlyValidationError[]> = {};
    
    for (const error of this.validationErrors) {
      if (!errorsByField[error.field]) {
        errorsByField[error.field] = [];
      }
      errorsByField[error.field].push(error);
    }
    
    return errorsByField;
  }
}