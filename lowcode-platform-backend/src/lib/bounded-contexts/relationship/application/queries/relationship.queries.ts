/*
 * @Description: 实体关系管理查询
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

export interface RelationshipListFilter {
  projectId?: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  type?: string;
  status?: string;
  search?: string;
}

export interface RelationshipListOptions {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GetRelationshipsQuery {
  constructor(
    public readonly filter: RelationshipListFilter,
    public readonly options: RelationshipListOptions = {},
  ) {}
}

export class GetRelationshipByIdQuery {
  constructor(
    public readonly relationshipId: string,
  ) {}
}

export class GetProjectRelationshipsQuery {
  constructor(
    public readonly projectId: string,
    public readonly options: RelationshipListOptions = {},
  ) {}
}

export class GetEntityRelationshipsQuery {
  constructor(
    public readonly entityId: string,
    public readonly direction?: 'source' | 'target' | 'both',
  ) {}
}

export class GetRelationshipTypesQuery {
  constructor() {}
}

export class ValidateRelationshipConfigQuery {
  constructor(
    public readonly projectId: string,
    public readonly config: any,
  ) {}
}

export class GetRelationshipSQLQuery {
  constructor(
    public readonly relationshipId: string,
  ) {}
}

export class GetRelationshipGraphQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class SearchRelationshipsQuery {
  constructor(
    public readonly projectId: string,
    public readonly keyword: string,
    public readonly options: RelationshipListOptions = {},
  ) {}
}

export class GetRelationshipStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetRelationshipConflictsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}
