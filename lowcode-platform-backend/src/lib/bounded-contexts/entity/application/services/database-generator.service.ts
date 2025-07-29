import { Injectable, Inject } from '@nestjs/common';
import { Entity } from '@entity/domain/entity.model';
import { Field, FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { FieldRepository } from '@lib/bounded-contexts/field/domain/field.repository';
import { PrismaSchemaGeneratorService } from './prisma-schema-generator.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DatabaseTableDefinition {
  tableName: string;
  columns: DatabaseColumnDefinition[];
  indexes: DatabaseIndexDefinition[];
  constraints: DatabaseConstraintDefinition[];
}

export interface DatabaseColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface DatabaseIndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface DatabaseConstraintDefinition {
  name: string;
  type: 'PRIMARY_KEY' | 'UNIQUE' | 'FOREIGN_KEY' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

@Injectable()
export class DatabaseGeneratorService {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
    private readonly prismaSchemaGenerator: PrismaSchemaGeneratorService,
  ) {}

  /**
   * 为实体生成Prisma Schema定义
   */
  async generatePrismaSchemaForEntity(entity: Entity): Promise<string> {
    // 获取实体的所有字段
    const fields = await this.fieldRepository.findByEntityId(entity.id!);
    
    // 使用新的PrismaSchemaGeneratorService生成模型
    return this.prismaSchemaGenerator.generateEntityModel(entity, fields);
  }

  /**
   * 为多个实体生成完整的Prisma Schema
   */
  async generateCompletePrismaSchema(entities: Entity[]): Promise<string> {
    let schemaContent = this.generatePrismaHeader();
    
    for (const entity of entities) {
      const entitySchema = await this.generatePrismaSchemaForEntity(entity);
      schemaContent += '\n\n' + entitySchema;
    }
    
    return schemaContent;
  }

  /**
   * 生成数据库表定义
   */
  private generateTableDefinition(entity: Entity, fields: Field[]): DatabaseTableDefinition {
    const columns: DatabaseColumnDefinition[] = fields.map(field => ({
      name: this.convertToColumnName(field.code),
      type: this.convertFieldTypeToSqlType(field.dataType, field.length, field.precision),
      nullable: !field.required,
      primaryKey: field.code === 'id', // 主键字段
      unique: field.unique,
      defaultValue: field.defaultValue,
      comment: field.description,
    }));

    const indexes: DatabaseIndexDefinition[] = [];
    const constraints: DatabaseConstraintDefinition[] = [];

    // 添加主键约束
    const primaryKeyField = fields.find(f => f.code === 'id');
    if (primaryKeyField) {
      constraints.push({
        name: `pk_${entity.tableName}`,
        type: 'PRIMARY_KEY',
        columns: [this.convertToColumnName(primaryKeyField.code)],
      });
    }

    // 添加唯一约束
    const uniqueFields = fields.filter(f => f.unique && f.code !== 'id');
    uniqueFields.forEach(field => {
      constraints.push({
        name: `uk_${entity.tableName}_${this.convertToColumnName(field.code)}`,
        type: 'UNIQUE',
        columns: [this.convertToColumnName(field.code)],
      });
    });

    // 添加常用索引
    const indexFields = ['createdBy', 'createdAt', 'updatedAt'];
    indexFields.forEach(fieldCode => {
      const field = fields.find(f => f.code === fieldCode);
      if (field) {
        indexes.push({
          name: `idx_${entity.tableName}_${this.convertToColumnName(fieldCode)}`,
          columns: [this.convertToColumnName(fieldCode)],
          unique: false,
        });
      }
    });

    return {
      tableName: entity.tableName,
      columns,
      indexes,
      constraints,
    };
  }

  /**
   * 生成Prisma模型定义
   */
  private generatePrismaModel(entity: Entity, tableDefinition: DatabaseTableDefinition): string {
    const modelName = this.convertToPascalCase(entity.code);
    let modelContent = `model ${modelName} {\n`;

    // 生成字段定义
    tableDefinition.columns.forEach(column => {
      const fieldLine = this.generatePrismaField(column);
      modelContent += `  ${fieldLine}\n`;
    });

    // 生成索引定义
    if (tableDefinition.indexes.length > 0) {
      modelContent += '\n';
      tableDefinition.indexes.forEach(index => {
        const indexLine = this.generatePrismaIndex(index);
        modelContent += `  ${indexLine}\n`;
      });
    }

    // 生成表映射
    modelContent += `\n  @@map("${tableDefinition.tableName}")\n`;
    modelContent += `  @@schema("lowcode")\n`;
    modelContent += '}';

    return modelContent;
  }

