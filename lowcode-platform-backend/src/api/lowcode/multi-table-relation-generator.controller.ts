import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Headers,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@nestjs/passport';
import { AmisResponse } from '@lib/shared/decorators/amis-response.decorator';
import { 
  MultiTableRelationGeneratorService, 
  MultiTableRelationConfig, 
  RelationQueryConfig,
  AggregateQueryConfig,
  QueryCondition,
  OrderByRule,
} from '../../services/multi-table-relation-generator.service';
import { EntityDefinition } from '../../services/layered-code-generator.service';
import { CodeGenerationManagerService } from '../../services/code-generation-manager.service';

/**
 * 创建多表关联生成任务请求DTO
 */
export class CreateMultiTableRelationTaskDto {
  /** 任务名称 */
  name: string;

  /** 实体定义列表 */
  entities: EntityDefinition[];

  /** 多表关联配置 */
  config: MultiTableRelationConfig;

  /** 关联查询配置 */
  relationQueries?: RelationQueryConfig[];

  /** 聚合查询配置 */
  aggregateQueries?: AggregateQueryConfig[];

  /** 是否异步执行 */
  async?: boolean;

  /** 是否发送通知 */
  sendNotification?: boolean;

  /** 回调URL */
  callbackUrl?: string;
}

/**
 * 分析实体关系请求DTO
 */
export class AnalyzeEntityRelationsDto {
  /** 实体定义列表 */
  entities: EntityDefinition[];

  /** 分析深度 */
  depth?: number;

  /** 是否包含建议 */
  includeSuggestions?: boolean;
}

/**
 * 生成查询配置请求DTO
 */
export class GenerateQueryConfigDto {
  /** 实体列表 */
  entities: string[];

  /** 查询目的 */
  purpose: 'list' | 'detail' | 'statistics' | 'report' | 'dashboard';

  /** 性能要求 */
  performance: 'fast' | 'balanced' | 'comprehensive';

  /** 业务场景 */
  scenario?: string;

  /** 特殊要求 */
  requirements?: string[];
}

/**
 * 多表关联生成器控制器
 */
