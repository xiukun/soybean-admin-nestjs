import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { CreateAppSpaceDto } from './dto/create-app-space.dto';
import { UpdateAppSpaceDto } from './dto/update-app-space.dto';
import { QueryAppSpaceDto } from './dto/query-app-space.dto';
import { Status } from '@prisma/client';

@Injectable()
export class AppSpaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建应用空间
   */
  async create(createAppSpaceDto: CreateAppSpaceDto) {
    const { name, tenantId, description, status } = createAppSpaceDto;

    // 检查租户是否存在
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 检查租户状态
    if (tenant.status !== Status.ENABLED) {
      throw new BadRequestException('租户状态不可用，无法创建应用空间');
    }

    // 检查应用空间名称在租户内是否唯一
    const existingAppSpace = await this.prisma.appSpace.findFirst({
      where: {
        name,
        tenantId,
      },
    });
    if (existingAppSpace) {
      throw new ConflictException('应用空间名称在该租户下已存在');
    }

    return this.prisma.appSpace.create({
      data: {
        name,
        description,
        tenantId,
        status: status || Status.ENABLED,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
    });
  }

  /**
   * 查询应用空间列表（分页）
   */
  async findAll(queryDto: QueryAppSpaceDto) {
    const { page = 1, limit = 10, name, tenantId, status } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (tenantId) {
      where.tenantId = tenantId;
    }
    if (status) {
      where.status = status;
    }

    const [appSpaces, total] = await Promise.all([
      this.prisma.appSpace.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              enterpriseId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appSpace.count({ where }),
    ]);

    return {
      data: appSpaces,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查询应用空间
   */
  async findOne(id: string) {
    const appSpace = await this.prisma.appSpace.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
    });

    if (!appSpace) {
      throw new NotFoundException('应用空间不存在');
    }

    return appSpace;
  }

  /**
   * 更新应用空间
   */
  async update(id: string, updateAppSpaceDto: UpdateAppSpaceDto) {
    const appSpace = await this.findOne(id);

    const { name, tenantId, description, status } = updateAppSpaceDto;

    // 如果更新租户ID，检查新租户是否存在
    if (tenantId && tenantId !== appSpace.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('新租户不存在');
      }
      if (tenant.status !== Status.ENABLED) {
        throw new BadRequestException('新租户状态不可用');
      }
    }

    // 如果更新名称，检查名称在租户内是否唯一
    if (name && name !== appSpace.name) {
      const targetTenantId = tenantId || appSpace.tenantId;
      const existingAppSpace = await this.prisma.appSpace.findFirst({
        where: {
          name,
          tenantId: targetTenantId,
          id: { not: id },
        },
      });
      if (existingAppSpace) {
        throw new ConflictException('应用空间名称在该租户下已存在');
      }
    }

    return this.prisma.appSpace.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(tenantId && { tenantId }),
        ...(status && { status }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
    });
  }

  /**
   * 删除应用空间
   */
  async remove(id: string) {
    const appSpace = await this.findOne(id);

    // 检查是否有关联的低代码页面
    // 注意：当前schema中SysLowcodePage没有appSpaceId字段，此检查暂时跳过
    // 如果需要此功能，需要在schema中添加appSpaceId字段
    // const pageCount = await this.prisma.sysLowcodePage.count({
    //   where: { appSpaceId: id },
    // });
    // if (pageCount > 0) {
    //   throw new BadRequestException('应用空间下存在低代码页面，无法删除');
    // }

    return this.prisma.appSpace.delete({
      where: { id },
    });
  }

  /**
   * 根据租户ID查询应用空间
   */
  async findByTenantId(tenantId: string) {
    return this.prisma.appSpace.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 启用应用空间
   */
  async activate(id: string) {
    const appSpace = await this.findOne(id);
    
    if (appSpace.status === Status.ENABLED) {
      throw new BadRequestException('应用空间已经是启用状态');
    }

    return this.prisma.appSpace.update({
      where: { id },
      data: { status: Status.ENABLED },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
    });
  }

  /**
   * 停用应用空间
   */
  async suspend(id: string) {
    const appSpace = await this.findOne(id);
    
    if (appSpace.status === Status.DISABLED) {
      throw new BadRequestException('应用空间已经是停用状态');
    }

    return this.prisma.appSpace.update({
      where: { id },
      data: { status: Status.DISABLED },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            enterpriseId: true,
          },
        },
      },
    });
  }
}