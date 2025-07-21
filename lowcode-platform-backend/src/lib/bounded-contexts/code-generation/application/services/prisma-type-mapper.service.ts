import { Injectable } from '@nestjs/common';

export interface PrismaFieldMapping {
  prismaType: string;
  tsType: string;
  validationType: string;
  attributes?: string[];
  defaultValue?: string;
}

@Injectable()
export class PrismaTypeMapperService {
  private readonly typeMapping: Record<string, PrismaFieldMapping> = {
    // 字符串类型
    STRING: {
      prismaType: 'String',
      tsType: 'string',
      validationType: 'String',
      attributes: [],
    },
    TEXT: {
      prismaType: 'String',
      tsType: 'string',
      validationType: 'String',
      attributes: [],
    },
    
    // 数字类型
    INTEGER: {
      prismaType: 'Int',
      tsType: 'number',
      validationType: 'Number',
      attributes: [],
    },
    BIGINT: {
      prismaType: 'BigInt',
      tsType: 'bigint',
      validationType: 'Number',
      attributes: [],
    },
    DECIMAL: {
      prismaType: 'Decimal',
      tsType: 'number',
      validationType: 'Number',
      attributes: [],
    },
    FLOAT: {
      prismaType: 'Float',
      tsType: 'number',
      validationType: 'Number',
      attributes: [],
    },
    
    // 布尔类型
    BOOLEAN: {
      prismaType: 'Boolean',
      tsType: 'boolean',
      validationType: 'Boolean',
      attributes: [],
      defaultValue: 'false',
    },
    
    // 日期时间类型
    DATE: {
      prismaType: 'DateTime',
      tsType: 'Date',
      validationType: 'Date',
      attributes: ['@db.Date'],
    },
    DATETIME: {
      prismaType: 'DateTime',
      tsType: 'Date',
      validationType: 'Date',
      attributes: [],
    },
    TIMESTAMP: {
      prismaType: 'DateTime',
      tsType: 'Date',
      validationType: 'Date',
      attributes: ['@db.Timestamp(6)'],
    },
    
    // JSON类型
    JSON: {
      prismaType: 'Json',
      tsType: 'any',
      validationType: 'Object',
      attributes: [],
    },
    
    // UUID类型
    UUID: {
      prismaType: 'String',
      tsType: 'string',
      validationType: 'String',
      attributes: ['@db.Uuid'],
      defaultValue: 'cuid()',
    },
    
    // 枚举类型
    ENUM: {
      prismaType: 'String', // 将在运行时替换为实际的枚举类型
      tsType: 'string',
      validationType: 'String',
      attributes: [],
    },
  };

  /**
   * 获取字段的Prisma类型映射
   */
  getPrismaMapping(fieldType: string, options?: {
    length?: number;
    precision?: number;
    scale?: number;
    enumValues?: string[];
    isArray?: boolean;
  }): PrismaFieldMapping {
    const baseMapping = this.typeMapping[fieldType.toUpperCase()];
    if (!baseMapping) {
      throw new Error(`Unsupported field type: ${fieldType}`);
    }

    const mapping = { ...baseMapping };

    // 处理数组类型
    if (options?.isArray) {
      mapping.prismaType += '[]';
      mapping.tsType += '[]';
    }

    // 处理字符串长度
    if (fieldType.toUpperCase() === 'STRING' && options?.length) {
      mapping.attributes = [`@db.VarChar(${options.length})`];
    }

    // 处理DECIMAL精度
    if (fieldType.toUpperCase() === 'DECIMAL' && options?.precision && options?.scale) {
      mapping.attributes = [`@db.Decimal(${options.precision}, ${options.scale})`];
    }

    // 处理枚举类型
    if (fieldType.toUpperCase() === 'ENUM' && options?.enumValues) {
      const enumName = this.generateEnumName(options.enumValues);
      mapping.prismaType = enumName;
      mapping.tsType = enumName;
    }

    return mapping;
  }

