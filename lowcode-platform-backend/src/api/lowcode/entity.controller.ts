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
  ApiBody,
} from '@nestjs/swagger';
import { IntelligentCodeGeneratorService } from '@lib/bounded-contexts/code-generation/application/services/intelligent-code-generator.service';
import {
  CreateEntityDto,
  UpdateEntityDto,
  EntityResponseDto,
  EntityListQueryDto,
  EntityListResponseDto,
} from '@api/lowcode/dto/entity.dto';
import { CreateEntityCommand } from '@entity/application/commands/create-entity.command';
import { UpdateEntityCommand } from '@entity/application/commands/update-entity.command';
import { DeleteEntityCommand } from '@entity/application/commands/delete-entity.command';
import {
  GetEntityQuery,
  GetEntityByCodeQuery,
  GetEntitiesByProjectQuery,
  GetEntitiesPaginatedQuery,
  GetEntityStatsQuery,
} from '@entity/application/queries/get-entity.query';
import * as path from 'path';

@ApiTags('entities')
@ApiBearerAuth()
@Controller({ path: 'entities', version: '1' })
export class EntityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly codeGenerationService: IntelligentCodeGeneratorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entity created successfully',
    type: EntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Entity with the same code or table name already exists',
  })
  async createEntity(@Body() createEntityDto: CreateEntityDto): Promise<EntityResponseDto> {
    const command = new CreateEntityCommand(
      createEntityDto.projectId,
      createEntityDto.name,
      createEntityDto.code,
      createEntityDto.tableName,
      createEntityDto.description,
      createEntityDto.category,
      createEntityDto.diagramPosition,
      createEntityDto.config,
      createEntityDto.status,
      'system', // TODO: Get from authenticated user
    );

    const entity = await this.commandBus.execute(command);
    return this.mapToResponseDto(entity);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity found',
    type: EntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async getEntity(@Param('id') id: string): Promise<EntityResponseDto> {
    const query = new GetEntityQuery(id);
    const entity = await this.queryBus.execute(query);
    return this.mapToResponseDto(entity);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get entities by project ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entities found',
    type: [EntityResponseDto],
  })
  async getEntitiesByProject(@Param('projectId') projectId: string): Promise<EntityResponseDto[]> {
    const query = new GetEntitiesByProjectQuery(projectId);
    const entities = await this.queryBus.execute(query);
    return entities.map(entity => this.mapToResponseDto(entity));
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: 'Get paginated entities by project ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated entities found',
    type: EntityListResponseDto,
  })
  async getEntitiesPaginated(
    @Param('projectId') projectId: string,
    @Query() query: EntityListQueryDto,
  ): Promise<EntityListResponseDto> {
    const paginatedQuery = new GetEntitiesPaginatedQuery(
      projectId,
      query.current,
      query.size,
      {
        status: query.status,
        category: query.category,
        search: query.search,
      },
    );

    const result = await this.queryBus.execute(paginatedQuery);

    return {
      options: result.entities.map(entity => this.mapToResponseDto(entity)),
      page: result.page,
      perPage: result.limit,
      total: result.total,
    };
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get entity statistics by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity statistics',
    type: Object,
  })
  async getEntityStats(@Param('projectId') projectId: string): Promise<{
    total: number;
    draft: number;
    published: number;
    deprecated: number;
  }> {
    const query = new GetEntityStatsQuery(projectId);
    return await this.queryBus.execute(query);
  }

  @Get('project/:projectId/code/:code')
  @ApiOperation({ summary: 'Get entity by project ID and code' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'code', description: 'Entity code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity found',
    type: EntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async getEntityByCode(
    @Param('projectId') projectId: string,
    @Param('code') code: string,
  ): Promise<EntityResponseDto> {
    const query = new GetEntityByCodeQuery(projectId, code);
    const entity = await this.queryBus.execute(query);
    return this.mapToResponseDto(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity updated successfully',
    type: EntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Entity with the same code or table name already exists',
  })
  async updateEntity(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ): Promise<EntityResponseDto> {
    const command = new UpdateEntityCommand(
      id,
      updateEntityDto.name,
      updateEntityDto.code,
      updateEntityDto.tableName,
      updateEntityDto.description,
      updateEntityDto.category,
      updateEntityDto.diagramPosition,
      updateEntityDto.config,
      updateEntityDto.status,
      'system', // TODO: Get from authenticated user
    );

    const entity = await this.commandBus.execute(command);
    return this.mapToResponseDto(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete entity' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Entity deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async deleteEntity(@Param('id') id: string): Promise<void> {
    const command = new DeleteEntityCommand(id);
    await this.commandBus.execute(command);
  }

  @Post(':id/generate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate code for entity' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        targetProject: { type: 'string', example: 'amis-lowcode-backend' },
        options: {
          type: 'object',
          properties: {
            overwrite: { type: 'boolean', default: true },
            createDirectories: { type: 'boolean', default: true },
            format: { type: 'boolean', default: true },
            dryRun: { type: 'boolean', default: false },
          },
        },
      },
      required: ['targetProject'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async generateCodeForEntity(
    @Param('id') id: string,
    @Body() body: { targetProject: string; options?: any },
  ) {
    // Get entity with fields
    const entity = await this.queryBus.execute(new GetEntityQuery(id));
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Transform entity to the format expected by CodeGenerationService
    const entityDefinition = {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      tableName: entity.tableName || entity.code.toLowerCase(),
      description: entity.description,
      fields: entity.fields?.map(field => ({
        id: field.id,
        code: field.code,
        name: field.name,
        type: field.type,
        nullable: field.nullable,
        defaultValue: field.defaultValue,
        comment: field.comment,
        validation: (field as any).validation,
      })) || [],
      relationships: [],
      indexes: [],
      uniqueConstraints: [],
    };

    // Prepare generation options
    const options = {
      targetProject: body.targetProject,
      outputPath: this.getTargetProjectPath(body.targetProject),
      overwrite: body.options?.overwrite ?? true,
      createDirectories: body.options?.createDirectories ?? true,
      format: body.options?.format ?? true,
      dryRun: body.options?.dryRun ?? false,
    };

    // Generate code using the new service
    const generationRequest = {
      projectId: entity.projectId,
      templateIds: [], // 使用默认模板
      entityIds: [id],
      outputPath: options.outputPath,
      variables: {},
      options: {
        overwriteExisting: options.overwrite,
        generateTests: body.options?.generateTests || false,
        generateDocs: body.options?.generateDocs || false,
        architecture: 'base-biz' as const,
        framework: 'nestjs' as const,
      },
    };

    const files = await this.codeGenerationService.generateFiles(generationRequest);
    const result = {
      success: true,
      files,
      message: 'Code generation completed successfully',
    };

    return result;
  }

  @Post('batch/generate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate code for multiple entities' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityIds: { type: 'array', items: { type: 'string' } },
        targetProject: { type: 'string', example: 'amis-lowcode-backend' },
        options: {
          type: 'object',
          properties: {
            overwrite: { type: 'boolean', default: true },
            createDirectories: { type: 'boolean', default: true },
            format: { type: 'boolean', default: true },
            dryRun: { type: 'boolean', default: false },
          },
        },
      },
      required: ['entityIds', 'targetProject'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code generated successfully for all entities',
  })
  async generateCodeForEntities(
    @Body() body: { entityIds: string[]; targetProject: string; options?: any },
  ) {
    // Get entities with fields
    const entities = await Promise.all(
      body.entityIds.map(id => this.queryBus.execute(new GetEntityQuery(id)))
    );

    const validEntities = entities.filter(entity => entity !== null);
    if (validEntities.length === 0) {
      throw new Error('No valid entities found');
    }

    // Transform entities to the format expected by CodeGenerationService
    const entityDefinitions = validEntities.map(entity => ({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      tableName: entity.tableName || entity.code.toLowerCase(),
      description: entity.description,
      fields: entity.fields?.map(field => ({
        id: field.id,
        code: field.code,
        name: field.name,
        type: field.type,
        nullable: field.nullable,
        defaultValue: field.defaultValue,
        comment: field.comment,
        validation: (field as any).validation,
      })) || [],
      relationships: [],
      indexes: [],
      uniqueConstraints: [],
    }));

    // Prepare generation options
    const options = {
      targetProject: body.targetProject,
      outputPath: this.getTargetProjectPath(body.targetProject),
      overwrite: body.options?.overwrite ?? true,
      createDirectories: body.options?.createDirectories ?? true,
      format: body.options?.format ?? true,
      dryRun: body.options?.dryRun ?? false,
    };

    // Generate code using the new service
    const generationRequest = {
      projectId: validEntities[0].projectId,
      templateIds: [], // 使用默认模板
      entityIds: body.entityIds,
      outputPath: options.outputPath,
      variables: {},
      options: {
        overwriteExisting: options.overwrite,
        generateTests: body.options?.generateTests || false,
        generateDocs: body.options?.generateDocs || false,
        architecture: 'base-biz' as const,
        framework: 'nestjs' as const,
      },
    };

    const files = await this.codeGenerationService.generateFiles(generationRequest);
    const result = {
      success: true,
      files,
      message: 'Code generation completed successfully',
    };

    return result;
  }

  private getTargetProjectPath(projectName: string): string {
    const projectPaths = {
      'amis-lowcode-backend': path.join(__dirname, '../../../amis-lowcode-backend'),
      'default': path.join(__dirname, '../../../generated'),
    };

    return projectPaths[projectName] || projectPaths['default'];
  }

  private mapToResponseDto(entity: any): EntityResponseDto {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      code: entity.code,
      tableName: entity.tableName,
      description: entity.description,
      category: entity.category,
      diagramPosition: entity.diagramPosition,
      config: entity.config,
      version: entity.version,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedBy: entity.updatedBy,
      updatedAt: entity.updatedAt,
    };
  }
}
