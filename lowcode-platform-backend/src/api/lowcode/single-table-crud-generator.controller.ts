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
  SingleTableCrudGeneratorService, 
  SingleTableCrudConfig, 
  CrudOperationConfig,
  FieldConfig,
  CustomOperation,
} from '../../services/single-table-crud-generator.service';
import { EntityDefinition } from '../../services/layered-code-generator.service';
import { CodeGenerationManagerService } from '../../services/code-generation-manager.service';

/**
 * 创建单表CRUD生成任务请求DTO
 */
export class CreateSingleTableCrudTaskDto {
  /** 任务名称 */
  name: string;

  /** 实体定义 */
  entity: EntityDefinition;

  /** CRUD配置 */
  config: SingleTableCrudConfig;

  /** 操作配置 */
  operationConfig?: CrudOperationConfig;

  /** 字段配置 */
  fieldConfigs?: Record<string, FieldConfig>;

  /** 是否异步执行 */
  async?: boolean;

  /** 是否发送通知 */
  sendNotification?: boolean;

  /** 回调URL */
  callbackUrl?: string;
}

/**
 * 预览CRUD代码请求DTO
 */
export class PreviewCrudCodeDto {
  /** 实体定义 */
  entity: EntityDefinition;

  /** CRUD配置 */
  config: SingleTableCrudConfig;

  /** 操作配置 */
  operationConfig?: CrudOperationConfig;

  /** 字段配置 */
  fieldConfigs?: Record<string, FieldConfig>;

  /** 预览类型 */
  previewType: 'controller' | 'service' | 'repository' | 'dto' | 'entity' | 'module';
}

/**
 * 单表CRUD生成器控制器
 */
