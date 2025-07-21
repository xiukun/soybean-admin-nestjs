import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ProjectMetadata, EntityMetadata, FieldMetadata, RelationshipMetadata } from '../../../shared/types/metadata.types';

@Injectable()
export class MetadataAggregatorService {
  private readonly logger = new Logger(MetadataAggregatorService.name);
  private readonly metadataCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Default fields that should be added to every entity
  private readonly DEFAULT_FIELDS: Partial<FieldMetadata>[] = [
    {
      name: 'id',
      code: 'id',
      type: 'UUID',
      nullable: false,
      isPrimaryKey: true,
      defaultValue: 'cuid()',
      description: 'Primary key',
      tsType: 'string',
      prismaType: 'String',
      prismaAttributes: ['@id', '@default(cuid())'],
    },
    {
      name: 'tenantId',
      code: 'tenantId',
      type: 'STRING',
      nullable: true,
      isPrimaryKey: false,
      description: 'Tenant ID for multi-tenancy',
      tsType: 'string',
      prismaType: 'String?',
      prismaAttributes: [],
    },
    {
      name: 'createdAt',
      code: 'createdAt',
      type: 'DATETIME',
      nullable: false,
      isPrimaryKey: false,
      defaultValue: 'now()',
      description: 'Creation timestamp',
      tsType: 'Date',
      prismaType: 'DateTime',
      prismaAttributes: ['@default(now())'],
    },
    {
      name: 'updatedAt',
      code: 'updatedAt',
      type: 'DATETIME',
      nullable: false,
      isPrimaryKey: false,
      defaultValue: 'now()',
      description: 'Last update timestamp',
      tsType: 'Date',
      prismaType: 'DateTime',
      prismaAttributes: ['@default(now())', '@updatedAt'],
    },
    {
      name: 'createdBy',
      code: 'createdBy',
      type: 'STRING',
      nullable: true,
      isPrimaryKey: false,
      description: 'User who created this record',
      tsType: 'string',
      prismaType: 'String?',
      prismaAttributes: [],
    },
    {
      name: 'updatedBy',
      code: 'updatedBy',
      type: 'STRING',
      nullable: true,
      isPrimaryKey: false,
      description: 'User who last updated this record',
      tsType: 'string',
      prismaType: 'String?',
      prismaAttributes: [],
    },
    {
      name: 'status',
      code: 'status',
      type: 'STRING',
      nullable: false,
      isPrimaryKey: false,
      defaultValue: 'ACTIVE',
      description: 'Record status (ACTIVE, INACTIVE, DELETED)',
      tsType: 'string',
      prismaType: 'String',
      prismaAttributes: ['@default("ACTIVE")'],
    },
    {
      name: 'deletedAt',
      code: 'deletedAt',
      type: 'DATETIME',
      nullable: true,
      isPrimaryKey: false,
      description: 'Soft delete timestamp',
      tsType: 'Date | null',
      prismaType: 'DateTime?',
      prismaAttributes: [],
    },
    {
      name: 'version',
      code: 'version',
      type: 'INTEGER',
      nullable: false,
      isPrimaryKey: false,
      defaultValue: '1',
      description: 'Record version for optimistic locking',
      tsType: 'number',
      prismaType: 'Int',
      prismaAttributes: ['@default(1)'],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get default fields based on entity configuration
   */
  getDefaultFieldsForEntity(entityConfig?: {
    enableSoftDelete?: boolean;
    enableAudit?: boolean;
    enableVersioning?: boolean;
    enableTenancy?: boolean;
    enableStatus?: boolean;
  }): Partial<FieldMetadata>[] {
    const config = {
      enableSoftDelete: true,
      enableAudit: true,
      enableVersioning: false,
      enableTenancy: false,
      enableStatus: true,
      ...entityConfig,
    };

    const defaultFields: Partial<FieldMetadata>[] = [];

    // Always include ID, createdAt, updatedAt
    defaultFields.push(
      this.DEFAULT_FIELDS.find(f => f.code === 'id')!,
      this.DEFAULT_FIELDS.find(f => f.code === 'createdAt')!,
      this.DEFAULT_FIELDS.find(f => f.code === 'updatedAt')!,
    );

    // Conditional fields based on configuration
    if (config.enableTenancy) {
      defaultFields.push(this.DEFAULT_FIELDS.find(f => f.code === 'tenantId')!);
    }

    if (config.enableAudit) {
      defaultFields.push(
        this.DEFAULT_FIELDS.find(f => f.code === 'createdBy')!,
        this.DEFAULT_FIELDS.find(f => f.code === 'updatedBy')!,
      );
    }

    if (config.enableStatus) {
      defaultFields.push(this.DEFAULT_FIELDS.find(f => f.code === 'status')!);
    }

    if (config.enableSoftDelete) {
      defaultFields.push(this.DEFAULT_FIELDS.find(f => f.code === 'deletedAt')!);
    }

    if (config.enableVersioning) {
      defaultFields.push(this.DEFAULT_FIELDS.find(f => f.code === 'version')!);
    }

    return defaultFields;
  }

  // Cache management methods
  private getCachedData<T>(key: string): T | null {
    const cached = this.metadataCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.metadataCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.metadataCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.metadataCache.keys()) {
        if (key.includes(pattern)) {
          this.metadataCache.delete(key);
        }
      }
    } else {
      this.metadataCache.clear();
    }
  }

