import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { PrismaService } from '../../../../../libs/shared/prisma/src/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建新的租户
   * @param createTenantDto - 创建租户所需的数据传输对象
   * @returns {Promise<Tenant>} 创建成功后的租户实体
   */
  async create(createTenantDto: CreateTenantDto) {
    // 验证企业是否存在
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id: createTenantDto.enterpriseId },
    });

    if (!enterprise) {
      throw new BadRequestException('指定的企业不存在');
    }

    // 检查租户名称在企业内是否唯一
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        enterpriseId: createTenantDto.enterpriseId,
        name: createTenantDto.name,
      },
    });

    if (existingTenant) {
      throw new BadRequestException('租户名称在该企业内已存在');
    }

    // 如果指定了计划ID，验证计划是否存在
    if (createTenantDto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: createTenantDto.planId },
      });

      if (!plan) {
        throw new BadRequestException('指定的订阅计划不存在');
      }
    }

    return this.prisma.tenant.create({
      data: createTenantDto,
      include: {
        enterprise: true,
        plan: true,
        _count: {
          select: {
            users: true,
            appSpaces: true,
            userGroups: true,
          },
        },
      },
    });
  }

  /**
   * 查询租户列表（支持分页和过滤）
   * @param queryDto - 查询参数
   * @returns {Promise<{data: Tenant[], total: number, page: number, limit: number}>} 分页查询结果
   */
  async findAll(queryDto: QueryTenantDto) {
    const { page = 1, limit = 10, name, enterpriseId, status, planId } = queryDto;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.TenantWhereInput = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (enterpriseId) {
      where.enterpriseId = enterpriseId;
    }

    if (status) {
      where.status = status;
    }

    if (planId) {
      where.planId = planId;
    }

    // 执行查询
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          enterprise: true,
          plan: true,
          _count: {
            select: {
              users: true,
              appSpaces: true,
              userGroups: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.tenant.count({ where }),
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
   * 根据 ID 查询单个租户
   * @param id - 租户的唯一标识符
   * @returns {Promise<Tenant>} 租户实体
   */
  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        enterprise: true,
        plan: true,
        appSpaces: true,
        userGroups: true,
        _count: {
          select: {
            users: true,
            appSpaces: true,
            userGroups: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return tenant;
  }

  /**
   * 更新租户信息
   * @param id - 租户的唯一标识符
   * @param updateTenantDto - 更新租户所需的数据传输对象
   * @returns {Promise<Tenant>} 更新后的租户实体
   */
  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // 检查租户是否存在
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      throw new NotFoundException('租户不存在');
    }

    // 如果更新企业ID，验证企业是否存在
    if (updateTenantDto.enterpriseId && updateTenantDto.enterpriseId !== existingTenant.enterpriseId) {
      const enterprise = await this.prisma.enterprise.findUnique({
        where: { id: updateTenantDto.enterpriseId },
      });

      if (!enterprise) {
        throw new BadRequestException('指定的企业不存在');
      }
    }

    // 如果更新租户名称，检查在企业内是否唯一
    if (updateTenantDto.name && updateTenantDto.name !== existingTenant.name) {
      const duplicateTenant = await this.prisma.tenant.findFirst({
        where: {
          enterpriseId: updateTenantDto.enterpriseId || existingTenant.enterpriseId,
          name: updateTenantDto.name,
          id: { not: id },
        },
      });

      if (duplicateTenant) {
        throw new BadRequestException('租户名称在该企业内已存在');
      }
    }

    // 如果更新计划ID，验证计划是否存在
    if (updateTenantDto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: updateTenantDto.planId },
      });

      if (!plan) {
        throw new BadRequestException('指定的订阅计划不存在');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
      include: {
        enterprise: true,
        plan: true,
        _count: {
          select: {
            users: true,
            appSpaces: true,
            userGroups: true,
          },
        },
      },
    });
  }

  /**
   * 删除租户
   * @param id - 租户的唯一标识符
   * @returns {Promise<Tenant>} 被删除的租户实体
   */
  async remove(id: string) {
    // 检查租户是否存在
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            appSpaces: true,
            userGroups: true,
          },
        },
      },
    });

    if (!existingTenant) {
      throw new NotFoundException('租户不存在');
    }

    // 检查是否有关联数据，如果有则不允许删除
    const { _count } = existingTenant;
    if (_count.users > 0 || _count.appSpaces > 0 || _count.userGroups > 0) {
      throw new BadRequestException(
        '无法删除租户：存在关联的用户、应用空间或用户组。请先删除相关数据。'
      );
    }

    return this.prisma.tenant.delete({
      where: { id },
      include: {
        enterprise: true,
        plan: true,
      },
    });
  }

  /**
   * 根据企业ID获取租户列表
   * @param enterpriseId - 企业ID
   * @returns {Promise<Tenant[]>} 租户列表
   */
  async findByEnterpriseId(enterpriseId: string) {
    return this.prisma.tenant.findMany({
      where: { enterpriseId },
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            appSpaces: true,
            userGroups: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 激活租户
   * @param id - 租户ID
   * @returns {Promise<Tenant>} 更新后的租户实体
   */
  async activate(id: string) {
    return this.update(id, { status: 'ENABLED' });
  }

  /**
   * 暂停租户
   * @param id - 租户ID
   * @returns {Promise<Tenant>} 更新后的租户实体
   */
  async suspend(id: string) {
    return this.update(id, { status: 'DISABLED' });
  }
}