import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleProperties } from '@app/base-system/lib/bounded-contexts/iam/role/domain/role.read.model';
import { AllRolesQuery } from '@app/base-system/lib/bounded-contexts/iam/role/queries/all-roles.query';

import { ApiResponseDoc } from '@lib/infra/decorators/api-result.decorator';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';

@ApiTags('System Manage - Module')
@ApiJwtAuth() // 添加Bearer认证装饰器
@Controller('systemManage')
export class SystemManageController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('getAllRoles')
  @ApiOperation({
    summary: 'Get All Enabled Roles',
    description: 'Retrieve all enabled roles for system management.',
  })
  @ApiResponseDoc({ type: Object, isArray: true })
  async getAllRoles(): Promise<ApiRes<RoleProperties[]>> {
    const result = await this.queryBus.execute<
      AllRolesQuery,
      RoleProperties[]
    >(new AllRolesQuery());
    return ApiRes.success(result);
  }
}
