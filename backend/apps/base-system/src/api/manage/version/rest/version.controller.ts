import {
  Body,
  Controller,
  Get,
  Post,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Status } from '@prisma/client';

import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import {
  CreateVersionDto,
  UpdateVersionDto,
  EnableVersionDto,
  VersionListQueryDto,
} from '../dto/version.dto';

/**
 * 产品版本管理控制器
 * 提供产品版本的创建、查询、更新、启用等操作
 */
@ApiTags('Product Version Management')
@ApiJwtAuth()
@Controller('version')
export class VersionController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取产品版本列表（分页查询）
   * 支持按版本号进行筛选，采用分页查询
   * @param query - 查询参数，包含分页和筛选条件
   * @returns 分页结果，包含版本列表、总数、当前页、每页数量
   */
  @Post('list')
  @ApiOperation({ summary: 'Get product version list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async list(@Body() query: VersionListQueryDto): Promise<ApiRes<any>> {
    const page = query.page || 1;
    const perPage = query.perPage || 10;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.versionNum) {
      where.versionNum = {
        contains: query.versionNum,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.sysProductVersion.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysProductVersion.count({ where }),
    ]);

    return ApiRes.success({
      options: items,
      total,
      pageNum: page,
      pageSize: perPage,
    });
  }

  /**
   * 获取产品版本列表（下拉选择用）
   * 返回格式化的下拉选项数据
   * @returns 版本选项列表，格式为 [{ label, value }]
   */
  @Get('list')
  @ApiOperation({ summary: 'Get product version list for select' })
  @ApiResponse({ status: 200, description: 'Success' })
  async listForSelect(): Promise<ApiRes<any>> {
    const items = await this.prisma.sysProductVersion.findMany({
      select: {
        id: true,
        versionNum: true,
        versionName: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const options = items.map((item: any) => ({
      label: `${item.versionName} (${item.versionNum})`,
      value: item.id,
    }));

    return ApiRes.success(options);
  }

  /**
   * 创建新产品版本
   * @param dto - 版本创建数据
   * @param req - 请求对象，包含用户信息
   * @returns 创建的版本ID
   */
  @Post('create')
  @ApiOperation({ summary: 'Create a new product version' })
  @ApiResponse({
    status: 201,
    description: 'The product version has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(
    @Body() dto: CreateVersionDto,
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    const version = await this.prisma.sysProductVersion.create({
      data: {
        versionName: dto.versionName,
        versionNum: dto.versionNum,
        description: dto.description || null,
        status: Status.DISABLED,
        createdBy: req.user.uid,
      },
    });

    return ApiRes.success({ id: version.id });
  }

  /**
   * 更新产品版本信息
   * @param dto - 版本更新数据
   * @param req - 请求对象，包含用户信息
   * @returns 操作结果
   */
  @Post('update')
  @ApiOperation({ summary: 'Update product version' })
  @ApiResponse({
    status: 200,
    description: 'The product version has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async update(
    @Body() dto: UpdateVersionDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.prisma.sysProductVersion.update({
      where: { id: dto.id },
      data: {
        versionName: dto.versionName,
        versionNum: dto.versionNum,
        description: dto.description || null,
        updatedBy: req.user.uid,
      },
    });

    return ApiRes.ok();
  }

  /**
   * 启用指定的产品版本
   * 启用操作会自动禁用其他所有版本，确保同一时间只有一个启用的版本
   * @param dto - 启用参数，包含版本ID
   * @param req - 请求对象，包含用户信息
   * @returns 操作结果
   */
  @Post('enable')
  @ApiOperation({ summary: 'Enable product version' })
  @ApiResponse({
    status: 200,
    description: 'The product version has been successfully enabled.',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async enable(
    @Body() dto: EnableVersionDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    // 先禁用所有版本
    await this.prisma.sysProductVersion.updateMany({
      where: { status: Status.ENABLED },
      data: {
        status: Status.DISABLED,
        updatedBy: req.user.uid,
      },
    });

    // 启用指定版本
    await this.prisma.sysProductVersion.update({
      where: { id: dto.id },
      data: {
        status: Status.ENABLED,
        updatedBy: req.user.uid,
      },
    });

    return ApiRes.ok();
  }
}
