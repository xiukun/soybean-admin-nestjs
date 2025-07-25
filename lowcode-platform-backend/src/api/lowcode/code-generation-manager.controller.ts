import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Headers,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
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
  CodeGenerationManagerService,
  GenerationTask,
  GenerationTaskType,
  GenerationTaskStatus,
  GenerationTaskPriority,
  GenerationStatistics,
} from '../../services/code-generation-manager.service';
import { EntityDefinition, CodeGenerationConfig } from '../../services/layered-code-generator.service';

/**
 * 创建代码生成任务请求DTO
 */
export class CreateGenerationTaskDto {
  /** 任务名称 */
  name: string;

  /** 任务类型 */
  type: GenerationTaskType;

  /** 实体定义 */
  entities: EntityDefinition[];

  /** 代码生成配置 */
  config: CodeGenerationConfig;

  /** 任务优先级 */
  priority?: GenerationTaskPriority;

  /** 是否异步执行 */
  async?: boolean;

  /** 任务描述 */
  description?: string;

  /** 任务标签 */
  tags?: string[];

  /** 项目ID */
  projectId?: string;
}

/**
 * 更新任务状态请求DTO
 */
export class UpdateTaskStatusDto {
  /** 任务状态 */
  status?: GenerationTaskStatus;

  /** 任务进度 */
  progress?: number;

  /** 错误信息 */
  error?: string;

  /** 警告信息 */
  warnings?: string[];
}

/**
 * 代码生成管理器控制器
 */
