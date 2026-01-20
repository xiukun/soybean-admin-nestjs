import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import {
  MenuProperties,
  MenuTreeProperties,
} from '@app/base-system/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { MenuReadRepoPort } from '@app/base-system/lib/bounded-contexts/iam/menu/ports/menu.read.repo-port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class MenuReadPostgresRepository implements MenuReadRepoPort {
  constructor(private prisma: PrismaService) {}

  private async attachButtons<T extends { id: number }>(
    menus: T[],
  ): Promise<(T & { buttons: { code: string; desc: string }[] })[]> {
    if (!menus.length) return [];

    const ids = menus.map((m) => m.id);
    const buttons = await this.prisma.sysButton.findMany({
      where: { menuId: { in: ids } },
      select: { menuId: true, code: true, description: true, order: true },
      orderBy: [{ menuId: 'asc' }, { order: 'asc' }],
    });

    const map = new Map<number, { code: string; desc: string }[]>();
    for (const b of buttons) {
      if (!b.menuId) continue;
      const arr = map.get(b.menuId) ?? [];
      arr.push({ code: b.code, desc: b.description ?? '' });
      map.set(b.menuId, arr);
    }

    return menus.map((m) => ({
      ...m,
      buttons: map.get(m.id) ?? [],
    }));
  }

  async getChildrenMenuCount(id: number): Promise<number> {
    return this.prisma.sysMenu.count({
      where: {
        pid: id,
      },
    });
  }

  async getMenuById(id: number): Promise<Readonly<MenuProperties> | null> {
    const menu = await this.prisma.sysMenu.findUnique({
      where: { id },
    });
    if (!menu) return null;

    const buttons = await this.prisma.sysButton.findMany({
      where: { menuId: id },
      select: { code: true, description: true },
      orderBy: { order: 'asc' },
    });

    return {
      ...menu,
      buttons: buttons.map((b) => ({ code: b.code, desc: b.description ?? '' })),
    } as any;
  }

  async getMenuByRouteName(routeName: string): Promise<Readonly<MenuProperties> | null> {
    const menu = await this.prisma.sysMenu.findUnique({
      where: { routeName },
    });
    if (!menu) return null;

    const buttons = await this.prisma.sysButton.findMany({
      where: { menuId: menu.id },
      select: { code: true, description: true },
      orderBy: { order: 'asc' },
    });

    return {
      ...menu,
      buttons: buttons.map((b) => ({ code: b.code, desc: b.description ?? '' })),
    } as any;
  }

  async findMenusByRoleCode(
    roleCode: string[],
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []> {
    const roles = await this.prisma.sysRole.findMany({
      where: {
        code: {
          in: roleCode,
        },
      },
      select: {
        id: true,
      },
    });

    const roleIds = roles.map((role) => role.id);

    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: { in: roleIds },
        domain: domain,
      },
      select: {
        menuId: true,
      },
    });

    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length > 0) {
      const menus = await this.prisma.sysMenu.findMany({
        where: {
          id: { in: menuIds },
          status: Status.ENABLED,
        },
      });
      return (await this.attachButtons(menus)) as any;
    }

    return [];
  }

  async findMenusByRoleId(
    roleId: string,
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []> {
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: roleId,
        domain: domain,
      },
      select: {
        menuId: true,
      },
    });

    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length > 0) {
      const menus = await this.prisma.sysMenu.findMany({
        where: {
          id: { in: menuIds },
          status: Status.ENABLED,
          constant: false,
        },
      });
      return (await this.attachButtons(menus)) as any;
    }

    return [];
  }

  async getConstantRoutes(): Promise<Readonly<MenuProperties[]> | []> {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        constant: true,
        status: Status.ENABLED,
      },
    });

    return (await this.attachButtons(menus)) as any;
  }

  async findAll(): Promise<MenuTreeProperties[] | []> {
    const menus = await this.prisma.sysMenu.findMany();
    return this.attachButtons(menus) as any;
  }

  async findAllConstantMenu(
    constant: boolean,
  ): Promise<MenuTreeProperties[] | []> {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        constant: constant,
      },
    });

    return this.attachButtons(menus) as any;
  }

  async findMenusByIds(ids: number[]): Promise<MenuProperties[]> {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return this.attachButtons(menus) as any;
  }

  async findMenuIdsByUserId(userId: string, domain: string): Promise<number[]> {
    const roleIds = await this.prisma.sysUserRole
      .findMany({
        where: {
          userId,
        },
        select: {
          roleId: true,
        },
      })
      .then((results) => results.map((item) => item.roleId));

    return this.prisma.sysRoleMenu
      .findMany({
        where: {
          roleId: {
            in: roleIds,
          },
          domain,
        },
        select: {
          menuId: true,
        },
      })
      .then((results) => results.map((item) => item.menuId));
  }
}
