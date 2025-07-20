import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { MultiTableQuery } from '../../domain/multi-table-query.model';
import { QueryRepository } from '../../infrastructure/query.repository';
import {
  GetQueryQuery,
  GetQueriesByProjectQuery,
  GetQueriesPaginatedQuery,
  GetQueryStatsQuery,
} from '../queries/get-query.query';

@QueryHandler(GetQueryQuery)
export class GetQueryHandler implements IQueryHandler<GetQueryQuery> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(query: GetQueryQuery): Promise<MultiTableQuery> {
    const result = await this.queryRepository.findById(query.id);
    if (!result) {
      throw new NotFoundException(`Query with id '${query.id}' not found`);
    }
    return result;
  }
}

@QueryHandler(GetQueriesByProjectQuery)
export class GetQueriesByProjectHandler implements IQueryHandler<GetQueriesByProjectQuery> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(query: GetQueriesByProjectQuery): Promise<MultiTableQuery[]> {
    return this.queryRepository.findByProject(query.projectId);
  }
}

@QueryHandler(GetQueriesPaginatedQuery)
export class GetQueriesPaginatedHandler implements IQueryHandler<GetQueriesPaginatedQuery> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(query: GetQueriesPaginatedQuery): Promise<{
    queries: MultiTableQuery[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.queryRepository.findPaginated(
      query.projectId,
      query.page,
      query.limit,
      query.filters,
    );
  }
}

@QueryHandler(GetQueryStatsQuery)
export class GetQueryStatsHandler implements IQueryHandler<GetQueryStatsQuery> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(query: GetQueryStatsQuery): Promise<any> {
    return this.queryRepository.getStats(query.projectId);
  }
}
