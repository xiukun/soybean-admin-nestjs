import { Injectable, Logger } from '@nestjs/common';
import { FieldMetadata } from '../../../shared/types/metadata.types';

export interface TypeMappingResult {
  prismaType: string;
  tsType: string;
  sqlType: string;
  defaultValue?: string;
  attributes: string[];
}

@Injectable()
export class FieldTypeMapperService {
  private readonly logger = new Logger(FieldTypeMapperService.name);

  /**
   * 将字段类型映射到Prisma类型
   */
  mapToPrismaType(field: FieldMetadata): string {
    const fieldType = this.normalizeFieldType(field.type);
    
    const typeMap: Record<string, string> = {
      // 字符串类型
      'STRING': 'String',
      'TEXT': 'String',
      'VARCHAR': 'String',
      'CHAR': 'String',
      
      // 数字类型
      'INTEGER': 'Int',
      'INT': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'NUMERIC': 'Decimal',
      'FLOAT': 'Float',
      'DOUBLE': 'Float',
      'REAL': 'Float',
      
      // 布尔类型
      'BOOLEAN': 'Boolean',
      'BOOL': 'Boolean',
      
      // 日期时间类型
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'TIME': 'DateTime',
      
      // 特殊类型
      'UUID': 'String',
      'JSON': 'Json',
      'JSONB': 'Json',
      'BINARY': 'Bytes',
      'BLOB': 'Bytes',
      'ENUM': 'String',
    };

    const mappedType = typeMap[fieldType];
    if (!mappedType) {
      this.logger.warn(`Unknown field type: ${field.type}, defaulting to String`);
      return 'String';
    }

    return mappedType;
  }

  /**
   * 将字段类型映射到TypeScript类型
   */
  mapToTsType(field: FieldMetadata): string {
    const fieldType = this.normalizeFieldType(field.type);
    
    const typeMap: Record<string, string> = {
      // 字符串类型
      'STRING': 'string',
      'TEXT': 'string',
      'VARCHAR': 'string',
      'CHAR': 'string',
      'UUID': 'string',
      'ENUM': 'string',
      
      // 数字类型
      'INTEGER': 'number',
      'INT': 'number',
      'BIGINT': 'bigint',
      'DECIMAL': 'number',
      'NUMERIC': 'number',
      'FLOAT': 'number',
      'DOUBLE': 'number',
      'REAL': 'number',
      
      // 布尔类型
      'BOOLEAN': 'boolean',
      'BOOL': 'boolean',
      
      // 日期时间类型
      'DATE': 'Date',
      'DATETIME': 'Date',
      'TIMESTAMP': 'Date',
      'TIME': 'Date',
      
      // 特殊类型
      'JSON': 'any',
      'JSONB': 'any',
      'BINARY': 'Buffer',
      'BLOB': 'Buffer',
    };

    const mappedType = typeMap[fieldType];
    if (!mappedType) {
      this.logger.warn(`Unknown field type: ${field.type}, defaulting to string`);
      return 'string';
    }

    return field.nullable ? `${mappedType} | null` : mappedType;
  }

  /**
   * 将字段类型映射到SQL类型
   */
  mapToSqlType(field: FieldMetadata): string {
    const fieldType = this.normalizeFieldType(field.type);
    
    const typeMap: Record<string, string> = {
      'STRING': `VARCHAR(${field.length || 255})`,
      'TEXT': 'TEXT',
      'VARCHAR': `VARCHAR(${field.length || 255})`,
      'CHAR': `CHAR(${field.length || 1})`,
      'INTEGER': 'INTEGER',
      'INT': 'INTEGER',
      'BIGINT': 'BIGINT',
      'DECIMAL': `DECIMAL(${this.getDecimalPrecision(field)}, ${this.getDecimalScale(field)})`,
      'NUMERIC': `NUMERIC(${this.getDecimalPrecision(field)}, ${this.getDecimalScale(field)})`,
      'FLOAT': 'FLOAT',
      'DOUBLE': 'DOUBLE PRECISION',
      'REAL': 'REAL',
      'BOOLEAN': 'BOOLEAN',
      'BOOL': 'BOOLEAN',
      'DATE': 'DATE',
      'DATETIME': 'TIMESTAMP',
      'TIMESTAMP': 'TIMESTAMP',
      'TIME': 'TIME',
      'UUID': 'UUID',
      'JSON': 'JSON',
      'JSONB': 'JSONB',
      'BINARY': 'BYTEA',
      'BLOB': 'BYTEA',
      'ENUM': 'VARCHAR(50)',
    };

    return typeMap[fieldType] || 'TEXT';
  }

