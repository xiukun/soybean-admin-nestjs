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
    const prismaData = {
      menuType: menuData.menuType,
      menuName: menuData.menuName,
      iconType: menuData.iconType,
      icon: menuData.icon,
      routeName: menuData.routeName,
      routePath: menuData.routePath,
      component: menuData.component,
      pathParam: menuData.pathParam,
      status: menuData.status,
      activeMenu: menuData.activeMenu,
      hideInMenu: menuData.hideInMenu,
      pid: menuData.pid,
      order: menuData.order,
      i18nKey: menuData.i18nKey,
      keepAlive: menuData.keepAlive,
      constant: menuData.constant,
      href: menuData.href,
      multiTab: menuData.multiTab,
      lowcodePageId: menuData.lowcodePageId, // 添加低代码页面ID字段
      createdAt: menuData.createdAt,
      createdBy: menuData.createdBy,
      updatedAt: new Date(),
    };

    await this.prisma.sysMenu.create({
      data: prismaData,
    });
  }

  async update(menu: Menu): Promise<void> {
    await this.prisma.sysMenu.update({
      where: { id: menu.id },
      data: { ...menu },
    });
  }
}
