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
  Res,
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
import { ListResponse, PaginationResponse, AmisResponse } from '@lib/shared/response/api-response.util';
import { ProjectStatus } from '@project/domain/project.model';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  ProjectResponseDto,
  ProjectListQueryDto,
  ProjectListResponseDto,
  ProjectStatsResponseDto,
  DeployProjectDto,
  ProjectDeploymentResponseDto,
} from '@api/lowcode/dto/project.dto';
import { CreateProjectCommand } from '@project/application/commands/create-project.command';
import { UpdateProjectCommand } from '@project/application/commands/update-project.command';
import { UpdateProjectStatusCommand } from '@project/application/commands/update-project-status.command';
import { DeleteProjectCommand } from '@project/application/commands/delete-project.command';
import { DeployProjectCommand, StopProjectDeploymentCommand } from '@project/application/commands/deploy-project.command';
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
  @Public()
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
  @Public()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Projects found',
    type: [ProjectResponseDto],
  })
  async getProjects(): Promise<any> {
    const query = new GetProjectsQuery();
    const projects = await this.queryBus.execute(query);
    const projectDtos = projects.map((project: any) => this.mapToResponseDto(project));

    // 返回项目数组（用于获取所有项目）
    return ListResponse.simple(projectDtos);
  }

  @Get('amis')
  @Public()
  @ApiOperation({ summary: 'Get all projects for amis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Projects found for amis',
  })
  async getProjectsForAmis(): Promise<any> {
    const query = new GetProjectsQuery();
    const projects = await this.queryBus.execute(query);
    const projectDtos = projects.map((project: any) => this.mapToResponseDto(project));

    // 返回amis格式的项目数据
    return AmisResponse.table(projectDtos);
  }

  @Get('paginated')
  @Public()
  @ApiOperation({ summary: 'Get paginated projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated projects found',
    type: ProjectListResponseDto,
  })
  async getProjectsPaginated(@Query() query: ProjectListQueryDto): Promise<any> {
    const paginatedQuery = new GetProjectsPaginatedQuery(
      query.current,
      query.size,
      {
        status: query.status,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    // 返回Vue表格标准分页格式
    const projectDtos = result.projects.map((project: any) => this.mapToResponseDto(project));
    return PaginationResponse.simple(projectDtos, result.page, result.limit, result.total);
  }

  @Get('paginated/amis')
  @Public()
  @ApiOperation({ summary: 'Get paginated projects for amis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated projects found for amis',
  })
  async getProjectsPaginatedForAmis(@Query() query: ProjectListQueryDto): Promise<any> {
    const paginatedQuery = new GetProjectsPaginatedQuery(
      query.current || 1,
      query.size || 10,
      {
        status: query.status,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    // 返回amis分页格式
    const projectDtos = result.projects.map((project: any) => this.mapToResponseDto(project));
    return AmisResponse.paginationTable(projectDtos, result.page, result.limit, result.total);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project statistics',
    type: ProjectStatsResponseDto,
  })
  async getProjectStats(): Promise<ProjectStatsResponseDto> {
    // 执行查询获取统计信息
    const allProjects = await this.queryBus.execute(new GetProjectsQuery());

    const total = allProjects.length;
    const active = allProjects.filter((p: any) => p.status === 'ACTIVE').length;
    const inactive = allProjects.filter((p: any) => p.status === 'INACTIVE').length;
    const archived = allProjects.filter((p: any) => p.status === 'ARCHIVED').length;
    const deployed = allProjects.filter((p: any) => p.deploymentStatus === 'DEPLOYED').length;

    return {
      total,
      active,
      inactive,
      archived,
      deployed,
      createdToday: 0, // TODO: 实现今日创建数量统计
      createdThisWeek: 0, // TODO: 实现本周创建数量统计
      createdThisMonth: 0, // TODO: 实现本月创建数量统计
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

  @Post(':id/deploy')
  @ApiOperation({ summary: 'Deploy project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project deployment started successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Project cannot be deployed in current state',
  })
  async deployProject(
    @Param('id') id: string,
    @Body() deployDto: DeployProjectDto
  ): Promise<ProjectResponseDto> {
    const command = new DeployProjectCommand(
      id,
      deployDto.port,
      deployDto.config,
      'system' // TODO: Get from authenticated user
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Post(':id/stop-deployment')
  @ApiOperation({ summary: 'Stop project deployment' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project deployment stopped successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Project is not deployed',
  })
  async stopProjectDeployment(@Param('id') id: string): Promise<ProjectResponseDto> {
    const command = new StopProjectDeploymentCommand(
      id,
      'system' // TODO: Get from authenticated user
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Post(':id/duplicate')
  @Public()
  @ApiOperation({ summary: 'Duplicate project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project duplicated successfully',
    type: ProjectResponseDto,
  })
  async duplicateProject(
    @Param('id') id: string,
    @Body() data: { name: string }
  ): Promise<any> {
    // 获取原项目
    const query = new GetProjectQuery(id);
    const originalProject = await this.queryBus.execute(query);

    // 创建新项目（复制）
    const command = new CreateProjectCommand(
      data.name,
      `${originalProject.code}_copy_${Date.now()}`,
      `${originalProject.description} (复制)`,
      originalProject.version,
      originalProject.config,
      'system'
    );

    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Put(':id/archive')
  @Public()
  @ApiOperation({ summary: 'Archive project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project archived successfully',
    type: ProjectResponseDto,
  })
  async archiveProject(@Param('id') id: string): Promise<any> {
    const command = new UpdateProjectStatusCommand(id, ProjectStatus.ARCHIVED);
    const project = await this.commandBus.execute(command);
    return this.mapToResponseDto(project);
  }

  @Get(':id/export')
  @Public()
  @ApiOperation({ summary: 'Export project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project exported successfully',
  })
  async exportProject(@Param('id') id: string, @Res() res: any): Promise<void> {
    const query = new GetProjectQuery(id);
    const project = await this.queryBus.execute(query);

    const exportData = {
      project: this.mapToResponseDto(project),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.code}_export.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  }

  @Post('test-connection')
  @Public()
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test result',
  })
  async testDatabaseConnection(@Body() config: any): Promise<any> {
    // Mock implementation
    return {
      success: true,
      message: 'Database connection successful'
    };
  }

  @Post('validate-config')
  @Public()
  @ApiOperation({ summary: 'Validate project configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration validation result',
  })
  async validateProjectConfig(@Body() config: any): Promise<any> {
    // Mock implementation
    const errors: string[] = [];

    if (!config.framework) {
      errors.push('Framework is required');
    }
    if (!config.database) {
      errors.push('Database is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
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
      deploymentStatus: project.deploymentStatus || 'INACTIVE',
      deploymentPort: project.deploymentPort,
      deploymentConfig: project.deploymentConfig,
      lastDeployedAt: project.lastDeployedAt,
      deploymentLogs: project.deploymentLogs,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      updatedBy: project.updatedBy,
      updatedAt: project.updatedAt,
    };
  }
}
