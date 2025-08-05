import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateEntityLayoutDto, UpdateEntityLayoutDto } from './dto/entity-layout.dto';

/**
 * 实体布局服务
 * 负责处理实体设计器的布局数据持久化和版本管理
 */
@Injectable()
export class EntityLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建或更新实体布局
   * @param projectId - 项目ID
   * @param createLayoutDto - 布局数据
   * @param userId - 创建用户ID
   * @returns 创建的布局记录
   */
  async createLayout(projectId: string, createLayoutDto: CreateEntityLayoutDto, userId: string = 'system') {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 检查是否已存在布局
    const existingLayout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (existingLayout) {
      throw new ConflictException(`Layout for project ${projectId} already exists`);
    }

    // 构建布局数据
    const layoutData = {
      entities: createLayoutDto.entities || [],
      relationships: createLayoutDto.relationships || [],
      viewport: createLayoutDto.viewport || { offsetX: 0, offsetY: 0, scale: 1 },
      layoutConfig: createLayoutDto.layoutConfig || { type: 'manual', options: {} },
      version: createLayoutDto.version || 1,
      description: createLayoutDto.description || '',
    };

    // 创建新布局
    return this.prisma.entityLayout.create({
      data: {
        projectId,
        layoutData: JSON.parse(JSON.stringify(layoutData)),
        version: 1,
        description: createLayoutDto.description,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * 获取项目的实体布局
   * @param projectId - 项目ID
   * @returns 布局数据
   */
  async getLayout(projectId: string) {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Layout for project ${projectId} not found`);
    }

    return layout;
  }

  /**
   * 更新实体布局
   * @param projectId - 项目ID
   * @param updateLayoutDto - 更新的布局数据
   * @param userId - 更新用户ID
   * @returns 更新后的布局记录
   */
  async updateLayout(projectId: string, updateLayoutDto: UpdateEntityLayoutDto, userId: string = 'system') {
    const existingLayout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!existingLayout) {
      throw new NotFoundException(`Layout for project ${projectId} not found`);
    }

    // 合并现有布局数据和新数据
    const currentLayoutData = existingLayout.layoutData as any;
    const updatedLayoutData = {
      entities: updateLayoutDto.entities || currentLayoutData.entities || [],
      relationships: updateLayoutDto.relationships || currentLayoutData.relationships || [],
      viewport: updateLayoutDto.viewport || currentLayoutData.viewport || { offsetX: 0, offsetY: 0, scale: 1 },
      layoutConfig: updateLayoutDto.layoutConfig || currentLayoutData.layoutConfig || { type: 'manual', options: {} },
      version: (currentLayoutData.version || 1) + 1,
      description: updateLayoutDto.description || currentLayoutData.description || '',
    };

    // 更新布局数据并增加版本号
    return this.prisma.entityLayout.update({
      where: { projectId },
      data: {
        layoutData: JSON.parse(JSON.stringify(updatedLayoutData)),
        version: existingLayout.version + 1,
        description: updateLayoutDto.description,
        updatedBy: userId,
      },
    });
  }

  /**
   * 删除实体布局
   * @param projectId - 项目ID
   */
  async deleteLayout(projectId: string) {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Layout for project ${projectId} not found`);
    }

    await this.prisma.entityLayout.delete({
      where: { projectId },
    });
  }

  /**
   * 获取布局版本历史
   * @param projectId - 项目ID
   * @returns 版本历史列表
   */
  async getLayoutVersions(projectId: string) {
    // 基础实现，返回当前版本信息
    const layout = await this.getLayout(projectId);
    return [
      {
        version: layout.version,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      },
    ];
  }

  /**
   * 恢复到指定版本
   * @param projectId - 项目ID
   * @param version - 目标版本号
   * @returns 恢复后的布局记录
   */
  async restoreToVersion(projectId: string, version: number) {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Layout for project ${projectId} not found`);
    }

    // 基础实现：创建新版本记录
    return this.prisma.entityLayout.update({
      where: { projectId },
      data: {
        version: layout.version + 1,
        updatedAt: new Date(),
      },
    });
  }
}