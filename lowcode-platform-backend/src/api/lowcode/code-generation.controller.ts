import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseInterceptors,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '@decorators/public.decorator';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { AmisResponse } from '@decorators/amis-response.decorator';
import { AmisResponseInterceptor } from '@interceptors/amis-response.interceptor';
import { CodeGenerationService, CodeGenerationOptions } from '@lib/code-generation/services/code-generation.service';
import { HotUpdateService } from '@lib/code-generation/services/hot-update.service';

// Dual-layer generation imports
import {
  GenerateCodeCommand,
  ValidateGenerationConfigCommand,
  PreviewGenerationCommand,
  CleanupGeneratedFilesCommand,
} from '@lib/bounded-contexts/code-generation/application/commands/code-generation.commands';

import {
  GetGenerationConfigQuery,
  GetAvailableTemplatesQuery,
  GetProjectEntitiesQuery,
  GetGenerationPreviewQuery,
  GetGenerationStatusQuery,
  GetGeneratedFilesQuery,
} from '@lib/bounded-contexts/code-generation/application/queries/code-generation.queries';

import { GenerationConfig } from '@lib/bounded-contexts/code-generation/application/services/dual-layer-generator.service';

import * as path from 'path';
import * as fs from 'fs';

export class GenerateCodeDto {
  entityIds: string[];
  targetProject: string;
  options?: {
    overwrite?: boolean;
    createDirectories?: boolean;
    format?: boolean;
    dryRun?: boolean;
  };
}

export class PreviewCodeDto {
  entityId: string;
  templateName?: string;
}

