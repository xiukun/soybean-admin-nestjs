import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  CreateEntityLayoutDto,
  UpdateEntityLayoutDto,
  EntityLayoutResponseDto,
  LayoutVersionDto,
} from '../dto/entity-layout.dto';

/**
 * 实体布局服务
 * 负责处理实体设计器的布局数据持久化和版本管理
 */
@Injectable()
export class EntityLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建新的实体布局
   * @param createLayoutDto - 创建布局的数据传输对象
   * @returns Promise<EntityLayoutResponseDto> 创建的布局信息
   */
  async createLayout(createLayoutDto: CreateEntityLayoutDto): Promise<EntityLayoutResponseDto> {
    try {
      // 检查项目是否已有布局
      const existingLayout = await this.prisma.entityLayout.findUnique({
        where: { projectId: createLayoutDto.projectId },
      });

      if (existingLayout) {
        throw new ConflictException(`Layout for project ${createLayoutDto.projectId} already exists`);
      }

      // 创建新布局
      const layoutData = {
        entities: createLayoutDto.entities || [],
        relationships: createLayoutDto.relationships || [],
        viewport: createLayoutDto.viewport || { x: 0, y: 0, zoom: 1 },
        layoutConfig: createLayoutDto.layoutConfig || { type: 'manual', options: {} },
        version: createLayoutDto.version || 1,
        description: createLayoutDto.description || '',
      };

      const layout = await this.prisma.entityLayout.create({
        data: {
          projectId: createLayoutDto.projectId,
          layoutData: JSON.parse(JSON.stringify(layoutData)),
          version: createLayoutDto.version || 1,
          description: createLayoutDto.description,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      return this.mapToResponseDto(layout);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create layout: ${error.message}`);
    }
  }

  /**
   * 根据项目ID获取实体布局
   * @param projectId - 项目ID
   * @returns Promise<EntityLayoutResponseDto> 布局信息
   */
  async getLayout(projectId: string): Promise<EntityLayoutResponseDto> {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Entity layout not found for project: ${projectId}`);
    }

    return this.mapToResponseDto(layout);
  }

  /**
   * 更新实体布局
   * @param projectId - 项目ID
   * @param updateLayoutDto - 更新布局的数据传输对象
   * @returns Promise<EntityLayoutResponseDto> 更新后的布局信息
   */
  /**
   * 更新或创建实体布局（Upsert操作）
   * @param projectId - 项目ID
   * @param updateLayoutDto - 更新布局的数据传输对象
   * @returns Promise<EntityLayoutResponseDto> 更新或创建后的布局信息
   */
  async updateLayout(
    projectId: string,
    updateLayoutDto: UpdateEntityLayoutDto,
  ): Promise<EntityLayoutResponseDto> {
    // 查找现有布局
    const existingLayout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!existingLayout) {
      // 如果布局不存在，创建新的布局
      const layoutData = {
        entities: updateLayoutDto.entities || [],
        relationships: updateLayoutDto.relationships || [],
        viewport: updateLayoutDto.viewport || { x: 0, y: 0, zoom: 1 },
        layoutConfig: updateLayoutDto.layoutConfig || { type: 'manual', options: {} },
        version: 1,
        description: updateLayoutDto.description || '',
        lastModified: new Date().toISOString(),
      };

      const newLayout = await this.prisma.entityLayout.create({
        data: {
          projectId,
          layoutData: JSON.parse(JSON.stringify(layoutData)),
          version: 1,
          description: updateLayoutDto.description,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      return this.mapToResponseDto(newLayout);
    }

    // 如果布局存在，更新现有布局
    const currentLayoutData = existingLayout.layoutData as any;
    const newLayoutData = {
      entities: updateLayoutDto.entities || currentLayoutData.entities,
      relationships: updateLayoutDto.relationships || currentLayoutData.relationships,
      viewport: updateLayoutDto.viewport || currentLayoutData.viewport,
      layoutConfig: updateLayoutDto.layoutConfig || currentLayoutData.layoutConfig,
      version: (currentLayoutData.version || 1) + 1,
      description: updateLayoutDto.description || currentLayoutData.description,
      lastModified: new Date().toISOString(),
    };

    // 更新布局
    const updatedLayout = await this.prisma.entityLayout.update({
      where: { projectId },
      data: {
        layoutData: JSON.parse(JSON.stringify(newLayoutData)),
        version: newLayoutData.version,
        description: updateLayoutDto.description,
        updatedBy: 'system',
      },
    });

    return this.mapToResponseDto(updatedLayout);
  }

  /**
   * 删除实体布局
   * @param projectId - 项目ID
   * @returns Promise<void>
   */
  async deleteLayout(projectId: string): Promise<void> {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Entity layout not found for project: ${projectId}`);
    }

    await this.prisma.entityLayout.delete({
      where: { projectId },
    });
  }

  /**
   * 获取布局版本历史
   * @param projectId - 项目ID
   * @returns Promise<LayoutVersionDto[]> 版本历史列表
   */
  async getLayoutVersions(projectId: string): Promise<LayoutVersionDto[]> {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Entity layout not found for project: ${projectId}`);
    }

    // 目前只返回当前版本，后续可以扩展为真正的版本历史
    const layoutData = layout.layoutData as any;
    return [
      {
        version: layoutData.version || 1,
        createdAt: layout.updatedAt,
        description: layoutData.description || 'Current version',
      },
    ];
  }

  /**
   * 恢复到指定版本
   * @param projectId - 项目ID
   * @param version - 目标版本号
   * @returns Promise<EntityLayoutResponseDto> 恢复后的布局信息
   */
  async restoreToVersion(projectId: string, version: number): Promise<EntityLayoutResponseDto> {
    const layout = await this.prisma.entityLayout.findUnique({
      where: { projectId },
    });

    if (!layout) {
      throw new NotFoundException(`Entity layout not found for project: ${projectId}`);
    }

    // 目前只是基础实现，后续可以扩展为真正的版本管理
    // 当前实现：创建一个新版本作为"恢复"操作
    const currentLayoutData = layout.layoutData as any;
    const newLayoutData = {
      ...currentLayoutData,
      version: (currentLayoutData.version || 1) + 1,
      description: `Restored from version ${version}`,
      lastModified: new Date().toISOString(),
    };

    const updatedLayout = await this.prisma.entityLayout.update({
      where: { projectId },
      data: {
        layoutData: JSON.parse(JSON.stringify(newLayoutData)),
        version: newLayoutData.version,
        description: `Restored from version ${version}`,
        updatedBy: 'system',
      },
    });

    return this.mapToResponseDto(updatedLayout);
  }

  /**
   * 将数据库实体映射为响应DTO
   * @param layout - 数据库布局实体
   * @returns EntityLayoutResponseDto
   */
  private mapToResponseDto(layout: any): EntityLayoutResponseDto {
    return {
      id: layout.id,
      projectId: layout.projectId,
      layoutData: layout.layoutData as any,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    };
  }
}