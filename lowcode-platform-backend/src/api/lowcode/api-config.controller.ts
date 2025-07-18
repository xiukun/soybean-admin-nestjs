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
import { CreateApiConfigCommand } from '@lib/bounded-contexts/api-config/application/commands/create-api-config.command';
import {
  GetApiConfigQuery,
  GetApiConfigByCodeQuery,
  GetApiConfigsByProjectQuery,
  GetApiConfigsPaginatedQuery,
  GetApiConfigsByEntityQuery,
  GetApiConfigStatsQuery,
  GetPublishedApiConfigsQuery,
  GetApiConfigVersionsQuery,
} from '@lib/bounded-contexts/api-config/application/queries/get-api-config.query';
import { PaginationParamsDto } from '@dto/pagination.dto';

@ApiTags('api-configs')
@ApiBearerAuth()
@Controller({ path: 'api-configs', version: '1' })
export class ApiConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API configuration created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'API configuration with the same code or path already exists',
  })
  async createApiConfig(@Body() createApiConfigDto: any): Promise<any> {
    const command = new CreateApiConfigCommand(
      createApiConfigDto.projectId,
      createApiConfigDto.name,
      createApiConfigDto.code,
      createApiConfigDto.method,
      createApiConfigDto.path,
      createApiConfigDto.description,
      createApiConfigDto.entityId,
      createApiConfigDto.parameters,
      createApiConfigDto.responses,
      createApiConfigDto.security,
      createApiConfigDto.config,
      'system', // TODO: Get from authenticated user
    );

    const apiConfig = await this.commandBus.execute(command);
    return this.mapToResponseDto(apiConfig);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all API configurations by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configurations found',
  })
  async getApiConfigsByProject(@Param('projectId') projectId: string): Promise<any[]> {
    const query = new GetApiConfigsByProjectQuery(projectId);
    const apiConfigs = await this.queryBus.execute(query);
    return apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig));
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: 'Get paginated API configurations by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated API configurations found',
  })
  async getApiConfigsPaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    // 使用统一的分页参数
    const page = query.page || 1;
    const perPage = query.perPage || query.limit || 10; // 兼容旧版本的limit参数

    const paginatedQuery = new GetApiConfigsPaginatedQuery(
      projectId,
      page,
      perPage,
      {
        method: query.method,
        status: query.status,
        entityId: query.entityId,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    // 返回统一的分页格式
    return {
      apiConfigs: result.apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig)),
      total: result.total,
      page: result.page,
      perPage: result.limit, // 将limit映射为perPage
      totalPages: result.totalPages,
    };
  }

  @Get('project/:projectId/published')
  @ApiOperation({ summary: 'Get published API configurations by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Published API configurations found',
  })
  async getPublishedApiConfigs(@Param('projectId') projectId: string): Promise<any[]> {
    const query = new GetPublishedApiConfigsQuery(projectId);
    const apiConfigs = await this.queryBus.execute(query);
    return apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig));
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get API configuration statistics by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configuration statistics',
  })
  async getApiConfigStats(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetApiConfigStatsQuery(projectId);
    return await this.queryBus.execute(query);
  }

  @Get('project/:projectId/code/:code/versions')
  @ApiOperation({ summary: 'Get API configuration versions by code' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'code', description: 'API configuration code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configuration versions found',
  })
  async getApiConfigVersions(
    @Param('projectId') projectId: string,
    @Param('code') code: string,
  ): Promise<any[]> {
    const query = new GetApiConfigVersionsQuery(projectId, code);
    const apiConfigs = await this.queryBus.execute(query);
    return apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig));
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Get API configurations by entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configurations found',
  })
  async getApiConfigsByEntity(@Param('entityId') entityId: string): Promise<any[]> {
    const query = new GetApiConfigsByEntityQuery(entityId);
    const apiConfigs = await this.queryBus.execute(query);
    return apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API configuration by ID' })
  @ApiParam({ name: 'id', description: 'API configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configuration found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API configuration not found',
  })
  async getApiConfig(@Param('id') id: string): Promise<any> {
    const query = new GetApiConfigQuery(id);
    const apiConfig = await this.queryBus.execute(query);
    return this.mapToResponseDto(apiConfig);
  }

  @Get('project/:projectId/code/:code')
  @ApiOperation({ summary: 'Get API configuration by code' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'code', description: 'API configuration code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configuration found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API configuration not found',
  })
  async getApiConfigByCode(
    @Param('projectId') projectId: string,
    @Param('code') code: string,
  ): Promise<any> {
    const query = new GetApiConfigByCodeQuery(projectId, code);
    const apiConfig = await this.queryBus.execute(query);
    return this.mapToResponseDto(apiConfig);
  }

  private mapToResponseDto(apiConfig: any): any {
    return {
      id: apiConfig.id,
      projectId: apiConfig.projectId,
      name: apiConfig.name,
      code: apiConfig.code,
      description: apiConfig.description,
      method: apiConfig.method,
      path: apiConfig.path,
      fullPath: apiConfig.getFullPath(),
      entityId: apiConfig.entityId,
      parameters: apiConfig.parameters,
      responses: apiConfig.responses,
      security: apiConfig.security,
      config: apiConfig.config,
      status: apiConfig.status,
      version: apiConfig.version,
      hasParameters: apiConfig.hasParameters(),
      hasAuthentication: apiConfig.hasAuthentication(),
      createdBy: apiConfig.createdBy,
      createdAt: apiConfig.createdAt,
      updatedBy: apiConfig.updatedBy,
      updatedAt: apiConfig.updatedAt,
    };
  }
}
