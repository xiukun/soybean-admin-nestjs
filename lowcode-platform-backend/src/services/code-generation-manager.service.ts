import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs-extra';
import * as path from 'path';
import { LayeredCodeGeneratorService, EntityDefinition, CodeGenerationConfig, CodeFileInfo } from './layered-code-generator.service';
import { SingleTableCrudGeneratorService } from './single-table-crud-generator.service';
import { MultiTableRelationGeneratorService } from './multi-table-relation-generator.service';
import { AmisBusinessGeneratorService } from './amis-business-generator.service';
import { ApiParameterConfigService } from './api-parameter-config.service';
import { LowcodeDesignerIntegrationService } from './lowcode-designer-integration.service';

/**
 * 代码生成任务状态
 */
export type GenerationTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

/**
 * 代码生成任务类型
 */
export type GenerationTaskType =
  | 'single-table-crud'
  | 'multi-table-relation'
  | 'layered-architecture'
  | 'amis-business'
  | 'api-parameter-config'
  | 'designer-integration'
  | 'custom';

/**
 * 代码生成任务优先级
 */
export type GenerationTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 生成的文件信息
 */
export interface GeneratedFile {
  /** 文件路径 */
  filePath: string;
  /** 文件类型 */
  type: string;
  /** 文件大小 */
  size: number;
  /** 是否可编辑 */
  editable: boolean;
  /** 文件依赖 */
  dependencies: string[];
  /** 文件内容 */
  content?: string;
  /** 文件元数据 */
  metadata: {
    /** 生成时间 */
    generatedAt: Date;
    /** 生成器版本 */
    generatorVersion: string;
    /** 模板版本 */
    templateVersion?: string;
    /** 文件描述 */
    description?: string;
    /** 最后修改时间 */
    lastModified?: Date;
    /** 文件哈希 */
    hash?: string;
  };
}

/**
 * 代码生成任务
 */
export interface GenerationTask {
  /** 任务ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务类型 */
  type: GenerationTaskType;
  /** 任务状态 */
  status: GenerationTaskStatus;
  /** 任务优先级 */
  priority: GenerationTaskPriority;
  /** 任务进度 (0-100) */
  progress: number;
  /** 项目配置 */
  config: CodeGenerationConfig;
  /** 实体定义 */
  entities: EntityDefinition[];
  /** 生成的文件 */
  generatedFiles: GeneratedFile[];
  /** 任务错误信息 */
  error?: string;
  /** 任务警告信息 */
  warnings: string[];
  /** 任务日志 */
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
  }>;
  /** 创建时间 */
  createdAt: Date;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 创建者 */
  createdBy: string;
  /** 任务元数据 */
  metadata: {
    /** 估计执行时间 */
    estimatedDuration?: number;
    /** 实际执行时间 */
    actualDuration?: number;
    /** 任务标签 */
    tags?: string[];
    /** 任务描述 */
    description?: string;
    /** 相关项目 */
    projectId?: string;
    /** 任务依赖 */
    dependencies?: string[];
  };
}

/**
 * 代码生成统计信息
 */
export interface GenerationStatistics {
  /** 总任务数 */
  totalTasks: number;
  /** 成功任务数 */
  successfulTasks: number;
  /** 失败任务数 */
  failedTasks: number;
  /** 运行中任务数 */
  runningTasks: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 总生成文件数 */
  totalFilesGenerated: number;
  /** 最近任务 */
  recentTasks: GenerationTask[];
  /** 热门生成器类型 */
  popularGeneratorTypes: Array<{ type: string; count: number }>;
  /** 性能指标 */
  performanceMetrics: {
    /** 成功率 */
    successRate: number;
    /** 平均队列等待时间 */
    averageQueueTime: number;
    /** 系统负载 */
    systemLoad: number;
  };
}

/**
 * 代码生成选项
 */
export interface CodeGenerationOptions {
  /** 是否异步执行 */
  async?: boolean;
  /** 是否发送通知 */
  sendNotification?: boolean;
  /** 回调URL */
  callbackUrl?: string;
  /** 自定义钩子 */
  hooks?: {
    beforeGeneration?: (task: GenerationTask) => Promise<void>;
    afterGeneration?: (task: GenerationTask) => Promise<void>;
    onError?: (task: GenerationTask, error: Error) => Promise<void>;
  };
}

/**
 * 代码生成管理器服务
 */
