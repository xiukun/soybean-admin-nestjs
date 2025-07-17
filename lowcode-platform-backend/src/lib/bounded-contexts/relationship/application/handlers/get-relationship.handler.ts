import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { 
  GetRelationshipQuery, 
  GetRelationshipByCodeQuery, 
  GetRelationshipsByProjectQuery,
  GetRelationshipsPaginatedQuery,
  GetRelationshipsByEntityQuery,
  GetRelationshipGraphQuery,
  GetRelationshipStatsQuery
} from '../queries/get-relationship.query';
import { Relationship } from '../../domain/relationship.model';
import { RelationshipRepository } from '../../domain/relationship.repository';

@QueryHandler(GetRelationshipQuery)
export class GetRelationshipHandler implements IQueryHandler<GetRelationshipQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipQuery): Promise<Relationship> {
    const relationship = await this.relationshipRepository.findById(query.id);
    if (!relationship) {
      throw new NotFoundException(`Relationship with id '${query.id}' not found`);
    }
    return relationship;
  }
}

@QueryHandler(GetRelationshipByCodeQuery)
export class GetRelationshipByCodeHandler implements IQueryHandler<GetRelationshipByCodeQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipByCodeQuery): Promise<Relationship> {
    const relationship = await this.relationshipRepository.findByCode(
      query.projectId,
      query.code
    );
    if (!relationship) {
      throw new NotFoundException(
        `Relationship with code '${query.code}' not found in project '${query.projectId}'`
      );
    }
    return relationship;
  }
}

@QueryHandler(GetRelationshipsByProjectQuery)
export class GetRelationshipsByProjectHandler implements IQueryHandler<GetRelationshipsByProjectQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipsByProjectQuery): Promise<Relationship[]> {
    return await this.relationshipRepository.findByProjectId(query.projectId);
  }
}

@QueryHandler(GetRelationshipsPaginatedQuery)
export class GetRelationshipsPaginatedHandler implements IQueryHandler<GetRelationshipsPaginatedQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipsPaginatedQuery): Promise<{
    relationships: Relationship[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.relationshipRepository.findPaginated(
      query.projectId,
      query.page,
      query.limit,
      query.filters,
    );
  }
}

@QueryHandler(GetRelationshipsByEntityQuery)
export class GetRelationshipsByEntityHandler implements IQueryHandler<GetRelationshipsByEntityQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipsByEntityQuery): Promise<Relationship[]> {
    return await this.relationshipRepository.findByEntityId(query.entityId);
  }
}

@QueryHandler(GetRelationshipGraphQuery)
export class GetRelationshipGraphHandler implements IQueryHandler<GetRelationshipGraphQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipGraphQuery): Promise<{
    entities: { id: string; name: string; code: string }[];
    relationships: Relationship[];
  }> {
    return await this.relationshipRepository.findRelationshipGraph(query.projectId);
  }
}

@QueryHandler(GetRelationshipStatsQuery)
export class GetRelationshipStatsHandler implements IQueryHandler<GetRelationshipStatsQuery> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(query: GetRelationshipStatsQuery): Promise<{
    total: number;
    oneToOne: number;
    oneToMany: number;
    manyToOne: number;
    manyToMany: number;
    active: number;
    inactive: number;
  }> {
    const [
      total,
      oneToOne,
      oneToMany,
      manyToOne,
      manyToMany,
      active,
      inactive
    ] = await Promise.all([
      this.relationshipRepository.countByProjectId(query.projectId),
      this.relationshipRepository.countByType(query.projectId, 'ONE_TO_ONE'),
      this.relationshipRepository.countByType(query.projectId, 'ONE_TO_MANY'),
      this.relationshipRepository.countByType(query.projectId, 'MANY_TO_ONE'),
      this.relationshipRepository.countByType(query.projectId, 'MANY_TO_MANY'),
      this.relationshipRepository.countByStatus(query.projectId, 'ACTIVE'),
      this.relationshipRepository.countByStatus(query.projectId, 'INACTIVE'),
    ]);

    return {
      total,
      oneToOne,
      oneToMany,
      manyToOne,
      manyToMany,
      active,
      inactive,
    };
  }
}
