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

    // 获取现有菜单
    const existingMenu = await this.menuReadRepoPort.getMenuById(command.id);
    if (!existingMenu) {
      throw new BadRequestException(
        `Menu with id ${command.id} does not exist.`,
      );
    }

    // 如果明确提供了 lowcodePageId（包括 null），则使用新值；否则保留原有值
    // 注意：command.lowcodePageId 可能是 null（表示要清除关联），也可能是 undefined（表示不修改）
    const finalLowcodePageId = command.lowcodePageId !== undefined 
      ? command.lowcodePageId 
      : existingMenu.lowcodePageId;

    const menuUpdateProperties: MenuUpdateProperties = {
      id: command.id,
      buttons: null,
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
      lowcodePageId: finalLowcodePageId,
      updatedAt: new Date(),
      updatedBy: command.uid,
    };

    const menu = Menu.fromUpdate(menuUpdateProperties);
    await this.menuWriteRepository.update(menu);
  }
}
