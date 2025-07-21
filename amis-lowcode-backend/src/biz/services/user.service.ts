import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/services/prisma.service';

export interface FindAllOptions {
  page: number;
  pageSize: number;
  filters: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: FindAllOptions): Promise<PaginatedResult<any>> {
    const { page, pageSize, filters } = options;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    try {
      const [items, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      // 如果User表不存在，返回空结果
      return {
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async create(createUserDto: any): Promise<any> {
    try {
      const { id, ...userData } = createUserDto;
      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async update(id: string, updateUserDto: any): Promise<any> {
    try {
      const user = await this.prisma.user.update({
        where: { id: parseInt(id) },
        data: updateUserDto,
      });

      return user;
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
