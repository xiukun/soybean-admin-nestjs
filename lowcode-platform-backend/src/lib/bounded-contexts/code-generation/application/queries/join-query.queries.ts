/*
 * @Description: 关联查询生成查询
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:45:00
 * @LastEditors: henry.xiukun
 */

export interface JoinQueryListFilter {
  projectId?: string;
  mainEntityId?: string;
  name?: string;
  status?: string;
  search?: string;
}

export interface JoinQueryListOptions {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GetJoinQueryConfigsQuery {
  constructor(
    public readonly filter: JoinQueryListFilter,
    public readonly options: JoinQueryListOptions = {},
  ) {}
}

export class GetJoinQueryConfigByIdQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetProjectJoinQueryConfigsQuery {
  constructor(
    public readonly projectId: string,
    public readonly options: JoinQueryListOptions = {},
  ) {}
}

export class GetEntityJoinQueryConfigsQuery {
  constructor(
    public readonly entityId: string,
    public readonly options: JoinQueryListOptions = {},
  ) {}
}

export class ValidateJoinQueryConfigQuery {
  constructor(
    public readonly projectId: string,
    public readonly config: any,
  ) {}
}

export class PreviewJoinQueryQuery {
  constructor(
    public readonly projectId: string,
    public readonly config: any,
  ) {}
}

export class GetJoinQuerySQLQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryTypesQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryAPIQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryDocumentationQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class SearchJoinQueryConfigsQuery {
  constructor(
    public readonly projectId: string,
    public readonly keyword: string,
    public readonly options: JoinQueryListOptions = {},
  ) {}
}

export class GetJoinQueryTemplatesQuery {
  constructor(
    public readonly category?: string,
    public readonly framework?: string,
  ) {}
}

export class GetJoinQueryPerformanceQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryDependenciesQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class GetJoinQueryConflictsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}