@Injectable()
export class CodeGenerationManagerService {
  private readonly logger = new Logger(CodeGenerationManagerService.name);
  private readonly tasks = new Map<string, GenerationTask>();
  private readonly taskQueue: string[] = [];
  private readonly runningTasks = new Set<string>();
  private readonly maxConcurrentTasks: number;
  private readonly taskRetentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly layeredGenerator: LayeredCodeGeneratorService,
    private readonly singleTableCrudGenerator: SingleTableCrudGeneratorService,
    private readonly multiTableRelationGenerator: MultiTableRelationGeneratorService,
    private readonly amisBusinessGenerator: AmisBusinessGeneratorService,
    private readonly apiParameterConfigService: ApiParameterConfigService,
    private readonly designerIntegrationService: LowcodeDesignerIntegrationService,
  ) {
    this.maxConcurrentTasks = this.configService.get<number>('MAX_CONCURRENT_GENERATION_TASKS', 3);
    this.taskRetentionDays = this.configService.get<number>('TASK_RETENTION_DAYS', 30);

    // 初始化管理器
    this.initializeManager();
  }

  /**
   * 初始化管理器
   */
  private async initializeManager(): Promise<void> {
    try {
      // 从数据库加载未完成的任务
      await this.loadPendingTasks();

      // 启动任务处理器
      this.startTaskProcessor();

      // 启动清理定时器
      this.startCleanupTimer();

      this.logger.log('代码生成管理器初始化完成');
    } catch (error) {
      this.logger.error('代码生成管理器初始化失败:', error);
    }
  }

  /**
   * 创建代码生成任务
   */
  async createGenerationTask(
    name: string,
    type: GenerationTaskType,
    entities: EntityDefinition[],
    config: CodeGenerationConfig,
    createdBy: string,
    options: CodeGenerationOptions = {}
  ): Promise<string> {
    try {
      const taskId = this.generateTaskId();

      const task: GenerationTask = {
        id: taskId,
        name,
        type,
        status: 'pending',
        priority: 'normal',
        progress: 0,
        config,
        entities,
        generatedFiles: [],
        warnings: [],
        logs: [],
        createdAt: new Date(),
        createdBy,
        metadata: {
          estimatedDuration: this.estimateTaskDuration(type, config),
          tags: [],
          description: `${type} 代码生成任务`,
        },
      };

      // 保存任务到内存和数据库
      this.tasks.set(taskId, task);
      await this.saveTaskToDatabase(task);

      // 添加到队列
      this.addToQueue(taskId);

      // 记录日志
      this.addTaskLog(taskId, 'info', '任务已创建');

      // 发送事件
      this.eventEmitter.emit('task.created', { taskId, task });

      this.logger.log(`创建代码生成任务: ${taskId} (${task.name})`);

      // 如果是异步执行，立即返回任务ID
      if (options.async) {
        return taskId;
      }

      // 同步执行（等待任务完成）
      await this.waitForTaskCompletion(taskId);
      return taskId;

    } catch (error) {
      this.logger.error('创建代码生成任务失败:', error);
      throw new BadRequestException('创建任务失败: ' + error.message);
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): GenerationTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): GenerationTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取用户的任务
   */
  getUserTasks(userId: string): GenerationTask[] {
    return Array.from(this.tasks.values()).filter(task => task.createdBy === userId);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === GenerationTaskStatus.RUNNING) {
      task.status = GenerationTaskStatus.CANCELLED;
      task.endTime = new Date();
      this.logger.log(`取消代码生成任务: ${taskId}`);
      return true;
    }

    return false;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 只能删除已完成、失败或取消的任务
    if ([GenerationTaskStatus.COMPLETED, GenerationTaskStatus.FAILED, GenerationTaskStatus.CANCELLED].includes(task.status)) {
      this.tasks.delete(taskId);
      this.logger.log(`删除代码生成任务: ${taskId}`);
      return true;
    }

    return false;
  }

  /**
   * 重新执行任务
   */
  async retryTask(taskId: string, options: CodeGenerationOptions = {}): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 只能重试失败或取消的任务
    if (task.status === GenerationTaskStatus.FAILED || task.status === GenerationTaskStatus.CANCELLED) {
      task.status = GenerationTaskStatus.PENDING;
      task.progress = 0;
      task.error = undefined;
      task.startTime = undefined;
      task.endTime = undefined;
      task.generatedFiles = [];

      if (options.async) {
        this.executeTaskAsync(task, options);
      } else {
        await this.executeTask(task, options);
      }

      return true;
    }

    return false;
  }

  /**
   * 获取生成统计
   */
  getGenerationStatistics(): GenerationStatistics {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === GenerationTaskStatus.COMPLETED);
    const failedTasks = tasks.filter(t => t.status === GenerationTaskStatus.FAILED);
    
    const totalFiles = completedTasks.reduce((sum, task) => sum + task.generatedFiles.length, 0);
    
    const generationTimes = completedTasks
      .filter(t => t.startTime && t.endTime)
      .map(t => t.endTime!.getTime() - t.startTime!.getTime());
    
    const averageGenerationTime = generationTimes.length > 0 
      ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length 
      : 0;

    const recentTasks = tasks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalTasks: tasks.length,
      successfulTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      totalFiles,
      averageGenerationTime,
      recentTasks,
    };
  }

  /**
   * 导出任务结果
   */
  async exportTaskResult(taskId: string, format: 'json' | 'zip' = 'json'): Promise<Buffer | string> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== GenerationTaskStatus.COMPLETED) {
      throw new Error('Task not found or not completed');
    }

    if (format === 'json') {
      return JSON.stringify({
        task: {
          id: task.id,
          name: task.name,
          status: task.status,
          config: task.config,
          entities: task.entities,
          startTime: task.startTime,
          endTime: task.endTime,
          progress: task.progress,
        },
        files: task.generatedFiles.map(file => ({
          filePath: file.filePath,
          content: file.content,
          type: file.type,
          layer: file.layer,
          metadata: file.metadata,
        })),
      }, null, 2);
    }

    // TODO: 实现ZIP格式导出
    throw new Error('ZIP export not implemented yet');
  }

  /**
   * 异步执行任务
   */
  private async executeTaskAsync(task: GenerationTask, options: CodeGenerationOptions): Promise<void> {
    // 检查并发限制
    if (this.runningTasks >= this.maxConcurrentTasks) {
      this.logger.warn(`达到最大并发任务数限制，任务 ${task.id} 将等待执行`);
      // 可以实现队列机制
      return;
    }

    setImmediate(() => {
      this.executeTask(task, options).catch(error => {
        this.logger.error(`异步任务执行失败: ${task.id}`, error);
      });
    });
  }

  /**
   * 执行任务
   */
  private async executeTask(task: GenerationTask, options: CodeGenerationOptions): Promise<void> {
    try {
      this.runningTasks++;
      task.status = GenerationTaskStatus.RUNNING;
      task.startTime = new Date();
      task.progress = 0;

      this.logger.log(`开始执行代码生成任务: ${task.id}`);

      // 执行前置钩子
      if (options.hooks?.beforeGeneration) {
        await options.hooks.beforeGeneration(task);
      }

      // 更新进度
      task.progress = 10;

      // 执行代码生成
      const generatedFiles = await this.layeredGenerator.generateLayeredArchitecture(
        task.entities,
        task.config
      );

      task.generatedFiles = generatedFiles;
      task.progress = 90;

      // 执行后置钩子
      if (options.hooks?.afterGeneration) {
        await options.hooks.afterGeneration(task);
      }

      task.status = GenerationTaskStatus.COMPLETED;
      task.endTime = new Date();
      task.progress = 100;

      this.logger.log(`代码生成任务完成: ${task.id}, 生成了 ${generatedFiles.length} 个文件`);

      // 发送通知
      if (options.sendNotification) {
        await this.sendNotification(task, options.callbackUrl);
      }

    } catch (error) {
      task.status = GenerationTaskStatus.FAILED;
      task.endTime = new Date();
      task.error = error.message;

      this.logger.error(`代码生成任务失败: ${task.id}`, error);

      // 执行错误钩子
      if (options.hooks?.onError) {
        await options.hooks.onError(task, error);
      }

      // 发送错误通知
      if (options.sendNotification) {
        await this.sendNotification(task, options.callbackUrl);
      }

    } finally {
      this.runningTasks--;
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(task: GenerationTask, callbackUrl?: string): Promise<void> {
    try {
      if (callbackUrl) {
        // 发送HTTP回调
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: task.id,
            status: task.status,
            progress: task.progress,
            error: task.error,
          }),
        });

        if (!response.ok) {
          this.logger.warn(`回调通知发送失败: ${callbackUrl}`);
        }
      }

      // 可以在这里添加其他通知方式，如邮件、钉钉等
      this.logger.debug(`发送任务通知: ${task.id} - ${task.status}`);

    } catch (error) {
      this.logger.error('发送通知失败:', error);
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每天清理一次过期任务
    setInterval(() => {
      this.cleanupExpiredTasks();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 清理过期任务
   */
  private cleanupExpiredTasks(): void {
    const now = new Date();
    const expiredTasks: string[] = [];

    for (const [taskId, task] of this.tasks.entries()) {
      const daysSinceCreation = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > this.taskRetentionDays && 
          [GenerationTaskStatus.COMPLETED, GenerationTaskStatus.FAILED, GenerationTaskStatus.CANCELLED].includes(task.status)) {
        expiredTasks.push(taskId);
      }
    }

    expiredTasks.forEach(taskId => {
      this.tasks.delete(taskId);
    });

    if (expiredTasks.length > 0) {
      this.logger.log(`清理了 ${expiredTasks.length} 个过期任务`);
    }
  }

  /**
   * 批量创建任务
   */
  async createBatchTasks(
    requests: Array<{
      name: string;
      entities: EntityDefinition[];
      config: CodeGenerationConfig;
    }>,
    createdBy: string,
    options: CodeGenerationOptions = {}
  ): Promise<string[]> {
    const taskIds: string[] = [];

    for (const request of requests) {
      const taskId = await this.createGenerationTask(
        request.name,
        request.entities,
        request.config,
        createdBy,
        { ...options, async: true }
      );
      taskIds.push(taskId);
    }

    this.logger.log(`批量创建了 ${taskIds.length} 个代码生成任务`);
    return taskIds;
  }

  /**
   * 获取任务队列状态
   */
  getQueueStatus(): {
    running: number;
    pending: number;
    maxConcurrent: number;
  } {
    const tasks = Array.from(this.tasks.values());
    const pendingTasks = tasks.filter(t => t.status === GenerationTaskStatus.PENDING).length;

    return {
      running: this.runningTasks,
      pending: pendingTasks,
      maxConcurrent: this.maxConcurrentTasks,
    };
  }
}
