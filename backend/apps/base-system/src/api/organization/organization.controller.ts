import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { TenantTestDto } from './dto/tenant-test.dto';
import { CurrentTenant, TenantRequired } from '@lib/infra/decorators/tenant.decorator';

@ApiTags('组织管理')
@Controller('organization')
@TenantRequired()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 创建组织
   */
  @Post()
  @ApiOperation({ summary: '创建组织' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '组织名称已存在' })
  create(@Body() createOrganizationDto: CreateOrganizationDto, @CurrentTenant() tenantId: string) {
    return this.organizationService.create({ ...createOrganizationDto, tenantId });
  }

  /**
   * 查询组织列表
   */
  @Get()
  @ApiOperation({ summary: '查询组织列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() queryDto: QueryOrganizationDto, @CurrentTenant() tenantId: string) {
    return this.organizationService.findAll({ ...queryDto, tenantId });
  }

  /**
   * 查询组织树
   */
  @Get('tree')
  @ApiOperation({ summary: '查询组织树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findTree(@CurrentTenant() tenantId: string) {
    return this.organizationService.findTree(tenantId);
  }

  /**
   * 根据ID查询组织
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID查询组织' })
  @ApiParam({ name: 'id', description: '组织ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '组织不存在' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  /**
   * 更新组织
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新组织' })
  @ApiParam({ name: 'id', description: '组织ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '组织不存在' })
  @ApiResponse({ status: 409, description: '组织名称已存在' })
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto, @CurrentTenant() tenantId: string) {
    return this.organizationService.update(id, { ...updateOrganizationDto, tenantId });
  }

  /**
   * 删除组织
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除组织' })
  @ApiParam({ name: 'id', description: '组织ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '组织下存在子组织，无法删除' })
  @ApiResponse({ status: 404, description: '组织不存在' })
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }

  /**
   * 启用组织
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启用组织' })
  @ApiParam({ name: 'id', description: '组织ID' })
  @ApiResponse({ status: 200, description: '启用成功' })
  @ApiResponse({ status: 400, description: '组织已经是启用状态' })
  @ApiResponse({ status: 404, description: '组织不存在' })
  activate(@Param('id') id: string) {
    return this.organizationService.activate(id);
  }

  /**
   * 停用组织
   */
  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '停用组织' })
  @ApiParam({ name: 'id', description: '组织ID' })
  @ApiResponse({ status: 200, description: '停用成功' })
  @ApiResponse({ status: 400, description: '组织已经是停用状态' })
  @ApiResponse({ status: 404, description: '组织不存在' })
  suspend(@Param('id') id: string) {
    return this.organizationService.suspend(id);
  }

  /**
   * 测试多租户功能
   */
  @Post('tenant-test')
  @ApiOperation({ summary: '测试多租户功能' })
  @ApiResponse({ status: 200, description: '测试成功' })
  tenantTest(@Body() tenantTestDto: TenantTestDto, @CurrentTenant() tenantId: string) {
    return {
      message: `租户 ${tenantId} 收到消息: ${tenantTestDto.message}`,
      tenantId,
      timestamp: new Date().toISOString(),
    };
  }
}