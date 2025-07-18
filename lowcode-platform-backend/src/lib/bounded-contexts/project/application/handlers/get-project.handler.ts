import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { 
  GetProjectQuery, 
  GetProjectByCodeQuery, 
  GetProjectsQuery,
  GetProjectsPaginatedQuery 
} from '@project/application/queries/get-project.query';
import { Project } from '@project/domain/project.model';
import { ProjectRepository } from '@project/domain/project.repository';

@QueryHandler(GetProjectQuery)
export class GetProjectHandler implements IQueryHandler<GetProjectQuery> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(query: GetProjectQuery): Promise<Project> {
    const project = await this.projectRepository.findById(query.id);
    if (!project) {
      throw new NotFoundException(`Project with id '${query.id}' not found`);
    }
    return project;
  }
}

@QueryHandler(GetProjectByCodeQuery)
export class GetProjectByCodeHandler implements IQueryHandler<GetProjectByCodeQuery> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(query: GetProjectByCodeQuery): Promise<Project> {
    const project = await this.projectRepository.findByCode(query.code);
    if (!project) {
      throw new NotFoundException(
        `Project with code '${query.code}' not found`
      );
    }
    return project;
  }
}

@QueryHandler(GetProjectsQuery)
export class GetProjectsHandler implements IQueryHandler<GetProjectsQuery> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(query: GetProjectsQuery): Promise<Project[]> {
    return await this.projectRepository.findAll();
  }
}

@QueryHandler(GetProjectsPaginatedQuery)
export class GetProjectsPaginatedHandler implements IQueryHandler<GetProjectsPaginatedQuery> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(query: GetProjectsPaginatedQuery): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.projectRepository.findPaginated(
      query.page,
      query.limit,
      query.filters,
    );
  }
}