  // Helper methods for metadata processing
  private async getEntitiesWithFields(projectId: string): Promise<any[]> {
    return await this.prisma.$queryRaw<any[]>`
      SELECT
        e.id,
        e.name,
        e.code,
        e.table_name as "tableName",
        e.description,
        json_agg(
          CASE
            WHEN f.id IS NOT NULL THEN
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
              )
            ELSE NULL
          END
          ORDER BY f.sort_order ASC
        ) FILTER (WHERE f.id IS NOT NULL) as fields
      FROM lowcode_entities e
      LEFT JOIN lowcode_fields f ON e.id = f.entity_id
      WHERE e.project_id = ${projectId}
      GROUP BY e.id, e.name, e.code, e.table_name, e.description
      ORDER BY e.name
    `;
  }

  private mergeWithDefaultFields(customFields: FieldMetadata[]): FieldMetadata[] {
    const customFieldCodes = new Set(customFields.map(f => f.code));
    const defaultFields = this.DEFAULT_FIELDS
      .filter(df => !customFieldCodes.has(df.code!))
      .map((df, index) => ({
        id: `default_${df.code}_${index}`,
        name: df.name!,
        code: df.code!,
        type: df.type!,
        length: df.length,
        nullable: df.nullable!,
        isPrimaryKey: df.isPrimaryKey!,
        isUnique: df.isUnique || false,
        defaultValue: df.defaultValue,
        description: df.description!,
        tsType: df.tsType!,
        prismaType: df.prismaType!,
        prismaAttributes: df.prismaAttributes!,
      }));

    // Sort fields: primary key first, then default fields, then custom fields
    const allFields = [...defaultFields, ...customFields];
    return allFields.sort((a, b) => {
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
      if (a.code === 'tenantId') return -1;
      if (b.code === 'tenantId') return 1;
      return 0;
    });
  }

