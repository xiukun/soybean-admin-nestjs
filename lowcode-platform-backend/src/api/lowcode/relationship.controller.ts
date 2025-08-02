/*
 * @Description: 实体关系管理控制器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AmisResponse } from '@lib/shared/decorators/amis-response.decorator';

// 命令
import {
  CreateRelationshipCommand,
  UpdateRelationshipCommand,
  DeleteRelationshipCommand,
  ValidateRelationshipCommand,
  GenerateRelationshipSQLCommand,
  BatchCreateRelationshipsCommand,
  SyncRelationshipsCommand,
  RelationshipConfig,
} from '@lib/bounded-contexts/relationship/application/commands/relationship.commands';

// 查询
import {
  GetRelationshipsQuery,
  GetRelationshipByIdQuery,
  GetProjectRelationshipsQuery,
  GetEntityRelationshipsQuery,
  GetRelationshipTypesQuery,
  ValidateRelationshipConfigQuery,
  GetRelationshipSQLQuery,
  GetRelationshipGraphQuery,
  GetRelationshipStatsQuery,
  RelationshipListFilter,
  RelationshipListOptions,
} from '@lib/bounded-contexts/relationship/application/queries/relationship.queries';

@ApiTags('关系管理')
@Controller({ path: 'relationships', version: '1' })
export class RelationshipController {
  private readonly logger = new Logger(RelationshipController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建实体关系' })
  @ApiBody({
    description: '关系创建数据',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        name: { type: 'string', description: '关系名称' },
        code: { type: 'string', description: '关系代码' },
        description: { type: 'string', description: '关系描述' },
        config: {
          type: 'object',
          description: '关系配置',
          properties: {
            type: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'] },
            sourceEntityId: { type: 'string' },
            targetEntityId: { type: 'string' },
            sourceFieldId: { type: 'string' },
            targetFieldId: { type: 'string' },
            foreignKeyName: { type: 'string' },
            onDelete: { type: 'string', enum: ['CASCADE', 'RESTRICT', 'SET_NULL', 'NO_ACTION'] },
            onUpdate: { type: 'string', enum: ['CASCADE', 'RESTRICT', 'SET_NULL', 'NO_ACTION'] },
            indexed: { type: 'boolean' },
          },
        },
        userId: { type: 'string', description: '用户ID' },
      },
      required: ['projectId', 'name', 'code', 'config', 'userId'],
    },
  })
  @AmisResponse({ description: '创建成功', dataKey: 'relationship' })
  async createRelationship(
    @Body() createData: {
      projectId: string;
      name: string;
      code: string;
      description: string;
      config: RelationshipConfig;
      userId: string;
    },
  ): Promise<any> {
    const command = new CreateRelationshipCommand(
      createData.projectId,
      createData.name,
      createData.code,
      createData.description,
      createData.config,
      createData.userId,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
      data: result.data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新实体关系' })
  @ApiParam({ name: 'id', description: '关系ID' })
  @AmisResponse({ description: '更新成功', dataKey: 'relationship' })
  async updateRelationship(
    @Param('id') relationshipId: string,
    @Body() updateData: {
      name?: string;
      description?: string;
      config?: Partial<RelationshipConfig>;
      userId?: string;
    },
  ): Promise<any> {
    const command = new UpdateRelationshipCommand(
      relationshipId,
      updateData.name,
      updateData.description,
      updateData.config,
      updateData.userId,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
      data: result.data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除实体关系' })
  @ApiParam({ name: 'id', description: '关系ID' })
  @AmisResponse({ description: '删除成功' })
  async deleteRelationship(
    @Param('id') relationshipId: string,
    @Body() deleteData: { userId: string },
  ): Promise<any> {
    const command = new DeleteRelationshipCommand(
      relationshipId,
      deleteData.userId,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取关系列表' })
  @ApiQuery({ name: 'projectId', description: '项目ID', required: false })
  @ApiQuery({ name: 'sourceEntityId', description: '源实体ID', required: false })
  @ApiQuery({ name: 'targetEntityId', description: '目标实体ID', required: false })
  @ApiQuery({ name: 'type', description: '关系类型', required: false })
  @ApiQuery({ name: 'search', description: '搜索关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sortBy', description: '排序字段', required: false })
  @ApiQuery({ name: 'sortOrder', description: '排序方向', required: false })
  @AmisResponse({ description: '获取成功', dataKey: 'options' })
  async getRelationships(
    @Query('projectId') projectId?: string,
    @Query('sourceEntityId') sourceEntityId?: string,
    @Query('targetEntityId') targetEntityId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<any> {
    const filter: RelationshipListFilter = {
      projectId,
      sourceEntityId,
      targetEntityId,
      type,
      search,
    };

    const options: RelationshipListOptions = {
      page: page || 1,
      size: size || 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };

    const query = new GetRelationshipsQuery(filter, options);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('meta/types')
  @ApiOperation({ summary: '获取关系类型列表' })
  @AmisResponse({ description: '获取成功', dataKey: 'types' })
  async getRelationshipTypes(): Promise<any> {
    const query = new GetRelationshipTypesQuery();
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: '获取项目关系分页列表' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiQuery({ name: 'current', description: '当前页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'type', description: '关系类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'search', description: '搜索关键词', required: false })
  @AmisResponse({ description: '获取成功', dataKey: 'options' })
  async getProjectRelationshipsPaginated(
    @Param('projectId') projectId: string,
    @Query('current') current?: number,
    @Query('size') size?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    const filter: RelationshipListFilter = {
      projectId,
      type,
      search,
    };

    const options: RelationshipListOptions = {
      page: current || 1,
      size: size || 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const query = new GetProjectRelationshipsQuery(projectId, options);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: {
        records: result.items || [],
        current: result.pagination?.page || 1,
        size: result.pagination?.size || 10,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      },
    };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: '获取项目所有关系' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'options' })
  async getProjectAllRelationships(
    @Param('projectId') projectId: string,
  ): Promise<any> {
    const query = new GetProjectRelationshipsQuery(projectId, { page: 1, size: 1000 });
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result.items || [],
    };
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: '获取项目关系列表' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @AmisResponse({ description: '获取成功', dataKey: 'options' })
  async getProjectRelationships(
    @Param('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ): Promise<any> {
    const options: RelationshipListOptions = {
      page: page || 1,
      size: size || 10,
    };

    const query = new GetProjectRelationshipsQuery(projectId, options);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('entities/:entityId')
  @ApiOperation({ summary: '获取实体关系' })
  @ApiParam({ name: 'entityId', description: '实体ID' })
  @ApiQuery({ name: 'direction', description: '关系方向', required: false })
  @AmisResponse({ description: '获取成功', dataKey: 'options' })
  async getEntityRelationships(
    @Param('entityId') entityId: string,
    @Query('direction') direction?: 'source' | 'target' | 'both',
  ): Promise<any> {
    const query = new GetEntityRelationshipsQuery(entityId, direction);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取关系详情' })
  @ApiParam({ name: 'id', description: '关系ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'relationship' })
  async getRelationshipById(@Param('id') relationshipId: string): Promise<any> {
    const query = new GetRelationshipByIdQuery(relationshipId);
    const result = await this.queryBus.execute(query);

    return {
      status: result ? 0 : 1,
      msg: result ? 'success' : 'relationship not found',
      data: result,
    };
  }

  @Get('project/:projectId/graph')
  @ApiOperation({ summary: '获取项目关系图' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'graph' })
  async getProjectRelationshipGraph(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipGraphQuery(projectId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: '获取项目关系统计' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'stats' })
  async getProjectRelationshipStats(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipStatsQuery(projectId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('project/:projectId/code/:code')
  @ApiOperation({ summary: '根据代码获取关系' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'code', description: '关系代码' })
  @AmisResponse({ description: '获取成功', dataKey: 'relationship' })
  async getRelationshipByCode(
    @Param('projectId') projectId: string,
    @Param('code') code: string,
  ): Promise<any> {
    const filter: RelationshipListFilter = {
      projectId,
      search: code,
    };

    const query = new GetRelationshipsQuery(filter, { page: 1, size: 1 });
    const result = await this.queryBus.execute(query);

    const relationship = result.items?.find(item => item.code === code);

    return {
      status: relationship ? 0 : 1,
      msg: relationship ? 'success' : 'relationship not found',
      data: relationship,
    };
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: '获取实体关系' })
  @ApiParam({ name: 'entityId', description: '实体ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'relationships' })
  async getRelationshipsByEntity(@Param('entityId') entityId: string): Promise<any> {
    const query = new GetEntityRelationshipsQuery(entityId, 'both');
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('projects/:projectId/graph')
  @ApiOperation({ summary: '获取项目关系图' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'graph' })
  async getRelationshipGraph(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipGraphQuery(projectId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('projects/:projectId/stats')
  @ApiOperation({ summary: '获取关系统计' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'stats' })
  async getRelationshipStats(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetRelationshipStatsQuery(projectId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get(':id/sql')
  @ApiOperation({ summary: '获取关系SQL' })
  @ApiParam({ name: 'id', description: '关系ID' })
  @AmisResponse({ description: '获取成功', dataKey: 'sql' })
  async getRelationshipSQL(@Param('id') relationshipId: string): Promise<any> {
    const query = new GetRelationshipSQLQuery(relationshipId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: '验证关系配置' })
  @AmisResponse({ description: '验证完成', dataKey: 'validation' })
  async validateRelationshipConfig(
    @Body() validateData: {
      projectId: string;
      config: RelationshipConfig;
    },
  ): Promise<any> {
    const query = new ValidateRelationshipConfigQuery(
      validateData.projectId,
      validateData.config,
    );
    const result = await this.queryBus.execute(query);

    return {
      status: result.isValid ? 0 : 1,
      msg: result.isValid ? 'success' : 'validation failed',
      data: result,
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建关系' })
  @AmisResponse({ description: '批量创建完成', dataKey: 'result' })
  async batchCreateRelationships(
    @Body() batchData: {
      projectId: string;
      relationships: Array<{
        name: string;
        code: string;
        description: string;
        config: RelationshipConfig;
      }>;
      userId: string;
    },
  ): Promise<any> {
    const command = new BatchCreateRelationshipsCommand(
      batchData.projectId,
      batchData.relationships,
      batchData.userId,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
      data: result.data,
    };
  }

  @Post('projects/:projectId/sync')
  @ApiOperation({ summary: '同步项目关系' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @AmisResponse({ description: '同步完成', dataKey: 'result' })
  async syncRelationships(
    @Param('projectId') projectId: string,
    @Body() syncData: { userId: string },
  ): Promise<any> {
    const command = new SyncRelationshipsCommand(
      projectId,
      syncData.userId,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
      data: result.data,
    };
  }

  @Post(':id/generate-sql')
  @ApiOperation({ summary: '生成关系SQL' })
  @ApiParam({ name: 'id', description: '关系ID' })
  @AmisResponse({ description: '生成成功', dataKey: 'result' })
  async generateRelationshipSQL(@Param('id') relationshipId: string): Promise<any> {
    const command = new GenerateRelationshipSQLCommand(relationshipId);
    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.message,
      data: result.data,
    };
  }
}
