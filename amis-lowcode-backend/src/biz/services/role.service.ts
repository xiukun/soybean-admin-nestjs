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
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: FindAllOptions): Promise<PaginatedResult<any>> {
    const { page, pageSize, filters } = options;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    try {
      const [items, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: 'desc' },
        }),
        this.prisma.role.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      // 如果Role表不存在，返回空结果
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
      const role = await this.prisma.role.findUnique({
        where: { id: parseInt(id) },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async create(createRoleDto: any): Promise<any> {
    try {
      const { id, ...roleData } = createRoleDto;
      return await this.prisma.role.create({
        data: roleData,
      });
    } catch (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  async update(id: string, updateRoleDto: any): Promise<any> {
    try {
      const role = await this.prisma.role.update({
        where: { id: parseInt(id) },
        data: updateRoleDto,
      });

      return role;
    } catch (error) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.role.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}
