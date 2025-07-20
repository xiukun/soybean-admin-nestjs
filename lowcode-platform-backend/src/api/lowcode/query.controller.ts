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
import { Public } from '@decorators/public.decorator';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Commands
import {
  CreateQueryCommand,
  UpdateQueryCommand,
  DeleteQueryCommand,
  ExecuteQueryCommand,
  ActivateQueryCommand,
  DeactivateQueryCommand,
} from '@lib/bounded-contexts/query/application/commands/create-query.command';

// Queries
import {
  GetQueryQuery,
  GetQueriesByProjectQuery,
  GetQueriesPaginatedQuery,
  GetQueryStatsQuery,
} from '@lib/bounded-contexts/query/application/queries/get-query.query';

@ApiTags('queries')
@ApiBearerAuth()
@Controller({ path: 'queries', version: '1' })
export class QueryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new query' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Query created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Query with the same name already exists',
  })
  async createQuery(@Body() body: any): Promise<any> {
    const command = new CreateQueryCommand(
      body.projectId,
      body.name,
      body.description,
      body.baseEntityId,
      body.baseEntityAlias || 'main',
      body.joins || [],
      body.fields || [],
      body.filters || [],
      body.sorting || [],
      body.groupBy || [],
      body.having || [],
      body.limit,
      body.offset,
      body.createdBy || 'system',
    );

    const result = await this.commandBus.execute(command);
    return this.mapToResponseDto(result);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all queries by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queries found',
  })
  async getQueriesByProject(@Param('projectId') projectId: string): Promise<any[]> {
    const query = new GetQueriesByProjectQuery(projectId);
    const result = await this.queryBus.execute(query);
    return result.map((q: any) => this.mapToResponseDto(q));
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: 'Get paginated queries by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated queries',
  })
  async getQueriesPaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    const paginatedQuery = new GetQueriesPaginatedQuery(
      projectId,
      parseInt(query.current) || 1,
      parseInt(query.size) || 10,
      {
        status: query.status,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    return {
      records: result.queries.map((q: any) => this.mapToResponseDto(q)),
      current: result.page,
      size: result.limit,
      total: result.total,
    };
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get query statistics by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query statistics',
  })
  async getQueryStats(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetQueryStatsQuery(projectId);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get query by ID' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Query not found',
  })
  async getQueryById(@Param('id') id: string): Promise<any> {
    const query = new GetQueryQuery(id);
    const result = await this.queryBus.execute(query);
    return this.mapToResponseDto(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update query' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Query not found',
  })
  async updateQuery(@Param('id') id: string, @Body() body: any): Promise<any> {
    const command = new UpdateQueryCommand(
      id,
      body.name,
      body.description,
      body.baseEntityId,
      body.baseEntityAlias || 'main',
      body.joins || [],
      body.fields || [],
      body.filters || [],
      body.sorting || [],
      body.groupBy || [],
      body.having || [],
      body.limit,
      body.offset,
      body.sqlQuery,
      body.updatedBy || 'system',
    );

    const result = await this.commandBus.execute(command);
    return this.mapToResponseDto(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete query' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Query deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Query not found',
  })
  async deleteQuery(@Param('id') id: string): Promise<void> {
    const command = new DeleteQueryCommand(id);
    await this.commandBus.execute(command);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute query' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query executed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Query not found',
  })
  async executeQuery(@Param('id') id: string, @Body() body?: any): Promise<any> {
    const command = new ExecuteQueryCommand(id, body?.parameters);
    return this.commandBus.execute(command);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate query' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query activated successfully',
  })
  async activateQuery(@Param('id') id: string): Promise<any> {
    const command = new ActivateQueryCommand(id);
    const result = await this.commandBus.execute(command);
    return this.mapToResponseDto(result);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate query' })
  @ApiParam({ name: 'id', description: 'Query ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query deactivated successfully',
  })
  async deactivateQuery(@Param('id') id: string): Promise<any> {
    const command = new DeactivateQueryCommand(id);
    const result = await this.commandBus.execute(command);
    return this.mapToResponseDto(result);
  }

  private mapToResponseDto(query: any): any {
    return {
      id: query.id,
      projectId: query.projectId,
      name: query.name,
      description: query.description,
      baseEntityId: query.baseEntityId,
      baseEntityAlias: query.baseEntityAlias,
      joins: query.joins,
      fields: query.fields,
      filters: query.filters,
      sorting: query.sorting,
      groupBy: query.groupBy,
      having: query.having,
      limit: query.limit,
      offset: query.offset,
      status: query.status,
      sqlQuery: query.sqlQuery,
      executionStats: query.executionStats,
      createdBy: query.createdBy,
      createdAt: query.createdAt,
      updatedBy: query.updatedBy,
      updatedAt: query.updatedAt,
    };
  }
}
