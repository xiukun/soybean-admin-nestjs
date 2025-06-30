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

import { LowcodeModelService } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/application/lowcode-model.service';

import { JwtAuthGuard } from '@lib/infra/guard/jwt.auth.guard';
import { ApiRes } from '@lib/infra/rest/res.response';


import { CreateLowcodeModelDto } from '../dto/create-lowcode-model.dto';
import { GetLowcodeModelsDto } from '../dto/get-lowcode-models.dto';
import { UpdateLowcodeModelStatusDto } from '../dto/update-lowcode-model-status.dto';
import { UpdateLowcodeModelDto } from '../dto/update-lowcode-model.dto';

@ApiTags('低代码模型管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lowcode/models')
export class LowcodeModelController {
  constructor(private readonly lowcodeModelService: LowcodeModelService) {}

  @Post()
  @ApiOperation({ summary: '创建低代码模型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '模型编码已存在' })
  async create(@Body() createDto: CreateLowcodeModelDto, @Req() req: Request) {
    const user = req.user as any;
    return this.lowcodeModelService.create({
      ...createDto,
      createdBy: user.username,
      properties: createDto.properties?.map(prop => ({
        ...prop,
        createdBy: user.username,
      })),
      references: createDto.references?.map(ref => ({
        ...ref,
        createdBy: user.username,
      })),
    });
  }

  @Get()
  @ApiOperation({ summary: '获取低代码模型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: GetLowcodeModelsDto) {
    const result = await this.lowcodeModelService.findAll(query);
    return ApiRes.success(result);
  }

  @Get('with-relations')
  @ApiOperation({ summary: '获取低代码模型列表（包含关联数据）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAllWithRelations(@Query() query: GetLowcodeModelsDto) {
    const result = await this.lowcodeModelService.findAll({ ...query, withRelations: true });
    return ApiRes.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取低代码模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async findById(@Param('id') id: string) {
    const model = await this.lowcodeModelService.findById(id);
    if (!model) {
      throw new Error('模型不存在');
    }
    return ApiRes.success(model);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '根据编码获取低代码模型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async findByCode(@Param('code') code: string) {
    const model = await this.lowcodeModelService.findByCode(code);
    if (!model) {
      throw new Error('模型不存在');
    }
    return ApiRes.success(model);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新低代码模型' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  @ApiResponse({ status: 409, description: '模型编码已存在' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLowcodeModelDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.lowcodeModelService.update(id, {
      ...updateDto,
      updatedBy: user.username,
    });
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新低代码模型状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateLowcodeModelStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.lowcodeModelService.updateStatus(id, statusDto.status, user.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除低代码模型' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  async delete(@Param('id') id: string) {
    await this.lowcodeModelService.delete(id);
  }
}