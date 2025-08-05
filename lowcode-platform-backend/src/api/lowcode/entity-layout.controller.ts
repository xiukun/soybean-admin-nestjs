import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { EntityLayoutService } from './services/entity-layout.service';
import {
  CreateEntityLayoutDto,
  UpdateEntityLayoutDto,
  EntityLayoutResponseDto,
  LayoutVersionDto,
} from './dto/entity-layout.dto';

/**
 * 实体布局控制器
 * 负责处理实体设计器的布局保存、加载和版本管理
 */
@ApiTags('entity-layouts')
@ApiBearerAuth()
@Controller({ path: 'entity-layouts', version: '1' })
export class EntityLayoutController {
  constructor(private readonly entityLayoutService: EntityLayoutService) {}

  /**
   * 创建新的实体布局
   * @param createLayoutDto - 创建布局的数据传输对象
   * @returns Promise<EntityLayoutResponseDto> 创建的布局信息
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new entity layout' })
  @ApiBody({ type: CreateEntityLayoutDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entity layout created successfully',
    type: EntityLayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Layout for this project already exists',
  })
  async createLayout(@Body() createLayoutDto: CreateEntityLayoutDto): Promise<EntityLayoutResponseDto> {
    return await this.entityLayoutService.createLayout(createLayoutDto);
  }

  /**
   * 根据项目ID获取实体布局
   * @param projectId - 项目ID
   * @returns Promise<EntityLayoutResponseDto> 布局信息
   */
  @Get(':projectId')
  @ApiOperation({ summary: 'Get entity layout by project ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity layout found',
    type: EntityLayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity layout not found',
  })
  async getLayout(@Param('projectId') projectId: string): Promise<EntityLayoutResponseDto> {
    return await this.entityLayoutService.getLayout(projectId);
  }

  /**
   * 更新实体布局
   * @param projectId - 项目ID
   * @param updateLayoutDto - 更新布局的数据传输对象
   * @returns Promise<EntityLayoutResponseDto> 更新后的布局信息
   */
  @Put(':projectId')
  @ApiOperation({ summary: 'Update entity layout' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiBody({ type: UpdateEntityLayoutDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity layout updated successfully',
    type: EntityLayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity layout not found',
  })
  async updateLayout(
    @Param('projectId') projectId: string,
    @Body() updateLayoutDto: UpdateEntityLayoutDto,
  ): Promise<EntityLayoutResponseDto> {
    return await this.entityLayoutService.updateLayout(projectId, updateLayoutDto);
  }

  /**
   * 删除实体布局
   * @param projectId - 项目ID
   * @returns Promise<void>
   */
  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete entity layout' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Entity layout deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity layout not found',
  })
  async deleteLayout(@Param('projectId') projectId: string): Promise<void> {
    return await this.entityLayoutService.deleteLayout(projectId);
  }

  /**
   * 获取布局版本历史
   * @param projectId - 项目ID
   * @returns Promise<LayoutVersionDto[]> 版本历史列表
   */
  @Get(':projectId/versions')
  @ApiOperation({ summary: 'Get layout version history' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Layout version history',
    type: [LayoutVersionDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity layout not found',
  })
  async getLayoutVersions(@Param('projectId') projectId: string): Promise<LayoutVersionDto[]> {
    return await this.entityLayoutService.getLayoutVersions(projectId);
  }

  /**
   * 恢复到指定版本
   * @param projectId - 项目ID
   * @param version - 版本号
   * @returns Promise<EntityLayoutResponseDto> 恢复后的布局信息
   */
  @Post(':projectId/restore/:version')
  @ApiOperation({ summary: 'Restore layout to specific version' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Layout restored successfully',
    type: EntityLayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Layout or version not found',
  })
  async restoreToVersion(
    @Param('projectId') projectId: string,
    @Param('version') version: number,
  ): Promise<EntityLayoutResponseDto> {
    return await this.entityLayoutService.restoreToVersion(projectId, version);
  }
}