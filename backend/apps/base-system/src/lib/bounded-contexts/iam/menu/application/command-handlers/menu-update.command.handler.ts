import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ROOT_ROUTE_PID } from '@lib/shared/prisma/db.constant';

import { MenuUpdateCommand } from '../../commands/menu-update.command';
import { MenuReadRepoPortToken, MenuWriteRepoPortToken } from '../../constants';
import { Menu } from '../../domain/menu.model';
import { MenuUpdateProperties } from '../../domain/menu.read.model';
import { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenuWriteRepoPort } from '../../ports/menu.write.repo-port';

@CommandHandler(MenuUpdateCommand)
export class MenuUpdateHandler
  implements ICommandHandler<MenuUpdateCommand, void>
{
  @Inject(MenuWriteRepoPortToken)
  private readonly menuWriteRepository: MenuWriteRepoPort;
  @Inject(MenuReadRepoPortToken)
  private readonly menuReadRepoPort: MenuReadRepoPort;

  async execute(command: MenuUpdateCommand) {
    if (command.pid === command.id) {
      throw new BadRequestException(
        `The parent menu identifier '${command.pid}' cannot be the same as its own identifier.`,
      );
    }

    if (command.pid !== ROOT_ROUTE_PID) {
      const parentMenu = await this.menuReadRepoPort.getMenuById(command.pid);

      if (!parentMenu) {
        throw new BadRequestException(
          `Parent menu with code ${command.pid} does not exist.`,
        );
      }
    }

    // 获取现有菜单以保留原有的 lowcodePageId
    const existingMenu = await this.menuReadRepoPort.getMenuById(command.id);
    if (!existingMenu) {
      throw new BadRequestException(
        `Menu with id ${command.id} does not exist.`,
      );
    }

    const menuUpdateProperties: MenuUpdateProperties = {
      id: command.id,
      menuName: command.menuName,
      menuType: command.menuType,
      routeName: command.routeName,
      routePath: command.routePath,
      component: command.component,
      status: command.status,
      pid: command.pid,
      order: command.order,
      constant: command.constant,
      iconType: command.iconType,
      icon: command.icon,
      pathParam: command.pathParam,
      activeMenu: command.activeMenu,
      hideInMenu: command.hideInMenu,
      i18nKey: command.i18nKey,
      keepAlive: command.keepAlive,
      href: command.href,
      multiTab: command.multiTab,
      lowcodePageId: existingMenu.lowcodePageId, // 保留原有的 lowcodePageId，不允许修改
      updatedAt: new Date(),
      updatedBy: command.uid,
    };

    const menu = Menu.fromUpdate(menuUpdateProperties);
    await this.menuWriteRepository.update(menu);
  }
}
