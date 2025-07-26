import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '@lib/shared-auth';
import { EntityRelationService } from './entity-relation.service';
import {
  CreateEntityRelationDto,
  UpdateEntityRelationDto,
  QueryEntityRelationDto,
  EntityRelationGraphDto,
  ValidateRelationDto,
} from './dto/entity-relation.dto';

@ApiTags('实体关系管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entity-relations')
export class EntityRelationController {
  constructor(private readonly entityRelationService: EntityRelationService) {}

  @Post()
  @ApiOperation({ summary: '创建实体关系' })
  async create(
    @Body() createDto: CreateEntityRelationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取实体关系列表' })
  async findAll(
    @Query() query: QueryEntityRelationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.findAll(query, user);
  }

  @Get('graph')
  @ApiOperation({ summary: '获取实体关系图' })
  async getRelationGraph(
    @Query() query: EntityRelationGraphDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.getRelationGraph(query, user);
  }

  @Post('validate')
  @ApiOperation({ summary: '验证实体关系' })
  async validateRelation(
    @Body() validateDto: ValidateRelationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.validateRelation(validateDto);
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: '获取实体的所有关系' })
  async getRelationsByEntity(
    @Param('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.getRelationsByEntity(entityId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取实体关系详情' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新实体关系' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEntityRelationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除实体关系' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.remove(id, user);
  }

  @Post(':id/generate-code')
  @ApiOperation({ summary: '生成关系代码' })
  async generateRelationCode(
    @Param('id') id: string,
    @Body('framework') framework: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.entityRelationService.generateRelationCode(id, framework, user);
  }
}
