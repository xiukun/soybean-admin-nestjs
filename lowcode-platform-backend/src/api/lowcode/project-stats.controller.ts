import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '@decorators/public.decorator';

// 导入各模块的统计查询
import { GetEntityStatsQuery } from '@entity/application/queries/get-entity-stats.query';
import { GetRelationshipStatsQuery } from '@relationship/application/queries/get-relationship-stats.query';
import { GetApiConfigStatsQuery } from '@api-config/application/queries/get-api-config-stats.query';
import { GetQueryStatsQuery } from '@query/application/queries/get-query-stats.query';

@ApiTags('Project Statistics')
@Controller('api/v1/projects')
export class ProjectStatsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/stats')
  @Public()
  @ApiOperation({ summary: 'Get comprehensive project statistics' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        entityCount: { type: 'number' },
        relationshipCount: { type: 'number' },
        apiCount: { type: 'number' },
        queryCount: { type: 'number' },
        generatedFiles: { type: 'number' },
        templateCount: { type: 'number' },
        entityStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            draft: { type: 'number' },
            published: { type: 'number' },
            deprecated: { type: 'number' }
          }
        },
        relationshipStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            oneToOne: { type: 'number' },
            oneToMany: { type: 'number' },
            manyToMany: { type: 'number' }
          }
        },
        apiStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' }
          }
        },
        queryStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            byStatus: { type: 'object' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found'
  })
  async getProjectStats(@Param('id') projectId: string): Promise<any> {
    try {
      // 并行获取各模块的统计数据
      const [
        entityStats,
        relationshipStats,
        apiStats,
        queryStats
      ] = await Promise.all([
        this.getEntityStats(projectId),
        this.getRelationshipStats(projectId),
        this.getApiStats(projectId),
        this.getQueryStats(projectId)
      ]);

      // 计算生成文件数量（这里使用一个简单的估算公式）
      const generatedFiles = this.calculateGeneratedFiles(entityStats, apiStats);

      // 计算模板数量（基于实体和API配置）
      const templateCount = this.calculateTemplateCount(entityStats, apiStats);

      return {
        projectId,
        entityCount: entityStats.total || 0,
        relationshipCount: relationshipStats.total || 0,
        apiCount: apiStats.total || 0,
        queryCount: queryStats.total || 0,
        generatedFiles,
        templateCount,
        entityStats,
        relationshipStats,
        apiStats,
        queryStats
      };
    } catch (error) {
      // 如果获取统计数据失败，返回默认值
      return {
        projectId,
        entityCount: 0,
        relationshipCount: 0,
        apiCount: 0,
        queryCount: 0,
        generatedFiles: 0,
        templateCount: 0,
        entityStats: { total: 0, draft: 0, published: 0, deprecated: 0 },
        relationshipStats: { total: 0, oneToOne: 0, oneToMany: 0, manyToMany: 0 },
        apiStats: { total: 0, active: 0, inactive: 0 },
        queryStats: { total: 0, byStatus: {} }
      };
    }
  }

  private async getEntityStats(projectId: string): Promise<any> {
    try {
      const query = new GetEntityStatsQuery(projectId);
      return await this.queryBus.execute(query);
    } catch (error) {
      return { total: 0, draft: 0, published: 0, deprecated: 0 };
    }
  }

  private async getRelationshipStats(projectId: string): Promise<any> {
    try {
      const query = new GetRelationshipStatsQuery(projectId);
      return await this.queryBus.execute(query);
    } catch (error) {
      return { total: 0, oneToOne: 0, oneToMany: 0, manyToMany: 0 };
    }
  }

  private async getApiStats(projectId: string): Promise<any> {
    try {
      const query = new GetApiConfigStatsQuery(projectId);
      return await this.queryBus.execute(query);
    } catch (error) {
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  private async getQueryStats(projectId: string): Promise<any> {
    try {
      const query = new GetQueryStatsQuery(projectId);
      return await this.queryBus.execute(query);
    } catch (error) {
      return { total: 0, byStatus: {} };
    }
  }

  /**
   * 计算生成文件数量
   * 基于实体数量、API数量等估算
   */
  private calculateGeneratedFiles(entityStats: any, apiStats: any): number {
    const baseFiles = 10; // 基础文件（package.json, app.module.ts 等）
    const entityFiles = (entityStats.total || 0) * 6; // 每个实体大约生成6个文件（entity, dto, controller, service, repository, module）
    const apiFiles = (apiStats.total || 0) * 2; // 每个API配置大约生成2个文件

    return baseFiles + entityFiles + apiFiles;
  }

  /**
   * 计算模板数量
   * 基于实体和API配置的复杂度
   */
  private calculateTemplateCount(entityStats: any, apiStats: any): number {
    const baseTemplates = 5; // 基础模板（项目模板、通用模板等）
    const entityTemplates = Math.min((entityStats.total || 0), 10); // 实体模板，最多10个
    const apiTemplates = Math.min((apiStats.total || 0), 5); // API模板，最多5个

    return baseTemplates + entityTemplates + apiTemplates;
  }
}