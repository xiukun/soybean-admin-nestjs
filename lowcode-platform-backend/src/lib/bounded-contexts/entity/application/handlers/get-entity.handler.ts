import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  GetEntityQuery,
  GetEntityByCodeQuery,
  GetEntitiesByProjectQuery,
  GetEntitiesPaginatedQuery,
  GetEntityStatsQuery
} from '@entity/application/queries/get-entity.query';
import { Entity } from '@entity/domain/entity.model';
import { EntityRepository } from '@entity/domain/entity.repository';

@QueryHandler(GetEntityQuery)
export class GetEntityHandler implements IQueryHandler<GetEntityQuery> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(query: GetEntityQuery): Promise<Entity> {
    const entity = await this.entityRepository.findById(query.id);
    if (!entity) {
      throw new NotFoundException(`Entity with id '${query.id}' not found`);
    }
    return entity;
  }
}

@QueryHandler(GetEntityByCodeQuery)
export class GetEntityByCodeHandler implements IQueryHandler<GetEntityByCodeQuery> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(query: GetEntityByCodeQuery): Promise<Entity> {
    const entity = await this.entityRepository.findByCode(query.projectId, query.code);
    if (!entity) {
      throw new NotFoundException(
        `Entity with code '${query.code}' not found in project '${query.projectId}'`
      );
    }
    return entity;
  }
}

@QueryHandler(GetEntitiesByProjectQuery)
export class GetEntitiesByProjectHandler implements IQueryHandler<GetEntitiesByProjectQuery> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(query: GetEntitiesByProjectQuery): Promise<Entity[]> {
    return await this.entityRepository.findByProjectId(query.projectId);
  }
}

@QueryHandler(GetEntitiesPaginatedQuery)
export class GetEntitiesPaginatedHandler implements IQueryHandler<GetEntitiesPaginatedQuery> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(query: GetEntitiesPaginatedQuery): Promise<{
    entities: Entity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.entityRepository.findEntitiesPaginated(
      query.projectId,
      query.page,
      query.limit,
      query.filters,
    );
  }
}

@QueryHandler(GetEntityStatsQuery)
export class GetEntityStatsHandler implements IQueryHandler<GetEntityStatsQuery> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(query: GetEntityStatsQuery): Promise<{
    total: number;
    draft: number;
    published: number;
    deprecated: number;
  }> {
    const [total, draft, published, deprecated] = await Promise.all([
      this.entityRepository.countTotal(query.projectId),
      this.entityRepository.countByStatus(query.projectId, 'DRAFT'),
      this.entityRepository.countByStatus(query.projectId, 'PUBLISHED'),
      this.entityRepository.countByStatus(query.projectId, 'DEPRECATED'),
    ]);

    return {
      total,
      draft,
      published,
      deprecated,
    };
  }
}
