import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/services/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto
} from '../dto/user.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 用户基础服务类
 *
 * 此类由代码生成器自动生成，请勿手动修改
 * 如需扩展功能，请在 biz/services/user.service.ts 中继承此类
 */
@Injectable()
export abstract class UserBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * 创建用户
   */
  async create(data: CreateUserDto, createdBy: string = 'system') {
    return await this.prisma.user.create({
      data: {
        ...data,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
      },
    });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        userProfiles: true,
      },
    });
  }

  /**
   * 根据ID获取用户（不存在时抛出异常）
   */
  async getById(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`用户 with id '${id}' not found`);
    }
    return user;
  }

  /**
   * 分页查询用户
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
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
        include: {
        },
      }),
      this.prisma.user.count({ where }),
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
   * 更新用户
   */
  async update(id: string, data: UpdateUserDto, updatedBy: string = 'system') {
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
      },
    });
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * 批量创建用户
   */
  async batchCreate(items: CreateUserDto[]): Promise<Array<{
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
   * 批量删除用户
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

    const [data, total] = await Promise.all([
      this.prisma.userProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
      }),
      this.prisma.userProfile.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
