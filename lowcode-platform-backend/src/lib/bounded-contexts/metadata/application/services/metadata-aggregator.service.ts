import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ProjectMetadata, EntityMetadata, FieldMetadata, RelationshipMetadata } from '../../../shared/types/metadata.types';

@Injectable()
export class MetadataAggregatorService {
  private readonly logger = new Logger(MetadataAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProjectMetadata(projectId: string): Promise<ProjectMetadata> {
    this.logger.log(`Aggregating metadata for project: ${projectId}`);

    try {
      // 获取项目信息
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 获取项目的所有实体和字段
      const entitiesWithFields = await this.prisma.$queryRaw<any[]>`
        SELECT
          e.id,
          e.name,
          e.code,
          e.table_name as "tableName",
          e.description,
          json_agg(
            json_build_object(
              'id', f.id,
              'name', f.name,
              'code', f.code,
              'type', f.type,
              'length', f.length,
              'nullable', f.nullable,
              'primaryKey', f.primary_key,
              'uniqueConstraint', f.unique_constraint,
              'defaultValue', f.default_value,
              'comment', f.comment,
              'sortOrder', f.sort_order
            ) ORDER BY f.sort_order ASC
          ) as fields
        FROM lowcode_entities e
        LEFT JOIN lowcode_fields f ON e.id = f.entity_id
        WHERE e.project_id = ${projectId}
        GROUP BY e.id, e.name, e.code, e.table_name, e.description
        ORDER BY e.name
      `;

      // 获取实体关系
      const relationships = await this.getEntityRelationships(projectId);

      // 构建实体元数据
      const entityMetadata: EntityMetadata[] = entitiesWithFields.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        description: entity.description,
        fields: (entity.fields || []).map((field: any) => this.mapFieldToMetadata(field)),
        relationships: {
          outgoing: relationships.filter(r => r.sourceEntityId === entity.id),
          incoming: relationships.filter(r => r.targetEntityId === entity.id),
        },
      }));