  private generateTableName(entityCode: string): string {
    // Convert PascalCase to snake_case
    return entityCode
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  async getProjectMetadata(projectId: string, useCache: boolean = true): Promise<ProjectMetadata> {
    this.logger.log(`Aggregating metadata for project: ${projectId}`);

    // Check cache first
    if (useCache) {
      const cached = this.getCachedData<ProjectMetadata>(`project_${projectId}`);
      if (cached) {
        this.logger.log(`Returning cached metadata for project: ${projectId}`);
        return cached;
      }
    }

    try {
      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project not found: ${projectId}`);
      }

      // Get project entities and fields in parallel
      const [entitiesWithFields, relationships] = await Promise.all([
        this.getEntitiesWithFields(projectId),
        this.getEntityRelationships(projectId),
      ]);

      // Build entity metadata with default fields
      const entityMetadata: EntityMetadata[] = entitiesWithFields.map(entity => {
        const customFields = (entity.fields || [])
          .filter((field: any) => field.id) // Only include fields with IDs (from database)
          .map((field: any) => this.mapFieldToMetadata(field));

        // Merge default fields with custom fields, avoiding duplicates
        const allFields = this.mergeWithDefaultFields(customFields);

        return {
          id: entity.id,
          name: entity.name,
          code: entity.code,
          tableName: entity.tableName || this.generateTableName(entity.code),
          description: entity.description,
          fields: allFields,
          relationships: {
            outgoing: relationships.filter(r => r.sourceEntityId === entity.id),
            incoming: relationships.filter(r => r.targetEntityId === entity.id),
          },
        };
      });

      // 安全地解析项目配置
      const config = project.config ? (typeof project.config === 'string' ? JSON.parse(project.config) : project.config) : {};

      const metadata: ProjectMetadata = {
        id: project.id,
        name: project.name,
        code: project.code,
        description: project.description,
        framework: config.framework || 'nestjs',
        architecture: config.architecture || 'ddd',
        language: config.language || 'typescript',
        database: config.database || 'postgresql',
        settings: config.settings,
        entities: entityMetadata,
        relationships,
      };

      // Cache the result
      if (useCache) {
        this.setCachedData(`project_${projectId}`, metadata);
      }

      this.logger.log(`Aggregated metadata for ${entityMetadata.length} entities`);
      return metadata;

    } catch (error) {
      this.logger.error(`Failed to aggregate metadata for project ${projectId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to aggregate project metadata: ${error.message}`);
    }
  }

  async getEntityMetadata(entityId: string, useCache: boolean = true): Promise<EntityMetadata> {
    this.logger.log(`Getting metadata for entity: ${entityId}`);

    // Check cache first
    if (useCache) {
      const cached = this.getCachedData<EntityMetadata>(`entity_${entityId}`);
      if (cached) {
        this.logger.log(`Returning cached metadata for entity: ${entityId}`);
        return cached;
      }
    }

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
            CASE
              WHEN f.id IS NOT NULL THEN
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
                )
              ELSE NULL
            END
            ORDER BY f.sort_order ASC
          ) FILTER (WHERE f.id IS NOT NULL) as fields
        FROM lowcode_entities e
        LEFT JOIN lowcode_fields f ON e.id = f.entity_id
        WHERE e.id = ${entityId}
        GROUP BY e.id, e.name, e.code, e.table_name, e.description, e.project_id
      `;

      if (!entityWithFields || entityWithFields.length === 0) {
        throw new NotFoundException(`Entity not found: ${entityId}`);
      }

      const entity = entityWithFields[0];

      // Get entity relationships
      const relationships = await this.getEntityRelationships(entity.projectId);

      // Process fields with default fields
      const customFields = (entity.fields || [])
        .filter((field: any) => field.id)
        .map((field: any) => this.mapFieldToMetadata(field));

      const allFields = this.mergeWithDefaultFields(customFields);

      const metadata: EntityMetadata = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName || this.generateTableName(entity.code),
        description: entity.description,
        fields: allFields,
        relationships: {
          outgoing: relationships.filter(r => r.sourceEntityId === entity.id),
          incoming: relationships.filter(r => r.targetEntityId === entity.id),
        },
      };

      // Cache the result
      if (useCache) {
        this.setCachedData(`entity_${entityId}`, metadata);
      }

      return metadata;

    } catch (error) {
      this.logger.error(`Failed to get entity metadata for ${entityId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get entity metadata: ${error.message}`);
    }
  }

  async generateDDL(projectId: string): Promise<string> {
    this.logger.log(`Generating DDL for project: ${projectId}`);

    try {
      const metadata = await this.getProjectMetadata(projectId);
      let ddl = `-- Auto-generated DDL for project: ${metadata.name}\n`;
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
      // Query relationships using the correct table structure
      const relationships = await this.prisma.$queryRaw<any[]>`
        SELECT
          r.id,
          r.source_entity_id as "sourceEntityId",
          r.target_entity_id as "targetEntityId",
          se.name as "sourceEntityName",
          te.name as "targetEntityName",
          r.relation_type as "relationType",
          r.relationship_name as "relationshipName",
          r.description,
          r.source_field as "sourceField",
          r.target_field as "targetField"
        FROM lowcode_relationships r
        JOIN lowcode_entities se ON r.source_entity_id = se.id
        JOIN lowcode_entities te ON r.target_entity_id = te.id
        WHERE se.project_id = ${projectId} OR te.project_id = ${projectId}
        ORDER BY r.created_at DESC
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
        sourceField: r.sourceField,
        targetField: r.targetField,
      }));

    } catch (error) {
      this.logger.warn('Failed to get entity relationships, returning empty array:', error.message);
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
    const systemFields = ['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'status', 'deletedAt', 'version'];
    return systemFields.includes(fieldCode);
  }

  /**
   * Validate entity relationships
   */
  private validateRelationships(relationships: RelationshipMetadata[]): void {
    for (const relationship of relationships) {
      // Check for circular references (only for self-referencing relationships)
      if (relationship.sourceEntityId === relationship.targetEntityId &&
          relationship.relationType !== 'oneToOne') {
        throw new Error(`Circular reference detected in relationship: ${relationship.relationshipName}`);
      }

      // Validate relationship type
      const validTypes = ['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'];
      if (!validTypes.includes(relationship.relationType)) {
        throw new Error(`Invalid relationship type: ${relationship.relationType}`);
      }

      // Validate relationship name
      if (!relationship.relationshipName || relationship.relationshipName.trim() === '') {
        throw new Error(`Relationship name is required for relationship ${relationship.id}`);
      }

      // Check for valid entity references
      if (!relationship.sourceEntityId || !relationship.targetEntityId) {
        throw new Error(`Source and target entity IDs are required for relationship: ${relationship.relationshipName}`);
      }
    }

    // Check for duplicate relationship names within the same entity
    const relationshipNames = new Map<string, string[]>();
    for (const relationship of relationships) {
      const key = relationship.sourceEntityId;
      if (!relationshipNames.has(key)) {
        relationshipNames.set(key, []);
      }
      const names = relationshipNames.get(key)!;
      if (names.includes(relationship.relationshipName)) {
        throw new Error(`Duplicate relationship name '${relationship.relationshipName}' in entity ${relationship.sourceEntityId}`);
      }
      names.push(relationship.relationshipName);
    }
  }

  // Public methods for cache management
  public invalidateProjectCache(projectId: string): void {
    this.clearCache(`project_${projectId}`);
    this.logger.log(`Invalidated cache for project: ${projectId}`);
  }

  public invalidateEntityCache(entityId: string): void {
    this.clearCache(`entity_${entityId}`);
    this.logger.log(`Invalidated cache for entity: ${entityId}`);
  }

  public invalidateAllCache(): void {
    this.clearCache();
    this.logger.log('Invalidated all metadata cache');
  }

  // Utility method to get field metadata by entity and field code
  public async getFieldMetadata(entityId: string, fieldCode: string): Promise<FieldMetadata | null> {
    try {
      const entityMetadata = await this.getEntityMetadata(entityId);
      return entityMetadata.fields.find(f => f.code === fieldCode) || null;
    } catch (error) {
      this.logger.error(`Failed to get field metadata for ${entityId}.${fieldCode}:`, error);
      return null;
    }
  }

  // Method to validate entity structure
  public async validateEntityStructure(entityId: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const metadata = await this.getEntityMetadata(entityId);
      const errors: string[] = [];

      // Check for primary key
      const primaryKeys = metadata.fields.filter(f => f.isPrimaryKey);
      if (primaryKeys.length === 0) {
        errors.push('Entity must have at least one primary key field');
      }

      // Check for required default fields
      const requiredFields = ['id', 'createdAt', 'updatedAt'];
      for (const requiredField of requiredFields) {
        if (!metadata.fields.some(f => f.code === requiredField)) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }

      // Check for duplicate field codes
      const fieldCodes = metadata.fields.map(f => f.code);
      const duplicates = fieldCodes.filter((code, index) => fieldCodes.indexOf(code) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate field codes found: ${duplicates.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate entity structure: ${error.message}`],
      };
    }
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
