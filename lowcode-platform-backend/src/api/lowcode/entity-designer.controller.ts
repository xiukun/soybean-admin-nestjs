import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
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
  EntityDesignerService, 
  EntityDesignerCanvas, 
  EntityNode, 
  RelationshipEdge,
  CanvasConfig 
} from '../../services/entity-designer.service';
import { CodeGenerationManagerService } from '../../services/code-generation-manager.service';

/**
 * 创建画布请求DTO
 */
export class CreateCanvasDto {
  /** 画布名称 */
  name: string;

  /** 画布描述 */
  description?: string;

  /** 项目ID */
  projectId: string;
}

/**
 * 更新画布请求DTO
 */
export class UpdateCanvasDto {
  /** 实体节点 */
  entities: EntityNode[];

  /** 关系连线 */
  relationships: RelationshipEdge[];

  /** 画布配置 */
  config: CanvasConfig;
}

/**
 * 实体设计器控制器
 */
@ApiTags('Entity Designer')
@Controller('entity-designer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EntityDesignerController {
  constructor(
    private readonly entityDesignerService: EntityDesignerService,
    private readonly codeGenerationManager: CodeGenerationManagerService,
  ) {}

  /**
   * 创建实体设计器画布
   */
  @Post('canvas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建实体设计器画布',
    description: '创建一个新的实体设计器画布用于可视化设计实体关系',
  })
  @ApiBody({
    type: CreateCanvasDto,
    description: '画布创建信息',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '画布创建成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            canvasId: { type: 'string', example: 'canvas_1234567890_abc123' },
            name: { type: 'string', example: '用户管理系统' },
            projectId: { type: 'string', example: 'project_123' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createCanvas(
    @Body() createCanvasDto: CreateCanvasDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const canvas = await this.entityDesignerService.createCanvas(
        createCanvasDto.name,
        createCanvasDto.description || '',
        createCanvasDto.projectId,
        userId,
      );

      return {
        canvasId: canvas.id,
        name: canvas.name,
        projectId: canvas.projectId,
        createdAt: canvas.createdAt,
      };
    } catch (error) {
      throw new BadRequestException('创建画布失败: ' + error.message);
    }
  }

  /**
   * 获取画布详情
   */
  @Get('canvas/:canvasId')
  @ApiOperation({
    summary: '获取画布详情',
    description: '获取指定画布的详细信息和设计数据',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
    example: 'canvas_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '画布详情获取成功',
  })
  @AmisResponse()
  async getCanvas(@Param('canvasId') canvasId: string) {
    try {
      const canvas = await this.entityDesignerService.getCanvas(canvasId);

      if (!canvas) {
        throw new NotFoundException('画布不存在');
      }

      return {
        id: canvas.id,
        name: canvas.name,
        description: canvas.description,
        canvasData: canvas.canvasData,
        projectId: canvas.projectId,
        createdBy: canvas.createdBy,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
        version: canvas.version,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取画布失败: ' + error.message);
    }
  }

  /**
   * 更新画布
   */
  @Put('canvas/:canvasId')
  @ApiOperation({
    summary: '更新画布',
    description: '更新画布的设计数据，包括实体、关系和配置',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiBody({
    type: UpdateCanvasDto,
    description: '画布更新数据',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '画布更新成功',
  })
  @AmisResponse()
  async updateCanvas(
    @Param('canvasId') canvasId: string,
    @Body() updateCanvasDto: UpdateCanvasDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const canvas = await this.entityDesignerService.updateCanvas(
        canvasId,
        {
          entities: updateCanvasDto.entities,
          relationships: updateCanvasDto.relationships,
          config: updateCanvasDto.config,
        },
        userId,
      );

      return {
        id: canvas.id,
        version: canvas.version,
        updatedAt: canvas.updatedAt,
        message: '画布更新成功',
      };
    } catch (error) {
      throw new BadRequestException('更新画布失败: ' + error.message);
    }
  }

  /**
   * 删除画布
   */
  @Delete('canvas/:canvasId')
  @ApiOperation({
    summary: '删除画布',
    description: '删除指定的实体设计器画布',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '画布删除成功',
  })
  @AmisResponse()
  async deleteCanvas(@Param('canvasId') canvasId: string) {
    try {
      const success = await this.entityDesignerService.deleteCanvas(canvasId);

      if (!success) {
        throw new NotFoundException('画布不存在或删除失败');
      }

      return {
        message: '画布删除成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('删除画布失败: ' + error.message);
    }
  }

  /**
   * 验证实体设计
   */
  @Post('canvas/:canvasId/validate')
  @ApiOperation({
    summary: '验证实体设计',
    description: '验证画布中的实体设计是否符合规范',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证完成',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', example: true },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'entity' },
                  code: { type: 'string', example: 'EMPTY_ENTITY_NAME' },
                  message: { type: 'string', example: '实体名称不能为空' },
                  entityId: { type: 'string', example: 'entity_123' },
                },
              },
            },
            warnings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'best-practice' },
                  code: { type: 'string', example: 'NO_FIELDS' },
                  message: { type: 'string', example: '实体没有定义任何字段' },
                  suggestion: { type: 'string', example: '建议至少定义一个字段' },
                },
              },
            },
          },
        },
      },
    },
  })
  @AmisResponse()
  async validateEntityDesign(@Param('canvasId') canvasId: string) {
    try {
      const canvas = await this.entityDesignerService.getCanvas(canvasId);

      if (!canvas) {
        throw new NotFoundException('画布不存在');
      }

      const validationResult = await this.entityDesignerService.validateEntityDesign(canvas);

      return validationResult;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('验证失败: ' + error.message);
    }
  }

  /**
   * 从画布生成代码
   */
  @Post('canvas/:canvasId/generate-code')
  @ApiOperation({
    summary: '从画布生成代码',
    description: '根据画布中的实体设计生成分层代码架构',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskName: { type: 'string', description: '生成任务名称' },
        config: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: '项目名称' },
            outputDir: { type: 'string', description: '输出目录' },
            generateBase: { type: 'boolean', description: '是否生成基础层' },
            generateBiz: { type: 'boolean', description: '是否生成业务层' },
            generateTests: { type: 'boolean', description: '是否生成测试文件' },
          },
        },
        async: { type: 'boolean', description: '是否异步执行' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '代码生成任务创建成功',
  })
  @AmisResponse()
  async generateCodeFromCanvas(
    @Param('canvasId') canvasId: string,
    @Body() body: {
      taskName: string;
      config: {
        projectName: string;
        outputDir: string;
        generateBase?: boolean;
        generateBiz?: boolean;
        generateTests?: boolean;
        createDirectories?: boolean;
        overwriteExisting?: boolean;
      };
      async?: boolean;
    },
    @Headers('user-id') userId: string,
  ) {
    try {
      const canvas = await this.entityDesignerService.getCanvas(canvasId);

      if (!canvas) {
        throw new NotFoundException('画布不存在');
      }

      // 验证实体设计
      const validationResult = await this.entityDesignerService.validateEntityDesign(canvas);
      if (!validationResult.isValid) {
        throw new BadRequestException('实体设计验证失败，请先修复错误');
      }

      // 转换为实体定义
      const entityDefinitions = this.entityDesignerService.convertCanvasToEntityDefinitions(canvas);

      // 创建代码生成任务
      const taskId = await this.codeGenerationManager.createGenerationTask(
        body.taskName,
        entityDefinitions,
        {
          projectName: body.config.projectName,
          outputDir: body.config.outputDir,
          generateBase: body.config.generateBase !== false,
          generateBiz: body.config.generateBiz !== false,
          generateTests: body.config.generateTests !== false,
          createDirectories: body.config.createDirectories !== false,
          overwriteExisting: body.config.overwriteExisting !== false,
        },
        userId,
        {
          async: body.async !== false,
          sendNotification: true,
        },
      );

      return {
        taskId,
        canvasId,
        entitiesCount: entityDefinitions.length,
        message: '代码生成任务创建成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('生成代码失败: ' + error.message);
    }
  }

  /**
   * 获取画布的实体定义
   */
  @Get('canvas/:canvasId/entities')
  @ApiOperation({
    summary: '获取画布的实体定义',
    description: '获取画布中所有实体的定义信息',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '实体定义获取成功',
  })
  @AmisResponse()
  async getCanvasEntities(@Param('canvasId') canvasId: string) {
    try {
      const canvas = await this.entityDesignerService.getCanvas(canvasId);

      if (!canvas) {
        throw new NotFoundException('画布不存在');
      }

      const entityDefinitions = this.entityDesignerService.convertCanvasToEntityDefinitions(canvas);

      return {
        canvasId,
        entities: entityDefinitions,
        count: entityDefinitions.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取实体定义失败: ' + error.message);
    }
  }

  /**
   * 导出画布数据
   */
  @Get('canvas/:canvasId/export')
  @ApiOperation({
    summary: '导出画布数据',
    description: '导出画布的完整数据，包括实体、关系和配置',
  })
  @ApiParam({
    name: 'canvasId',
    description: '画布ID',
  })
  @ApiQuery({
    name: 'format',
    description: '导出格式',
    required: false,
    enum: ['json', 'sql', 'prisma'],
    example: 'json',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '画布数据导出成功',
  })
  @AmisResponse()
  async exportCanvas(
    @Param('canvasId') canvasId: string,
    @Query('format') format: 'json' | 'sql' | 'prisma' = 'json',
  ) {
    try {
      const canvas = await this.entityDesignerService.getCanvas(canvasId);

      if (!canvas) {
        throw new NotFoundException('画布不存在');
      }

      let exportData: any;

      switch (format) {
        case 'json':
          exportData = {
            canvas: {
              id: canvas.id,
              name: canvas.name,
              description: canvas.description,
              canvasData: canvas.canvasData,
              version: canvas.version,
              exportedAt: new Date().toISOString(),
            },
          };
          break;

        case 'sql':
          // TODO: 实现SQL导出
          exportData = {
            format: 'sql',
            content: '-- SQL export not implemented yet',
          };
          break;

        case 'prisma':
          // TODO: 实现Prisma schema导出
          exportData = {
            format: 'prisma',
            content: '// Prisma schema export not implemented yet',
          };
          break;

        default:
          throw new BadRequestException('不支持的导出格式');
      }

      return {
        canvasId,
        format,
        data: exportData,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('导出画布数据失败: ' + error.message);
    }
  }
}
