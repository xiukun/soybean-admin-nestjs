/*
 * @Description: 实体关系管理命令
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import { RelationshipType } from '../../domain/relationship.model';

export interface RelationshipConfig {
  type: RelationshipType;
  sourceEntityId: string;
  sourceFieldId?: string;
  targetEntityId: string;
  targetFieldId?: string;
  foreignKeyName?: string;
  joinTableConfig?: {
    tableName: string;
    sourceColumn: string;
    targetColumn: string;
  };
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'NO_ACTION';
  onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'NO_ACTION';
  indexed?: boolean;
  indexName?: string;
}

export class CreateRelationshipCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly description: string,
    public readonly config: RelationshipConfig,
    public readonly userId: string,
  ) {}
}

export class UpdateRelationshipCommand {
  constructor(
    public readonly relationshipId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly config?: Partial<RelationshipConfig>,
    public readonly userId?: string,
  ) {}
}

export class DeleteRelationshipCommand {
  constructor(
    public readonly relationshipId: string,
    public readonly userId: string,
  ) {}
}

export class ValidateRelationshipCommand {
  constructor(
    public readonly projectId: string,
    public readonly config: RelationshipConfig,
  ) {}
}

export class GenerateRelationshipSQLCommand {
  constructor(
    public readonly relationshipId: string,
  ) {}
}

export class BatchCreateRelationshipsCommand {
  constructor(
    public readonly projectId: string,
    public readonly relationships: Array<{
      name: string;
      code: string;
      description: string;
      config: RelationshipConfig;
    }>,
    public readonly userId: string,
  ) {}
}

export class SyncRelationshipsCommand {
  constructor(
    public readonly projectId: string,
    public readonly userId: string,
  ) {}
}
