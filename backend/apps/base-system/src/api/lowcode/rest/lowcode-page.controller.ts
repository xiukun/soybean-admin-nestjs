import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { LowcodePageService } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/application/lowcode-page.service';

import { JwtAuthGuard } from '@lib/infra/guard/jwt.auth.guard';
import { ApiRes } from '@lib/infra/rest/res.response';


import { CreateLowcodePageDto } from '../dto/create-lowcode-page.dto';
import { GetLowcodePagesDto } from '../dto/get-lowcode-pages.dto';
import { UpdateLowcodePageStatusDto } from '../dto/update-lowcode-page-status.dto';
import { UpdateLowcodePageDto } from '../dto/update-lowcode-page.dto';

@ApiTags('低代码页面管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lowcode/pages')
export class LowcodePageController {
  constructor(private readonly lowcodePageService: LowcodePageService) {}

  @Post()
  @ApiOperation({ summary: '创建低代码页面' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '页面编码已存在' })
  async create(@Body() createDto: CreateLowcodePageDto, @Req() req: Request) {
    const user = req.user as any;
    return this.lowcodePageService.create({
      ...createDto,
      createdBy: user.username,
    });
  }

  @Get()
  @ApiOperation({ summary: '获取低代码页面列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: GetLowcodePagesDto) {
    const result = await this.lowcodePageService.findAll(query);
    return ApiRes.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取低代码页面' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '页面不存在' })
  async findById(@Param('id') id: string) {
    const page = await this.lowcodePageService.findById(id);
    if (!page) {
      throw new Error('页面不存在');
    }
    return ApiRes.success(page);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '根据编码获取低代码页面' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '页面不存在' })
  async findByCode(@Param('code') code: string) {
    const page = await this.lowcodePageService.findByCode(code);
    if (!page) {
      throw new Error('页面不存在');
    }
    return ApiRes.success(page);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新低代码页面' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '页面不存在' })
  @ApiResponse({ status: 409, description: '页面编码已存在' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLowcodePageDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.lowcodePageService.update(id, {
      ...updateDto,
      updatedBy: user.username,
    });
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新低代码页面状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '页面不存在' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateLowcodePageStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.lowcodePageService.updateStatus(id, statusDto.status, user.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删���低代码页面' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '页面不存在' })
  async delete(@Param('id') id: string) {
    await this.lowcodePageService.delete(id);
  }
}