import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import {
  HistoryListQueryDto,
  DeleteHistoryDto,
  BatchDeleteHistoryDto,
} from '../dto/history.dto';

/**
 * 低代码页面版本历史管理控制器
 * 提供低代码页面版本的列表查询、删除等操作
 */
@ApiTags('Lowcode History Management')
@ApiJwtAuth()
@Controller('lowcode/history')
export class HistoryController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取低代码页面版本历史列表
   * 支持按页面ID、产品版本ID、版本号进行筛选，采用分页查询
   * @param query - 查询参数，包含分页和筛选条件
   * @returns 分页结果，包含版本列表、总数、当前页、每页数量
   */
  @Post('list')
  @ApiOperation({ summary: 'Get lowcode page version history list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async list(@Body() query: HistoryListQueryDto): Promise<ApiRes<any>> {
    const page = query.page || 1;
    const perPage = query.perPage || 10;
    const skip = (page - 1) * perPage;

    const where: any = {};
    
    // 如果有mainId筛选（页面ID）
    if (query.mainId) {
      where.pageId = query.mainId;
    }
    
    // todo 版本号筛选 调整为 产品版本ID筛选
    if (query.versionNum) {
      where.productVersionId = {
        contains: query.versionNum,
        mode: 'insensitive',
      };
    }
    
    if (query.productVersionId) {
      where.productVersionId = query.productVersionId;
    }

    const [items, total] = await Promise.all([
      this.prisma.sysLowcodePageVersion.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          page: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          productVersion: {
            select: {
              id: true,
              versionNum: true,
            },
          },
        },
      }),
      this.prisma.sysLowcodePageVersion.count({ where }),
    ]);

    const pageIds = items.map(item => item.pageId);
    const creatorIds = items
      .filter(item => item.createdBy !== 'system')
      .map(item => item.createdBy);

    const [menus, users] = await Promise.all([
      this.prisma.sysMenu.findMany({
        where: { lowcodePageId: { in: pageIds } },
        select: { id: true, lowcodePageId: true },
      }),
      creatorIds.length > 0
        ? this.prisma.sysUser.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, username: true },
          })
        : Promise.resolve([]),
    ]);

    const menuMap = new Map(menus.map(m => [m.lowcodePageId, m.id]));
    const userMap = new Map(users.map(u => [u.id, u.username]));

    const options = items.map(item => ({
      id: item.id,
      pageId: item.pageId,
      menuId: menuMap.get(item.pageId),
      menuPage: item.page.title,
      productVersion: item.productVersion
        ? { id: item.productVersion.id, versionNum: item.productVersion.versionNum }
        : null,
      pageVersion: item.version,
      createdAt: item.createdAt,
      creator: item.createdBy === 'system' ? 'system' : userMap.get(item.createdBy) || item.createdBy,
      changelog: item.changelog,
    }));

    return ApiRes.success({
      options,
      total,
      pageNum: page,
      pageSize: perPage,
    });
  }

  /**
   * 删除单个低代码页面版本
   * @param dto - 删除参数，包含版本ID
   * @returns 操作结果
   */
  @Post('delete')
  @ApiOperation({ summary: 'Delete a lowcode page version' })
  @ApiResponse({
    status: 200,
    description: 'The version has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async delete(@Body() dto: DeleteHistoryDto): Promise<ApiRes<null>> {
    await this.prisma.sysLowcodePageVersion.delete({
      where: { id: dto.id },
    });

    return ApiRes.ok();
  }

  /**
   * 批量删除低代码页面版本
   * @param dto - 批量删除参数，包含版本ID数组
   * @returns 操作结果
   */
  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete lowcode page versions' })
  @ApiResponse({
    status: 200,
    description: 'The versions have been successfully deleted.',
  })
  async batchDelete(@Body() dto: BatchDeleteHistoryDto): Promise<ApiRes<null>> {
    await this.prisma.sysLowcodePageVersion.deleteMany({
      where: {
        id: {
          in: dto.ids,
        },
      },
    });

    return ApiRes.ok();
  }
}
