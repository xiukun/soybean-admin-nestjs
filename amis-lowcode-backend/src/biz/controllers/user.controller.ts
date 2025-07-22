import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserBaseController } from '../base/controllers/user.base.controller';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto/user.dto';
import { AmisResponse, AmisPaginationResponse } from '@lib/shared/decorators/amis-response.decorator';
import { AmisResponseInterceptor } from '@lib/shared/interceptors/amis-response.interceptor';
import {
  PaginationResponseDto,
  EntityResponseDto,
  DeleteResponseDto,
  BatchCreateResponseDto,
  BatchDeleteResponseDto
} from '@lib/shared/dto/base-response.dto';

@ApiTags('用户')
@Controller('user')
@UseInterceptors(AmisResponseInterceptor)
export class UserController extends UserBaseController {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'current', required: false, description: '当前页码', example: 1 })
  @ApiQuery({ name: 'size', required: false, description: '每页大小', example: 10 })
  @ApiQuery({ name: 'sort', required: false, description: '排序字段', example: 'createdAt:desc' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: PaginationResponseDto
  })
  @AmisPaginationResponse({ description: '用户分页列表' })
  async findAll(@Query() query: UserQueryDto) {
    return super.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: EntityResponseDto
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @AmisResponse({ description: '用户详情' })
  async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: EntityResponseDto
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @AmisResponse({ description: '创建用户成功' })
  async create(@Body() createDto: CreateUserDto) {
    return super.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: EntityResponseDto
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @AmisResponse({ description: '更新用户成功' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return super.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteResponseDto
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @AmisResponse({ description: '删除用户成功' })
  async remove(@Param('id') id: string) {
    return super.remove(id);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建用户' })
  @ApiResponse({
    status: 201,
    description: '批量创建成功',
    type: BatchCreateResponseDto
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @AmisResponse({ description: '批量创建用户结果' })
  async batchCreate(@Body() createDtos: CreateUserDto[]) {
    return super.batchCreate(createDtos);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除用户' })
  @ApiResponse({
    status: 200,
    description: '批量删除成功',
    type: BatchDeleteResponseDto
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @AmisResponse({ description: '批量删除用户结果' })
  async batchRemove(@Body() ids: string[]) {
    return super.batchRemove(ids);
  }

  @Get(':id/user-profiles')
  @ApiOperation({ summary: '获取的用户档案列表' })
  @ApiParam({ name: 'id', description: 'ID' })
  @ApiQuery({ name: 'current', required: false, description: '当前页码', example: 1 })
  @ApiQuery({ name: 'size', required: false, description: '每页大小', example: 10 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AmisResponse()
  async getUserProfiles(@Param('id') id: string, @Query() query: any) {
    return super.getRelated(id, 'userProfiles', query);
  }
}
