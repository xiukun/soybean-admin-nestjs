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
  AmisBusinessGeneratorService, 
  AmisBusinessConfig, 
  AmisPageConfig 
} from '../../services/amis-business-generator.service';
import { EntityDefinition } from '../../services/layered-code-generator.service';
import { CodeGenerationManagerService } from '../../services/code-generation-manager.service';

/**
 * 创建Amis业务代码生成任务请求DTO
 */
export class CreateAmisBusinessTaskDto {
  /** 任务名称 */
  name: string;

  /** 实体定义列表 */
  entities: EntityDefinition[];

  /** Amis业务配置 */
  config: AmisBusinessConfig;

  /** 页面配置 */
  pageConfigs?: Record<string, AmisPageConfig>;

  /** 是否异步执行 */
  async?: boolean;

  /** 是否发送通知 */
  sendNotification?: boolean;

  /** 回调URL */
  callbackUrl?: string;
}

/**
 * Amis业务代码生成控制器
 */
@ApiTags('Amis Business Generator')
@Controller('amis-business-generator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AmisBusinessGeneratorController {
  constructor(
    private readonly amisBusinessGenerator: AmisBusinessGeneratorService,
    private readonly codeGenerationManager: CodeGenerationManagerService,
  ) {}

  /**
   * 创建Amis业务代码生成任务
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建Amis业务代码生成任务',
    description: '创建一个新的Amis业务代码生成任务，生成符合Amis规范的完整业务代码',
  })
  @ApiBody({
    type: CreateAmisBusinessTaskDto,
    description: 'Amis业务代码生成任务配置',
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
            taskId: { type: 'string', example: 'amis_task_1234567890_abc123' },
            name: { type: 'string', example: '用户管理系统Amis业务代码' },
            entitiesCount: { type: 'number', example: 3 },
            estimatedTime: { type: 'number', example: 120 },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createAmisBusinessTask(
    @Body() createTaskDto: CreateAmisBusinessTaskDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      // 验证输入数据
      if (!createTaskDto.entities || createTaskDto.entities.length === 0) {
        throw new BadRequestException('至少需要一个实体定义');
      }

      if (!createTaskDto.config.projectName) {
        throw new BadRequestException('项目名称不能为空');
      }

      if (!createTaskDto.config.moduleName) {
        throw new BadRequestException('模块名称不能为空');
      }

      // 创建任务ID
      const taskId = `amis_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 如果是异步执行，创建后台任务
      if (createTaskDto.async !== false) {
        // 创建异步任务
        this.executeAmisBusinessGeneration(
          taskId,
          createTaskDto.entities,
          createTaskDto.config,
          createTaskDto.pageConfigs,
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
          estimatedTime: createTaskDto.entities.length * 40, // 每个实体预估40秒
          message: 'Amis业务代码生成任务已创建，正在后台执行',
        };
      } else {
        // 同步执行
        const generatedFiles = await this.amisBusinessGenerator.generateAmisBusinessCode(
          createTaskDto.entities,
          createTaskDto.config,
          createTaskDto.pageConfigs
        );

        return {
          taskId,
          name: createTaskDto.name,
          entitiesCount: createTaskDto.entities.length,
          filesCount: generatedFiles.length,
          files: generatedFiles.map(file => ({
            filePath: file.filePath,
            type: file.type,
            description: file.description,
          })),
          message: 'Amis业务代码生成完成',
        };
      }
    } catch (error) {
      throw new BadRequestException('创建Amis业务代码生成任务失败: ' + error.message);
    }
  }

  /**
   * 获取Amis业务代码生成任务状态
   */
  @Get('tasks/:taskId')
  @ApiOperation({
    summary: '获取Amis业务代码生成任务状态',
    description: '获取指定任务的执行状态和进度信息',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
    example: 'amis_task_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '任务状态获取成功',
  })
  @AmisResponse()
  async getAmisTaskStatus(@Param('taskId') taskId: string) {
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
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务状态失败: ' + error.message);
    }
  }

  /**
   * 获取Amis业务代码生成任务的文件列表
   */
  @Get('tasks/:taskId/files')
  @ApiOperation({
    summary: '获取Amis业务代码生成任务的文件列表',
    description: '获取任务生成的所有文件信息',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '文件列表获取成功',
  })
  @AmisResponse()
  async getAmisTaskFiles(@Param('taskId') taskId: string) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      const files = task.generatedFiles.map(file => ({
        filePath: file.filePath,
        type: file.type,
        description: file.metadata?.description || '',
        editable: file.editable,
        dependencies: file.dependencies,
        size: file.metadata?.size || 0,
        lastModified: file.metadata?.lastModified,
      }));

      return {
        taskId,
        files,
        totalFiles: files.length,
        fileTypes: [...new Set(files.map(f => f.type))],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务文件列表失败: ' + error.message);
    }
  }

  /**
   * 预览Amis页面配置
   */
  @Post('preview-page-config')
  @ApiOperation({
    summary: '预览Amis页面配置',
    description: '根据实体定义预览生成的Amis页面配置',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entity: {
          type: 'object',
          description: '实体定义',
        },
        config: {
          type: 'object',
          description: 'Amis业务配置',
        },
        pageConfig: {
          type: 'object',
          description: '页面配置',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '页面配置预览成功',
  })
  @AmisResponse()
  async previewPageConfig(@Body() body: {
    entity: EntityDefinition;
    config: AmisBusinessConfig;
    pageConfig?: AmisPageConfig;
  }) {
    try {
      // 生成页面配置预览
      const pageConfigFile = await this.amisBusinessGenerator.generateAmisBusinessCode(
        [body.entity],
        body.config,
        body.pageConfig ? { [body.entity.code]: body.pageConfig } : {}
      );

      const pageConfig = pageConfigFile.find(file => file.type === 'page-config');

      if (!pageConfig) {
        throw new BadRequestException('页面配置生成失败');
      }

      return {
        entity: body.entity,
        pageConfig: JSON.parse(pageConfig.content),
        preview: {
          title: `${body.entity.description}管理`,
          apiPath: body.config.apiPrefix ? `${body.config.apiPrefix}/${body.entity.code}` : body.entity.code,
          fieldsCount: body.entity.fields.length,
          hasSearch: body.pageConfig?.enableSearch !== false,
          hasBatchActions: body.pageConfig?.enableBatchActions !== false,
        },
      };
    } catch (error) {
      throw new BadRequestException('预览页面配置失败: ' + error.message);
    }
  }

  /**
   * 获取Amis业务代码生成模板列表
   */
  @Get('templates')
  @ApiOperation({
    summary: '获取Amis业务代码生成模板列表',
    description: '获取可用的Amis业务代码生成模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '模板类型筛选',
    enum: ['controller', 'service', 'repository', 'dto', 'entity', 'page-config'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '模板列表获取成功',
  })
  @AmisResponse()
  async getAmisTemplates(@Query('type') type?: string) {
    try {
      const templates = [
        {
          name: 'amis-controller',
          type: 'controller',
          description: 'Amis控制器模板',
          features: ['CRUD接口', '分页查询', '批量操作', '数据验证', 'Swagger文档'],
        },
        {
          name: 'amis-service',
          type: 'service',
          description: 'Amis服务模板',
          features: ['业务逻辑', '数据验证', '软删除支持', '数据权限', '统计功能'],
        },
        {
          name: 'amis-repository',
          type: 'repository',
          description: 'Amis仓储模板',
          features: ['数据访问', 'Prisma集成', '查询优化', '事务支持'],
        },
        {
          name: 'amis-dto',
          type: 'dto',
          description: 'Amis数据传输对象模板',
          features: ['数据验证', 'API文档', '类型安全', '转换器'],
        },
        {
          name: 'amis-entity',
          type: 'entity',
          description: 'Amis实体模板',
          features: ['数据库映射', '关系定义', '索引优化', '软删除'],
        },
        {
          name: 'amis-page-config',
          type: 'page-config',
          description: 'Amis页面配置模板',
          features: ['CRUD页面', '搜索筛选', '批量操作', '表单验证', '响应式布局'],
        },
      ];

      const filteredTemplates = type 
        ? templates.filter(template => template.type === type)
        : templates;

      return {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        types: [...new Set(templates.map(t => t.type))],
      };
    } catch (error) {
      throw new BadRequestException('获取模板列表失败: ' + error.message);
    }
  }

  /**
   * 获取Amis业务代码生成统计
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取Amis业务代码生成统计',
    description: '获取Amis业务代码生成的统计信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '统计信息获取成功',
  })
  @AmisResponse()
  async getAmisGenerationStatistics() {
    try {
      const baseStats = this.codeGenerationManager.getGenerationStatistics();
      
      // 筛选Amis相关任务
      const amisTasks = baseStats.recentTasks.filter(task => 
        task.id.startsWith('amis_task_')
      );

      return {
        totalAmisTasksCount: amisTasks.length,
        successfulAmisTasksCount: amisTasks.filter(task => task.status === 'completed').length,
        failedAmisTasksCount: amisTasks.filter(task => task.status === 'failed').length,
        averageAmisGenerationTime: amisTasks.length > 0 
          ? amisTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / amisTasks.length
          : 0,
        totalAmisFilesGenerated: amisTasks.reduce((sum, task) => sum + (task.filesCount || 0), 0),
        recentAmisTasks: amisTasks.slice(0, 10),
        popularEntityTypes: this.getPopularEntityTypes(amisTasks),
      };
    } catch (error) {
      throw new BadRequestException('获取统计信息失败: ' + error.message);
    }
  }

  /**
   * 执行Amis业务代码生成（异步）
   */
  private async executeAmisBusinessGeneration(
    taskId: string,
    entities: EntityDefinition[],
    config: AmisBusinessConfig,
    pageConfigs: Record<string, AmisPageConfig> = {},
    userId: string,
    options: {
      sendNotification?: boolean;
      callbackUrl?: string;
    } = {}
  ): Promise<void> {
    try {
      // 注册任务
      this.codeGenerationManager.registerTask(taskId, {
        name: `Amis业务代码生成: ${config.projectName}`,
        type: 'amis-business',
        status: 'running',
        progress: 0,
        createdBy: userId,
        metadata: {
          entitiesCount: entities.length,
          projectName: config.projectName,
          moduleName: config.moduleName,
        },
      });

      // 执行代码生成
      const generatedFiles = await this.amisBusinessGenerator.generateAmisBusinessCode(
        entities,
        config,
        pageConfigs
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
   * 获取热门实体类型
   */
  private getPopularEntityTypes(tasks: any[]): Array<{ type: string; count: number }> {
    const entityTypes: Record<string, number> = {};

    tasks.forEach(task => {
      if (task.metadata?.entities) {
        task.metadata.entities.forEach((entity: any) => {
          const type = entity.code || 'unknown';
          entityTypes[type] = (entityTypes[type] || 0) + 1;
        });
      }
    });

    return Object.entries(entityTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
