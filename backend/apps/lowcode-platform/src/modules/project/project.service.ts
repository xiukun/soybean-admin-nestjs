import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto, ProjectStatus, ProjectStatsDto, ProjectFramework, DatabaseType } from './dto/project.dto';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  // 模拟数据存储
  private projects: any[] = [
    {
      id: '1',
      name: 'E-commerce Platform',
      code: 'ecommerce',
      description: '电商平台低代码项目',
      type: 'WEB',
      status: 'ACTIVE',
      tags: ['电商', '前端'],
      config: {},
      createdBy: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'CRM System',
      code: 'crm',
      description: '客户关系管理系统',
      type: 'WEB',
      status: 'ACTIVE',
      tags: ['CRM', '管理系统'],
      config: {},
      createdBy: 'admin',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
  ];

  async create(createProjectDto: CreateProjectDto, user: AuthenticatedUser) {
    this.logger.log(`Creating project: ${createProjectDto.name} by user: ${user.username}`);

    // 检查项目代码是否已存在
    const existingProject = this.projects.find(p => p.code === createProjectDto.code);
    if (existingProject) {
      throw BusinessException.conflict('Project code already exists');
    }

    const project = {
      id: Date.now().toString(),
      ...createProjectDto,
      status: ProjectStatus.ACTIVE,
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.push(project);

    return {
      status: 200,
      msg: 'Project created successfully',
      data: project,
    };
  }

  async findAll(query: QueryProjectDto, user: AuthenticatedUser) {
    this.logger.log(`Fetching projects for user: ${user.username}`);

    let filteredProjects = [...this.projects];

    // 搜索过滤
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredProjects = filteredProjects.filter(
        p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.code.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (query.status) {
      filteredProjects = filteredProjects.filter(p => p.status === query.status);
    }

    // 类型过滤
    if (query.type) {
      filteredProjects = filteredProjects.filter(p => p.type === query.type);
    }

    // 分页
    const total = filteredProjects.length;
    const startIndex = (query.page - 1) * query.pageSize;
    const endIndex = startIndex + query.pageSize;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    return {
      status: 200,
      msg: 'Projects fetched successfully',
      data: {
        records: paginatedProjects,
        total,
        current: query.page,
        size: query.pageSize,
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    this.logger.log(`Fetching project: ${id} for user: ${user.username}`);

    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw BusinessException.notFound('Project', id);
    }

    return {
      status: 200,
      msg: 'Project fetched successfully',
      data: project,
    };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user: AuthenticatedUser) {
    this.logger.log(`Updating project: ${id} by user: ${user.username}`);

    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw BusinessException.notFound('Project', id);
    }

    // 如果更新代码，检查是否与其他项目冲突
    if (updateProjectDto.code) {
      const existingProject = this.projects.find(p => p.code === updateProjectDto.code && p.id !== id);
      if (existingProject) {
        throw BusinessException.conflict('Project code already exists');
      }
    }

    const updatedProject = {
      ...this.projects[projectIndex],
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    this.projects[projectIndex] = updatedProject;

    return {
      status: 200,
      msg: 'Project updated successfully',
      data: updatedProject,
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.logger.log(`Deleting project: ${id} by user: ${user.username}`);

    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw BusinessException.notFound('Project', id);
    }

    this.projects.splice(projectIndex, 1);

    return {
      status: 200,
      msg: 'Project deleted successfully',
      data: null,
    };
  }

  async getStatistics(id: string, user: AuthenticatedUser) {
    this.logger.log(`Fetching statistics for project: ${id}`);

    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw BusinessException.notFound('Project', id);
    }

    // 模拟统计数据
    const statistics = {
      entityCount: 5,
      templateCount: 8,
      generationCount: 12,
      lastGeneratedAt: new Date(),
      totalLines: 2500,
      fileCount: 25,
    };

    return {
      status: 200,
      msg: 'Statistics fetched successfully',
      data: statistics,
    };
  }

  async getGlobalStats(query: ProjectStatsDto, user: AuthenticatedUser) {
    this.logger.log(`Fetching global project statistics for user: ${user.username}`);

    const userProjects = this.projects.filter(p => p.createdBy === user.username);

    const stats = {
      overview: {
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === ProjectStatus.ACTIVE).length,
        archivedProjects: userProjects.filter(p => p.status === ProjectStatus.ARCHIVED).length,
        totalEntities: userProjects.length * 5, // 模拟数据
        totalGenerations: userProjects.length * 12,
      },
      byType: this.getStatsByField(userProjects, 'type'),
      byStatus: this.getStatsByField(userProjects, 'status'),
      byFramework: this.getStatsByField(userProjects, 'config.framework'),
      recentActivity: this.getRecentActivity(userProjects),
    };

    return {
      status: 200,
      msg: 'Global statistics fetched successfully',
      data: stats,
    };
  }

  async duplicateProject(id: string, name: string, user: AuthenticatedUser) {
    this.logger.log(`Duplicating project: ${id} as ${name} by user: ${user.username}`);

    const originalProject = this.projects.find(p => p.id === id);
    if (!originalProject) {
      throw BusinessException.notFound('Project', id);
    }

    const duplicatedProject = {
      ...originalProject,
      id: Date.now().toString(),
      name,
      code: `${originalProject.code}_copy_${Date.now()}`,
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.push(duplicatedProject);

    return {
      status: 200,
      msg: 'Project duplicated successfully',
      data: duplicatedProject,
    };
  }

  async archiveProject(id: string, user: AuthenticatedUser) {
    this.logger.log(`Archiving project: ${id} by user: ${user.username}`);

    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw BusinessException.notFound('Project', id);
    }

    this.projects[projectIndex].status = ProjectStatus.ARCHIVED;
    this.projects[projectIndex].updatedAt = new Date();

    return {
      status: 200,
      msg: 'Project archived successfully',
      data: this.projects[projectIndex],
    };
  }

  async restoreProject(id: string, user: AuthenticatedUser) {
    this.logger.log(`Restoring project: ${id} by user: ${user.username}`);

    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw BusinessException.notFound('Project', id);
    }

    this.projects[projectIndex].status = ProjectStatus.ACTIVE;
    this.projects[projectIndex].updatedAt = new Date();

    return {
      status: 200,
      msg: 'Project restored successfully',
      data: this.projects[projectIndex],
    };
  }

  async exportProject(id: string, user: AuthenticatedUser) {
    this.logger.log(`Exporting project: ${id} by user: ${user.username}`);

    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw BusinessException.notFound('Project', id);
    }

    // 模拟导出数据
    const exportData = {
      project,
      entities: [], // 实际应该从实体服务获取
      templates: [], // 实际应该从模板服务获取
      exportedAt: new Date(),
      version: '1.0.0',
    };

    return {
      status: 200,
      msg: 'Project exported successfully',
      data: exportData,
    };
  }

  async importProject(importData: any, user: AuthenticatedUser) {
    this.logger.log(`Importing project by user: ${user.username}`);

    const project = {
      ...importData.project,
      id: Date.now().toString(),
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.push(project);

    return {
      status: 200,
      msg: 'Project imported successfully',
      data: project,
    };
  }

  private getStatsByField(projects: any[], field: string): Record<string, number> {
    const stats: Record<string, number> = {};

    projects.forEach(project => {
      const value = this.getNestedValue(project, field) || 'Unknown';
      stats[value] = (stats[value] || 0) + 1;
    });

    return stats;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getRecentActivity(projects: any[]): any[] {
    return projects
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        name: project.name,
        action: 'updated',
        timestamp: project.updatedAt,
      }));
  }
}
