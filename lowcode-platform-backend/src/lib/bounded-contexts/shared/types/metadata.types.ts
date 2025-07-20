export interface ProjectMetadata {
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
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
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
  description?: string;
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
