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
  HttpStatus
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../../../libs/infra/decorators/src/public.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('Tenant Management')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tenantService: TenantService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: '创建新租户' })
  @ApiResponse({ status: 201, description: '租户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '租户名称已存在' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取租户列表' })
  @ApiResponse({ status: 200, description: '获取租户列表成功' })
  findAll(@Query() queryDto: QueryTenantDto) {
    return this.tenantService.findAll(queryDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取租户详情' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '获取租户详情成功' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: '更新租户信息' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '租户更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: '删除租户' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '租户删除成功' })
  @ApiResponse({ status: 400, description: '无法删除：存在关联数据' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }

  @Public()
  @Get('enterprise/:enterpriseId')
  @ApiOperation({ summary: '根据企业ID获取租户列表' })
  @ApiParam({ name: 'enterpriseId', description: '企业ID' })
  @ApiResponse({ status: 200, description: '获取企业租户列表成功' })
  findByEnterpriseId(@Param('enterpriseId') enterpriseId: string) {
    return this.tenantService.findByEnterpriseId(enterpriseId);
  }

  @Public()
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '激活租户' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '租户激活成功' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  activate(@Param('id') id: string) {
    return this.tenantService.activate(id);
  }

  @Public()
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '暂停租户' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '租户暂停成功' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  suspend(@Param('id') id: string) {
    return this.tenantService.suspend(id);
  }
}