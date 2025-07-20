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

      // 获取项目的所有实体
      const entities = await this.prisma.entity.findMany({
        where: { projectId },
        include: {
          fields: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // 获取实体关系
      const relationships = await this.getEntityRelationships(projectId);

      // 构建实体元数据
      const entityMetadata: EntityMetadata[] = entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        description: entity.description,
        fields: entity.fields.map(field => this.mapFieldToMetadata(field)),
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
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
        include: {
          fields: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      // 获取实体关系
      const relationships = await this.getEntityRelationships(entity.projectId);

      const metadata: EntityMetadata = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName,
        description: entity.description,
        fields: entity.fields.map(field => this.mapFieldToMetadata(field)),
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
      isPrimaryKey: field.primaryKey,
      isUnique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      description: field.comment,
    };
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
