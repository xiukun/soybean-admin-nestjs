import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { 
  GetApiConfigQuery, 
  GetApiConfigByCodeQuery, 
  GetApiConfigsByProjectQuery,
  GetApiConfigsPaginatedQuery,
  GetApiConfigsByEntityQuery,
  GetApiConfigStatsQuery,
  GetPublishedApiConfigsQuery,
  GetApiConfigVersionsQuery
} from '@lib/bounded-contexts/api-config/application/queries/get-api-config.query';
import { ApiConfig } from '@lib/bounded-contexts/api-config/domain/api-config.model';
import { ApiConfigRepository } from '@lib/bounded-contexts/api-config/domain/api-config.repository';

@QueryHandler(GetApiConfigQuery)
export class GetApiConfigHandler implements IQueryHandler<GetApiConfigQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigQuery): Promise<ApiConfig> {
    const apiConfig = await this.apiConfigRepository.findById(query.id);
    if (!apiConfig) {
      throw new NotFoundException(`API config with id '${query.id}' not found`);
    }
    return apiConfig;
  }
}

@QueryHandler(GetApiConfigByCodeQuery)
export class GetApiConfigByCodeHandler implements IQueryHandler<GetApiConfigByCodeQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigByCodeQuery): Promise<ApiConfig> {
    const apiConfig = await this.apiConfigRepository.findByCode(
      query.projectId,
      query.code
    );
    if (!apiConfig) {
      throw new NotFoundException(
        `API config with code '${query.code}' not found in project '${query.projectId}'`
      );
    }
    return apiConfig;
  }
}

@QueryHandler(GetApiConfigsByProjectQuery)
export class GetApiConfigsByProjectHandler implements IQueryHandler<GetApiConfigsByProjectQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigsByProjectQuery): Promise<ApiConfig[]> {
    return await this.apiConfigRepository.findByProjectId(query.projectId);
  }
}

@QueryHandler(GetApiConfigsPaginatedQuery)
export class GetApiConfigsPaginatedHandler implements IQueryHandler<GetApiConfigsPaginatedQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigsPaginatedQuery): Promise<{
    apiConfigs: ApiConfig[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.apiConfigRepository.findPaginated(
      query.projectId,
      query.page,
      query.limit,
      query.filters,
    );
  }
}

@QueryHandler(GetApiConfigsByEntityQuery)
export class GetApiConfigsByEntityHandler implements IQueryHandler<GetApiConfigsByEntityQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigsByEntityQuery): Promise<ApiConfig[]> {
    return await this.apiConfigRepository.findByEntityId(query.entityId);
  }
}

@QueryHandler(GetApiConfigStatsQuery)
export class GetApiConfigStatsHandler implements IQueryHandler<GetApiConfigStatsQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigStatsQuery): Promise<{
    total: number;
    draft: number;
    published: number;
    deprecated: number;
    get: number;
    post: number;
    put: number;
    delete: number;
  }> {
    const [
      total,
      draft,
      published,
      deprecated,
      get,
      post,
      put,
      deleteCount
    ] = await Promise.all([
      this.apiConfigRepository.countByProjectId(query.projectId),
      this.apiConfigRepository.countByStatus(query.projectId, 'DRAFT'),
      this.apiConfigRepository.countByStatus(query.projectId, 'PUBLISHED'),
      this.apiConfigRepository.countByStatus(query.projectId, 'DEPRECATED'),
      this.apiConfigRepository.countByMethod(query.projectId, 'GET'),
      this.apiConfigRepository.countByMethod(query.projectId, 'POST'),
      this.apiConfigRepository.countByMethod(query.projectId, 'PUT'),
      this.apiConfigRepository.countByMethod(query.projectId, 'DELETE'),
    ]);

    return {
      total,
      draft,
      published,
      deprecated,
      get,
      post,
      put,
      delete: deleteCount,
    };
  }
}

@QueryHandler(GetPublishedApiConfigsQuery)
export class GetPublishedApiConfigsHandler implements IQueryHandler<GetPublishedApiConfigsQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetPublishedApiConfigsQuery): Promise<ApiConfig[]> {
    return await this.apiConfigRepository.findPublishedApis(query.projectId);
  }
}

@QueryHandler(GetApiConfigVersionsQuery)
export class GetApiConfigVersionsHandler implements IQueryHandler<GetApiConfigVersionsQuery> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(query: GetApiConfigVersionsQuery): Promise<ApiConfig[]> {
    return await this.apiConfigRepository.findVersions(query.projectId, query.code);
  }
}
