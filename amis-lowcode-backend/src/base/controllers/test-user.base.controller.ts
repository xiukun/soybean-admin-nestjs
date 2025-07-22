import { Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TestUserBaseService } from '../services/test-user.base.service';
import { CreateTestUserDto, UpdateTestUserDto, TestUserQueryDto } from '../dto/test-user.dto';

/**
 * 测试用户基础控制器
 * 此文件由代码生成器自动生成，请勿手动修改
 * 如需自定义业务逻辑，请在 biz/controllers/test-user.controller.ts 中继承并扩展
 */
export abstract class TestUserBaseController {
  constructor(protected readonly testUserService: TestUserBaseService) {}

  /**
   * 获取测试用户列表
   */
  async findAll(query: TestUserQueryDto) {
    const { current = 1, size = 10, sort, search, ...filters } = query;
    
    const result = await this.testUserService.findMany({
      page: current,
      limit: size,
      sort: sort ? this.parseSortString(sort) : undefined,
      search,
      filters,
    });

    return {
      items: result.data,
      total: result.total,
      current,
      size,
    };
  }

  /**
   * 获取测试用户详情
   */
  async findOne(id: string) {
    return await this.testUserService.findById(id);
  }

  /**
   * 创建测试用户
   */
  async create(createDto: CreateTestUserDto) {
    return await this.testUserService.create(createDto);
  }

  /**
   * 更新测试用户
   */
  async update(id: string, updateDto: UpdateTestUserDto) {
    return await this.testUserService.update(id, updateDto);
  }

  /**
   * 删除测试用户
   */
  async remove(id: string) {
    await this.testUserService.delete(id);
    return {
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * 批量创建测试用户
   */
  async batchCreate(createDtos: CreateTestUserDto[]) {
    const results = await this.testUserService.batchCreate(createDtos);
    return {
      success: results.filter(r => r.success).map(r => r.data),
      failed: results.filter(r => !r.success).map(r => ({
        item: r.input,
        error: r.error,
      })),
      total: createDtos.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
    };
  }

  /**
   * 批量删除测试用户
   */
  async batchRemove(ids: string[]) {
    const results = await this.testUserService.batchDelete(ids);
    return {
      deletedIds: results.filter(r => r.success).map(r => r.id),
      failedIds: results.filter(r => !r.success).map(r => ({
        id: r.id,
        error: r.error,
      })),
      deletedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
    };
  }

  /**
   * 获取的关联用户档案列表
   */
  async getRelated(id: string, relation: string, query: any) {
    const { current = 1, size = 10, sort, search, ...filters } = query;
    
    const result = await this.testUserService.findRelated(id, relation, {
      page: current,
      limit: size,
      sort: sort ? this.parseSortString(sort) : undefined,
      search,
      filters,
    });

    return {
      items: result.data,
      total: result.total,
      current,
      size,
      relation: {
        type: 'ONE_TO_MANY',
        sourceEntity: '',
        targetEntity: 'UserProfile',
        sourceField: 'id',
        targetField: 'userId',
      },
    };
  }

  /**
   * 解析排序字符串
   */
  private parseSortString(sort: string): { field: string; order: 'asc' | 'desc' } | undefined {
    if (!sort) return undefined;
    
    const [field, order] = sort.split(':');
    return {
      field,
      order: order === 'desc' ? 'desc' : 'asc',
    };
  }
}
