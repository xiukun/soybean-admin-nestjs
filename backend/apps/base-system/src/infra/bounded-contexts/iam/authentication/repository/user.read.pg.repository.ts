import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { UserProperties } from '@app/base-system/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import { UserReadRepoPort } from '@app/base-system/lib/bounded-contexts/iam/authentication/ports/user.read.repo-port';
import { PageUsersQuery } from '@app/base-system/lib/bounded-contexts/iam/authentication/queries/page-users.query';

import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class UserReadRepository implements UserReadRepoPort {
  private readonly logger = new Logger(UserReadRepository.name);

  constructor(private prisma: PrismaService) {}

  async findUserById(id: string): Promise<UserProperties | null> {
    const user = await this.prisma.sysUser.findUnique({
      where: { id },
      select: this.USER_ESSENTIAL_FIELDS as any,
    });
    if (!user) return null;
    
    // 处理部门数据
    let departments: any[] = [];
    if ((user as any).depts && Array.isArray((user as any).depts)) {
      departments = (user as any).depts
        .map((x: any) => x?.dept)
        .filter((d: any) => d != null && d.id != null);
    }
    
    // 移除 depts 字段，只保留 departments
    const { depts, ...rest } = user as any;
    
    return {
      ...rest,
      departments,
    } as any;
  }

  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    return this.prisma.sysUserRole
      .findMany({
        where: { roleId },
        select: {
          userId: true,
        },
      })
      .then((results) => results.map((item) => item.userId));
  }

  async findUsersByIds(ids: string[]): Promise<UserProperties[]> {
    return this.prisma.sysUser.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  private readonly USER_ESSENTIAL_FIELDS = {
    id: true,
    username: true,
    domain: true,
    avatar: true,
    email: true,
    phoneNumber: true,
    nickName: true,
    status: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    password: false,
    depts: {
      select: {
        dept: { select: { id: true, name: true, code: true } },
      },
    },
  };

  async findUserByIdentifier(
    identifier: string,
  ): Promise<UserProperties | null> {
    return this.prisma.sysUser.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      },
    });
  }

  async pageUsers(
    query: PageUsersQuery,
  ): Promise<PaginationResult<UserProperties>> {
    this.logger.debug(`[pageUsers] 开始查询用户列表，参数: ${JSON.stringify(query)}`);
    this.logger.debug(`[pageUsers] query.deptIds 类型: ${typeof query.deptIds}, 值: ${JSON.stringify(query.deptIds)}`);
    this.logger.debug(`[pageUsers] query.deptIds 是否为数组: ${Array.isArray(query.deptIds)}`);
    this.logger.debug(`[pageUsers] query.deptIds 长度: ${Array.isArray(query.deptIds) ? query.deptIds.length : 'N/A'}`);

    const where: Prisma.SysUserWhereInput = {};

    // dept filter (many-to-many)
    if (query.deptIds && Array.isArray(query.deptIds) && query.deptIds.length > 0) {
      this.logger.debug(`[pageUsers] 应用部门筛选条件，deptIds: ${JSON.stringify(query.deptIds)}`);
      where.depts = {
        some: {
          deptId: { in: query.deptIds },
        },
      };
      this.logger.debug(`[pageUsers] 部门筛选条件: ${JSON.stringify(where.depts)}`);
    } else {
      this.logger.debug(`[pageUsers] 未应用部门筛选条件，原因: deptIds=${JSON.stringify(query.deptIds)}, isArray=${Array.isArray(query.deptIds)}, length=${Array.isArray(query.deptIds) ? query.deptIds.length : 'N/A'}`);
    }

    if (query.username) {
      where.username = {
        contains: query.username,
      };
    }

    if (query.nickName) {
      where.nickName = {
        contains: query.nickName,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const users = await this.prisma.sysUser.findMany({
      where: where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      select: this.USER_ESSENTIAL_FIELDS as any,
    });

   const mapped = (users as any[]).map((u, index) => {
      // 处理部门数据：depts 是 SysUserDept[] 数组，每个元素有 dept 属性
      // 如果 depts 不存在或不是数组，返回空数组
      let departments: any[] = [];
      if (u.depts && Array.isArray(u.depts)) {
        departments = u.depts
          .map((x: any) => {
            return x?.dept;
          })
          .filter((d: any) => {
            const isValid = d != null && d.id != null;
            if (!isValid) {
              this.logger.debug(`[pageUsers] 过滤掉无效的部门数据: ${JSON.stringify(d)}`);
            }
            return isValid;
          });
      }
      
      // 移除 depts 字段，只保留 departments
      const { depts, ...rest } = u;
      
      const result = {
        ...rest,
        departments,
      };
            
      return result;
    });

    const total = await this.prisma.sysUser.count({ where: where });

    
    const paginationResult = new PaginationResult<UserProperties>(
      query.current,
      query.size,
      total,
      mapped,
    );

    return paginationResult;
  }

  async getUserByUsername(
    username: string,
  ): Promise<Readonly<UserProperties> | null> {
    return this.prisma.sysUser.findUnique({
      where: { username },
    });
  }

  async findRolesByUserId(userId: string): Promise<Set<string>> {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: {
        userId: userId,
      },
      select: {
        roleId: true,
      },
    });

    const roleIds = userRoles.map((userRole) => userRole.roleId);

    const roles = await this.prisma.sysRole.findMany({
      where: {
        id: {
          in: roleIds,
        },
      },
      select: {
        code: true,
      },
    });

    return new Set(roles.map((role) => role.code));
  }
}
