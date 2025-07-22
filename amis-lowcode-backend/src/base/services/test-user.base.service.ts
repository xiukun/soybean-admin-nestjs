import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  CreateTestUserDto,
  UpdateTestUserDto,
  TestUserQueryDto
} from '../dto/test-user.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 测试用户基础服务类
 *
 * 此类由代码生成器自动生成，请勿手动修改
 * 如需扩展功能，请在 biz/services/test-user.service.ts 中继承此类
 */
@Injectable()
export abstract class TestUserBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * 创建测试用户
   */
  async create(data: CreateTestUserDto, createdBy: string = 'system') {
    return await this.prisma.testUser.create({
      data: {
        ...data,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

    });
  }

  /**
   * 根据ID查找测试用户
   */
  async findById(id: string) {
    return await this.prisma.testUser.findUnique({
      where: { id },

    });
  }

  /**
   * 根据ID获取测试用户（不存在时抛出异常）
   */
  async getById(id: string) {
    const testUser = await this.findById(id);
    if (!testUser) {
      throw new NotFoundException(`测试用户 with id '${id}' not found`);
    }
    return testUser;
  }

  /**
   * 分页查询测试用户
   */
  async findMany(options?: {
    page?: number;
    limit?: number;
    sort?: { field: string; order: 'asc' | 'desc' };
    search?: string;
    filters?: Record<string, any>;
  }) {
    const { page = 1, limit = 10, sort, search, filters = {} } = options || {};

    const where: any = { ...filters };

    // 搜索逻辑
    if (search) {
      const searchFields = [
        'username',
        'email',
        'phone',
        'realName',
        'gender',
        'avatar',
        'bio',
      ];

      where.OR = searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      }));
    }

    const [data, total] = await Promise.all([
      this.prisma.testUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },

      }),
      this.prisma.testUser.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 更新测试用户
   */
  async update(id: string, data: UpdateTestUserDto, updatedBy: string = 'system') {
    return await this.prisma.testUser.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },

    });
  }

  /**
   * 删除测试用户
   */
  async delete(id: string): Promise<void> {
    await this.prisma.testUser.delete({
      where: { id },
    });
  }

  /**
   * 批量创建测试用户
   */
  async batchCreate(items: CreateTestUserDto[]): Promise<Array<{
    success: boolean;
    data?: any;
    input: any;
    error?: string;
  }>> {
    const results = [];

    for (const item of items) {
      try {
        const created = await this.create(item);
        results.push({
          success: true,
          data: created,
          input: item,
        });
      } catch (error) {
        results.push({
          success: false,
          input: item,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 批量删除测试用户
   */
  async batchDelete(ids: string[]): Promise<Array<{
    success: boolean;
    id: string;
    error?: string;
  }>> {
    const results = [];

    for (const id of ids) {
      try {
        await this.delete(id);
        results.push({
          success: true,
          id,
        });
      } catch (error) {
        results.push({
          success: false,
          id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 获取的关联用户档案列表
   */
  async findRelated(id: string, relation: string, options?: {
    page?: number;
    limit?: number;
    sort?: { field: string; order: 'asc' | 'desc' };
    search?: string;
    filters?: Record<string, any>;
  }) {
    const { page = 1, limit = 10, sort, search, filters = {} } = options || {};

    const where: any = {
      ...filters,
      id: id,
    };

    if (search) {
      // Add search logic for related entity
      where.OR = [
        // Add searchable fields for 用户档案
      ];
    }

    // TestUser模型暂无关联关系，返回空结果
    const data: any[] = [];
    const total = 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
