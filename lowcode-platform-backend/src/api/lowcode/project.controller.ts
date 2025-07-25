import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@decorators/public.decorator';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  ProjectResponseDto,
  ProjectListQueryDto,
  ProjectListResponseDto,
  ProjectStatsResponseDto,
} from '@api/lowcode/dto/project.dto';
import { CreateProjectCommand } from '@project/application/commands/create-project.command';
import { UpdateProjectCommand } from '@project/application/commands/update-project.command';
import { UpdateProjectStatusCommand } from '@project/application/commands/update-project-status.command';
import { DeleteProjectCommand } from '@project/application/commands/delete-project.command';
import {
  GetProjectQuery,
  GetProjectByCodeQuery,
  GetProjectsQuery,
  GetProjectsPaginatedQuery,
} from '@project/application/queries/get-project.query';

@ApiTags('projects')
@ApiBearerAuth()
@Controller({ path: 'projects', version: '1' })
export class ProjectController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Project with the same code already exists',
  })
  async createProject(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const command = new CreateProjectCommand(
      createProjectDto.name,
      createProjectDto.code,
      createProjectDto.description,
      createProjectDto.version,
      createProjectDto.config,
      'system', // TODO: Get from authenticated user
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Projects found',
    type: [ProjectResponseDto],
  })
  async getProjects(): Promise<ProjectResponseDto[]> {
    const query = new GetProjectsQuery();
    const projects = await this.queryBus.execute(query);
    return projects.map(project => this.mapToResponseDto(project));
  }

  @Get('paginated')
  @Public()
  @ApiOperation({ summary: 'Get paginated projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated projects found',
    type: ProjectListResponseDto,
  })
  async getProjectsPaginated(@Query() query: ProjectListQueryDto): Promise<ProjectListResponseDto> {
    const paginatedQuery = new GetProjectsPaginatedQuery(
      query.current,
      query.size,
      {
        status: query.status,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    return {
      options: result.projects.map(project => this.mapToResponseDto(project)),
      page: result.page,
      perPage: result.limit,
      total: result.total,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project statistics',
    type: ProjectStatsResponseDto,
  })
  async getProjectStats(): Promise<ProjectStatsResponseDto> {
    // TODO: Implement project statistics query
    return {
      total: 0,
      active: 0,
      inactive: 0,
      archived: 0,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async getProject(@Param('id') id: string): Promise<ProjectResponseDto> {
    const query = new GetProjectQuery(id);
    const project = await this.queryBus.execute(query);
    return this.mapToResponseDto(project);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get project by code' })
  @ApiParam({ name: 'code', description: 'Project code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async getProjectByCode(@Param('code') code: string): Promise<ProjectResponseDto> {
    const query = new GetProjectByCodeQuery(code);
    const project = await this.queryBus.execute(query);
    return this.mapToResponseDto(project);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Project with the same code already exists',
  })
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const command = new UpdateProjectCommand(
      id,
      updateProjectDto.name,
      updateProjectDto.code,
      updateProjectDto.description,
      updateProjectDto.version,
      updateProjectDto.config,
      'system', // TODO: Get from authenticated user
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project status updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async updateProjectStatus(
    @Param('id') id: string,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
  ): Promise<ProjectResponseDto> {
    const command = new UpdateProjectStatusCommand(
      id,
      updateProjectStatusDto.status,
      'system', // TODO: Get from authenticated user
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Project deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async deleteProject(@Param('id') id: string): Promise<void> {
    const command = new DeleteProjectCommand(id);
    await this.commandBus.execute(command);
  }

  private mapToResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      version: project.version,
      config: project.config,
      status: project.status,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      updatedBy: project.updatedBy,
      updatedAt: project.updatedAt,
    };
  }
}