  /**
   * 生成Prisma schema字段定义
   */
  generatePrismaField(fieldName: string, fieldType: string, options?: {
    nullable?: boolean;
    unique?: boolean;
    defaultValue?: string;
    length?: number;
    precision?: number;
    scale?: number;
    enumValues?: string[];
    isArray?: boolean;
    comment?: string;
  }): string {
    const mapping = this.getPrismaMapping(fieldType, options);
    
    let fieldDef = `  ${fieldName}`;
    
    // 添加可选标记
    if (options?.nullable) {
      fieldDef += '?';
    }
    
    // 添加类型
    fieldDef += `     ${mapping.prismaType}`;
    
    // 添加属性
    const attributes: string[] = [];
    
    // 唯一约束
    if (options?.unique) {
      attributes.push('@unique');
    }
    
    // 默认值
    if (options?.defaultValue) {
      attributes.push(`@default(${options.defaultValue})`);
    } else if (mapping.defaultValue && !options?.nullable) {
      attributes.push(`@default(${mapping.defaultValue})`);
    }
    
    // 数据库特定属性
    if (mapping.attributes && mapping.attributes.length > 0) {
      attributes.push(...mapping.attributes);
    }
    
    // 添加属性到字段定义
    if (attributes.length > 0) {
      fieldDef += ` ${attributes.join(' ')}`;
    }
    
    // 添加注释
    if (options?.comment) {
      fieldDef += ` // ${options.comment}`;
    }
    
    return fieldDef;
  }

  /**
   * 生成TypeScript接口字段
   */
  generateTSField(fieldName: string, fieldType: string, options?: {
    nullable?: boolean;
    isArray?: boolean;
    enumValues?: string[];
    comment?: string;
  }): string {
    const mapping = this.getPrismaMapping(fieldType, options);
    
    let fieldDef = `  ${fieldName}`;
    
    // 添加可选标记
    if (options?.nullable) {
      fieldDef += '?';
    }
    
    fieldDef += `: ${mapping.tsType}`;
    
    // 添加null类型
    if (options?.nullable) {
      fieldDef += ' | null';
    }
    
    fieldDef += ';';
    
    // 添加注释
    if (options?.comment) {
      fieldDef += ` // ${options.comment}`;
    }
    
    return fieldDef;
  }

  /**
   * 获取验证装饰器
   */
  getValidationDecorator(fieldType: string, options?: {
    nullable?: boolean;
    length?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enumValues?: string[];
  }): string[] {
    const mapping = this.getPrismaMapping(fieldType, options);
    const decorators: string[] = [];
    
    // 基础类型验证
    decorators.push(`@Is${mapping.validationType}()`);
    
    // 可选字段
    if (options?.nullable) {
      decorators.push('@IsOptional()');
    }
    
    // 字符串长度验证
    if (fieldType.toUpperCase() === 'STRING' && options?.length) {
      decorators.push(`@MaxLength(${options.length})`);
    }
    
    // 数字范围验证
    if (['INTEGER', 'DECIMAL', 'FLOAT'].includes(fieldType.toUpperCase())) {
      if (options?.min !== undefined) {
        decorators.push(`@Min(${options.min})`);
      }
      if (options?.max !== undefined) {
        decorators.push(`@Max(${options.max})`);
      }
    }
    
    // 正则表达式验证
    if (options?.pattern) {
      decorators.push(`@Matches(/${options.pattern}/)`);
    }
    
    // 枚举验证
    if (fieldType.toUpperCase() === 'ENUM' && options?.enumValues) {
      const enumValues = options.enumValues.map(v => `'${v}'`).join(', ');
      decorators.push(`@IsIn([${enumValues}])`);
    }
    
    return decorators;
  }

  /**
   * 生成枚举名称
   */
  private generateEnumName(enumValues: string[]): string {
    // 简单的枚举名称生成逻辑
    return `Enum_${enumValues.join('_').replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * 获取所有支持的字段类型
   */
  getSupportedTypes(): string[] {
    return Object.keys(this.typeMapping);
  }

  /**
   * 检查字段类型是否支持
   */
  isTypeSupported(fieldType: string): boolean {
    return fieldType.toUpperCase() in this.typeMapping;
  }

  /**
   * 生成Prisma枚举定义
   */
  generatePrismaEnum(enumName: string, values: string[]): string {
    const enumDef = [`enum ${enumName} {`];
    values.forEach(value => {
      enumDef.push(`  ${value.toUpperCase()}`);
    });
    enumDef.push('}');
    return enumDef.join('\n');
  }

  /**
   * 生成TypeScript枚举定义
   */
  generateTSEnum(enumName: string, values: string[]): string {
    const enumDef = [`export enum ${enumName} {`];
    values.forEach(value => {
      enumDef.push(`  ${value.toUpperCase()} = '${value}',`);
    });
    enumDef.push('}');
    return enumDef.join('\n');
  }
}
