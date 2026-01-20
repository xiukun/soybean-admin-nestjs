import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@ApiTags('Lowcode Designer - Tree')
@ApiJwtAuth()
@Controller('lowcode/designer')
export class LowcodeDesignerTreeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Lowcode designer menus tree and buttons list' })
  async tree(
    @Query('menuId') menuId?: string,
  ): Promise<
    ApiRes<{
      menusTree: any[];
      buttons: {
        id: string;
        code: string;
        description: string | null;
        menuId: number | null;
        status: string;
        order: number;
      }[];
    }>
  > {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        menuType: 'lowcode',
      },
      select: {
        id: true,
        pid: true,
        menuName: true,
        routeName: true,
        routePath: true,
        menuType: true,
        lowcodePageId: true,
        order: true,
      },
      orderBy: [{ pid: 'asc' }, { order: 'asc' }],
    });

    const menuMap = new Map<number, any>();
    const roots: any[] = [];

    for (const m of menus) {
      menuMap.set(m.id, {
        id: m.id,
        pid: m.pid,
        menuName: m.menuName,
        routeName: m.routeName,
        routePath: m.routePath,
        menuType: m.menuType,
        lowcodePageId: m.lowcodePageId,
        order: m.order,
        children: [],
      });
    }

    for (const node of menuMap.values()) {
      const parent = menuMap.get(node.pid);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    const mid = menuId ? Number(menuId) : undefined;

    const buttons = await this.prisma.sysButton.findMany({
      where: {
        menuId: mid ?? undefined,
      },
      select: {
        id: true,
        code: true,
        description: true,
        menuId: true,
        status: true,
        order: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    return ApiRes.success({ menusTree: roots, buttons });
  }

  @Get('buttons-tree')
  @ApiOperation({ summary: 'Buttons tree grouped by lowcode menu (for designer permission binding)' })
  async buttonsTree(): Promise<ApiRes<any[]>> {
    const lowcodeMenus = await this.prisma.sysMenu.findMany({
      where: { menuType: 'lowcode' },
      select: { id: true, menuName: true, routeName: true, order: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    const buttons = await this.prisma.sysButton.findMany({
      where: { status: 'ENABLED' },
      select: { id: true, code: true, description: true, menuId: true, order: true },
      orderBy: [{ menuId: 'asc' }, { order: 'asc' }],
    });

    type TreeNode = {
      menuId: number | string;
      menuName: string;
      menuType: string;
      routeName?: string;
      buttonId?: string;
      buttonCode?: string;
      children: TreeNode[];
    };

    const byMenu = new Map<number, TreeNode>();
    for (const m of lowcodeMenus) {
      byMenu.set(m.id, {
        menuId: m.id,
        menuName: m.menuName,
        menuType: 'lowcode',
        routeName: m.routeName,
        children: [],
      });
    }


    const globalNode: TreeNode = {
      menuId: 0,
      menuName: 'GLOBAL',
      menuType: 'global',
      children: [],
    };

    for (const b of buttons) {
      const node: TreeNode = {
        menuId: b.code,
        menuName: b.description || b.code,
        menuType: 'button',
        buttonId: b.id,
        buttonCode: b.code,
        children: [],
      };

      if (!b.menuId) {
        globalNode.children.push(node);
        continue;
      }

      const parent = byMenu.get(b.menuId);
      if (parent) parent.children.push(node);
      else globalNode.children.push(node);
    }

    const result = Array.from(byMenu.values()).filter((n) => n.children.length > 0);
    if (globalNode.children.length) result.unshift(globalNode);

    return ApiRes.success(result);
  }
}
