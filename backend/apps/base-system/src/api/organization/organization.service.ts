import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { Status } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建组织
   */
  async create(createOrganizationDto: CreateOrganizationDto) {
    const { name, description, status, tenantId } = createOrganizationDto;
    let { parentId } = createOrganizationDto;

    // 如果没有指定父组织，设置为根组织
    if (!parentId) {
      parentId = '0';
    }

    // 如果指定了父组织且不是根组织，检查父组织是否存在
    if (parentId && parentId !== '0') {
      const parentOrg = await this.prisma.sysOrganization.findUnique({
        where: { id: parentId },
      });
      if (!parentOrg) {
        throw new NotFoundException('父组织不存在');
      }
      if (parentOrg.status !== Status.ENABLED) {
        throw new BadRequestException('父组织状态不可用');
      }
      // 检查父组织是否属于同一租户
      if (tenantId && parentOrg.tenantId !== tenantId) {
        throw new BadRequestException('父组织必须属于同一租户');
      }
    }

    // 检查组织名称在租户内是否唯一
    const whereCondition: any = { name };
    if (tenantId) {
      whereCondition.tenantId = tenantId;
    }
    const existingOrg = await this.prisma.sysOrganization.findFirst({
      where: whereCondition,
    });
    if (existingOrg) {
      throw new ConflictException('组织名称在当前租户内已存在');
    }

    // 生成组织代码
    const code = `ORG_${Date.now()}`;

    return this.prisma.sysOrganization.create({
      data: {
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code,
        name,
        description,
        pid: parentId,
        tenantId,
        status: status || Status.ENABLED,
        createdBy: 'system', // TODO: 从当前用户上下文获取
      },
    });
  }

  /**
   * 查询组织列表（分页）
   */
  async findAll(queryDto: QueryOrganizationDto) {
    const { page = 1, limit = 10, name, parentId, status, tenantId } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (parentId !== undefined) {
      where.pid = parentId;
    }
    if (status) {
      where.status = status;
    }
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.sysOrganization.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.sysOrganization.count({ where }),
    ]);

    return {
      data: organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查询组织
   */
  async findOne(id: string) {
    const organization = await this.prisma.sysOrganization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('组织不存在');
    }

    return organization;
  }

  /**
   * 更新组织
   */
  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);

    const { name, description, status, tenantId } = updateOrganizationDto;
    let { parentId } = updateOrganizationDto;

    // 如果更新父组织，检查父组织是否存在且不会形成循环引用
    if (parentId !== undefined && parentId !== organization.pid) {
      if (parentId && parentId !== '0') {
        const parentOrg = await this.prisma.sysOrganization.findUnique({
          where: { id: parentId },
        });
        if (!parentOrg) {
          throw new NotFoundException('父组织不存在');
        }
        
        // 检查父组织是否属于同一租户
        const currentTenantId = tenantId || (organization as any).tenantId;
        if (currentTenantId && (parentOrg as any).tenantId !== currentTenantId) {
          throw new BadRequestException('父组织必须属于同一租户');
        }
        
        // 检查是否会形成循环引用
        if (await this.wouldCreateCycle(id, parentId)) {
          throw new BadRequestException('不能将组织设置为其子组织的父组织');
        }
      } else {
        parentId = '0';
      }
    }

    // 如果更新名称，检查名称在租户内是否唯一
    if (name && name !== organization.name) {
      const currentTenantId = tenantId || (organization as any).tenantId;
      const whereCondition: any = {
        name,
        id: { not: id },
      };
      if (currentTenantId) {
        whereCondition.tenantId = currentTenantId;
      }
      const existingOrg = await this.prisma.sysOrganization.findFirst({
        where: whereCondition,
      });
      if (existingOrg) {
        throw new ConflictException('组织名称在当前租户内已存在');
      }
    }

    return this.prisma.sysOrganization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { pid: parentId }),
        ...(tenantId !== undefined && { tenantId }),
        ...(status && { status }),
        updatedBy: 'system', // TODO: 从当前用户上下文获取
      },
    });
  }

  /**
   * 删除组织
   */
  async remove(id: string) {
    const organization = await this.findOne(id);

    // 检查是否有子组织
    const childCount = await this.prisma.sysOrganization.count({
      where: { pid: id },
    });
    if (childCount > 0) {
      throw new BadRequestException('组织下存在子组织，无法删除');
    }

    return this.prisma.sysOrganization.delete({
      where: { id },
    });
  }

  /**
   * 查询组织树
   * @param tenantId - 可选的租户ID，用于过滤特定租户的组织架构
   */
  async findTree(tenantId?: string) {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const organizations = await this.prisma.sysOrganization.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    // 构建树形结构
    const buildTree = (parentId: string): any[] => {
      return organizations
        .filter(org => org.pid === parentId)
        .map(org => ({
          ...org,
          children: buildTree(org.id),
        }));
    };

    return buildTree('0');
  }

  /**
   * 启用组织
   */
  async activate(id: string) {
    const organization = await this.findOne(id);
    
    if (organization.status === Status.ENABLED) {
      throw new BadRequestException('组织已经是启用状态');
    }

    return this.prisma.sysOrganization.update({
      where: { id },
      data: { 
        status: Status.ENABLED,
        updatedBy: 'system', // TODO: 从当前用户上下文获取
      },
    });
  }

  /**
   * 停用组织
   */
  async suspend(id: string) {
    const organization = await this.findOne(id);
    
    if (organization.status === Status.DISABLED) {
      throw new BadRequestException('组织已经是停用状态');
    }

    return this.prisma.sysOrganization.update({
      where: { id },
      data: { 
        status: Status.DISABLED,
        updatedBy: 'system', // TODO: 从当前用户上下文获取
      },
    });
  }

  /**
   * 检查是否会形成循环引用
   * @param orgId - 当前组织ID
   * @param newParentId - 新的父组织ID
   * @returns {Promise<boolean>} 是否会形成循环
   */
  private async wouldCreateCycle(orgId: string, newParentId: string): Promise<boolean> {
    if (orgId === newParentId) {
      return true;
    }

    // 递归检查新父组织的所有祖先
    let currentParentId = newParentId;
    while (currentParentId && currentParentId !== '0') {
      if (currentParentId === orgId) {
        return true;
      }
      
      const parent = await this.prisma.sysOrganization.findUnique({
        where: { id: currentParentId },
        select: { pid: true },
      });
      
      currentParentId = parent?.pid || '0';
    }

    return false;
  }
}