@ApiTags('Multi Table Relation Generator')
@Controller('multi-table-relation-generator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MultiTableRelationGeneratorController {
  constructor(
    private readonly multiTableRelationGenerator: MultiTableRelationGeneratorService,
    private readonly codeGenerationManager: CodeGenerationManagerService,
  ) {}

  /**
   * 创建多表关联生成任务
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建多表关联生成任务',
    description: '创建多表关联查询接口生成任务，支持复杂的关联查询、聚合查询等',
  })
  @ApiBody({
    type: CreateMultiTableRelationTaskDto,
    description: '多表关联生成任务配置',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '任务创建成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            taskId: { type: 'string', example: 'relation_task_1234567890_abc123' },
            name: { type: 'string', example: '用户订单关联查询接口' },
            entitiesCount: { type: 'number', example: 3 },
            relationQueriesCount: { type: 'number', example: 5 },
            aggregateQueriesCount: { type: 'number', example: 2 },
            estimatedTime: { type: 'number', example: 180 },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createMultiTableRelationTask(
    @Body() createTaskDto: CreateMultiTableRelationTaskDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      // 验证输入数据
      if (!createTaskDto.entities || createTaskDto.entities.length < 2) {
        throw new BadRequestException('多表关联至少需要2个实体');
      }

      if (!createTaskDto.config.projectName) {
        throw new BadRequestException('项目名称不能为空');
      }

      // 验证实体关系
      const hasRelations = createTaskDto.entities.some(entity => 
        entity.relationships && entity.relationships.length > 0
      );
      if (!hasRelations) {
        throw new BadRequestException('实体之间必须存在关联关系');
      }

      // 创建任务ID
      const taskId = `relation_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 如果是异步执行，创建后台任务
      if (createTaskDto.async !== false) {
        // 创建异步任务
        this.executeMultiTableRelationGeneration(
          taskId,
          createTaskDto.entities,
          createTaskDto.config,
          createTaskDto.relationQueries || [],
          createTaskDto.aggregateQueries || [],
          userId,
          {
            sendNotification: createTaskDto.sendNotification,
            callbackUrl: createTaskDto.callbackUrl,
          }
        );

        return {
          taskId,
          name: createTaskDto.name,
          entitiesCount: createTaskDto.entities.length,
          relationQueriesCount: createTaskDto.relationQueries?.length || 0,
          aggregateQueriesCount: createTaskDto.aggregateQueries?.length || 0,
          estimatedTime: this.estimateGenerationTime(createTaskDto),
          message: '多表关联代码生成任务已创建，正在后台执行',
        };
      } else {
        // 同步执行
        const generatedFiles = await this.multiTableRelationGenerator.generateMultiTableRelations(
          createTaskDto.entities,
          createTaskDto.config,
          createTaskDto.relationQueries,
          createTaskDto.aggregateQueries
        );

        return {
          taskId,
          name: createTaskDto.name,
          entitiesCount: createTaskDto.entities.length,
          filesCount: generatedFiles.length,
          relationQueriesCount: createTaskDto.relationQueries?.length || 0,
          aggregateQueriesCount: createTaskDto.aggregateQueries?.length || 0,
          files: generatedFiles.map(file => ({
            filePath: file.filePath,
            type: file.type,
            description: file.description,
          })),
          message: '多表关联代码生成完成',
        };
      }
    } catch (error) {
      throw new BadRequestException('创建多表关联生成任务失败: ' + error.message);
    }
  }

  /**
   * 获取多表关联生成任务状态
   */
  @Get('tasks/:taskId')
  @ApiOperation({
    summary: '获取多表关联生成任务状态',
    description: '获取指定任务的执行状态和进度信息',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
    example: 'relation_task_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '任务状态获取成功',
  })
  @AmisResponse()
  async getMultiTableRelationTaskStatus(@Param('taskId') taskId: string) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        progress: task.progress,
        startTime: task.startTime,
        endTime: task.endTime,
        error: task.error,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        filesCount: task.generatedFiles.length,
        entitiesCount: task.metadata?.entitiesCount || 0,
        relationQueriesCount: task.metadata?.relationQueriesCount || 0,
        aggregateQueriesCount: task.metadata?.aggregateQueriesCount || 0,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务状态失败: ' + error.message);
    }
  }

  /**
   * 分析实体关系
   */
  @Post('analyze-relations')
  @ApiOperation({
    summary: '分析实体关系',
    description: '分析实体之间的关系，生成关系图谱和查询建议',
  })
  @ApiBody({
    type: AnalyzeEntityRelationsDto,
    description: '实体关系分析配置',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            relationshipMap: { type: 'object', description: '关系映射' },
            queryComplexity: { type: 'number', description: '查询复杂度' },
            suggestedQueries: { type: 'array', description: '建议的查询' },
            optimizationTips: { type: 'array', description: '优化建议' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async analyzeEntityRelations(@Body() analyzeDto: AnalyzeEntityRelationsDto) {
    try {
      if (!analyzeDto.entities || analyzeDto.entities.length < 2) {
        throw new BadRequestException('至少需要2个实体进行关系分析');
      }

      // 分析实体关系
      const relationshipMap = this.analyzeRelationships(analyzeDto.entities);
      
      // 计算查询复杂度
      const queryComplexity = this.calculateRelationComplexity(relationshipMap);
      
      // 生成查询建议
      const suggestedQueries = analyzeDto.includeSuggestions 
        ? this.generateQuerySuggestions(analyzeDto.entities, relationshipMap)
        : [];
      
      // 生成优化建议
      const optimizationTips = this.generateOptimizationTips(relationshipMap, queryComplexity);

      return {
        relationshipMap,
        queryComplexity,
        suggestedQueries,
        optimizationTips,
        metadata: {
          entitiesCount: analyzeDto.entities.length,
          relationsCount: Object.values(relationshipMap).flat().length,
          analysisDepth: analyzeDto.depth || 2,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException('实体关系分析失败: ' + error.message);
    }
  }

  /**
   * 生成查询配置
   */
  @Post('generate-query-config')
  @ApiOperation({
    summary: '生成查询配置',
    description: '根据业务需求自动生成查询配置',
  })
  @ApiBody({
    type: GenerateQueryConfigDto,
    description: '查询配置生成参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询配置生成成功',
  })
  @AmisResponse()
  async generateQueryConfig(@Body() generateDto: GenerateQueryConfigDto) {
    try {
      if (!generateDto.entities || generateDto.entities.length === 0) {
        throw new BadRequestException('至少需要指定一个实体');
      }

      // 生成关联查询配置
      const relationQueries = this.generateRelationQueryConfigs(
        generateDto.entities,
        generateDto.purpose,
        generateDto.performance
      );

      // 生成聚合查询配置
      const aggregateQueries = this.generateAggregateQueryConfigs(
        generateDto.entities,
        generateDto.purpose
      );

      // 生成配置建议
      const configSuggestions = this.generateConfigSuggestions(
        generateDto.entities,
        generateDto.purpose,
        generateDto.performance,
        generateDto.requirements
      );

      return {
        relationQueries,
        aggregateQueries,
        configSuggestions,
        metadata: {
          entitiesCount: generateDto.entities.length,
          purpose: generateDto.purpose,
          performance: generateDto.performance,
          scenario: generateDto.scenario,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException('生成查询配置失败: ' + error.message);
    }
  }

  /**
   * 获取查询模板
   */
  @Get('query-templates')
  @ApiOperation({
    summary: '获取查询模板',
    description: '获取预定义的多表查询模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '模板类型',
    enum: ['relation', 'aggregate', 'statistics', 'report'],
  })
  @ApiQuery({
    name: 'complexity',
    required: false,
    description: '复杂度级别',
    enum: ['simple', 'medium', 'complex'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询模板获取成功',
  })
  @AmisResponse()
  async getQueryTemplates(
    @Query('type') type?: string,
    @Query('complexity') complexity?: string,
  ) {
    try {
      const templates = {
        relation: [
          {
            name: 'user-orders',
            description: '用户订单关联查询',
            complexity: 'simple',
            config: {
              name: 'userOrders',
              description: '获取用户及其订单信息',
              primaryEntity: 'user',
              relatedEntities: ['order'],
              queryType: 'oneToMany',
              conditions: [
                {
                  field: 'status',
                  operator: 'eq',
                  value: 'active',
                  fromParam: false,
                },
              ],
              pagination: {
                enabled: true,
                defaultPageSize: 10,
                maxPageSize: 100,
              },
            },
          },
          {
            name: 'order-details',
            description: '订单详情关联查询',
            complexity: 'medium',
            config: {
              name: 'orderDetails',
              description: '获取订单及其详细信息',
              primaryEntity: 'order',
              relatedEntities: ['orderItem', 'product', 'user'],
              queryType: 'complex',
              conditions: [
                {
                  field: 'orderId',
                  operator: 'eq',
                  fromParam: true,
                  paramName: 'orderId',
                },
              ],
              pagination: {
                enabled: false,
                defaultPageSize: 50,
                maxPageSize: 200,
              },
            },
          },
        ],
        aggregate: [
          {
            name: 'sales-summary',
            description: '销售汇总统计',
            complexity: 'medium',
            config: {
              name: 'salesSummary',
              description: '按时间维度统计销售数据',
              primaryEntity: 'order',
              aggregateFields: [
                { field: 'amount', function: 'SUM', alias: 'totalAmount' },
                { field: 'id', function: 'COUNT', alias: 'orderCount' },
                { field: 'amount', function: 'AVG', alias: 'avgAmount' },
              ],
              groupByFields: ['status'],
              timeDimension: {
                field: 'createdAt',
                granularity: 'day',
              },
            },
          },
        ],
        statistics: [
          {
            name: 'user-activity',
            description: '用户活跃度统计',
            complexity: 'simple',
            config: {
              entities: ['user', 'order', 'loginLog'],
              metrics: ['activeUsers', 'newUsers', 'orderCount', 'revenue'],
              timePeriod: 'last30days',
            },
          },
        ],
        report: [
          {
            name: 'monthly-report',
            description: '月度业务报表',
            complexity: 'complex',
            config: {
              entities: ['user', 'order', 'product', 'category'],
              sections: ['overview', 'sales', 'products', 'users'],
              format: 'excel',
              schedule: 'monthly',
            },
          },
        ],
      };

      let filteredTemplates = templates;

      if (type) {
        filteredTemplates = { [type]: templates[type] || [] };
      }

      if (complexity) {
        Object.keys(filteredTemplates).forEach(key => {
          filteredTemplates[key] = filteredTemplates[key].filter(
            template => template.complexity === complexity
          );
        });
      }

      return {
        templates: filteredTemplates,
        total: Object.values(filteredTemplates).flat().length,
        types: Object.keys(templates),
        complexityLevels: ['simple', 'medium', 'complex'],
      };
    } catch (error) {
      throw new BadRequestException('获取查询模板失败: ' + error.message);
    }
  }

  /**
   * 验证查询配置
   */
  @Post('validate-config')
  @ApiOperation({
    summary: '验证查询配置',
    description: '验证多表查询配置的正确性和性能影响',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        relationQueries: { type: 'array', items: { type: 'object' } },
        aggregateQueries: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证结果',
  })
  @AmisResponse()
  async validateQueryConfig(@Body() body: {
    entities: EntityDefinition[];
    relationQueries?: RelationQueryConfig[];
    aggregateQueries?: AggregateQueryConfig[];
  }) {
    try {
      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        performance: {
          complexity: 0,
          estimatedTime: 0,
          memoryUsage: 0,
          optimizations: [] as string[],
        },
      };

      // 验证实体定义
      const entityValidation = this.validateEntities(body.entities);
      validation.errors.push(...entityValidation.errors);
      validation.warnings.push(...entityValidation.warnings);

      // 验证关联查询
      if (body.relationQueries) {
        const relationValidation = this.validateRelationQueries(
          body.entities,
          body.relationQueries
        );
        validation.errors.push(...relationValidation.errors);
        validation.warnings.push(...relationValidation.warnings);
        validation.performance.complexity += relationValidation.complexity;
      }

      // 验证聚合查询
      if (body.aggregateQueries) {
        const aggregateValidation = this.validateAggregateQueries(
          body.entities,
          body.aggregateQueries
        );
        validation.errors.push(...aggregateValidation.errors);
        validation.warnings.push(...aggregateValidation.warnings);
        validation.performance.complexity += aggregateValidation.complexity;
      }

      // 性能评估
      validation.performance.estimatedTime = this.estimateQueryTime(validation.performance.complexity);
      validation.performance.memoryUsage = this.estimateMemoryUsage(validation.performance.complexity);
      validation.performance.optimizations = this.generatePerformanceOptimizations(validation.performance.complexity);

      validation.isValid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      throw new BadRequestException('验证查询配置失败: ' + error.message);
    }
  }

  /**
   * 获取多表关联生成统计
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取多表关联生成统计',
    description: '获取多表关联生成的统计信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '统计信息获取成功',
  })
  @AmisResponse()
  async getMultiTableRelationStatistics() {
    try {
      const baseStats = this.codeGenerationManager.getGenerationStatistics();
      
      // 筛选多表关联相关任务
      const relationTasks = baseStats.recentTasks.filter(task => 
        task.id.startsWith('relation_task_')
      );

      return {
        totalRelationTasksCount: relationTasks.length,
        successfulRelationTasksCount: relationTasks.filter(task => task.status === 'completed').length,
        failedRelationTasksCount: relationTasks.filter(task => task.status === 'failed').length,
        averageRelationGenerationTime: relationTasks.length > 0 
          ? relationTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / relationTasks.length
          : 0,
        totalRelationFilesGenerated: relationTasks.reduce((sum, task) => sum + (task.filesCount || 0), 0),
        recentRelationTasks: relationTasks.slice(0, 10),
        popularQueryTypes: this.getPopularQueryTypes(relationTasks),
        complexityDistribution: this.getComplexityDistribution(relationTasks),
      };
    } catch (error) {
      throw new BadRequestException('获取统计信息失败: ' + error.message);
    }
  }

  /**
   * 执行多表关联代码生成（异步）
   */
  private async executeMultiTableRelationGeneration(
    taskId: string,
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationQueries: RelationQueryConfig[],
    aggregateQueries: AggregateQueryConfig[],
    userId: string,
    options: {
      sendNotification?: boolean;
      callbackUrl?: string;
    } = {}
  ): Promise<void> {
    try {
      // 注册任务
      this.codeGenerationManager.registerTask(taskId, {
        name: `多表关联代码生成: ${config.projectName}`,
        type: 'multi-table-relation',
        status: 'running',
        progress: 0,
        createdBy: userId,
        metadata: {
          entitiesCount: entities.length,
          relationQueriesCount: relationQueries.length,
          aggregateQueriesCount: aggregateQueries.length,
          projectName: config.projectName,
        },
      });

      // 执行代码生成
      const generatedFiles = await this.multiTableRelationGenerator.generateMultiTableRelations(
        entities,
        config,
        relationQueries,
        aggregateQueries
      );

      // 更新任务状态
      this.codeGenerationManager.updateTaskStatus(taskId, {
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        generatedFiles: generatedFiles.map(file => ({
          filePath: file.filePath,
          type: file.type,
          editable: file.editable,
          dependencies: file.dependencies,
          metadata: {
            description: file.description,
            size: file.content.length,
            lastModified: new Date(),
            queryType: file.metadata.queryType,
            entities: file.metadata.entities,
            complexity: file.metadata.complexity,
          },
        })),
      });

      // 发送通知（如果需要）
      if (options.sendNotification) {
        // TODO: 实现通知发送逻辑
      }

      // 调用回调URL（如果提供）
      if (options.callbackUrl) {
        // TODO: 实现回调逻辑
      }

    } catch (error) {
      // 更新任务状态为失败
      this.codeGenerationManager.updateTaskStatus(taskId, {
        status: 'failed',
        progress: 0,
        endTime: new Date(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * 估算生成时间
   */
  private estimateGenerationTime(createTaskDto: CreateMultiTableRelationTaskDto): number {
    let time = 60; // 基础时间60秒
    
    time += createTaskDto.entities.length * 20; // 每个实体20秒
    time += (createTaskDto.relationQueries?.length || 0) * 30; // 每个关联查询30秒
    time += (createTaskDto.aggregateQueries?.length || 0) * 40; // 每个聚合查询40秒
    
    return time;
  }

  /**
   * 分析实体关系
   */
  private analyzeRelationships(entities: EntityDefinition[]): Record<string, any[]> {
    const relationshipMap: Record<string, any[]> = {};
    
    entities.forEach(entity => {
      if (entity.relationships) {
        relationshipMap[entity.code] = entity.relationships;
      }
    });
    
    return relationshipMap;
  }

  /**
   * 计算关系复杂度
   */
  private calculateRelationComplexity(relationshipMap: Record<string, any[]>): number {
    let complexity = 0;
    
    Object.values(relationshipMap).forEach(relations => {
      complexity += relations.length * 2;
    });
    
    return complexity;
  }

  /**
   * 生成查询建议
   */
  private generateQuerySuggestions(entities: EntityDefinition[], relationshipMap: Record<string, any[]>): any[] {
    // TODO: 实现查询建议生成逻辑
    return [];
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationTips(relationshipMap: Record<string, any[]>, complexity: number): string[] {
    const tips: string[] = [];
    
    if (complexity > 10) {
      tips.push('关系复杂度较高，建议添加数据库索引');
    }
    
    if (Object.keys(relationshipMap).length > 5) {
      tips.push('涉及表较多，建议使用分页查询');
    }
    
    return tips;
  }

  /**
   * 生成关联查询配置
   */
  private generateRelationQueryConfigs(
    entities: string[],
    purpose: string,
    performance: string
  ): RelationQueryConfig[] {
    // TODO: 实现关联查询配置生成逻辑
    return [];
  }

  /**
   * 生成聚合查询配置
   */
  private generateAggregateQueryConfigs(
    entities: string[],
    purpose: string
  ): AggregateQueryConfig[] {
    // TODO: 实现聚合查询配置生成逻辑
    return [];
  }

  /**
   * 生成配置建议
   */
  private generateConfigSuggestions(
    entities: string[],
    purpose: string,
    performance: string,
    requirements?: string[]
  ): any[] {
    // TODO: 实现配置建议生成逻辑
    return [];
  }

  /**
   * 验证实体定义
   */
  private validateEntities(entities: EntityDefinition[]): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // TODO: 实现实体验证逻辑
    
    return { errors, warnings };
  }

  /**
   * 验证关联查询
   */
  private validateRelationQueries(
    entities: EntityDefinition[],
    relationQueries: RelationQueryConfig[]
  ): {
    errors: string[];
    warnings: string[];
    complexity: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let complexity = 0;
    
    // TODO: 实现关联查询验证逻辑
    
    return { errors, warnings, complexity };
  }

  /**
   * 验证聚合查询
   */
  private validateAggregateQueries(
    entities: EntityDefinition[],
    aggregateQueries: AggregateQueryConfig[]
  ): {
    errors: string[];
    warnings: string[];
    complexity: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let complexity = 0;
    
    // TODO: 实现聚合查询验证逻辑
    
    return { errors, warnings, complexity };
  }

  /**
   * 估算查询时间
   */
  private estimateQueryTime(complexity: number): number {
    return Math.round(complexity * 15 + Math.random() * 100);
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(complexity: number): number {
    return Math.round(complexity * 5 + 50);
  }

  /**
   * 生成性能优化建议
   */
  private generatePerformanceOptimizations(complexity: number): string[] {
    const optimizations: string[] = [];
    
    if (complexity > 15) {
      optimizations.push('建议添加数据库索引');
      optimizations.push('考虑使用查询缓存');
    }
    
    if (complexity > 25) {
      optimizations.push('建议分步查询');
      optimizations.push('考虑使用异步处理');
    }
    
    return optimizations;
  }

  /**
   * 获取热门查询类型
   */
  private getPopularQueryTypes(tasks: any[]): Array<{ type: string; count: number }> {
    const queryTypes: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.metadata?.queryTypes) {
        task.metadata.queryTypes.forEach((type: string) => {
          queryTypes[type] = (queryTypes[type] || 0) + 1;
        });
      }
    });
    
    return Object.entries(queryTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 获取复杂度分布
   */
  private getComplexityDistribution(tasks: any[]): Array<{ level: string; count: number }> {
    const distribution = { simple: 0, medium: 0, complex: 0 };
    
    tasks.forEach(task => {
      const complexity = task.metadata?.complexity || 0;
      if (complexity < 10) {
        distribution.simple++;
      } else if (complexity < 20) {
        distribution.medium++;
      } else {
        distribution.complex++;
      }
    });
    
    return Object.entries(distribution)
      .map(([level, count]) => ({ level, count }));
  }
}
