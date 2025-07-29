import { Injectable } from '@nestjs/common';
import { Entity } from '@entity/domain/entity.model';
import { Field } from '@lib/bounded-contexts/field/domain/field.model';
import { CommonFieldService } from './common-field.service';

/**
 * Prisma Schema生成服务
 * 负责根据实体和字段信息生成Prisma Schema定义
 */
@Injectable()
export class PrismaSchemaGeneratorService {
  constructor(private readonly commonFieldService: CommonFieldService) {}

  /**
   * 生成实体的Prisma模型定义
   */
  generateEntityModel(entity: Entity, fields: Field[]): string {
    const modelName = this.toPascalCase(entity.code);
    const tableName = this.toSnakeCase(entity.code);

    let schemaContent = `model ${modelName} {\n`;

    // 添加通用字段
    const commonFields = this.commonFieldService.getCommonFieldDefinitions();
    for (const commonField of commonFields) {
      schemaContent += this.generateFieldDefinition(commonField);
    }

    // 添加业务字段
    for (const field of fields) {
      schemaContent += this.generateFieldDefinition(field);
    }

    schemaContent += `\n  @@map("${tableName}")\n`;
    schemaContent += '}\n';

    return schemaContent;
  }

  /**
   * 生成字段定义
   */
  private generateFieldDefinition(field: any): string {
    const fieldName = field.code;
    const prismaType = this.mapToPrismaType(field.dataType);
    const isOptional = !field.required ? '?' : '';
    const isId = field.code === 'id' ? ' @id' : '';
    const defaultValue = this.generateDefaultValue(field);

    return `  ${fieldName} ${prismaType}${isOptional}${defaultValue}${isId}\n`;
  }

  /**
   * 映射数据类型到Prisma类型
   */
  private mapToPrismaType(dataType: string): string {
    const typeMapping: Record<string, string> = {
      'STRING': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'DECIMAL': 'Decimal',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'UUID': 'String',
      'JSON': 'Json'
    };

    return typeMapping[dataType] || 'String';
  }

  /**
   * 生成默认值
   */
  private generateDefaultValue(field: any): string {
    if (field.code === 'id') {
      return ' @default(uuid())';
    }
    
    if (field.code === 'createdAt' || field.code === 'updatedAt') {
      return ' @default(now())';
    }

    if (field.defaultValue) {
      const prismaType = this.mapToPrismaType(field.dataType);
      if (prismaType === 'String') {
        return ` @default("${field.defaultValue}")`;
      } else if (prismaType === 'Int' || prismaType === 'Decimal') {
        return ` @default(${field.defaultValue})`;
      } else if (prismaType === 'Boolean') {
        return ` @default(${field.defaultValue})`;
      }
    }

    return '';
  }

  /**
   * 转换为PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 转换为snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * 生成完整的Prisma Schema文件内容
   */
  generateFullSchema(entities: Array<{ entity: Entity; fields: Field[] }>): string {
    let schemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // 生成所有实体模型
    for (const { entity, fields } of entities) {
      schemaContent += this.generateEntityModel(entity, fields);
      schemaContent += '\n';
    }

    return schemaContent;
  }

  /**
   * 生成数据库迁移SQL
   */
  generateMigrationSQL(entity: Entity, fields: Field[]): string {
    const tableName = this.toSnakeCase(entity.code);
    
    let sql = `-- CreateTable\nCREATE TABLE "${tableName}" (\n`;

    // 添加通用字段
    const commonFields = this.commonFieldService.getCommonFieldDefinitions();
    const allFields = [...commonFields, ...fields];

    const fieldDefinitions: string[] = [];

    for (const field of allFields) {
      const columnDefinition = this.generateColumnDefinition(field);
      fieldDefinitions.push(columnDefinition);
    }

    sql += fieldDefinitions.join(',\n');
    sql += `\n);\n\n`;

    // 添加主键约束
    sql += `-- AddPrimaryKey\nALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("id");\n`;

    return sql;
  }

  /**
   * 生成列定义
   */
  private generateColumnDefinition(field: any): string {
    const columnName = field.code;
    const sqlType = this.mapToSQLType(field.dataType);
    const notNull = field.required ? ' NOT NULL' : '';
    const defaultValue = this.generateSQLDefaultValue(field);

    return `    "${columnName}" ${sqlType}${defaultValue}${notNull}`;
  }

  /**
   * 映射数据类型到SQL类型
   */
  private mapToSQLType(dataType: string): string {
    const typeMapping: Record<string, string> = {
      'STRING': 'TEXT',
      'TEXT': 'TEXT',
      'INTEGER': 'INTEGER',
      'DECIMAL': 'DECIMAL(65,30)',
      'BOOLEAN': 'BOOLEAN',
      'DATE': 'DATE',
      'DATETIME': 'TIMESTAMP(3)',
      'UUID': 'TEXT',
      'JSON': 'JSONB'
    };

    return typeMapping[dataType] || 'TEXT';
  }

  /**
   * 生成SQL默认值
   */
  private generateSQLDefaultValue(field: any): string {
    if (field.code === 'id') {
      return ' DEFAULT gen_random_uuid()';
    }
    
    if (field.code === 'createdAt' || field.code === 'updatedAt') {
      return ' DEFAULT CURRENT_TIMESTAMP';
    }

    if (field.defaultValue) {
      const sqlType = this.mapToSQLType(field.dataType);
      if (sqlType.includes('TEXT')) {
        return ` DEFAULT '${field.defaultValue}'`;
      } else if (sqlType.includes('INTEGER') || sqlType.includes('DECIMAL')) {
        return ` DEFAULT ${field.defaultValue}`;
      } else if (sqlType.includes('BOOLEAN')) {
        return ` DEFAULT ${field.defaultValue}`;
      }
    }

    return '';
  }
}