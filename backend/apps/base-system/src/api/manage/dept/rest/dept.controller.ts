import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma, Status } from '@prisma/client';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import { DeptCreateDto } from '../dto/dept.dto';

@ApiTags('Dept - Module')
@ApiJwtAuth()
@Controller('dept')
export class DeptController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List departments' })
  async list(@Query('keyword') keyword?: string): Promise<ApiRes<any>> {
    const where: any = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { code: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await (this.prisma as any).sysDept.findMany({
      where,
      orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    return ApiRes.success(items);
  }

  @Get('tree')
  @ApiOperation({ summary: 'List departments as tree' })
  async tree(): Promise<ApiRes<any>> {
    const items = await (this.prisma as any).sysDept.findMany({
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
      return arr.map((node) => ({
        ...node,
        children: build((node as any).id),
      }));
    };

    return ApiRes.success(build('0'));
  }

  @Post()
  @ApiOperation({ summary: 'Create department' })
  async create(@Body() dto: DeptCreateDto, @Request() req: any): Promise<ApiRes<{ id: string }>> {
    const pid = dto.pid ?? '0';

    try {
      await this.validateDeptCode(pid, dto.code);
    } catch (e: any) {
      return ApiRes.error(400, e?.message || '部门编码校验失败');
    }

    const created = await (this.prisma as any).sysDept.create({
      data: {
        name: dto.name,
        code: dto.code,
        pid,
        sequence: dto.sequence ?? 0,
        status: dto.status ?? Status.ENABLED,
        remark: dto.remark ?? null,
        createdBy: req.user.uid,
      },
    });

    return ApiRes.success({ id: created.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update department' })
  async update(
    @Param('id') id: string,
    @Body() dto: DeptCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const pid = dto.pid ?? '0';

    // prevent circular reference: pid cannot be self or descendant
    if (pid === id) {
      return ApiRes.error(400, 'pid 不能为自身');
    }

    try {
      await this.validateDeptCode(pid, dto.code, id);
    } catch (e: any) {
      return ApiRes.error(400, e?.message || '部门编码校验失败');
    }

    // circular reference check
    const all = await (this.prisma as any).sysDept.findMany({ select: { id: true, pid: true } });
    const childrenMap = new Map<string, string[]>();
    for (const n of all) {
      const p = (n as any).pid ?? '0';
      const arr = childrenMap.get(p) ?? [];
      arr.push(n.id);
      childrenMap.set(p, arr);
    }

    const descendants = new Set<string>();
    const collect = (rootId: string) => {
      const children = childrenMap.get(rootId) ?? [];
      for (const c of children) {
        if (!descendants.has(c)) {
          descendants.add(c);
          collect(c);
        }
      }
    };
    collect(id);

    if (descendants.has(pid)) {
      return ApiRes.error(400, 'pid 不能为子节点');
    }

    await (this.prisma as any).sysDept.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        pid,
        sequence: dto.sequence ?? 0,
        status: dto.status ?? Status.ENABLED,
        remark: dto.remark ?? null,
        updatedBy: req.user.uid,
      },
    });

    return ApiRes.success(null);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  async delete(@Param('id') id: string): Promise<ApiRes<null>> {
    const childCount = await (this.prisma as any).sysDept.count({ where: { pid: id } });
    if (childCount > 0) {
      return ApiRes.error(400, '存在子部门，禁止删除');
    }

    const userBindCount = await (this.prisma as any).sysUserDept.count({ where: { deptId: id } });
    if (userBindCount > 0) {
      return ApiRes.error(400, '部门已关联用户，禁止删除');
    }

    await (this.prisma as any).sysDept.delete({ where: { id } });
    return ApiRes.success(null);
  }

  private async validateDeptCode(pid: string, code: string, excludeId?: string): Promise<void> {
    // unique check
    const existed = await (this.prisma as any).sysDept.findFirst({
      where: {
        code,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existed) {
      throw new Error('部门编码已存在');
    }

    if (pid !== '0') {
      const parent = await (this.prisma as any).sysDept.findUnique({ where: { id: pid }, select: { code: true } });
      if (!parent) {
        throw new Error('父部门不存在');
      }

      const prefix = `${parent.code}-`;
      if (!code.startsWith(prefix)) {
        throw new Error('部门编码不符合层级规则');
      }
    }
  }
}