@ApiTags('Code Generation Manager')
@Controller('code-generation-manager')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CodeGenerationManagerController {
  constructor(
    private readonly codeGenerationManager: CodeGenerationManagerService,
  ) {}

  /**
   * 创建代码生成任务
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建代码生成任务',
    description: '创建新的代码生成任务，支持多种生成器类型',
  })
  @ApiBody({
    type: CreateGenerationTaskDto,
    description: '代码生成任务配置',
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
            taskId: { type: 'string', example: 'task_123' },
            name: { type: 'string', example: '用户管理CRUD生成' },
            type: { type: 'string', example: 'single-table-crud' },
            status: { type: 'string', example: 'pending' },
            estimatedDuration: { type: 'number', example: 60 },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createTask(
    @Body(ValidationPipe) createDto: CreateGenerationTaskDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const taskId = await this.codeGenerationManager.createGenerationTask(
        createDto.name,
        createDto.type,
        createDto.entities,
        createDto.config,
        userId,
        {
          async: createDto.async || false,
          priority: createDto.priority,
          description: createDto.description,
          tags: createDto.tags,
          projectId: createDto.projectId,
        }
      );

      const task = this.codeGenerationManager.getTaskStatus(taskId);

      return {
        taskId,
        name: task?.name,
        type: task?.type,
        status: task?.status,
        estimatedDuration: task?.metadata.estimatedDuration,
        message: '代码生成任务创建成功',
      };
    } catch (error) {
      throw new BadRequestException('创建代码生成任务失败: ' + error.message);
    }
  }

  /**
   * 获取任务状态
   */
  @Get('tasks/:taskId')
  @ApiOperation({
    summary: '获取任务状态',
    description: '根据任务ID获取代码生成任务的详细状态',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
    example: 'task_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getTaskStatus(@Param('taskId') taskId: string) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      return {
        data: {
          id: task.id,
          name: task.name,
          type: task.type,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          generatedFiles: task.generatedFiles.map(file => ({
            filePath: file.filePath,
            type: file.type,
            size: file.size,
            editable: file.editable,
            description: file.metadata.description,
          })),
          error: task.error,
          warnings: task.warnings,
          logs: task.logs.slice(-10), // 只返回最近10条日志
          createdAt: task.createdAt,
          startTime: task.startTime,
          endTime: task.endTime,
          createdBy: task.createdBy,
          metadata: task.metadata,
        },
        message: '获取任务状态成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务状态失败: ' + error.message);
    }
  }

  /**
   * 获取任务列表
   */
  @Get('tasks')
  @ApiOperation({
    summary: '获取任务列表',
    description: '分页获取代码生成任务列表，支持筛选',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: '任务状态', enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'] })
  @ApiQuery({ name: 'type', required: false, description: '任务类型', enum: ['single-table-crud', 'multi-table-relation', 'layered-architecture', 'amis-business', 'api-parameter-config', 'designer-integration', 'custom'] })
  @ApiQuery({ name: 'createdBy', required: false, description: '创建者' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getTaskList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: GenerationTaskStatus,
    @Query('type') type?: GenerationTaskType,
    @Query('createdBy') createdBy?: string,
  ) {
    try {
      const result = this.codeGenerationManager.getTaskList({
        page,
        limit,
        status,
        type,
        createdBy,
      });

      return {
        items: result.tasks.map(task => ({
          id: task.id,
          name: task.name,
          type: task.type,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          generatedFilesCount: task.generatedFiles.length,
          createdAt: task.createdAt,
          startTime: task.startTime,
          endTime: task.endTime,
          createdBy: task.createdBy,
          estimatedDuration: task.metadata.estimatedDuration,
          actualDuration: task.metadata.actualDuration,
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        message: '获取任务列表成功',
      };
    } catch (error) {
      throw new BadRequestException('获取任务列表失败: ' + error.message);
    }
  }

  /**
   * 更新任务状态
   */
  @Put('tasks/:taskId/status')
  @ApiOperation({
    summary: '更新任务状态',
    description: '更新代码生成任务的状态和进度',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiBody({
    type: UpdateTaskStatusDto,
    description: '任务状态更新信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @AmisResponse()
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body(ValidationPipe) updateDto: UpdateTaskStatusDto,
  ) {
    try {
      await this.codeGenerationManager.updateTaskStatus(taskId, updateDto);

      return {
        message: '任务状态更新成功',
      };
    } catch (error) {
      throw new BadRequestException('更新任务状态失败: ' + error.message);
    }
  }

  /**
   * 取消任务
   */
  @Post('tasks/:taskId/cancel')
  @ApiOperation({
    summary: '取消任务',
    description: '取消指定的代码生成任务',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '取消成功',
  })
  @AmisResponse()
  async cancelTask(@Param('taskId') taskId: string) {
    try {
      await this.codeGenerationManager.cancelTask(taskId);

      return {
        message: '任务取消成功',
      };
    } catch (error) {
      throw new BadRequestException('取消任务失败: ' + error.message);
    }
  }

  /**
   * 暂停任务
   */
  @Post('tasks/:taskId/pause')
  @ApiOperation({
    summary: '暂停任务',
    description: '暂停正在运行的代码生成任务',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '暂停成功',
  })
  @AmisResponse()
  async pauseTask(@Param('taskId') taskId: string) {
    try {
      await this.codeGenerationManager.pauseTask(taskId);

      return {
        message: '任务暂停成功',
      };
    } catch (error) {
      throw new BadRequestException('暂停任务失败: ' + error.message);
    }
  }

  /**
   * 恢复任务
   */
  @Post('tasks/:taskId/resume')
  @ApiOperation({
    summary: '恢复任务',
    description: '恢复暂停的代码生成任务',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '恢复成功',
  })
  @AmisResponse()
  async resumeTask(@Param('taskId') taskId: string) {
    try {
      await this.codeGenerationManager.resumeTask(taskId);

      return {
        message: '任务恢复成功',
      };
    } catch (error) {
      throw new BadRequestException('恢复任务失败: ' + error.message);
    }
  }

  /**
   * 重试任务
   */
  @Post('tasks/:taskId/retry')
  @ApiOperation({
    summary: '重试任务',
    description: '重试失败的代码生成任务',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '重试成功',
  })
  @AmisResponse()
  async retryTask(@Param('taskId') taskId: string) {
    try {
      await this.codeGenerationManager.retryTask(taskId);

      return {
        message: '任务重试成功',
      };
    } catch (error) {
      throw new BadRequestException('重试任务失败: ' + error.message);
    }
  }

  /**
   * 删除任务
   */
  @Delete('tasks/:taskId')
  @ApiOperation({
    summary: '删除任务',
    description: '删除指定的代码生成任务及其生成的文件',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '删除成功',
  })
  @AmisResponse()
  async deleteTask(@Param('taskId') taskId: string) {
    try {
      await this.codeGenerationManager.deleteTask(taskId);

      return {
        message: '任务删除成功',
      };
    } catch (error) {
      throw new BadRequestException('删除任务失败: ' + error.message);
    }
  }

  /**
   * 获取任务日志
   */
  @Get('tasks/:taskId/logs')
  @ApiOperation({
    summary: '获取任务日志',
    description: '获取代码生成任务的详细日志',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiQuery({ name: 'level', required: false, description: '日志级别', enum: ['info', 'warn', 'error'] })
  @ApiQuery({ name: 'limit', required: false, description: '日志数量限制', example: 100 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getTaskLogs(
    @Param('taskId') taskId: string,
    @Query('level') level?: 'info' | 'warn' | 'error',
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
  ) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      let logs = task.logs;

      // 按级别筛选
      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      // 限制数量
      if (limit) {
        logs = logs.slice(-limit);
      }

      return {
        data: {
          taskId,
          logs: logs.map(log => ({
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            details: log.details,
          })),
          total: logs.length,
        },
        message: '获取任务日志成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务日志失败: ' + error.message);
    }
  }

  /**
   * 获取生成的文件列表
   */
  @Get('tasks/:taskId/files')
  @ApiOperation({
    summary: '获取生成的文件列表',
    description: '获取代码生成任务生成的所有文件信息',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiQuery({ name: 'type', required: false, description: '文件类型' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getGeneratedFiles(
    @Param('taskId') taskId: string,
    @Query('type') type?: string,
  ) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      let files = task.generatedFiles;

      // 按类型筛选
      if (type) {
        files = files.filter(file => file.type === type);
      }

      return {
        data: {
          taskId,
          files: files.map(file => ({
            filePath: file.filePath,
            type: file.type,
            size: file.size,
            editable: file.editable,
            dependencies: file.dependencies,
            metadata: {
              generatedAt: file.metadata.generatedAt,
              generatorVersion: file.metadata.generatorVersion,
              templateVersion: file.metadata.templateVersion,
              description: file.metadata.description,
              lastModified: file.metadata.lastModified,
              hash: file.metadata.hash,
            },
          })),
          total: files.length,
          fileTypes: [...new Set(task.generatedFiles.map(f => f.type))],
        },
        message: '获取生成文件列表成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取生成文件列表失败: ' + error.message);
    }
  }

  /**
   * 下载生成的文件
   */
  @Get('tasks/:taskId/files/:filePath/download')
  @ApiOperation({
    summary: '下载生成的文件',
    description: '下载代码生成任务生成的指定文件',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
  })
  @ApiParam({
    name: 'filePath',
    description: '文件路径（需要URL编码）',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '下载成功',
  })
  async downloadFile(
    @Param('taskId') taskId: string,
    @Param('filePath') filePath: string,
  ) {
    try {
      const task = this.codeGenerationManager.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundException('任务不存在');
      }

      const decodedFilePath = decodeURIComponent(filePath);
      const file = task.generatedFiles.find(f => f.filePath === decodedFilePath);

      if (!file) {
        throw new NotFoundException('文件不存在');
      }

      // 这里应该返回文件流，简化处理返回文件信息
      return {
        filePath: file.filePath,
        type: file.type,
        size: file.size,
        content: file.content || '文件内容',
        downloadUrl: `/api/files/download?path=${encodeURIComponent(file.filePath)}`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('下载文件失败: ' + error.message);
    }
  }

  /**
   * 获取代码生成统计信息
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取代码生成统计信息',
    description: '获取代码生成的统计数据和性能指标',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            totalTasks: { type: 'number', description: '总任务数' },
            successfulTasks: { type: 'number', description: '成功任务数' },
            failedTasks: { type: 'number', description: '失败任务数' },
            runningTasks: { type: 'number', description: '运行中任务数' },
            averageExecutionTime: { type: 'number', description: '平均执行时间' },
            totalFilesGenerated: { type: 'number', description: '总生成文件数' },
            performanceMetrics: {
              type: 'object',
              properties: {
                successRate: { type: 'number', description: '成功率' },
                averageQueueTime: { type: 'number', description: '平均队列等待时间' },
                systemLoad: { type: 'number', description: '系统负载' },
              },
            },
          },
        },
      },
    },
  })
  @AmisResponse()
  async getStatistics() {
    try {
      const statistics = this.codeGenerationManager.getGenerationStatistics();

      return {
        data: {
          totalTasks: statistics.totalTasks,
          successfulTasks: statistics.successfulTasks,
          failedTasks: statistics.failedTasks,
          runningTasks: statistics.runningTasks,
          averageExecutionTime: statistics.averageExecutionTime,
          totalFilesGenerated: statistics.totalFilesGenerated,
          recentTasks: statistics.recentTasks.slice(0, 5).map(task => ({
            id: task.id,
            name: task.name,
            type: task.type,
            status: task.status,
            createdAt: task.createdAt,
          })),
          popularGeneratorTypes: statistics.popularGeneratorTypes,
          performanceMetrics: statistics.performanceMetrics,
        },
        message: '获取代码生成统计信息成功',
      };
    } catch (error) {
      throw new BadRequestException('获取统计信息失败: ' + error.message);
    }
  }

  /**
   * 批量操作任务
   */
  @Post('tasks/batch')
  @ApiOperation({
    summary: '批量操作任务',
    description: '批量执行任务操作（取消、删除等）',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskIds: { type: 'array', items: { type: 'string' }, description: '任务ID列表' },
        operation: { type: 'string', enum: ['cancel', 'delete', 'retry'], description: '操作类型' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '批量操作成功',
  })
  @AmisResponse()
  async batchOperateTasks(@Body() body: {
    taskIds: string[];
    operation: 'cancel' | 'delete' | 'retry';
  }) {
    try {
      const { taskIds, operation } = body;
      const results = {
        successful: [] as string[],
        failed: [] as { taskId: string; error: string }[],
      };

      for (const taskId of taskIds) {
        try {
          switch (operation) {
            case 'cancel':
              await this.codeGenerationManager.cancelTask(taskId);
              break;
            case 'delete':
              await this.codeGenerationManager.deleteTask(taskId);
              break;
            case 'retry':
              await this.codeGenerationManager.retryTask(taskId);
              break;
          }
          results.successful.push(taskId);
        } catch (error) {
          results.failed.push({ taskId, error: error.message });
        }
      }

      return {
        data: {
          operation,
          results,
          summary: {
            total: taskIds.length,
            successful: results.successful.length,
            failed: results.failed.length,
          },
        },
        message: `批量${operation}操作完成`,
      };
    } catch (error) {
      throw new BadRequestException('批量操作失败: ' + error.message);
    }
  }
}