  /**
   * 生成Prisma字段定义
   */
  private generatePrismaField(column: DatabaseColumnDefinition): string {
    let fieldDef = `${this.convertToCamelCase(column.name)} `;
    
    // 字段类型
    fieldDef += this.convertSqlTypeToPrismaType(column.type);
    
    // 可选性
    if (column.nullable && !column.primaryKey) {
      fieldDef += '?';
    }
    
    // 字段属性
    const attributes: string[] = [];
    
    if (column.primaryKey) {
      attributes.push('@id');
    }
    
    if (column.unique && !column.primaryKey) {
      attributes.push('@unique');
    }
    
    if (column.defaultValue) {
      if (column.defaultValue === 'gen_random_uuid()') {
        attributes.push('@default(dbgenerated("(gen_random_uuid())::text"))');
      } else if (column.defaultValue === 'now()') {
        attributes.push('@default(now())');
      } else {
        attributes.push(`@default("${column.defaultValue}")`);
      }
    }
    
    if (column.name !== this.convertToCamelCase(column.name)) {
      attributes.push(`@map("${column.name}")`);
    }
    
    if (column.type.includes('VarChar')) {
      const match = column.type.match(/VarChar\((\d+)\)/);
      if (match) {
        attributes.push(`@db.VarChar(${match[1]})`);
      }
    }
    
    if (attributes.length > 0) {
      fieldDef += ' ' + attributes.join(' ');
    }
    
    return fieldDef;
  }

  /**
   * 生成Prisma索引定义
   */
  private generatePrismaIndex(index: DatabaseIndexDefinition): string {
    const columns = index.columns.map(col => this.convertToCamelCase(col));
    const indexType = index.unique ? '@@unique' : '@@index';
    return `${indexType}([${columns.join(', ')}], map: "${index.name}")`;
  }

  /**
   * 生成Prisma Schema头部
   */
  private generatePrismaHeader(): string {
    return `// 自动生成的Prisma Schema - 请勿手动修改
// Generated at: ${new Date().toISOString()}

generator client {
  provider        = "prisma-client-js"
  output          = "../node_modules/.prisma/client"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["lowcode"]
}`;
  }

  /**
   * 将字段类型转换为SQL类型
   */
  private convertFieldTypeToSqlType(fieldType: FieldDataType, length?: number, precision?: number): string {
    switch (fieldType) {
      case FieldDataType.STRING:
        return `VarChar(${length || 255})`;
      case FieldDataType.TEXT:
        return 'Text';
      case FieldDataType.INTEGER:
        return 'Integer';
      case FieldDataType.DECIMAL:
        return `Decimal(${precision || 10}, 2)`;
      case FieldDataType.BOOLEAN:
        return 'Boolean';
      case FieldDataType.DATE:
        return 'Date';
      case FieldDataType.DATETIME:
        return 'Timestamp(6)';
      case FieldDataType.JSON:
        return 'Json';
      default:
        return 'Text';
    }
  }

  /**
   * 将SQL类型转换为Prisma类型
   */
  private convertSqlTypeToPrismaType(sqlType: string): string {
    if (sqlType.startsWith('VarChar')) return 'String';
    if (sqlType === 'Text') return 'String';
    if (sqlType === 'Integer') return 'Int';
    if (sqlType.startsWith('Decimal')) return 'Decimal';
    if (sqlType === 'Boolean') return 'Boolean';
    if (sqlType === 'Date') return 'DateTime';
    if (sqlType.startsWith('Timestamp')) return 'DateTime';
    if (sqlType === 'Json') return 'Json';
    return 'String';
  }

  /**
   * 转换为数据库列名（下划线命名）
   */
  private convertToColumnName(fieldCode: string): string {
    return fieldCode.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  /**
   * 转换为驼峰命名
   */
  private convertToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 转换为帕斯卡命名
   */
  private convertToPascalCase(str: string): string {
    const camelCase = this.convertToCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * 保存Schema到文件
   */
  async saveSchemaToFile(schema: string, filePath: string): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 写入文件
      await fs.writeFile(filePath, schema, 'utf8');
      
      console.log(`Prisma Schema已保存到: ${filePath}`);
    } catch (error) {
      console.error('保存Schema文件失败:', error);
      throw new Error(`保存Schema文件失败: ${error.message}`);
    }
  }

  /**
   * 生成数据库迁移SQL
   */
  async generateMigrationSql(entity: Entity): Promise<string> {
    const fields = await this.fieldRepository.findByEntityId(entity.id!);
    
    // 使用新的PrismaSchemaGeneratorService生成迁移SQL
    return this.prismaSchemaGenerator.generateMigrationSQL(entity, fields);
  }
}