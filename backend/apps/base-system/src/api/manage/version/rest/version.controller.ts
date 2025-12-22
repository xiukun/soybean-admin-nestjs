import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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

@ApiTags('Product Version Management')
@ApiJwtAuth()
@Controller('version')
export class VersionController {
  constructor(private readonly prisma: PrismaService) {}

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
      current: page,
      size: perPage,
    });
  }

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
      value: item.versionNum,
    }));

    return ApiRes.success(options);
  }

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
