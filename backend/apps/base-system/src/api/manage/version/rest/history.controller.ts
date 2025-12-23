import {
  Body,
  Controller,
  Post,
  Request,
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

@ApiTags('Lowcode History Management')
@ApiJwtAuth()
@Controller('lowcode/history')
export class HistoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('list')
  @ApiOperation({ summary: 'Get lowcode page version history list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async list(@Body() query: HistoryListQueryDto): Promise<ApiRes<any>> {
    const pageNum = query.pageNum || 1;
    const pageSize = query.pageSize || 10;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    
    // 如果有mainId筛选（页面ID）
    if (query.mainId) {
      where.pageId = query.mainId;
    }
    
    // 如果有版本号筛选
    if (query.versionNum) {
      where.version = {
        contains: query.versionNum,
        mode: 'insensitive',
      };
    }
    
    // 如果有产品版本ID筛选
    if (query.productVersionId) {
      where.productVersionId = query.productVersionId;
    }

    const [items, total] = await Promise.all([
      this.prisma.sysLowcodePageVersion.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          page: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.sysLowcodePageVersion.count({ where }),
    ]);

    // 转换数据格式以匹配前端需求
    const options = await Promise.all(items.map(async (item: any) => {
      // 查询关联的菜单ID
      const menu = await this.prisma.sysMenu.findFirst({
        where: { lowcodePageId: item.pageId },
        select: { id: true }
      });
      
      // 查询创建者信息，将用户ID转换为用户名
      let creatorName = item.createdBy;
      if (item.createdBy !== 'system') {
        const user = await this.prisma.sysUser.findUnique({
          where: { id: item.createdBy },
          select: { username: true }
        });
        if (user) {
          creatorName = user.username;
        }
      }
      
      return {
        id: item.id,
        pageId: item.pageId,
        menuId: menu?.id,
        menuPage: item.page.title,
        pageVersion: item.version,
        createdAt: item.createdAt,
        creator: creatorName,
        changelog: item.changelog,
      };
    }));

    return ApiRes.success({
      options,
      total,
      current: pageNum,
      size: pageSize,
    });
  }

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