@ApiTags('Single Table CRUD Generator')
@Controller('single-table-crud-generator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SingleTableCrudGeneratorController {
  constructor(
    private readonly singleTableCrudGenerator: SingleTableCrudGeneratorService,
    private readonly codeGenerationManager: CodeGenerationManagerService,
  ) {}

  /**
   * 创建单表CRUD生成任务
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建单表CRUD生成任务',
    description: '为单个实体创建完整的CRUD代码生成任务',
  })
  @ApiBody({
    type: CreateSingleTableCrudTaskDto,
    description: '单表CRUD生成任务配置',
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
            taskId: { type: 'string', example: 'crud_task_1234567890_abc123' },
            name: { type: 'string', example: '用户CRUD代码生成' },
            entityCode: { type: 'string', example: 'user' },
            estimatedTime: { type: 'number', example: 60 },
            enabledOperations: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createSingleTableCrudTask(
    @Body() createTaskDto: CreateSingleTableCrudTaskDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      // 验证输入数据
      if (!createTaskDto.entity) {
        throw new BadRequestException('实体定义不能为空');
      }

      if (!createTaskDto.config.projectName) {
        throw new BadRequestException('项目名称不能为空');
      }

      if (!createTaskDto.entity.fields || createTaskDto.entity.fields.length === 0) {
        throw new BadRequestException('实体必须包含至少一个字段');
      }

      // 创建任务ID
      const taskId = `crud_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 如果是异步执行，创建后台任务
      if (createTaskDto.async !== false) {
        // 创建异步任务
        this.executeSingleTableCrudGeneration(
          taskId,
          createTaskDto.entity,
          createTaskDto.config,
          createTaskDto.operationConfig,
          createTaskDto.fieldConfigs,
          userId,
          {
            sendNotification: createTaskDto.sendNotification,
            callbackUrl: createTaskDto.callbackUrl,
          }
        );

        return {
          taskId,
          name: createTaskDto.name,
          entityCode: createTaskDto.entity.code,
          estimatedTime: 60, // 单表CRUD预估60秒
          enabledOperations: this.getEnabledOperations(createTaskDto.operationConfig),
          message: '单表CRUD代码生成任务已创建，正在后台执行',
        };
      } else {
        // 同步执行
        const generatedFiles = await this.singleTableCrudGenerator.generateSingleTableCrud(
          createTaskDto.entity,
          createTaskDto.config,
          createTaskDto.operationConfig,
          createTaskDto.fieldConfigs
        );

        return {
          taskId,
          name: createTaskDto.name,
          entityCode: createTaskDto.entity.code,
          filesCount: generatedFiles.length,
          enabledOperations: this.getEnabledOperations(createTaskDto.operationConfig),
          files: generatedFiles.map(file => ({
            filePath: file.filePath,
            type: file.type,
            description: file.description,
          })),
          message: '单表CRUD代码生成完成',
        };
      }
    } catch (error) {
      throw new BadRequestException('创建单表CRUD生成任务失败: ' + error.message);
    }
  }

  /**
   * 获取单表CRUD生成任务状态
   */
  @Get('tasks/:taskId')
  @ApiOperation({
    summary: '获取单表CRUD生成任务状态',
    description: '获取指定任务的执行状态和进度信息',
  })
  @ApiParam({
    name: 'taskId',
    description: '任务ID',
    example: 'crud_task_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '任务状态获取成功',
  })
  @AmisResponse()
  async getSingleTableCrudTaskStatus(@Param('taskId') taskId: string) {
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
        entityCode: task.metadata?.entityCode || '',
        enabledOperations: task.metadata?.enabledOperations || [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务状态失败: ' + error.message);
    }
  }

  /**
   * 获取单表CRUD生成任务的文件列表
   */
  @Get('tasks/:taskId/files')
  @ApiOperation({
    summary: '获取单表CRUD生成任务的文件列表',
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
  async getSingleTableCrudTaskFiles(@Param('taskId') taskId: string) {
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
        operations: file.metadata?.operations || [],
      }));

      return {
        taskId,
        files,
        totalFiles: files.length,
        fileTypes: [...new Set(files.map(f => f.type))],
        entityCode: task.metadata?.entityCode || '',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取任务文件列表失败: ' + error.message);
    }
  }

  /**
   * 预览单表CRUD代码
   */
  @Post('preview')
  @ApiOperation({
    summary: '预览单表CRUD代码',
    description: '根据配置预览生成的CRUD代码',
  })
  @ApiBody({
    type: PreviewCrudCodeDto,
    description: 'CRUD代码预览配置',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '代码预览成功',
  })
  @AmisResponse()
  async previewSingleTableCrudCode(@Body() previewDto: PreviewCrudCodeDto) {
    try {
      // 生成代码预览
      const generatedFiles = await this.singleTableCrudGenerator.generateSingleTableCrud(
        previewDto.entity,
        previewDto.config,
        previewDto.operationConfig,
        previewDto.fieldConfigs
      );

      const targetFile = generatedFiles.find(file => file.type === previewDto.previewType);

      if (!targetFile) {
        throw new BadRequestException(`未找到类型为 ${previewDto.previewType} 的文件`);
      }

      return {
        entity: previewDto.entity,
        config: previewDto.config,
        operationConfig: previewDto.operationConfig,
        previewType: previewDto.previewType,
        code: targetFile.content,
        filePath: targetFile.filePath,
        description: targetFile.description,
        dependencies: targetFile.dependencies,
        metadata: targetFile.metadata,
      };
    } catch (error) {
      throw new BadRequestException('预览CRUD代码失败: ' + error.message);
    }
  }

  /**
   * 获取CRUD操作配置模板
   */
  @Get('operation-config-templates')
  @ApiOperation({
    summary: '获取CRUD操作配置模板',
    description: '获取预定义的CRUD操作配置模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '模板类型',
    enum: ['basic', 'advanced', 'readonly', 'custom'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '配置模板获取成功',
  })
  @AmisResponse()
  async getCrudOperationConfigTemplates(@Query('type') type?: string) {
    try {
      const templates = {
        basic: {
          name: '基础CRUD',
          description: '包含基本的增删改查操作',
          config: {
            enableCreate: true,
            enableRead: true,
            enableUpdate: true,
            enableDelete: true,
            enableBatchOperations: false,
            enableSearch: true,
            enableSort: true,
            enableFilter: true,
            enableImportExport: false,
          },
        },
        advanced: {
          name: '高级CRUD',
          description: '包含完整的CRUD功能和批量操作',
          config: {
            enableCreate: true,
            enableRead: true,
            enableUpdate: true,
            enableDelete: true,
            enableBatchOperations: true,
            enableSearch: true,
            enableSort: true,
            enableFilter: true,
            enableImportExport: true,
          },
        },
        readonly: {
          name: '只读模式',
          description: '仅包含查询和搜索功能',
          config: {
            enableCreate: false,
            enableRead: true,
            enableUpdate: false,
            enableDelete: false,
            enableBatchOperations: false,
            enableSearch: true,
            enableSort: true,
            enableFilter: true,
            enableImportExport: true,
          },
        },
        custom: {
          name: '自定义配置',
          description: '可自由配置的CRUD操作',
          config: {
            enableCreate: true,
            enableRead: true,
            enableUpdate: true,
            enableDelete: true,
            enableBatchOperations: true,
            enableSearch: true,
            enableSort: true,
            enableFilter: true,
            enableImportExport: true,
            customOperations: [
              {
                name: 'activate',
                method: 'PUT',
                path: ':id/activate',
                description: '激活记录',
                requiresAuth: true,
                permissions: ['activate'],
              },
              {
                name: 'deactivate',
                method: 'PUT',
                path: ':id/deactivate',
                description: '停用记录',
                requiresAuth: true,
                permissions: ['deactivate'],
              },
            ],
          },
        },
      };

      const filteredTemplates = type 
        ? { [type]: templates[type] }
        : templates;

      return {
        templates: filteredTemplates,
        total: Object.keys(filteredTemplates).length,
        types: Object.keys(templates),
      };
    } catch (error) {
      throw new BadRequestException('获取配置模板失败: ' + error.message);
    }
  }

  /**
   * 获取字段配置模板
   */
  @Get('field-config-templates')
  @ApiOperation({
    summary: '获取字段配置模板',
    description: '获取预定义的字段配置模板',
  })
  @ApiQuery({
    name: 'fieldType',
    required: false,
    description: '字段类型',
    enum: ['string', 'number', 'boolean', 'date', 'datetime', 'text', 'json'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '字段配置模板获取成功',
  })
  @AmisResponse()
  async getFieldConfigTemplates(@Query('fieldType') fieldType?: string) {
    try {
      const templates = {
        string: {
          showInList: true,
          showInDetail: true,
          searchable: true,
          sortable: true,
          filterable: true,
          validationRules: [
            { type: 'required', message: '此字段为必填项' },
            { type: 'maxLength', value: 255, message: '长度不能超过255个字符' },
          ],
        },
        number: {
          showInList: true,
          showInDetail: true,
          searchable: false,
          sortable: true,
          filterable: true,
          validationRules: [
            { type: 'required', message: '此字段为必填项' },
            { type: 'min', value: 0, message: '值不能小于0' },
          ],
        },
        boolean: {
          showInList: true,
          showInDetail: true,
          searchable: false,
          sortable: true,
          filterable: true,
          validationRules: [],
        },
        date: {
          showInList: true,
          showInDetail: true,
          searchable: false,
          sortable: true,
          filterable: true,
          validationRules: [
            { type: 'required', message: '此字段为必填项' },
          ],
        },
        datetime: {
          showInList: true,
          showInDetail: true,
          searchable: false,
          sortable: true,
          filterable: true,
          validationRules: [
            { type: 'required', message: '此字段为必填项' },
          ],
        },
        text: {
          showInList: false,
          showInDetail: true,
          searchable: true,
          sortable: false,
          filterable: false,
          validationRules: [
            { type: 'maxLength', value: 5000, message: '长度不能超过5000个字符' },
          ],
        },
        json: {
          showInList: false,
          showInDetail: true,
          searchable: false,
          sortable: false,
          filterable: false,
          validationRules: [],
        },
      };

      const filteredTemplates = fieldType 
        ? { [fieldType]: templates[fieldType] }
        : templates;

      return {
        templates: filteredTemplates,
        total: Object.keys(filteredTemplates).length,
        fieldTypes: Object.keys(templates),
      };
    } catch (error) {
      throw new BadRequestException('获取字段配置模板失败: ' + error.message);
    }
  }

  /**
   * 获取单表CRUD生成统计
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取单表CRUD生成统计',
    description: '获取单表CRUD生成的统计信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '统计信息获取成功',
  })
  @AmisResponse()
  async getSingleTableCrudStatistics() {
    try {
      const baseStats = this.codeGenerationManager.getGenerationStatistics();
      
      // 筛选单表CRUD相关任务
      const crudTasks = baseStats.recentTasks.filter(task => 
        task.id.startsWith('crud_task_')
      );

      return {
        totalCrudTasksCount: crudTasks.length,
        successfulCrudTasksCount: crudTasks.filter(task => task.status === 'completed').length,
        failedCrudTasksCount: crudTasks.filter(task => task.status === 'failed').length,
        averageCrudGenerationTime: crudTasks.length > 0 
          ? crudTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / crudTasks.length
          : 0,
        totalCrudFilesGenerated: crudTasks.reduce((sum, task) => sum + (task.filesCount || 0), 0),
        recentCrudTasks: crudTasks.slice(0, 10),
        popularEntityTypes: this.getPopularEntityTypes(crudTasks),
        operationUsageStats: this.getOperationUsageStats(crudTasks),
      };
    } catch (error) {
      throw new BadRequestException('获取统计信息失败: ' + error.message);
    }
  }

  /**
   * 执行单表CRUD代码生成（异步）
   */
  private async executeSingleTableCrudGeneration(
    taskId: string,
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig = {},
    fieldConfigs: Record<string, FieldConfig> = {},
    userId: string,
    options: {
      sendNotification?: boolean;
      callbackUrl?: string;
    } = {}
  ): Promise<void> {
    try {
      // 注册任务
      this.codeGenerationManager.registerTask(taskId, {
        name: `单表CRUD代码生成: ${entity.name}`,
        type: 'single-table-crud',
        status: 'running',
        progress: 0,
        createdBy: userId,
        metadata: {
          entityCode: entity.code,
          enabledOperations: this.getEnabledOperations(operationConfig),
          projectName: config.projectName,
        },
      });

      // 执行代码生成
      const generatedFiles = await this.singleTableCrudGenerator.generateSingleTableCrud(
        entity,
        config,
        operationConfig,
        fieldConfigs
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
            operations: file.metadata.operations,
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
   * 获取启用的操作列表
   */
  private getEnabledOperations(operationConfig: CrudOperationConfig = {}): string[] {
    const operations: string[] = [];

    if (operationConfig.enableCreate !== false) operations.push('create');
    if (operationConfig.enableRead !== false) operations.push('read');
    if (operationConfig.enableUpdate !== false) operations.push('update');
    if (operationConfig.enableDelete !== false) operations.push('delete');
    if (operationConfig.enableBatchOperations) operations.push('batch');
    if (operationConfig.enableSearch) operations.push('search');
    if (operationConfig.enableSort) operations.push('sort');
    if (operationConfig.enableFilter) operations.push('filter');
    if (operationConfig.enableImportExport) operations.push('import', 'export');

    return operations;
  }

  /**
   * 获取热门实体类型
   */
  private getPopularEntityTypes(tasks: any[]): Array<{ type: string; count: number }> {
    const entityTypes: Record<string, number> = {};

    tasks.forEach(task => {
      if (task.metadata?.entityCode) {
        const type = task.metadata.entityCode;
        entityTypes[type] = (entityTypes[type] || 0) + 1;
      }
    });

    return Object.entries(entityTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 获取操作使用统计
   */
  private getOperationUsageStats(tasks: any[]): Array<{ operation: string; count: number }> {
    const operationStats: Record<string, number> = {};

    tasks.forEach(task => {
      if (task.metadata?.enabledOperations) {
        task.metadata.enabledOperations.forEach((operation: string) => {
          operationStats[operation] = (operationStats[operation] || 0) + 1;
        });
      }
    });

    return Object.entries(operationStats)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count);
  }
}
