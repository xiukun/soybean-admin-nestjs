import { Injectable } from '@nestjs/common';
import { Field, FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { Entity } from '@entity/domain/entity.model';
import { CommonFieldService } from './common-field.service';

export interface FieldValidationError {
  fieldCode: string;
  fieldName: string;
  errorType: 'error' | 'warning';
  message: string;
}

export interface EntityValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
  warnings: FieldValidationError[];
  summary: {
    totalFields: number;
    errorCount: number;
    warningCount: number;
    commonFieldsCount: number;
    businessFieldsCount: number;
  };
}

@Injectable()
export class EntityFieldValidatorService {
  constructor(private readonly commonFieldService: CommonFieldService) {}

  /**
   * 验证实体的所有字段
   */
  async validateEntityFields(entity: Entity, fields: Field[]): Promise<EntityValidationResult> {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    // 验证通用字段
    const commonFieldValidation = this.validateCommonFields(fields);
    errors.push(...commonFieldValidation.errors);
    warnings.push(...commonFieldValidation.warnings);

    // 验证业务字段
    const businessFields = this.filterBusinessFields(fields);
    for (const field of businessFields) {
      const fieldValidation = this.validateSingleField(field);
      errors.push(...fieldValidation.errors);
      warnings.push(...fieldValidation.warnings);
    }

    // 验证字段之间的关系
    const relationValidation = this.validateFieldRelations(fields);
    errors.push(...relationValidation.errors);
    warnings.push(...relationValidation.warnings);

    // 验证实体级别的约束
    const entityValidation = this.validateEntityConstraints(entity, fields);
    errors.push(...entityValidation.errors);
    warnings.push(...entityValidation.warnings);

    const commonFieldsCount = this.commonFieldService.getCommonFieldDefinitions().length;
    const businessFieldsCount = fields.length - commonFieldsCount;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalFields: fields.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        commonFieldsCount,
        businessFieldsCount: Math.max(0, businessFieldsCount),
      },
    };
  }

  /**
   * 验证通用字段
   */
  private validateCommonFields(fields: Field[]): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    const commonFieldDefinitions = this.commonFieldService.getCommonFieldDefinitions();
    const fieldCodes = fields.map(f => f.code);

    // 检查是否缺少必需的通用字段
    for (const commonField of commonFieldDefinitions) {
      if (!fieldCodes.includes(commonField.code)) {
        errors.push({
          fieldCode: commonField.code,
          fieldName: commonField.name,
          errorType: 'error',
          message: `缺少必需的通用字段: ${commonField.name}`,
        });
      }
    }

    // 检查通用字段的配置是否正确
    for (const field of fields) {
      const commonField = commonFieldDefinitions.find(cf => cf.code === field.code);
      if (commonField) {
        const validation = this.validateCommonFieldConfiguration(field, commonField);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证通用字段配置
   */
  private validateCommonFieldConfiguration(
    field: Field,
    commonFieldDefinition: any
  ): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    // 验证数据类型
    if (field.dataType !== commonFieldDefinition.dataType) {
      errors.push({
        fieldCode: field.code,
        fieldName: field.name,
        errorType: 'error',
        message: `通用字段 ${field.name} 的数据类型应为 ${commonFieldDefinition.dataType}，当前为 ${field.dataType}`,
      });
    }

    // 验证必填属性
    if (field.required !== commonFieldDefinition.required) {
      errors.push({
        fieldCode: field.code,
        fieldName: field.name,
        errorType: 'error',
        message: `通用字段 ${field.name} 的必填属性应为 ${commonFieldDefinition.required}，当前为 ${field.required}`,
      });
    }

    // 验证字段名称
    if (field.name !== commonFieldDefinition.name) {
      warnings.push({
        fieldCode: field.code,
        fieldName: field.name,
        errorType: 'warning',
        message: `通用字段 ${field.code} 的名称建议使用标准名称: ${commonFieldDefinition.name}`,
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证单个字段
   */
  private validateSingleField(field: Field): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    // 验证字段名称
    if (!field.name || field.name.trim().length === 0) {
      errors.push({
        fieldCode: field.code,
        fieldName: field.name,
        errorType: 'error',
        message: '字段名称不能为空',
      });
    }

    // 验证字段代码
    const codeValidation = this.validateFieldCode(field.code);
    if (!codeValidation.isValid) {
      errors.push({
        fieldCode: field.code,
        fieldName: field.name,
        errorType: 'error',
        message: codeValidation.message,
      });
    }

    // 验证数据类型特定的约束
    const dataTypeValidation = this.validateDataTypeConstraints(field);
    errors.push(...dataTypeValidation.errors);
    warnings.push(...dataTypeValidation.warnings);

    // 验证默认值
    const defaultValueValidation = this.validateDefaultValue(field);
    errors.push(...defaultValueValidation.errors);
    warnings.push(...defaultValueValidation.warnings);

    return { errors, warnings };
  }

  /**
   * 验证字段代码
   */
  private validateFieldCode(code: string): { isValid: boolean; message: string } {
    if (!code || code.trim().length === 0) {
      return { isValid: false, message: '字段代码不能为空' };
    }

    // 检查字段代码格式
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!codeRegex.test(code)) {
      return { isValid: false, message: '字段代码必须以字母开头，只能包含字母、数字和下划线' };
    }

    // 检查长度
    if (code.length > 50) {
      return { isValid: false, message: '字段代码长度不能超过50个字符' };
    }

    // 检查是否为保留字
    const reservedWords = ['id', 'class', 'type', 'order', 'group', 'select', 'from', 'where', 'insert', 'update', 'delete'];
    if (reservedWords.includes(code.toLowerCase())) {
      return { isValid: false, message: `字段代码不能使用保留字: ${code}` };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 验证数据类型约束
   */
  private validateDataTypeConstraints(field: Field): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    switch (field.dataType) {
      case FieldDataType.STRING:
        if (!field.length || field.length <= 0) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'STRING类型字段必须指定长度',
          });
        } else if (field.length > 4000) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'STRING类型字段长度超过4000，建议使用TEXT类型',
          });
        }
        if (field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'STRING类型字段不需要指定精度',
          });
        }
        break;

      case FieldDataType.INTEGER:
        if (field.length) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'INTEGER类型字段不需要指定长度',
          });
        }
        if (field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'INTEGER类型字段不需要指定精度',
          });
        }
        break;

      case FieldDataType.DECIMAL:
        if (!field.precision || field.precision <= 0) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'DECIMAL类型字段必须指定精度',
          });
        }
        if (field.precision && field.precision > 38) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'DECIMAL类型字段精度不能超过38',
          });
        }
        break;

      case FieldDataType.TEXT:
        if (field.length || field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'TEXT类型字段不需要指定长度或精度',
          });
        }
        break;

      case FieldDataType.BOOLEAN:
        if (field.length || field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'BOOLEAN类型字段不需要指定长度或精度',
          });
        }
        break;

      case FieldDataType.DATE:
      case FieldDataType.DATETIME:
        if (field.length || field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: '日期时间类型字段不需要指定长度或精度',
          });
        }
        break;

      case FieldDataType.JSON:
        if (field.length || field.precision) {
          warnings.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'warning',
            message: 'JSON类型字段不需要指定长度或精度',
          });
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * 验证默认值
   */
  private validateDefaultValue(field: Field): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    if (!field.defaultValue) {
      return { errors, warnings };
    }

    const defaultValue = field.defaultValue;

    switch (field.dataType) {
      case FieldDataType.INTEGER:
        if (!/^-?\d+$/.test(defaultValue)) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'INTEGER类型字段的默认值必须是整数',
          });
        }
        break;

      case FieldDataType.DECIMAL:
        if (!/^-?\d+(\.\d+)?$/.test(defaultValue)) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'DECIMAL类型字段的默认值必须是数字',
          });
        }
        break;

      case FieldDataType.BOOLEAN:
        if (!['true', 'false', '1', '0'].includes(defaultValue.toLowerCase())) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'BOOLEAN类型字段的默认值必须是true、false、1或0',
          });
        }
        break;

      case FieldDataType.DATE:
        if (!this.isValidDate(defaultValue)) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'DATE类型字段的默认值必须是有效的日期格式(YYYY-MM-DD)',
          });
        }
        break;

      case FieldDataType.DATETIME:
        if (!this.isValidDateTime(defaultValue)) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'DATETIME类型字段的默认值必须是有效的日期时间格式',
          });
        }
        break;

      case FieldDataType.JSON:
        try {
          JSON.parse(defaultValue);
        } catch (e) {
          errors.push({
            fieldCode: field.code,
            fieldName: field.name,
            errorType: 'error',
            message: 'JSON类型字段的默认值必须是有效的JSON格式',
          });
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * 验证字段之间的关系
   */
  private validateFieldRelations(fields: Field[]): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    // 检查字段代码重复
    const fieldCodes = fields.map(f => f.code);
    const duplicateCodes = fieldCodes.filter((code, index) => fieldCodes.indexOf(code) !== index);
    
    for (const duplicateCode of [...new Set(duplicateCodes)]) {
      const duplicateFields = fields.filter(f => f.code === duplicateCode);
      for (const field of duplicateFields) {
        errors.push({
          fieldCode: field.code,
          fieldName: field.name,
          errorType: 'error',
          message: `字段代码重复: ${duplicateCode}`,
        });
      }
    }

    // 检查字段名称重复
    const fieldNames = fields.map(f => f.name);
    const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    
    for (const duplicateName of [...new Set(duplicateNames)]) {
      const duplicateFields = fields.filter(f => f.name === duplicateName);
      for (const field of duplicateFields) {
        warnings.push({
          fieldCode: field.code,
          fieldName: field.name,
          errorType: 'warning',
          message: `字段名称重复: ${duplicateName}`,
        });
      }
    }

    // 检查显示顺序重复
    const displayOrders = fields.map(f => f.displayOrder);
    const duplicateOrders = displayOrders.filter((order, index) => displayOrders.indexOf(order) !== index);
    
    for (const duplicateOrder of [...new Set(duplicateOrders)]) {
      const duplicateFields = fields.filter(f => f.displayOrder === duplicateOrder);
      for (const field of duplicateFields) {
        warnings.push({
          fieldCode: field.code,
          fieldName: field.name,
          errorType: 'warning',
          message: `显示顺序重复: ${duplicateOrder}`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证实体级别的约束
   */
  private validateEntityConstraints(entity: Entity, fields: Field[]): { errors: FieldValidationError[]; warnings: FieldValidationError[] } {
    const errors: FieldValidationError[] = [];
    const warnings: FieldValidationError[] = [];

    // 检查字段数量
    if (fields.length === 0) {
      errors.push({
        fieldCode: '',
        fieldName: '',
        errorType: 'error',
        message: '实体必须至少包含一个字段',
      });
    } else if (fields.length > 100) {
      warnings.push({
        fieldCode: '',
        fieldName: '',
        errorType: 'warning',
        message: '实体字段数量过多，可能影响性能',
      });
    }

    // 检查必填字段数量
    const requiredFields = fields.filter(f => f.required);
    if (requiredFields.length === 0) {
      warnings.push({
        fieldCode: '',
        fieldName: '',
        errorType: 'warning',
        message: '实体没有必填字段，建议至少设置一个必填字段',
      });
    }

    // 检查唯一字段数量
    const uniqueFields = fields.filter(f => f.unique);
    if (uniqueFields.length > 5) {
      warnings.push({
        fieldCode: '',
        fieldName: '',
        errorType: 'warning',
        message: '唯一字段数量过多，可能影响插入性能',
      });
    }

    return { errors, warnings };
  }

  /**
   * 过滤业务字段
   */
  private filterBusinessFields(fields: Field[]): Field[] {
    const commonFieldCodes = this.commonFieldService.getCommonFieldDefinitions().map(cf => cf.code);
    return fields.filter(field => !commonFieldCodes.includes(field.code));
  }

  /**
   * 验证日期格式
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  /**
   * 验证日期时间格式
   */
  private isValidDateTime(dateTimeString: string): boolean {
    const date = new Date(dateTimeString);
    return !isNaN(date.getTime());
  }

  /**
   * 获取字段验证规则说明
   */
  getValidationRules(): any {
    return {
      fieldCode: {
        required: true,
        pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
        maxLength: 50,
        reservedWords: ['id', 'class', 'type', 'order', 'group', 'select', 'from', 'where', 'insert', 'update', 'delete'],
      },
      fieldName: {
        required: true,
        maxLength: 100,
      },
      dataTypes: {
        STRING: { requiresLength: true, maxLength: 4000 },
        INTEGER: { noLengthOrPrecision: true },
        DECIMAL: { requiresPrecision: true, maxPrecision: 38 },
        BOOLEAN: { noLengthOrPrecision: true },
        DATE: { noLengthOrPrecision: true, format: 'YYYY-MM-DD' },
        DATETIME: { noLengthOrPrecision: true, format: 'ISO 8601' },
        TEXT: { noLengthOrPrecision: true },
        JSON: { noLengthOrPrecision: true, mustBeValidJson: true },
      },
      constraints: {
        maxFieldsPerEntity: 100,
        maxUniqueFields: 5,
      },
    };
  }
}