  /**
   * 生成Prisma字段属性
   */
  generatePrismaAttributes(field: FieldMetadata): string[] {
    const attributes: string[] = [];
    const fieldType = this.normalizeFieldType(field.type);

    // 主键属性
    if (field.isPrimaryKey) {
      attributes.push('@id');
      
      // 主键默认值
      if (fieldType === 'UUID' || (fieldType === 'STRING' && field.code === 'id')) {
        if (field.defaultValue === 'uuid()') {
          attributes.push('@default(uuid())');
        } else {
          attributes.push('@default(cuid())');
        }
      } else if (fieldType === 'INTEGER' || fieldType === 'INT') {
        attributes.push('@default(autoincrement())');
      }
    }

    // 唯一约束
    if (field.isUnique && !field.isPrimaryKey) {
      attributes.push('@unique');
    }

    // 默认值处理
    if (field.defaultValue && !field.isPrimaryKey) {
      const defaultValue = this.formatDefaultValue(field);
      if (defaultValue) {
        attributes.push(`@default(${defaultValue})`);
      }
    }

    // 特殊字段处理
    if (field.code === 'updatedAt' && this.isDateTimeType(fieldType)) {
      attributes.push('@updatedAt');
    } else if (field.code === 'createdAt' && this.isDateTimeType(fieldType) && !field.defaultValue) {
      attributes.push('@default(now())');
    }

    // 数据库特定属性
    const dbAttributes = this.generateDbAttributes(field);
    if (dbAttributes) {
      attributes.push(dbAttributes);
    }

    return attributes;
  }

  /**
   * 获取完整的类型映射结果
   */
  getTypeMappingResult(field: FieldMetadata): TypeMappingResult {
    return {
      prismaType: this.mapToPrismaType(field),
      tsType: this.mapToTsType(field),
      sqlType: this.mapToSqlType(field),
      defaultValue: this.formatDefaultValue(field),
      attributes: this.generatePrismaAttributes(field),
    };
  }

  /**
   * 标准化字段类型名称
   */
  private normalizeFieldType(type: string): string {
    return type?.toUpperCase().trim() || 'STRING';
  }

  /**
   * 检查是否为日期时间类型
   */
  private isDateTimeType(fieldType: string): boolean {
    return ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(fieldType);
  }

  /**
   * 格式化默认值
   */
  private formatDefaultValue(field: FieldMetadata): string | undefined {
    if (!field.defaultValue) return undefined;

    const fieldType = this.normalizeFieldType(field.type);
    const defaultValue = field.defaultValue;

    // 日期时间类型
    if (this.isDateTimeType(fieldType)) {
      if (defaultValue === 'now()' || defaultValue === 'CURRENT_TIMESTAMP') {
        return 'now()';
      }
      return `"${defaultValue}"`;
    }

    // 布尔类型
    if (fieldType === 'BOOLEAN' || fieldType === 'BOOL') {
      const boolValue = defaultValue === 'true' || defaultValue === true || defaultValue === 'TRUE' || defaultValue === '1';
      return boolValue.toString();
    }

    // 数字类型
    if (['INTEGER', 'INT', 'BIGINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL'].includes(fieldType)) {
      return defaultValue.toString();
    }

    // 字符串类型
    if (['STRING', 'TEXT', 'VARCHAR', 'CHAR', 'UUID', 'ENUM'].includes(fieldType)) {
      return `"${defaultValue}"`;
    }

    // JSON类型
    if (fieldType === 'JSON' || fieldType === 'JSONB') {
      try {
        JSON.parse(defaultValue);
        return defaultValue;
      } catch {
        return `"${defaultValue}"`;
      }
    }

    return `"${defaultValue}"`;
  }

