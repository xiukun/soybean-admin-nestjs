import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma, Status } from '@prisma/client';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import { DictCreateDto } from '../dto/dict.dto';
import { DictItemCreateDto } from '../dto/dict-item.dto';

@ApiTags('Dict - Module')
@ApiJwtAuth()
@Controller('dict')
export class DictController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List dictionaries' })
  async list(): Promise<ApiRes<any>> {
    const items = await this.prisma.sysDict.findMany({
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });
    return ApiRes.success(items);
  }

  @Get('options-all')
  @ApiOperation({ summary: 'List all dicts with item options (cache)' })
  async optionsAll(): Promise<ApiRes<any>> {
    const dicts = await this.prisma.sysDict.findMany({
      select: { id: true, name: true },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    const items = await this.prisma.sysDictItem.findMany({
      where: { status: Status.ENABLED },
      select: { dictId: true, label: true, dictValue: true },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    const map = new Map<string, any[]>();
    for (const it of items) {
      const arr = map.get(it.dictId) ?? [];
      arr.push({ label: it.label, dictValue: it.dictValue });
      map.set(it.dictId, arr);
    }

    const options = dicts.map(d => ({ id: d.id, name: d.name, options: map.get(d.id) ?? [] }));

    return ApiRes.success({ options });
  }

  @Get('names')
  @ApiOperation({ summary: 'List dictionary names for select' })
  async names(): Promise<ApiRes<any>> {
    const items = await this.prisma.sysDict.findMany({
      select: { id: true, name: true },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    return ApiRes.success({ options: items });
  }

  @Get('tree')
  @ApiOperation({ summary: 'List dictionaries as tree' })
  async tree(): Promise<ApiRes<any>> {
    const items = await this.prisma.sysDict.findMany({
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    const byPid = new Map<string, any[]>();
    for (const it of items) {
      const pid = (it as any).pid ?? '0';
      const arr = byPid.get(pid) ?? [];
      arr.push(it);
      byPid.set(pid, arr);
    }

    const build = (pid: string): any[] => {
      const arr = byPid.get(pid) ?? [];
      return arr.map(node => ({
        ...node,
        children: build((node as any).id)
      }));
    };

    return ApiRes.success(build('0'));
  }

  @Post()
  @ApiOperation({ summary: 'Create dictionary' })
  async create(
    @Body() dto: DictCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    const created = await this.prisma.sysDict.create({
      data: {
        name: dto.name,
        pid: dto.pid ?? '0',
        sequence: dto.sequence ?? 0,
        code: dto.code,
        status: dto.status ?? Status.ENABLED,
        remark: dto.remark ?? null,
        createdBy: req.user.uid,
      },
    });

    return ApiRes.success({ id: created.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dictionary' })
  async update(
    @Param('id') id: string,
    @Body() dto: DictCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    // prevent circular reference: pid cannot be self or descendant
    const targetPid = dto.pid ?? '0';
    if (targetPid === id) {
      return ApiRes.error(400, 'pid 不能为自身');
    }

    const all = await this.prisma.sysDict.findMany({
      select: { id: true, pid: true },
    });

    const childrenMap = new Map<string, string[]>();
    for (const n of all) {
      const pid = (n as any).pid ?? '0';
      const arr = childrenMap.get(pid) ?? [];
      arr.push(n.id);
      childrenMap.set(pid, arr);
    }

    const collectDescendants = (rootId: string, acc: Set<string>) => {
      const children = childrenMap.get(rootId) ?? [];
      for (const c of children) {
        if (!acc.has(c)) {
          acc.add(c);
          collectDescendants(c, acc);
        }
      }
    };

    const descendants = new Set<string>();
    collectDescendants(id, descendants);

    if (descendants.has(targetPid)) {
      return ApiRes.error(400, '禁止设置父节点为自身的子节点');
    }

    await this.prisma.sysDict.update({
      where: { id },
      data: {
        name: dto.name,
        pid: targetPid,
        sequence: dto.sequence ?? 0,
        code: dto.code,
        status: dto.status,
        remark: dto.remark ?? null,
        updatedBy: req.user.uid,
      },
    });

    return ApiRes.ok();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dictionary' })
  async remove(@Param('id') id: string): Promise<ApiRes<null>> {
    const childCount = await this.prisma.sysDict.count({ where: { pid: id } });
    if (childCount > 0) {
      return ApiRes.error(400, '请先删除子节点');
    }

    const itemCount = await this.prisma.sysDictItem.count({ where: { dictId: id } });
    if (itemCount > 0) {
      return ApiRes.error(400, '请先删除字典项');
    }

    await this.prisma.sysDict.delete({ where: { id } });
    return ApiRes.ok();
  }

  // ---------------- dict items ----------------

  @Get(':dictId/options')
  @ApiOperation({ summary: 'List dict item options for select' })
  async options(@Param('dictId') dictId: string): Promise<ApiRes<any>> {
    const items = await this.prisma.sysDictItem.findMany({
      where: { dictId, status: Status.ENABLED },
      select: { label: true, dictValue: true },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    return ApiRes.success({ options: items });
  }

  @Get(':dictId/items')
  @ApiOperation({ summary: 'List dict items' })
  async listItems(@Param('dictId') dictId: string): Promise<ApiRes<any>> {
    const items = await this.prisma.sysDictItem.findMany({
      where: { dictId },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    return ApiRes.success(items);
  }

  @Post(':dictId/items')
  @ApiOperation({ summary: 'Create dict item' })
  async createItem(
    @Param('dictId') dictId: string,
    @Body() dto: DictItemCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    try {
      const created = await this.prisma.sysDictItem.create({
        data: {
          dictId,
          label: dto.label,
          dictValue: dto.dictValue,
          sequence: dto.sequence ?? 0,
          status: dto.status ?? Status.ENABLED,
          remark: dto.remark ?? null,
          createdBy: req.user.uid,
        },
      });

      return ApiRes.success({ id: created.id });
    } catch (e: any) {
      // Unique constraint: (dictId, dictValue)
      if ((e as Prisma.PrismaClientKnownRequestError)?.code === 'P2002') {
        return ApiRes.error(400, 'dictValue 已存在');
      }
      throw e;
    }
  }

  @Put(':dictId/items/:itemId')
  @ApiOperation({ summary: 'Update dict item' })
  async updateItem(
    @Param('dictId') dictId: string,
    @Param('itemId') itemId: string,
    @Body() dto: DictItemCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    try {
      await this.prisma.sysDictItem.update({
        where: { id: itemId },
        data: {
          dictId,
          label: dto.label,
          dictValue: dto.dictValue,
          sequence: dto.sequence ?? 0,
          status: dto.status ?? Status.ENABLED,
          remark: dto.remark ?? null,
          updatedBy: req.user.uid,
        },
      });

      return ApiRes.ok();
    } catch (e: any) {
      if ((e as Prisma.PrismaClientKnownRequestError)?.code === 'P2002') {
        return ApiRes.error(400, 'dictValue 已存在');
      }
      throw e;
    }
  }

  @Delete(':dictId/items/:itemId')
  @ApiOperation({ summary: 'Delete dict item' })
  async removeItem(
    @Param('dictId') dictId: string,
    @Param('itemId') itemId: string,
  ): Promise<ApiRes<null>> {
    // dictId is kept in params to make it explicit this is a sub-resource
    await this.prisma.sysDictItem.delete({ where: { id: itemId } });
    return ApiRes.ok();
  }

  @Post(':dictId/items/batch-delete')
  @ApiOperation({ summary: 'Batch delete dict items' })
  async batchDeleteItems(
    @Param('dictId') dictId: string,
    @Body() body: { ids: string[] },
  ): Promise<ApiRes<null>> {
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return ApiRes.ok();
    }

    await this.prisma.sysDictItem.deleteMany({
      where: {
        dictId,
        id: { in: ids },
      },
    });

    return ApiRes.ok();
  }
}
