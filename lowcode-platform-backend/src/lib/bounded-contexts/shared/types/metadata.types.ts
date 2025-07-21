export interface ProjectMetadata {
  id: string;
  name: string;
  code: string;
  description?: string;
  framework: string;
  architecture: string;
  language: string;
  database: string;
  settings?: {
    enableSwagger?: boolean;
    enableValidation?: boolean;
    enableAuth?: boolean;
    enableCaching?: boolean;
    enableLogging?: boolean;
    enableAudit?: boolean;
    enableSoftDelete?: boolean;
    enableVersioning?: boolean;
    enableTenancy?: boolean;
    enableStatus?: boolean;
  };
  entities: EntityMetadata[];
  relationships: RelationshipMetadata[];
}

export interface EntityMetadata {
  id: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  fields: FieldMetadata[];
  relationships: {
    outgoing: RelationshipMetadata[];
    incoming: RelationshipMetadata[];
  };
}

export interface FieldMetadata {
  id: string;
  name: string;
  code: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
  description?: string;
  comment?: string;
  validationPattern?: string;
  // 新增字段
  tsType?: string;
  prismaType?: string;
  prismaAttributes?: string[];
  sortOrder?: number;
  isSystemField?: boolean;
}

export interface RelationshipMetadata {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceEntityName: string;
  targetEntityName: string;
  relationType: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  relationshipName: string;
  description?: string;
}

export interface GeneratedFile {
  filename: string;
  path: string;
  content: string;
  language: string;
  size: number;
}
