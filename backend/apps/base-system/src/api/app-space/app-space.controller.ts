import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../../../libs/infra/decorators/src/public.decorator';
import { AppSpaceService } from './app-space.service';
import { CreateAppSpaceDto } from './dto/create-app-space.dto';
import { UpdateAppSpaceDto } from './dto/update-app-space.dto';
import { QueryAppSpaceDto } from './dto/query-app-space.dto';

/**
 * 应用空间管理控制器
 * 提供应用空间的CRUD操作和状态管理功能
 */
@ApiTags('应用空间管理')
@Controller('app-spaces')
export class AppSpaceController {
  constructor(private readonly appSpaceService: AppSpaceService) {}

  /**
   * 创建应用空间
   * @param createAppSpaceDto - 创建应用空间的数据传输对象
   * @returns {Promise<AppSpace>} 创建成功的应用空间信息
   */
  @Post()
  @Public()
  @ApiOperation({ summary: '创建应用空间' })
  @ApiResponse({ status: 201, description: '应用空间创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  @ApiResponse({ status: 409, description: '应用空间名称已存在' })
  create(@Body() createAppSpaceDto: CreateAppSpaceDto) {
    return this.appSpaceService.create(createAppSpaceDto);
  }

  /**
   * 查询应用空间列表（分页）
   * @param queryDto - 查询条件和分页参数
   * @returns {Promise<PaginatedResult<AppSpace>>} 分页的应用空间列表
   */
  @Get()
  @Public()
  @ApiOperation({ summary: '查询应用空间列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() queryDto: QueryAppSpaceDto) {
    return this.appSpaceService.findAll(queryDto);
  }

  /**
   * 根据ID查询应用空间详情
   * @param id - 应用空间ID
   * @returns {Promise<AppSpace>} 应用空间详细信息
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: '查询应用空间详情' })
  @ApiParam({ name: 'id', description: '应用空间ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '应用空间不存在' })
  findOne(@Param('id') id: string) {
    return this.appSpaceService.findOne(id);
  }

  /**
   * 更新应用空间信息
   * @param id - 应用空间ID
   * @param updateAppSpaceDto - 更新数据
   * @returns {Promise<AppSpace>} 更新后的应用空间信息
   */
  @Patch(':id')
  @Public()
  @ApiOperation({ summary: '更新应用空间' })
  @ApiParam({ name: 'id', description: '应用空间ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '应用空间不存在' })
  @ApiResponse({ status: 409, description: '应用空间名称已存在' })
  update(@Param('id') id: string, @Body() updateAppSpaceDto: UpdateAppSpaceDto) {
    return this.appSpaceService.update(id, updateAppSpaceDto);
  }

  /**
   * 删除应用空间
   * @param id - 应用空间ID
   * @returns {Promise<void>} 删除结果
   */
  @Delete(':id')
  @Public()
  @ApiOperation({ summary: '删除应用空间' })
  @ApiParam({ name: 'id', description: '应用空间ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '应用空间不存在' })
  @ApiResponse({ status: 400, description: '应用空间下存在关联数据，无法删除' })
  remove(@Param('id') id: string) {
    return this.appSpaceService.remove(id);
  }

  /**
   * 根据租户ID查询应用空间列表
   * @param tenantId - 租户ID
   * @returns {Promise<AppSpace[]>} 该租户下的所有应用空间
   */
  @Get('tenant/:tenantId')
  @Public()
  @ApiOperation({ summary: '根据租户ID查询应用空间' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByTenantId(@Param('tenantId') tenantId: string) {
    return this.appSpaceService.findByTenantId(tenantId);
  }

  /**
   * 启用应用空间
   * @param id - 应用空间ID
   * @returns {Promise<AppSpace>} 启用后的应用空间信息
   */
  @Put(':id/activate')
  @Public()
  @ApiOperation({ summary: '启用应用空间' })
  @ApiParam({ name: 'id', description: '应用空间ID' })
  @ApiResponse({ status: 200, description: '启用成功' })
  @ApiResponse({ status: 404, description: '应用空间不存在' })
  @ApiResponse({ status: 400, description: '应用空间已经是启用状态' })
  activate(@Param('id') id: string) {
    return this.appSpaceService.activate(id);
  }

  /**
   * 停用应用空间
   * @param id - 应用空间ID
   * @returns {Promise<AppSpace>} 停用后的应用空间信息
   */
  @Put(':id/suspend')
  @Public()
  @ApiOperation({ summary: '停用应用空间' })
  @ApiParam({ name: 'id', description: '应用空间ID' })
  @ApiResponse({ status: 200, description: '停用成功' })
  @ApiResponse({ status: 404, description: '应用空间不存在' })
  @ApiResponse({ status: 400, description: '应用空间已经是停用状态' })
  suspend(@Param('id') id: string) {
    return this.appSpaceService.suspend(id);
  }
}