      const metadata: ProjectMetadata = {
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
          description: project.description,
        },
        entities: entityMetadata,
        relationships,
      };

      this.logger.log(`Aggregated metadata for ${entityMetadata.length} entities`);
      return metadata;

    } catch (error) {
      this.logger.error(`Failed to aggregate metadata for project ${projectId}:`, error);
      throw error;
    }
  }

  async getEntityMetadata(entityId: string): Promise<EntityMetadata> {
    this.logger.log(`Getting metadata for entity: ${entityId}`);

    try {
      const entityWithFields = await this.prisma.$queryRaw<any[]>`
        SELECT
          e.id,
          e.name,
          e.code,
          e.table_name as "tableName",
          e.description,
          e.project_id as "projectId",
          json_agg(
            json_build_object(
              'id', f.id,
              'name', f.name,
              'code', f.code,
              'type', f.type,
              'length', f.length,
              'nullable', f.nullable,
              'primaryKey', f.primary_key,
              'uniqueConstraint', f.unique_constraint,
              'defaultValue', f.default_value,
              'comment', f.comment,
              'sortOrder', f.sort_order
            ) ORDER BY f.sort_order ASC
          ) as fields
        FROM lowcode_entities e
        LEFT JOIN lowcode_fields f ON e.id = f.entity_id
        WHERE e.id = ${entityId}
        GROUP BY e.id, e.name, e.code, e.table_name, e.description, e.project_id
      `;

      if (!entityWithFields || entityWithFields.length === 0) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      const entity = entityWithFields[0];

      // 获取实体关系
      const relationships = await this.getEntityRelationships(entity.projectId);

      const metadata: EntityMetadata = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        description: entity.description,
        fields: (entity.fields || []).map((field: any) => this.mapFieldToMetadata(field)),
        relationships: {
          outgoing: relationships.filter(r => r.sourceEntityId === entity.id),
          incoming: relationships.filter(r => r.targetEntityId === entity.id),
        },
      };

      return metadata;

    } catch (error) {
      this.logger.error(`Failed to get entity metadata for ${entityId}:`, error);
      throw error;
    }
  }

  async generateDDL(projectId: string): Promise<string> {
    this.logger.log(`Generating DDL for project: ${projectId}`);

    try {
      const metadata = await this.getProjectMetadata(projectId);
      let ddl = `-- Auto-generated DDL for project: ${metadata.project.name}\n`;
      ddl += `-- Generated at: ${new Date().toISOString()}\n\n`;

      // 生成表结构
      for (const entity of metadata.entities) {
        ddl += this.generateTableDDL(entity);
        ddl += '\n';
      }

      // 生成外键约束
      for (const relationship of metadata.relationships) {
        if (relationship.relationType === 'manyToOne' || relationship.relationType === 'oneToOne') {
          ddl += this.generateForeignKeyDDL(relationship, metadata.entities);
          ddl += '\n';
        }
      }

      // 生成关联表（多对多关系）
      for (const relationship of metadata.relationships) {
        if (relationship.relationType === 'manyToMany') {
          ddl += this.generateJunctionTableDDL(relationship, metadata.entities);
          ddl += '\n';
        }
      }

      this.logger.log('DDL generated successfully');
      return ddl;

    } catch (error) {
      this.logger.error(`Failed to generate DDL for project ${projectId}:`, error);
      throw error;
    }
  }

  private async getEntityRelationships(projectId: string): Promise<RelationshipMetadata[]> {
    try {
      // 这里需要根据实际的关系表结构来查询
      // 假设有一个 EntityRelationship 表
      const relationships = await this.prisma.$queryRaw<any[]>`
        SELECT 
          er.id,
          er.source_entity_id as "sourceEntityId",
          er.target_entity_id as "targetEntityId",
          se.name as "sourceEntityName",
          te.name as "targetEntityName",
          er.relation_type as "relationType",
          er.relationship_name as "relationshipName",
          er.description
        FROM entity_relationships er
        JOIN entities se ON er.source_entity_id = se.id
        JOIN entities te ON er.target_entity_id = te.id
        WHERE se.project_id = ${projectId} OR te.project_id = ${projectId}
      `;

      return relationships.map(r => ({
        id: r.id,
        sourceEntityId: r.sourceEntityId,
        targetEntityId: r.targetEntityId,
        sourceEntityName: r.sourceEntityName,
        targetEntityName: r.targetEntityName,
        relationType: r.relationType,
        relationshipName: r.relationshipName,
        description: r.description,
      }));

    } catch (error) {
      this.logger.warn('Failed to get entity relationships, returning empty array:', error);
      return [];
    }
  }

  private mapFieldToMetadata(field: any): FieldMetadata {
    return {
      id: field.id,
      name: field.name,
      code: field.code,
      type: field.type,
      length: field.length,
      nullable: field.nullable,
      isPrimaryKey: field.primaryKey || field.primary_key,
      isUnique: field.uniqueConstraint || field.unique_constraint,
      defaultValue: field.defaultValue || field.default_value,
      description: field.comment,
      // 添加字段类型映射
      tsType: this.mapFieldType(field.type),
      prismaType: this.getPrismaFieldType(field),
      prismaAttributes: this.getPrismaFieldAttributes(field),
    };
  }

  private mapFieldType(dbType: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'BIGINT': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'Date',
      'DATETIME': 'Date',
      'TIMESTAMP': 'Date',
      'JSON': 'any',
      'UUID': 'string',
    };
    return typeMap[dbType] || 'string';
  }

  private getPrismaFieldType(field: any): string {
    const typeMap: Record<string, string> = {
      'STRING': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'JSON': 'Json',
      'UUID': 'String',
    };

    let prismaType = typeMap[field.type] || 'String';

    // 处理可空字段
    if ((field.nullable || field.nullable === true) && !(field.primary_key || field.primaryKey)) {
      prismaType += '?';
    }

    return prismaType;
  }

  private getPrismaFieldAttributes(field: any): string[] {
    const attributes: string[] = [];
    const isPrimaryKey = field.primary_key || field.primaryKey;
    const isUnique = field.unique_constraint || field.uniqueConstraint;
    const defaultValue = field.default_value || field.defaultValue;

    // 主键
    if (isPrimaryKey) {
      if (field.type === 'UUID' || (field.type === 'STRING' && defaultValue === 'cuid()')) {
        attributes.push('@id @default(cuid())');
      } else {
        attributes.push('@id');
      }
    }

    // 唯一约束
    if (isUnique && !isPrimaryKey) {
      attributes.push('@unique');
    }

    // 默认值
    if (defaultValue && !isPrimaryKey) {
      if (defaultValue === 'now()') {
        attributes.push('@default(now())');
      } else if (defaultValue === 'cuid()') {
        attributes.push('@default(cuid())');
      } else {
        attributes.push(`@default("${defaultValue}")`);
      }
    }

    // 更新时间自动更新
    if (field.code === 'updatedAt') {
      attributes.push('@updatedAt');
    }

    return attributes;
  }

  private isSystemField(fieldCode: string): boolean {
    const systemFields = ['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
    return systemFields.includes(fieldCode);
  }

  private generateTableDDL(entity: EntityMetadata): string {
    let ddl = `CREATE TABLE ${entity.tableName} (\n`;
    
    const fieldDDLs = entity.fields.map(field => {
      let fieldDDL = `  ${field.code} ${this.mapFieldTypeToSQL(field)}`;
      
      if (!field.nullable) {
        fieldDDL += ' NOT NULL';
      }
      
      if (field.defaultValue) {
        fieldDDL += ` DEFAULT ${field.defaultValue}`;
      }
      
      return fieldDDL;
    });

    ddl += fieldDDLs.join(',\n');

    // 添加主键约束
    const primaryKeys = entity.fields.filter(f => f.isPrimaryKey);
    if (primaryKeys.length > 0) {
      const pkFields = primaryKeys.map(f => f.code).join(', ');
      ddl += `,\n  PRIMARY KEY (${pkFields})`;
    }

    // 添加唯一约束
    const uniqueFields = entity.fields.filter(f => f.isUnique && !f.isPrimaryKey);
    for (const field of uniqueFields) {
      ddl += `,\n  UNIQUE (${field.code})`;
    }

    ddl += '\n);';
    ddl += `\n\nCOMMENT ON TABLE ${entity.tableName} IS '${entity.description || entity.name}';`;

    // 添加字段注释
    for (const field of entity.fields) {
      if (field.description) {
        ddl += `\nCOMMENT ON COLUMN ${entity.tableName}.${field.code} IS '${field.description}';`;
      }
    }

    return ddl;
  }

  private generateForeignKeyDDL(relationship: RelationshipMetadata, entities: EntityMetadata[]): string {
    const sourceEntity = entities.find(e => e.id === relationship.sourceEntityId);
    const targetEntity = entities.find(e => e.id === relationship.targetEntityId);

    if (!sourceEntity || !targetEntity) {
      return '';
    }

    const foreignKeyName = `fk_${sourceEntity.tableName}_${targetEntity.tableName}`;
    const foreignKeyColumn = `${relationship.relationshipName}_id`;

    return `ALTER TABLE ${sourceEntity.tableName} 
ADD CONSTRAINT ${foreignKeyName} 
FOREIGN KEY (${foreignKeyColumn}) 
REFERENCES ${targetEntity.tableName}(id);`;
  }

  private generateJunctionTableDDL(relationship: RelationshipMetadata, entities: EntityMetadata[]): string {
    const sourceEntity = entities.find(e => e.id === relationship.sourceEntityId);
    const targetEntity = entities.find(e => e.id === relationship.targetEntityId);

    if (!sourceEntity || !targetEntity) {
      return '';
    }

    const junctionTableName = `${sourceEntity.tableName}_${targetEntity.tableName}`;
    
    return `CREATE TABLE ${junctionTableName} (
  id VARCHAR(26) PRIMARY KEY DEFAULT gen_random_uuid(),
  ${sourceEntity.code.toLowerCase()}_id VARCHAR(26) NOT NULL,
  ${targetEntity.code.toLowerCase()}_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (${sourceEntity.code.toLowerCase()}_id) REFERENCES ${sourceEntity.tableName}(id) ON DELETE CASCADE,
  FOREIGN KEY (${targetEntity.code.toLowerCase()}_id) REFERENCES ${targetEntity.tableName}(id) ON DELETE CASCADE,
  UNIQUE (${sourceEntity.code.toLowerCase()}_id, ${targetEntity.code.toLowerCase()}_id)
);

COMMENT ON TABLE ${junctionTableName} IS '${relationship.description || `${sourceEntity.name} and ${targetEntity.name} relationship table`}';`;
  }

  private mapFieldTypeToSQL(field: FieldMetadata): string {
    const typeMap: Record<string, string> = {
      'string': field.length ? `VARCHAR(${field.length})` : 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL(10,2)',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'timestamp': 'TIMESTAMP',
      'json': 'JSONB',
      'uuid': 'VARCHAR(26)',
    };

    return typeMap[field.type] || 'VARCHAR(255)';
  }
}
