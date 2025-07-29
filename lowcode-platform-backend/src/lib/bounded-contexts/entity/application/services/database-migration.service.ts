import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { Entity } from '@entity/domain/entity.model';
import { DatabaseGeneratorService } from './database-generator.service';

@Injectable()
export class DatabaseMigrationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly databaseGeneratorService: DatabaseGeneratorService,
  ) {}

  /**
   * 为实体创建数据库表
   */
  async createTableForEntity(entity: Entity): Promise<void> {
    try {
      // 生成建表SQL
      const migrationSql = await this.databaseGeneratorService.generateMigrationSql(entity);
      
      // 执行SQL语句
      await this.executeSql(migrationSql);
      
      console.log(`成功为实体 '${entity.name}' 创建数据库表: ${entity.tableName}`);
    } catch (error) {
      console.error(`为实体 '${entity.name}' 创建数据库表失败:`, error);
      throw new Error(`创建数据库表失败: ${error.message}`);
    }
  }

  /**
   * 检查表是否存在
   */
  async tableExists(tableName: string, schema: string = 'lowcode'): Promise<boolean> {
    try {
      const result = await this.prismaService.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schema}
          AND table_name = ${tableName}
        ) as exists
      `;
      
      return (result as any)[0]?.exists || false;
    } catch (error) {
      console.error('检查表是否存在时出错:', error);
      return false;
    }
  }

  /**
   * 删除实体对应的数据库表
   */
  async dropTableForEntity(entity: Entity): Promise<void> {
    try {
      const exists = await this.tableExists(entity.tableName);
      if (!exists) {
        console.log(`表 ${entity.tableName} 不存在，跳过删除操作`);
        return;
      }

      await this.executeSql(`DROP TABLE IF EXISTS lowcode.${entity.tableName} CASCADE;`);
      console.log(`成功删除实体 '${entity.name}' 的数据库表: ${entity.tableName}`);
    } catch (error) {
      console.error(`删除实体 '${entity.name}' 的数据库表失败:`, error);
      throw new Error(`删除数据库表失败: ${error.message}`);
    }
  }

  /**
   * 更新表结构（添加新字段）
   */
  async addColumnToTable(tableName: string, columnName: string, columnType: string, nullable: boolean = true): Promise<void> {
    try {
      const nullableClause = nullable ? '' : ' NOT NULL';
      const sql = `ALTER TABLE lowcode.${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}${nullableClause};`;
      
      await this.executeSql(sql);
      console.log(`成功为表 ${tableName} 添加列: ${columnName}`);
    } catch (error) {
      console.error(`为表 ${tableName} 添加列 ${columnName} 失败:`, error);
      throw new Error(`添加列失败: ${error.message}`);
    }
  }

  /**
   * 删除表中的列
   */
  async dropColumnFromTable(tableName: string, columnName: string): Promise<void> {
    try {
      const sql = `ALTER TABLE lowcode.${tableName} DROP COLUMN IF EXISTS ${columnName};`;
      
      await this.executeSql(sql);
      console.log(`成功从表 ${tableName} 删除列: ${columnName}`);
    } catch (error) {
      console.error(`从表 ${tableName} 删除列 ${columnName} 失败:`, error);
      throw new Error(`删除列失败: ${error.message}`);
    }
  }

  /**
   * 创建索引
   */
  async createIndex(tableName: string, indexName: string, columns: string[], unique: boolean = false): Promise<void> {
    try {
      const uniqueClause = unique ? 'UNIQUE ' : '';
      const sql = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON lowcode.${tableName} (${columns.join(', ')});`;
      
      await this.executeSql(sql);
      console.log(`成功为表 ${tableName} 创建索引: ${indexName}`);
    } catch (error) {
      console.error(`为表 ${tableName} 创建索引 ${indexName} 失败:`, error);
      throw new Error(`创建索引失败: ${error.message}`);
    }
  }

  /**
   * 删除索引
   */
  async dropIndex(indexName: string): Promise<void> {
    try {
      const sql = `DROP INDEX IF EXISTS lowcode.${indexName};`;
      
      await this.executeSql(sql);
      console.log(`成功删除索引: ${indexName}`);
    } catch (error) {
      console.error(`删除索引 ${indexName} 失败:`, error);
      throw new Error(`删除索引失败: ${error.message}`);
    }
  }

  /**
   * 获取表的列信息
   */
  async getTableColumns(tableName: string, schema: string = 'lowcode'): Promise<any[]> {
    try {
      const result = await this.prismaService.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = ${schema}
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      return result as any[];
    } catch (error) {
      console.error('获取表列信息时出错:', error);
      return [];
    }
  }

  /**
   * 验证表结构是否与实体定义匹配
   */
  async validateTableStructure(entity: Entity): Promise<{
    isValid: boolean;
    missingColumns: string[];
    extraColumns: string[];
    issues: string[];
  }> {
    try {
      const exists = await this.tableExists(entity.tableName);
      if (!exists) {
        return {
          isValid: false,
          missingColumns: [],
          extraColumns: [],
          issues: [`表 ${entity.tableName} 不存在`],
        };
      }

      const actualColumns = await this.getTableColumns(entity.tableName);
      const actualColumnNames = actualColumns.map(col => col.column_name);

      // 获取期望的列（通用字段）
      const expectedColumns = ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'];
      
      const missingColumns = expectedColumns.filter(col => !actualColumnNames.includes(col));
      const extraColumns = actualColumnNames.filter(col => !expectedColumns.includes(col));

      const issues: string[] = [];
      if (missingColumns.length > 0) {
        issues.push(`缺少列: ${missingColumns.join(', ')}`);
      }

      return {
        isValid: missingColumns.length === 0,
        missingColumns,
        extraColumns,
        issues,
      };
    } catch (error) {
      return {
        isValid: false,
        missingColumns: [],
        extraColumns: [],
        issues: [`验证表结构时出错: ${error.message}`],
      };
    }
  }

  /**
   * 修复表结构（添加缺失的通用字段）
   */
  async repairTableStructure(entity: Entity): Promise<void> {
    try {
      const validation = await this.validateTableStructure(entity);
      
      if (validation.isValid) {
        console.log(`表 ${entity.tableName} 结构正确，无需修复`);
        return;
      }

      // 添加缺失的通用字段
      for (const columnName of validation.missingColumns) {
        let columnType: string;
        let nullable = true;

        switch (columnName) {
          case 'id':
            columnType = 'VARCHAR(36) DEFAULT gen_random_uuid()';
            nullable = false;
            break;
          case 'created_by':
            columnType = 'VARCHAR(36)';
            nullable = false;
            break;
          case 'created_at':
            columnType = 'TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP';
            nullable = false;
            break;
          case 'updated_by':
            columnType = 'VARCHAR(36)';
            nullable = true;
            break;
          case 'updated_at':
            columnType = 'TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP';
            nullable = true;
            break;
          default:
            columnType = 'TEXT';
        }

        await this.addColumnToTable(entity.tableName, columnName, columnType, nullable);
      }

      console.log(`成功修复表 ${entity.tableName} 的结构`);
    } catch (error) {
      console.error(`修复表 ${entity.tableName} 结构失败:`, error);
      throw new Error(`修复表结构失败: ${error.message}`);
    }
  }

  /**
   * 执行原始SQL语句
   */
  private async executeSql(sql: string): Promise<any> {
    try {
      console.log('执行SQL:', sql);
      return await this.prismaService.$executeRawUnsafe(sql);
    } catch (error) {
      console.error('SQL执行失败:', error);
      throw error;
    }
  }

  /**
   * 批量执行SQL语句
   */
  async executeBatchSql(sqlStatements: string[]): Promise<void> {
    for (const sql of sqlStatements) {
      await this.executeSql(sql);
    }
  }

  /**
   * 在事务中执行多个SQL语句
   */
  async executeInTransaction(sqlStatements: string[]): Promise<void> {
    try {
      await this.prismaService.$transaction(async (prisma) => {
        for (const sql of sqlStatements) {
          await prisma.$executeRawUnsafe(sql);
        }
      });
      
      console.log('事务执行成功');
    } catch (error) {
      console.error('事务执行失败:', error);
      throw new Error(`事务执行失败: ${error.message}`);
    }
  }
}