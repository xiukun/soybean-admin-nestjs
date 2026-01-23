import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserBatchDeleteCommand } from '@app/base-system/lib/bounded-contexts/iam/authentication/commands/user-batch-delete.command';
import { UserCreateCommand } from '@app/base-system/lib/bounded-contexts/iam/authentication/commands/user-create.command';
import { UserDeleteCommand } from '@app/base-system/lib/bounded-contexts/iam/authentication/commands/user-delete.command';
import { UserUpdateCommand } from '@app/base-system/lib/bounded-contexts/iam/authentication/commands/user-update.command';
import {
  UserProperties,
  UserReadModel,
} from '@app/base-system/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import { PageUsersQuery } from '@app/base-system/lib/bounded-contexts/iam/authentication/queries/page-users.query';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiResponseDoc } from '@lib/infra/decorators/api-result.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PaginationResult } from '@lib/shared/prisma/pagination';

import { PageUsersDto } from '../dto/page-users.dto';
import { BatchDeleteUserDto, UserCreateDto, UserUpdateDto } from '../dto/user.dto';

@ApiTags('User - Module')
@ApiJwtAuth()
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated Users',
  })
  @ApiResponseDoc({ type: UserReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageUsersDto,
    @Request() req: any,
  ): Promise<ApiRes<PaginationResult<UserProperties>>> {
    // 记录原始查询参数（从 URL）
    const rawQuery = req.query || {};
    this.logger.debug(`[page] 收到查询请求，原始 URL 参数: ${JSON.stringify(rawQuery)}`);
    this.logger.debug(`[page] 转换后的 DTO: ${JSON.stringify(queryDto)}`);
    this.logger.debug(`[page] deptIds 参数类型: ${typeof queryDto.deptIds}, 值: ${JSON.stringify(queryDto.deptIds)}`);
    this.logger.debug(`[page] deptIds 是否为数组: ${Array.isArray(queryDto.deptIds)}`);
    
    // 如果 deptIds 未正确解析，从原始查询参数中手动提取
    let deptIds = queryDto.deptIds;
    if (!deptIds || !Array.isArray(deptIds) || deptIds.length === 0) {
      const deptIdsValues: string[] = [];
      Object.keys(rawQuery).forEach(key => {
        // 匹配 deptIds[0], deptIds[1] 等格式
        const match = key.match(/^deptIds\[(\d+)\]$/);
        if (match) {
          const val = rawQuery[key];
          if (val && typeof val === 'string' && val.trim()) {
            deptIdsValues.push(val.trim());
          }
        }
      });
      if (deptIdsValues.length > 0) {
        deptIds = [...new Set(deptIdsValues)];
        this.logger.debug(`[page] 从原始查询参数中提取 deptIds: ${JSON.stringify(deptIds)}`);
      }
    }
    
    const query = new PageUsersQuery({
      current: queryDto.current,
      size: queryDto.size,
      username: queryDto.username,
      nickName: queryDto.nickName,
      status: queryDto.status,
      deptIds: deptIds,
    });
    
    this.logger.debug(`[page] 构建的 PageUsersQuery: ${JSON.stringify(query)}`);
    this.logger.debug(`[page] query.deptIds: ${JSON.stringify(query.deptIds)}`);
    
    const result = await this.queryBus.execute<
      PageUsersQuery,
      PaginationResult<UserProperties>
    >(query);
    
    if (result.records.length > 0) {
      const firstRecord = result.records[0] as any;
    }
    
    const response = ApiRes.success(result);
    return response;
  }

  @Post()
  @ApiOperation({ summary: 'Create a New User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createUser(
    @Body() dto: UserCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new UserCreateCommand(
        dto.username,
        dto.password,
        dto.domain,
        dto.nickName,
        dto.status,
        dto.avatar,
        dto.email,
        dto.phoneNumber,
        req.user.uid,
        dto.deptIds,
      ),
    );
    return ApiRes.ok();
  }

  @Put()
  @ApiOperation({ summary: 'Update a User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUser(
    @Body() dto: UserUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new UserUpdateCommand(
        dto.id,
        dto.username,
        dto.nickName,
        dto.status,
        dto.avatar,
        dto.email,
        dto.phoneNumber,
        req.user.uid,
        dto.deptIds,
      ),
    );
    return ApiRes.ok();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteUser(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.commandBus.execute(new UserDeleteCommand(id));
    return ApiRes.ok();
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch Delete Users' })
  @ApiResponse({
    status: 200,
    description: 'The users have been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async batchDeleteUsers(
    @Body() dto: BatchDeleteUserDto,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(new UserBatchDeleteCommand(dto.ids));
    return ApiRes.ok();
  }
}
