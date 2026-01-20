import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard } from '@lib/infra/casbin';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@UseGuards(AuthZGuard)
@ApiTags('Button - Module')
@ApiJwtAuth()
@Controller('button')
export class ButtonController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('list')
  @ApiOperation({ summary: 'Buttons list by menuId' })
  async list(@Query('menuId') menuId?: string): Promise<ApiRes<any[]>> {
    const id = menuId ? parseInt(menuId, 10) : undefined;

    const rows = await this.prisma.sysButton.findMany({
      where: {
        menuId: id ?? undefined,
      },
      select: {
        id: true,
        code: true,
        description: true,
        menuId: true,
        status: true,
        order: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    return ApiRes.success(rows);
  }

  @Post()
  @ApiOperation({ summary: 'Create button' })
  async create(
    @Body()
    dto: {
      code: string;
      description?: string | null;
      menuId?: number | null;
      status?: 'ENABLED' | 'DISABLED';
      order?: number;
    },
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    const code = (dto.code || '').trim();
    if (!code) throw new BadRequestException('buttonCode is required');

    const exists = await this.prisma.sysButton.findFirst({ where: { code } });
    if (exists) throw new BadRequestException('buttonCode already exists');

    const created = await this.prisma.sysButton.create({
      data: {
        code,
        description: dto.description ?? null,
        menuId: dto.menuId ?? null,
        status: dto.status ?? 'ENABLED',
        order: dto.order ?? 0,
        createdBy: req.user.uid,
      },
      select: { id: true },
    });

    return ApiRes.success({ id: created.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update button' })
  async update(
    @Param('id') id: string,
    @Body()
    dto: {
      description?: string | null;
      menuId?: number | null;
      status?: 'ENABLED' | 'DISABLED';
      order?: number;
    },
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.prisma.sysButton.update({
      where: { id },
      data: {
        description: dto.description ?? null,
        menuId: dto.menuId ?? null,
        status: dto.status,
        order: dto.order,
        updatedBy: req.user.uid,
      },
    });

    return ApiRes.ok();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete button' })
  async delete(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.prisma.sysButton.delete({ where: { id } });
    return ApiRes.ok();
  }

  @Get('tree')
  @ApiOperation({ summary: 'Buttons tree (grouped by menu)' })
  async tree(): Promise<ApiRes<any[]>> {
    type TreeNode = {
      id: string;
      key: string;
      label: string;
      children: TreeNode[];
    };

    const menus = await this.prisma.sysMenu.findMany({
      select: {
        id: true,
        menuName: true,
        i18nKey: true,
      },
      orderBy: { order: 'asc' },
    });

    const buttons = await this.prisma.sysButton.findMany({
      where: { status: 'ENABLED' },
      select: {
        id: true,
        code: true,
        description: true,
        menuId: true,
        order: true,
      },
      orderBy: [{ menuId: 'asc' }, { order: 'asc' }],
    });

    const menuMap = new Map<number, TreeNode>(
      menus.map((m) => [
        m.id,
        {
          id: `menu-${m.id}`,
          key: `menu-${m.id}`,
          label: m.i18nKey || m.menuName,
          children: [],
        } satisfies TreeNode,
      ]),
    );

    const root: TreeNode[] = [];

    // global group
    const globalNode: TreeNode = {
      id: 'global',
      key: 'global',
      label: 'GLOBAL',
      children: [],
    };

    for (const b of buttons) {
      const node: TreeNode = {
        id: b.id,
        key: b.id,
        label: `${b.description || b.code} (${b.code})`,
        children: [],
      };

      if (!b.menuId) {
        globalNode.children.push(node);
        continue;
      }

      const menuNode = menuMap.get(b.menuId);
      if (menuNode) {
        menuNode.children.push(node);
      } else {
        globalNode.children.push(node);
      }
    }

    // only push when has children
    if (globalNode.children.length) root.push(globalNode);
    for (const menuNode of menuMap.values()) {
      if (menuNode.children.length) root.push(menuNode);
    }

    return ApiRes.success(root);
  }

  @Get('auth-buttons/:roleId')
  @ApiOperation({ summary: 'Authorized buttons for role (ids)' })
  async authButtons(@Param('roleId') roleId: string, @Request() req: any): Promise<ApiRes<string[]>> {
    const domain = req.user.domain;

    const rows = await this.prisma.sysRoleButton.findMany({
      where: { roleId, domain },
      select: { buttonId: true },
    });

    return ApiRes.success(rows.map((r) => r.buttonId));
  }
}
