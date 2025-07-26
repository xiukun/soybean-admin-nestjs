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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto, ProjectStatsDto } from './dto/project.dto';

@ApiTags('项目管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.create(createProjectDto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  async findAll(
    @Query() query: QueryProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.update(id, updateProjectDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.remove(id, user);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: '获取项目统计信息' })
  async getStatistics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.getStatistics(id, user);
  }

  @Get('stats/global')
  @ApiOperation({ summary: '获取全局项目统计' })
  async getGlobalStats(
    @Query() query: ProjectStatsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.getGlobalStats(query, user);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '复制项目' })
  async duplicateProject(
    @Param('id') id: string,
    @Body('name') name: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.duplicateProject(id, name, user);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: '归档项目' })
  async archiveProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.archiveProject(id, user);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: '恢复项目' })
  async restoreProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.restoreProject(id, user);
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出项目' })
  async exportProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.exportProject(id, user);
  }

  @Post('import')
  @ApiOperation({ summary: '导入项目' })
  async importProject(
    @Body() importData: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectService.importProject(importData, user);
  }
}
