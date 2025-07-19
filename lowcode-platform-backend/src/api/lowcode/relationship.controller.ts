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
import { CreateRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/create-relationship.command';
import { UpdateRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/update-relationship.command';
import { DeleteRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/delete-relationship.command';
import {
  GetRelationshipQuery,
  GetRelationshipByCodeQuery,
  GetRelationshipsByProjectQuery,
  GetRelationshipsPaginatedQuery,
  GetRelationshipsByEntityQuery,
  GetRelationshipGraphQuery,
  GetRelationshipStatsQuery,
} from '@lib/bounded-contexts/relationship/application/queries/get-relationship.query';

@ApiTags('relationships')
@ApiBearerAuth()
@Controller({ path: 'relationships', version: '1' })
export class RelationshipController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new relationship' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Relationship created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Relationship with the same code already exists',
  })
  async createRelationship(@Body() createRelationshipDto: any): Promise<any> {
    const command = new CreateRelationshipCommand(
      createRelationshipDto.projectId,
      createRelationshipDto.name,
      createRelationshipDto.code,
      createRelationshipDto.type,
      createRelationshipDto.sourceEntityId,
      createRelationshipDto.targetEntityId,
      createRelationshipDto.description,
      createRelationshipDto.sourceFieldId,
      createRelationshipDto.targetFieldId,
      createRelationshipDto.foreignKeyName,
      createRelationshipDto.onDelete,
      createRelationshipDto.onUpdate,
      createRelationshipDto.config,
      'system', // TODO: Get from authenticated user
    );

    const relationship = await this.commandBus.execute(command);
    return this.mapToResponseDto(relationship);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all relationships by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationships found',
  })
  async getRelationshipsByProject(@Param('projectId') projectId: string): Promise<any[]> {
    const query = new GetRelationshipsByProjectQuery(projectId);
    const relationships = await this.queryBus.execute(query);
    return relationships.map(relationship => this.mapToResponseDto(relationship));
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: 'Get paginated relationships by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated relationships found',
  })
  async getRelationshipsPaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    const paginatedQuery = new GetRelationshipsPaginatedQuery(
      projectId,
      parseInt(query.current) || 1,
      parseInt(query.size) || 10,
      {
        type: query.type,
        status: query.status,
        sourceEntityId: query.sourceEntityId,
        targetEntityId: query.targetEntityId,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    return {
      records: result.relationships.map(relationship => this.mapToResponseDto(relationship)),
      current: result.page,
      size: result.limit,
      total: result.total,
    };
  }

  @Get('project/:projectId/graph')
  @ApiOperation({ summary: 'Get relationship graph by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationship graph found',
  })
  async getRelationshipGraph(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipGraphQuery(projectId);
    const result = await this.queryBus.execute(query);
    
    return {
      entities: result.entities,
      relationships: result.relationships.map(relationship => this.mapToResponseDto(relationship)),
    };
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get relationship statistics by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationship statistics',
  })
  async getRelationshipStats(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipStatsQuery(projectId);
    return await this.queryBus.execute(query);
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Get relationships by entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationships found',
  })
  async getRelationshipsByEntity(@Param('entityId') entityId: string): Promise<any[]> {
    const query = new GetRelationshipsByEntityQuery(entityId);
    const relationships = await this.queryBus.execute(query);
    return relationships.map(relationship => this.mapToResponseDto(relationship));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relationship by ID' })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationship found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Relationship not found',
  })
  async getRelationship(@Param('id') id: string): Promise<any> {
    const query = new GetRelationshipQuery(id);
    const relationship = await this.queryBus.execute(query);
    return this.mapToResponseDto(relationship);
  }

  @Get('project/:projectId/code/:code')
  @ApiOperation({ summary: 'Get relationship by code' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'code', description: 'Relationship code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationship found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Relationship not found',
  })
  async getRelationshipByCode(
    @Param('projectId') projectId: string,
    @Param('code') code: string,
  ): Promise<any> {
    const query = new GetRelationshipByCodeQuery(projectId, code);
    const relationship = await this.queryBus.execute(query);
    return this.mapToResponseDto(relationship);
  }



  @Put(':id')
  @ApiOperation({ summary: 'Update relationship by ID' })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relationship updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Relationship not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateRelationship(
    @Param('id') id: string,
    @Body() updateDto: any,
  ): Promise<any> {
    const command = new UpdateRelationshipCommand(
      id,
      updateDto.name,
      updateDto.description,
      updateDto.sourceFieldId,
      updateDto.targetFieldId,
      updateDto.foreignKeyName,
      updateDto.onDelete,
      updateDto.onUpdate,
      updateDto.config,
      updateDto.status,
    );

    const relationship = await this.commandBus.execute(command);
    return this.mapToResponseDto(relationship);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete relationship by ID' })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Relationship deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Relationship not found',
  })
  async deleteRelationship(@Param('id') id: string): Promise<void> {
    const command = new DeleteRelationshipCommand(id);
    await this.commandBus.execute(command);
  }

  private mapToResponseDto(relationship: any): any {
    return {
      id: relationship.id,
      projectId: relationship.projectId,
      name: relationship.name,
      code: relationship.code,
      description: relationship.description,
      type: relationship.type,
      sourceEntityId: relationship.sourceEntityId,
      targetEntityId: relationship.targetEntityId,
      sourceEntity: relationship.sourceEntity ? {
        id: relationship.sourceEntity.id,
        name: relationship.sourceEntity.name,
        code: relationship.sourceEntity.code,
      } : null,
      targetEntity: relationship.targetEntity ? {
        id: relationship.targetEntity.id,
        name: relationship.targetEntity.name,
        code: relationship.targetEntity.code,
      } : null,
      sourceFieldId: relationship.sourceFieldId,
      targetFieldId: relationship.targetFieldId,
      foreignKeyName: relationship.foreignKeyName,
      onDelete: relationship.onDelete,
      onUpdate: relationship.onUpdate,
      config: relationship.config,
      status: relationship.status,
      createdBy: relationship.createdBy,
      createdAt: relationship.createdAt,
      updatedBy: relationship.updatedBy,
      updatedAt: relationship.updatedAt,
    };
  }
}
