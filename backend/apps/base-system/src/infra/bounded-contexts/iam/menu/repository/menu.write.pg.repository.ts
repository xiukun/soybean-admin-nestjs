import { Injectable } from '@nestjs/common';

import { Menu } from '@app/base-system/lib/bounded-contexts/iam/menu/domain/menu.model';
import { MenuWriteRepoPort } from '@app/base-system/lib/bounded-contexts/iam/menu/ports/menu.write.repo-port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class MenuWritePostgresRepository implements MenuWriteRepoPort {
  constructor(private prisma: PrismaService) {}

  async deleteById(id: number): Promise<void> {
    await this.prisma.sysMenu.delete({
      where: { id },
    });
  }

  async save(menu: Menu): Promise<void> {
    // Use destructuring to explicitly exclude id and any other problematic fields
    const { id, uid, ...menuData } = menu;

    // Ensure we have the correct field mapping for Prisma
    // Explicitly construct data object without id to prevent unique constraint violations
    const prismaData = {
      menuType: menuData.menuType,
      menuName: menuData.menuName,
      iconType: menuData.iconType,
      icon: menuData.icon,
      routeName: menuData.routeName,
      routePath: menuData.routePath,
      component: menuData.component,
      pathParam: menuData.pathParam ?? null,
      status: menuData.status,
      activeMenu: menuData.activeMenu ?? null,
      hideInMenu: menuData.hideInMenu ?? false,
      pid: menuData.pid,
      order: menuData.order,
      i18nKey: menuData.i18nKey ?? null,
      keepAlive: menuData.keepAlive ?? false,
      constant: menuData.constant,
      href: menuData.href ?? null,
      multiTab: menuData.multiTab ?? false,
      lowcodePageId: menuData.lowcodePageId ?? null,
      createdAt: menuData.createdAt,
      createdBy: menuData.createdBy,
      updatedAt: new Date(),
    };

    // Double-check: ensure id is never included
    if ('id' in prismaData) {
      delete (prismaData as any).id;
    }

    await this.prisma.sysMenu.create({
      data: prismaData,
    });
  }

  async upsertButtonsByMenuId(params: {
    menuId: number;
    createdBy: string;
    buttons: { code: string; desc: string }[];
  }): Promise<void> {
    // buttons are optional, keep consistent behavior
    const normalized = (params.buttons || [])
      .map((b) => ({
        code: (b.code || '').trim(),
        desc: (b.desc || '').trim(),
      }))
      .filter((b) => b.code.length > 0);

    // remove existing menu buttons which are not in new list
    const existing = await this.prisma.sysButton.findMany({
      where: { menuId: params.menuId },
      select: { id: true, code: true },
    });

    const nextCodes = new Set(normalized.map((b) => b.code));
    const toDeleteIds = existing.filter((b) => !nextCodes.has(b.code)).map((b) => b.id);

    const ops = [
      ...toDeleteIds.map((id) =>
        this.prisma.sysButton.deleteMany({
          where: { id, menuId: params.menuId },
        }),
      ),
      ...normalized.map((b, index) =>
        this.prisma.sysButton.upsert({
          where: { code: b.code },
          create: {
            code: b.code,
            description: b.desc || null,
            menuId: params.menuId,
            status: 'ENABLED',
            order: index,
            createdBy: params.createdBy,
          },
          update: {
            description: b.desc || null,
            menuId: params.menuId,
            order: index,
            updatedBy: params.createdBy,
          },
        }),
      ),
    ];

    await this.prisma.$transaction(ops);
  }

  async update(menu: Menu): Promise<void> {
    // Prisma update data 不允许包含主键 id；同时避免写入 undefined/非表字段
    const {
      id,
      buttons,
      createdAt,
      createdBy,
      updatedAt,
      ...rest
    } = menu as any;

    const prismaData: any = {
      menuType: rest.menuType,
      menuName: rest.menuName,
      iconType: rest.iconType,
      icon: rest.icon,
      routeName: rest.routeName,
      routePath: rest.routePath,
      component: rest.component,
      pathParam: rest.pathParam ?? null,
      status: rest.status,
      activeMenu: rest.activeMenu ?? null,
      hideInMenu: rest.hideInMenu,
      pid: rest.pid,
      order: rest.order,
      i18nKey: rest.i18nKey,
      keepAlive: rest.keepAlive,
      constant: rest.constant,
      href: rest.href ?? null,
      multiTab: rest.multiTab,
      lowcodePageId: rest.lowcodePageId ?? null,
      updatedAt: new Date(),
      updatedBy: rest.updatedBy,
    };

    await this.prisma.sysMenu.update({
      where: { id },
      data: prismaData,
    });

    // buttons 维护走 sys_button 表，不属于 sys_menu 字段
    if (Array.isArray(buttons)) {
      await this.upsertButtonsByMenuId({
        menuId: id,
        createdBy: rest.updatedBy || rest.uid || 'system',
        buttons,
      });
    }
  }
}
