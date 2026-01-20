import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  MenuReadRepoPortToken,
  MenuWriteRepoPortToken,
} from '@app/base-system/lib/bounded-contexts/iam/menu/constants';
import { MenuReadRepoPort } from '@app/base-system/lib/bounded-contexts/iam/menu/ports/menu.read.repo-port';
import { MenuWriteRepoPort } from '@app/base-system/lib/bounded-contexts/iam/menu/ports/menu.write.repo-port';

import { ROOT_ROUTE_PID } from '@lib/shared/prisma/db.constant';

import { MenuCreateCommand } from '../../commands/menu-create.command';
import { MenuUpdateCommand } from '../../commands/menu-update.command';
import { MenuProperties } from '../../domain/menu.read.model';
import { MenusByRoleCodeAndDomainQuery } from '../../queries/menus.by-role_code&domain.query';
import { MenuRoute, UserRoute } from '../dto/route.dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @Inject(MenuReadRepoPortToken)
    private readonly repository: MenuReadRepoPort,
    @Inject(MenuWriteRepoPortToken)
    private readonly menuWriteRepository: MenuWriteRepoPort,
  ) {}

  async createRoute(params: {
    dto: { [key: string]: any; buttons?: { code: string; desc: string }[] | null };
    uid: string;
  }): Promise<void> {
    await this.commandBus.execute(
      new MenuCreateCommand(
        params.dto.menuName,
        params.dto.menuType,
        params.dto.iconType,
        params.dto.icon,
        params.dto.routeName,
        params.dto.routePath,
        params.dto.component,
        params.dto.pathParam ?? null,
        params.dto.status,
        params.dto.activeMenu,
        params.dto.hideInMenu,
        params.dto.pid,
        params.dto.order,
        params.dto.i18nKey,
        params.dto.keepAlive,
        params.dto.constant,
        params.dto.href,
        params.dto.multiTab,
        null,
        params.uid,
      ),
    );

    const createdMenu = await this.repository.getMenuByRouteName(params.dto.routeName);
    if (!createdMenu) {
      throw new BadRequestException('Menu created but not found by routeName.');
    }

    if (params.dto.buttons) {
      await this.menuWriteRepository.upsertButtonsByMenuId({
        menuId: createdMenu.id,
        createdBy: params.uid,
        buttons: params.dto.buttons,
      });
    }
  }

  async updateRoute(params: {
    dto: { [key: string]: any; buttons?: { code: string; desc: string }[] | null };
    uid: string;
  }): Promise<void> {
    await this.commandBus.execute(
      new MenuUpdateCommand(
        params.dto.id,
        params.dto.menuName,
        params.dto.menuType,
        params.dto.iconType,
        params.dto.icon,
        params.dto.routeName,
        params.dto.routePath,
        params.dto.component,
        params.dto.pathParam ?? null,
        params.dto.status,
        params.dto.activeMenu,
        params.dto.hideInMenu,
        params.dto.pid,
        params.dto.order,
        params.dto.i18nKey,
        params.dto.keepAlive,
        params.dto.constant,
        params.dto.href,
        params.dto.multiTab,
        null,
        params.uid,
      ),
    );

    if (params.dto.buttons) {
      await this.menuWriteRepository.upsertButtonsByMenuId({
        menuId: params.dto.id,
        createdBy: params.uid,
        buttons: params.dto.buttons,
      });
    }
  }

  async getUserRoutes(roleCode: string[], domain: string): Promise<UserRoute> {
    const userRoutes = await this.queryBus.execute<
      MenusByRoleCodeAndDomainQuery,
      Readonly<MenuProperties[]> | []
    >(new MenusByRoleCodeAndDomainQuery(roleCode, domain));
    if (userRoutes.length > 0) {
      return {
        routes: buildMenuTree(userRoutes),
        home: 'home',
      };
    }
    return { home: '', routes: [] };
  }

  async getConstantRoutes(): Promise<MenuRoute[]> {
    const constantMenus = await this.repository.getConstantRoutes();

    return constantMenus.map((menu) => ({
      id: menu.id.toString(),
      name: menu.menuName,
      path: menu.routePath,
      component: menu.component,
      meta: {
        title: menu.menuName,
        i18nKey: menu.i18nKey,
        constant: menu.constant,
        hideInMenu: menu.hideInMenu,
        keepAlive: menu.keepAlive,
        icon: menu.icon,
        order: menu.order,
        href: menu.href,
        activeMenu: menu.activeMenu,
        multiTab: menu.multiTab,
        menuId: menu.id.toString(), // 添加菜单ID到meta中
      },
    }));
  }
}

function buildMenuTree(
  menus: ReadonlyArray<MenuProperties>,
  pid = ROOT_ROUTE_PID,
): MenuRoute[] {
  const menuMap = new Map<number, MenuProperties[]>();

  menus.forEach((menu) => {
    const list = menuMap.get(menu.pid) || [];
    list.push(menu);
    menuMap.set(menu.pid, list);
  });

  const children = menuMap.get(pid) || [];

  children.sort((a, b) => a.order - b.order);

  return children.map((menu) => ({
    id: menu.id.toString(),
    name: menu.routeName,
    path: menu.routePath,
    component: menu.component,
    meta: {
      title: menu.menuName,
      i18nKey: menu.i18nKey,
      keepAlive: menu.keepAlive,
      constant: menu.constant,
      icon: menu.icon,
      order: menu.order,
      href: menu.href,
      hideInMenu: menu.hideInMenu,
      activeMenu: menu.activeMenu,
      multiTab: menu.multiTab,
      menuId: menu.id.toString(), // 添加菜单ID到meta中
    },
    children: buildMenuTree(menus, menu.id),
  }));
}