  /**
   * 生成数据库特定属性
   */
  private generateDbAttributes(field: FieldMetadata): string | undefined {
    const fieldType = this.normalizeFieldType(field.type);

    if (fieldType === 'STRING' || fieldType === 'VARCHAR') {
      return `@db.VarChar(${field.length || 255})`;
    }

    if (fieldType === 'TEXT') {
      return '@db.Text';
    }

    if (fieldType === 'DECIMAL' || fieldType === 'NUMERIC') {
      const precision = this.getDecimalPrecision(field);
      const scale = this.getDecimalScale(field);
      return `@db.Decimal(${precision}, ${scale})`;
    }

    if (fieldType === 'CHAR') {
      return `@db.Char(${field.length || 1})`;
    }

    return undefined;
  }

  /**
   * 获取小数精度
   */
  private getDecimalPrecision(field: FieldMetadata): number {
    // 如果length是字符串格式 "10,2"，解析精度
    if (typeof field.length === 'string' && field.length.includes(',')) {
      const [precision] = field.length.split(',').map(n => parseInt(n.trim()));
      return precision || 10;
    }
    return field.length || 10;
  }

  /**
   * 获取小数位数
   */
  private getDecimalScale(field: FieldMetadata): number {
    // 如果length是字符串格式 "10,2"，解析小数位数
    if (typeof field.length === 'string' && field.length.includes(',')) {
      const [, scale] = field.length.split(',').map(n => parseInt(n.trim()));
      return scale || 2;
    }
    return 2; // 默认2位小数
  }

  /**
   * 验证字段类型是否支持
   */
  isSupportedFieldType(type: string): boolean {
    const normalizedType = this.normalizeFieldType(type);
    const supportedTypes = [
      'STRING', 'TEXT', 'VARCHAR', 'CHAR',
      'INTEGER', 'INT', 'BIGINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
      'BOOLEAN', 'BOOL',
      'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
      'UUID', 'JSON', 'JSONB', 'BINARY', 'BLOB', 'ENUM'
    ];
    return supportedTypes.includes(normalizedType);
  }

  /**
   * 获取所有支持的字段类型
   */
  getSupportedFieldTypes(): Array<{ type: string; description: string; category: string }> {
    return [
      // 字符串类型
      { type: 'STRING', description: 'Variable length string', category: 'String' },
      { type: 'TEXT', description: 'Long text', category: 'String' },
      { type: 'UUID', description: 'Universally unique identifier', category: 'String' },
      { type: 'ENUM', description: 'Enumeration', category: 'String' },
      
      // 数字类型
      { type: 'INTEGER', description: '32-bit integer', category: 'Number' },
      { type: 'BIGINT', description: '64-bit integer', category: 'Number' },
      { type: 'DECIMAL', description: 'Fixed-point decimal', category: 'Number' },
      { type: 'FLOAT', description: 'Floating-point number', category: 'Number' },
      
      // 布尔类型
      { type: 'BOOLEAN', description: 'True/false value', category: 'Boolean' },
      
      // 日期时间类型
      { type: 'DATE', description: 'Date only', category: 'DateTime' },
      { type: 'DATETIME', description: 'Date and time', category: 'DateTime' },
      { type: 'TIMESTAMP', description: 'Timestamp with timezone', category: 'DateTime' },
      
      // 特殊类型
      { type: 'JSON', description: 'JSON data', category: 'Special' },
      { type: 'BINARY', description: 'Binary data', category: 'Special' },
    ];
  }
}