@ApiTags('code-generation')
@ApiBearerAuth()
@Public() // 临时禁用认证以便测试
@Controller({ path: 'code-generation', version: '1' })
@UseInterceptors(AmisResponseInterceptor)
export class CodeGenerationController {
  private readonly logger = new Logger(CodeGenerationController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerationService: CodeGenerationService,
    private readonly hotUpdateService: HotUpdateService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('templates')
  @AmisResponse({
    description: 'Get available code templates',
    dataKey: 'templates'
  })
  @ApiOperation({ summary: 'Get available code templates' })
  async getTemplates(
    @Query('type') type?: string,
    @Query('language') language?: string,
    @Query('framework') framework?: string,
  ) {
    const where: any = {
      status: 'ACTIVE',
    };

    if (type) {
      where.type = type;
    }

    if (language) {
      where.language = language;
    }

    if (framework) {
      where.framework = framework;
    }

    const templates = await this.prisma.codeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        language: true,
        framework: true,
        description: true,
        variables: true,
        version: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return templates.map(template => ({
      ...template,
      variables: typeof template.variables === 'string'
        ? JSON.parse(template.variables)
        : template.variables,
    }));
  }

  @Post('generate')
  @AmisResponse({
    description: 'Generate code for entities',
    dataKey: 'result'
  })
  @ApiOperation({ summary: 'Generate code for entities' })
  @ApiBody({ type: GenerateCodeDto })
  async generateCode(@Body() dto: GenerateCodeDto) {
    try {
      this.logger.log(`Starting code generation for entities: ${dto.entityIds.join(', ')}`);

      // Validate entity IDs
      if (!dto.entityIds || dto.entityIds.length === 0) {
        throw new BadRequestException('Entity IDs are required');
      }

      // Fetch entities from database
      const entities = await this.prisma.entity.findMany({
        where: {
          id: { in: dto.entityIds },
        },
        include: {
          fields: true,
        },
      });

      if (entities.length === 0) {
        throw new NotFoundException('No entities found with the provided IDs');
      }

      if (entities.length !== dto.entityIds.length) {
        const foundIds = entities.map(e => e.id);
        const missingIds = dto.entityIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Entities not found: ${missingIds.join(', ')}`);
      }

      // Prepare generation options
      const options: CodeGenerationOptions = {
        targetProject: dto.targetProject,
        outputPath: this.getTargetProjectPath(dto.targetProject),
        overwrite: dto.options?.overwrite ?? true,
        createDirectories: dto.options?.createDirectories ?? true,
        format: dto.options?.format ?? true,
        dryRun: dto.options?.dryRun ?? false,
      };

      // Transform entities to the format expected by CodeGenerationService
      const entityDefinitions = entities.map(entity => ({
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

      // Generate code
      const result = await this.codeGenerationService.generateCode(
        entityDefinitions,
        options
      );

      return result;

    } catch (error) {
      this.logger.error('Code generation failed:', error);
      throw error;
    }
  }

  @Post('preview')
  @AmisResponse({
    description: 'Preview generated code',
    dataKey: 'preview'
  })
  @ApiOperation({ summary: 'Preview generated code' })
  @ApiBody({ type: PreviewCodeDto })
  async previewCode(@Body() dto: PreviewCodeDto) {
    try {
      this.logger.log(`Generating code preview for entity: ${dto.entityId}`);

      // Fetch entity from database
      const entity = await this.prisma.entity.findUnique({
        where: { id: dto.entityId },
        include: {
          fields: true,
        },
      });

      if (!entity) {
        throw new NotFoundException(`Entity not found: ${dto.entityId}`);
      }

      // Prepare generation options for preview (dry run)
      const options: CodeGenerationOptions = {
        targetProject: 'preview',
        outputPath: '/tmp/preview',
        overwrite: true,
        createDirectories: false,
        format: true,
        dryRun: true,
      };

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

      // Generate code in dry run mode
      const result = await this.codeGenerationService.generateCode(
        [entityDefinition],
        options
      );

      const preview = {
        entityCode: entity.code,
        templates: result.generatedFiles.map(filePath => ({
          templateName: path.basename(filePath),
          fileName: path.basename(filePath),
          content: '// Preview content - implement actual content extraction',
        })),
      };

      return preview;

    } catch (error) {
      this.logger.error('Code preview failed:', error);
      throw error;
    }
  }

  @Get('status')
  @AmisResponse({
    description: 'Get code generation service status',
    dataKey: 'status'
  })
  @ApiOperation({ summary: 'Get code generation service status' })
  async getStatus() {
    try {
      const codeGenerationStats = await this.codeGenerationService.getStatistics();
      const hotUpdateStatus = this.hotUpdateService.getStatus();

      return {
        codeGeneration: codeGenerationStats,
        hotUpdate: hotUpdateStatus,
      };

    } catch (error) {
      this.logger.error('Failed to get service status:', error);
      throw error;
    }
  }

  @Post('clear-cache')
  @AmisResponse({
    description: 'Clear template cache',
    dataKey: 'result'
  })
  @ApiOperation({ summary: 'Clear template cache' })
  async clearCache() {
    try {
      this.codeGenerationService.clearTemplateCache();

      return {
        success: true,
        message: 'Template cache cleared successfully',
      };

    } catch (error) {
      this.logger.error('Failed to clear template cache:', error);
      throw error;
    }
  }

  /**
   * Get target project path based on project name
   */
  private getTargetProjectPath(projectName: string): string {
    const projectPaths = {
      'amis-lowcode-backend': path.join(__dirname, '../../../amis-lowcode-backend'),
      'default': path.join(__dirname, '../../../generated'),
    };

    return projectPaths[projectName] || projectPaths['default'];
  }

  // ==================== 双层代码生成接口 ====================

  @Get('dual-layer/config/:projectId')
  @ApiOperation({ summary: '获取双层代码生成配置' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDualLayerGenerationConfig(@Param('projectId') projectId: string): Promise<any> {
    const query = new GetGenerationConfigQuery(projectId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('dual-layer/templates')
  @ApiOperation({ summary: '获取可用模板列表' })
  @ApiQuery({ name: 'projectId', description: '项目ID', required: true })
  @ApiQuery({ name: 'category', description: '模板分类', required: false })
  @ApiQuery({ name: 'language', description: '编程语言', required: false })
  @ApiQuery({ name: 'framework', description: '框架', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDualLayerAvailableTemplates(
    @Query('projectId') projectId: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('framework') framework?: string,
  ): Promise<any> {
    const query = new GetAvailableTemplatesQuery(projectId, category, language, framework);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('dual-layer/entities/:projectId')
  @ApiOperation({ summary: '获取项目实体列表' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiQuery({ name: 'includeFields', description: '包含字段信息', required: false })
  @ApiQuery({ name: 'includeRelations', description: '包含关系信息', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDualLayerProjectEntities(
    @Param('projectId') projectId: string,
    @Query('includeFields') includeFields?: boolean,
    @Query('includeRelations') includeRelations?: boolean,
  ): Promise<any> {
    const query = new GetProjectEntitiesQuery(
      projectId,
      includeFields !== false,
      includeRelations !== false,
    );
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Post('dual-layer/validate')
  @ApiOperation({ summary: '验证双层代码生成配置' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async validateDualLayerGenerationConfig(@Body() config: GenerationConfig): Promise<any> {
    const command = new ValidateGenerationConfigCommand(config);
    const result = await this.commandBus.execute(command);

    return {
      status: result.isValid ? 0 : 1,
      msg: result.isValid ? 'success' : 'validation failed',
      data: result,
    };
  }

  @Post('dual-layer/generate')
  @ApiOperation({ summary: '执行双层代码生成' })
  @ApiResponse({ status: 200, description: '生成任务已启动' })
  async generateDualLayerCode(
    @Body() generateData: {
      config: GenerationConfig;
      userId?: string;
    },
  ): Promise<any> {
    const command = new GenerateCodeCommand(generateData.config, generateData.userId);
    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.success ? 'success' : 'generation failed',
      data: result,
    };
  }

  @Get('dual-layer/status/:taskId')
  @ApiOperation({ summary: '获取双层代码生成任务状态' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDualLayerGenerationStatus(@Param('taskId') taskId: string): Promise<any> {
    const query = new GetGenerationStatusQuery(taskId);
    const result = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Delete('dual-layer/cleanup')
  @ApiOperation({ summary: '清理双层生成的文件' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanupDualLayerGeneratedFiles(
    @Body() cleanupData: {
      outputPath: string;
      preserveBizFiles?: boolean;
    },
  ): Promise<any> {
    const command = new CleanupGeneratedFilesCommand(
      cleanupData.outputPath,
      cleanupData.preserveBizFiles,
    );
    const result = await this.commandBus.execute(command);

    return {
      status: result.success ? 0 : 1,
      msg: result.success ? 'success' : 'cleanup failed',
      data: result,
    };
  }
}
