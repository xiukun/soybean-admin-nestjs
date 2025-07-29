import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { CreateEntityDto, UpdateEntityDto, EntityQueryDto } from '../dto/lowcode-entity.dto';

@ApiJwtAuth()
@ApiTags('Lowcode Entity Management')
@Controller('entities')
export class LowcodeEntityController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  async createEntity(@Body() dto: CreateEntityDto, @Req() req: any): Promise<ApiRes<any>> {
    try {
      const entity = await this.prisma.lowcodeEntity.create({
        data: {
          name: dto.name,
          code: dto.code,
          tableName: dto.tableName,
          projectId: dto.projectId,
          category: dto.category || 'business',
          description: dto.description,
          createdBy: req.user?.uid || '1',
          updatedBy: req.user?.uid || '1',
          status: 'ENABLED',
        },
      });

      return ApiRes.success(entity);
    } catch (error) {
      console.error('Create entity error:', error);
      return ApiRes.error(400, '创建实体失败');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get entities list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getEntities(@Query() query: EntityQueryDto): Promise<ApiRes<any>> {
    try {
      const { projectId, page = 1, pageSize = 10, search, category, status } = query;
      
      if (!projectId) {
        return ApiRes.error(400, '项目ID不能为空');
      }

      const where: any = { projectId };
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
          { tableName: { contains: search } },
        ];
      }
      
      if (category) {
        where.category = category;
      }
      
      if (status) {
        where.status = status;
      }

      const [entities, total] = await Promise.all([
        this.prisma.lowcodeEntity.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.lowcodeEntity.count({ where }),
      ]);

      return ApiRes.success({
        items: entities,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('Get entities error:', error);
      return ApiRes.error(500, '获取实体列表失败');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getEntityById(@Param('id') id: string): Promise<ApiRes<any>> {
    try {
      const entity = await this.prisma.lowcodeEntity.findUnique({
        where: { id },
      });

      if (!entity) {
        return ApiRes.error(404, '实体不存在');
      }

      return ApiRes.success(entity);
    } catch (error) {
      console.error('Get entity error:', error);
      return ApiRes.error(500, '获取实体失败');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  async updateEntity(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
    @Req() req: any,
  ): Promise<ApiRes<any>> {
    try {
      const entity = await this.prisma.lowcodeEntity.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.code && { code: dto.code }),
          ...(dto.tableName && { tableName: dto.tableName }),
          ...(dto.category && { category: dto.category }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.status && { status: dto.status as any }),
          updatedBy: req.user?.uid || '1',
          updatedAt: new Date(),
        },
      });

      return ApiRes.success(entity);
    } catch (error) {
      console.error('Update entity error:', error);
      return ApiRes.error(400, '更新实体失败');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  async deleteEntity(@Param('id') id: string): Promise<ApiRes<null>> {
    try {
      await this.prisma.lowcodeEntity.delete({
        where: { id },
      });

      return ApiRes.success(null);
    } catch (error) {
      console.error('Delete entity error:', error);
      return ApiRes.error(400, '删除实体失败');
    }
  }
}