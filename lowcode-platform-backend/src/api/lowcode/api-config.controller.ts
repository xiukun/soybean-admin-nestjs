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
  @ApiOperation({ summary: 'Get paginated API configurations by project for platform management' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated API configurations found (Platform Management Format)',
  })
  async getApiConfigsPaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    // 平台管理接口：使用 current/size 参数
    const current = parseInt(query.current) || 1;
    const size = parseInt(query.size) || 10;

    const paginatedQuery = new GetApiConfigsPaginatedQuery(
      projectId,
      current,
      size,
      {
        method: query.method,
        status: query.status,
        entityId: query.entityId,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    // 返回平台管理格式：records 格式
    return {
      records: result.apiConfigs.map((apiConfig: any) => this.mapToResponseDto(apiConfig)),
      total: result.total,
      current: result.page,
      size: result.limit,
    };
  }

  @Get('project/:projectId/lowcode-paginated')
  @ApiOperation({ summary: 'Get paginated API configurations by project for lowcode pages' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated API configurations found (Lowcode Format)',
  })
  async getApiConfigsLowcodePaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    // 低代码页面接口：使用 page/perPage 参数
    const page = query.page || 1;
    const perPage = query.perPage || 10;

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

    // 返回低代码格式：options 格式，符合 amis 标准
    return {
      status: 0,
      msg: '',
      data: {
        options: result.apiConfigs.map((apiConfig: any) => this.mapToLowcodeResponseDto(apiConfig)),
        page: result.page,
        perPage: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
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

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new version of API configuration' })
  @ApiParam({ name: 'id', description: 'API configuration ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API configuration version created successfully',
  })
  async createApiConfigVersion(
    @Param('id') id: string,
    @Body() createVersionDto: any,
  ): Promise<any> {
    // Get the current API configuration
    const currentApiConfig = await this.queryBus.execute(new GetApiConfigQuery(id));

    if (!currentApiConfig) {
      throw new Error('API configuration not found');
    }

    // Create a new version with updated data
    const command = new CreateApiConfigCommand(
      currentApiConfig.projectId,
      createVersionDto.name || currentApiConfig.name,
      currentApiConfig.code,
      createVersionDto.method || currentApiConfig.method,
      createVersionDto.path || currentApiConfig.path,
      createVersionDto.description || currentApiConfig.description,
      currentApiConfig.entityId,
      createVersionDto.parameters || currentApiConfig.parameters,
      createVersionDto.responses || currentApiConfig.responses,
      createVersionDto.security || currentApiConfig.security,
      createVersionDto.config || currentApiConfig.config,
      'system', // TODO: Get from authenticated user
    );

    const newVersion = await this.commandBus.execute(command);
    return this.mapToResponseDto(newVersion);
  }

  @Put(':id/rollback/:version')
  @ApiOperation({ summary: 'Rollback API configuration to a specific version' })
  @ApiParam({ name: 'id', description: 'API configuration ID' })
  @ApiParam({ name: 'version', description: 'Version to rollback to' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API configuration rolled back successfully',
  })
  async rollbackApiConfigVersion(
    @Param('id') id: string,
    @Param('version') version: string,
  ): Promise<any> {
    // Get the current API configuration
    const currentApiConfig = await this.queryBus.execute(new GetApiConfigQuery(id));

    if (!currentApiConfig) {
      throw new Error('API configuration not found');
    }

    // Get the target version
    const versions = await this.queryBus.execute(
      new GetApiConfigVersionsQuery(currentApiConfig.projectId, currentApiConfig.code)
    );

    const targetVersion = versions.find((v: any) => v.version === version);
    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Create a new version based on the target version
    const command = new CreateApiConfigCommand(
      targetVersion.projectId,
      targetVersion.name,
      targetVersion.code,
      targetVersion.method,
      targetVersion.path,
      targetVersion.description,
      targetVersion.entityId,
      targetVersion.parameters,
      targetVersion.responses,
      targetVersion.security,
      targetVersion.config,
      'system', // TODO: Get from authenticated user
    );

    const rolledBackVersion = await this.commandBus.execute(command);
    return this.mapToResponseDto(rolledBackVersion);
  }

  @Get('project/:projectId/documentation')
  @ApiOperation({ summary: 'Generate API documentation for project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API documentation generated successfully',
  })
  async generateDocumentation(
    @Param('projectId') projectId: string,
    @Query('format') format: string = 'swagger',
    @Query('includeInactive') includeInactive: boolean = false,
  ): Promise<any> {
    const query = new GetApiConfigsByProjectQuery(projectId);
    const apiConfigs = await this.queryBus.execute(query);

    const filteredConfigs = includeInactive
      ? apiConfigs
      : apiConfigs.filter((config: any) => config.status === 'ACTIVE');

    const mappedConfigs = filteredConfigs.map((config: any) => this.mapToResponseDto(config));

    switch (format) {
      case 'swagger':
        return this.generateSwaggerDoc(mappedConfigs);
      case 'openapi':
        return this.generateOpenAPIDoc(mappedConfigs);
      default:
        return this.generateSwaggerDoc(mappedConfigs);
    }
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

  private mapToLowcodeResponseDto(apiConfig: any): any {
    return {
      label: `${apiConfig.method} ${apiConfig.path}`,
      value: apiConfig.id,
      id: apiConfig.id,
      name: apiConfig.name,
      method: apiConfig.method,
      path: apiConfig.path,
      fullPath: apiConfig.getFullPath(),
      description: apiConfig.description,
      status: apiConfig.status,
      hasAuthentication: apiConfig.hasAuthentication(),
      // 为低代码页面提供的额外字段
      api: apiConfig.getFullPath(),
      url: apiConfig.getFullPath(),
      // 支持 amis 的数据源格式
      ...(apiConfig.method === 'GET' && {
        // GET 请求可以直接作为数据源使用
        data: {
          api: apiConfig.getFullPath(),
          method: apiConfig.method,
        }
      }),
    };
  }

  private generateSwaggerDoc(apiConfigs: any[]): any {
    const swagger = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'Generated API documentation'
      },
      servers: [
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server'
        }
      ],
      paths: {} as any,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    apiConfigs.forEach(api => {
      const path = api.path;
      const method = api.method.toLowerCase();

      if (!swagger.paths[path]) {
        swagger.paths[path] = {};
      }

      swagger.paths[path][method] = {
        summary: api.name,
        description: api.description || '',
        tags: ['API'],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'integer', example: 0 },
                    msg: { type: 'string', example: '' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      };

      if (api.hasAuthentication) {
        swagger.paths[path][method].security = [{ bearerAuth: [] }];
      }
    });

    return swagger;
  }

  private generateOpenAPIDoc(apiConfigs: any[]): any {
    // Generate OpenAPI 3.0 specification
    return this.generateSwaggerDoc(apiConfigs);
  }
}
