import type { Entity, EntityRelationship, LayoutConfig, Point } from '../types';

/**
 * 布局持久化服务
 * 负责保存和恢复实体设计器的布局状态
 */
export class LayoutPersistenceService {
  private readonly STORAGE_KEY_PREFIX = 'entity-designer-layout';
  private readonly API_BASE_URL = '/proxy-lowcodeService/entity-layouts';

  /**
   * 保存布局到本地存储
   * @param projectId - 项目ID
   * @param layoutData - 布局数据
   */
  saveLayoutToLocal(projectId: string, layoutData: LayoutState): void {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}-${projectId}`;
      const data = {
        ...layoutData,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('布局已保存到本地存储:', key);
    } catch (error) {
      console.error('保存布局到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载布局
   * @param projectId - 项目ID
   * @returns 布局数据或null
   */
  loadLayoutFromLocal(projectId: string): LayoutState | null {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}-${projectId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const layoutState = JSON.parse(data) as LayoutState;
        console.log('从本地存储加载布局:', key);
        return layoutState;
      }
    } catch (error) {
      console.error('从本地存储加载布局失败:', error);
    }
    return null;
  }

  /**
   * 保存布局到服务器
   * @param projectId - 项目ID
   * @param layoutData - 布局数据
   * @returns Promise<boolean> 是否成功
   */
  async saveLayoutToServer(projectId: string, layoutData: LayoutState): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          layoutData: {
            ...layoutData,
            lastModified: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('布局已保存到服务器');
        return true;
      } else {
        console.error('保存布局到服务器失败:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('保存布局到服务器失败:', error);
      return false;
    }
  }

  /**
   * 从服务器加载布局
   * @param projectId - 项目ID
   * @returns Promise<LayoutState | null> 布局数据或null
   */
  async loadLayoutFromServer(projectId: string): Promise<LayoutState | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${projectId}`);
      
      if (response.ok) {
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('服务器返回的不是JSON格式数据，可能是HTML错误页面');
          return null;
        }
        
        const result = await response.json();
        console.log('从服务器加载布局成功');
        return result.data?.layoutData || null;
      } else if (response.status === 404) {
        console.log('服务器上没有找到布局数据');
        return null;
      } else {
        console.error('从服务器加载布局失败:', response.statusText);
        return null;
      }
    } catch (error) {
      // 特别处理JSON解析错误
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        console.error('从服务器加载布局失败: 服务器返回了非JSON格式的响应（可能是HTML错误页面）');
      } else {
        console.error('从服务器加载布局失败:', error);
      }
      return null;
    }
  }

  /**
   * 保存布局（优先服务器，失败时保存到本地）
   * @param projectId - 项目ID
   * @param entities - 实体数组
   * @param relationships - 关系数组
   * @param layoutConfig - 布局配置
   * @param viewport - 视口信息
   * @returns Promise<boolean> 是否成功
   */
  async saveLayout(
    projectId: string,
    entities: Entity[],
    relationships: EntityRelationship[],
    layoutConfig: LayoutConfig,
    viewport: { x: number; y: number; zoom: number }
  ): Promise<boolean> {
    const layoutData: LayoutState = {
      projectId,
      entities: entities.map(entity => ({
        id: entity.id,
        x: entity.x,
        y: entity.y,
        width: entity.width,
        height: entity.height,
        color: entity.color
      })),
      relationships: relationships.map(rel => ({
        id: rel.id,
        sourcePoint: rel.sourcePoint,
        targetPoint: rel.targetPoint,
        controlPoints: rel.controlPoints,
        style: {
          lineStyle: rel.lineStyle,
          lineColor: rel.lineColor,
          lineWidth: rel.lineWidth
        }
      })),
      viewport,
      layoutConfig,
      lastModified: new Date().toISOString()
    };

    // 先尝试保存到服务器
    const serverSuccess = await this.saveLayoutToServer(projectId, layoutData);
    
    // 无论服务器是否成功，都保存到本地作为备份
    this.saveLayoutToLocal(projectId, layoutData);
    
    return serverSuccess;
  }

  /**
   * 加载布局（优先服务器，失败时从本地加载）
   * @param projectId - 项目ID
   * @returns Promise<LayoutState | null> 布局数据或null
   */
  async loadLayout(projectId: string): Promise<LayoutState | null> {
    // 先尝试从服务器加载
    let layoutData = await this.loadLayoutFromServer(projectId);
    
    // 如果服务器加载失败，尝试从本地加载
    if (!layoutData) {
      layoutData = this.loadLayoutFromLocal(projectId);
    }
    
    return layoutData;
  }

  /**
   * 应用布局到实体数组
   * @param entities - 实体数组
   * @param layoutData - 布局数据
   * @returns 更新后的实体数组
   */
  applyLayoutToEntities(entities: Entity[], layoutData: LayoutState): Entity[] {
    const layoutMap = new Map(layoutData.entities.map(item => [item.id, item]));
    
    return entities.map(entity => {
      const layout = layoutMap.get(entity.id);
      if (layout) {
        return {
          ...entity,
          x: layout.x ?? entity.x,
          y: layout.y ?? entity.y,
          width: layout.width ?? entity.width,
          height: layout.height ?? entity.height,
          color: layout.color ?? entity.color
        };
      }
      return entity;
    });
  }

  /**
   * 应用布局到关系数组
   * @param relationships - 关系数组
   * @param layoutData - 布局数据
   * @returns 更新后的关系数组
   */
  applyLayoutToRelationships(relationships: EntityRelationship[], layoutData: LayoutState): EntityRelationship[] {
    const layoutMap = new Map(layoutData.relationships.map(item => [item.id, item]));
    
    return relationships.map(relationship => {
      const layout = layoutMap.get(relationship.id);
      if (layout) {
        return {
          ...relationship,
          sourcePoint: layout.sourcePoint ?? relationship.sourcePoint,
          targetPoint: layout.targetPoint ?? relationship.targetPoint,
          controlPoints: layout.controlPoints ?? relationship.controlPoints,
          lineStyle: (layout.style?.lineStyle as 'solid' | 'dashed' | 'dotted') ?? relationship.lineStyle,
          lineColor: layout.style?.lineColor ?? relationship.lineColor,
          lineWidth: layout.style?.lineWidth ?? relationship.lineWidth
        };
      }
      return relationship;
    });
  }

  /**
   * 清除本地布局数据
   * @param projectId - 项目ID
   */
  clearLocalLayout(projectId: string): void {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}-${projectId}`;
      localStorage.removeItem(key);
      console.log('已清除本地布局数据:', key);
    } catch (error) {
      console.error('清除本地布局数据失败:', error);
    }
  }

  /**
   * 删除服务器布局数据
   * @param projectId - 项目ID
   * @returns Promise<boolean> 是否成功
   */
  async deleteServerLayout(projectId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('已删除服务器布局数据');
        return true;
      } else {
        console.error('删除服务器布局数据失败:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('删除服务器布局数据失败:', error);
      return false;
    }
  }

  /**
   * 获取布局历史版本列表
   * @param projectId - 项目ID
   * @returns Promise<LayoutVersion[]> 版本列表
   */
  async getLayoutVersions(projectId: string): Promise<LayoutVersion[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${projectId}/versions`);
      
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      } else {
        console.error('获取布局版本失败:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('获取布局版本失败:', error);
      return [];
    }
  }

  /**
   * 恢复到指定版本
   * @param projectId - 项目ID
   * @param version - 版本号
   * @returns Promise<LayoutState | null> 布局数据或null
   */
  async restoreToVersion(projectId: string, version: number): Promise<LayoutState | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${projectId}/versions/${version}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`已恢复到版本 ${version}`);
        return result.data?.layoutData || null;
      } else {
        console.error('恢复版本失败:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('恢复版本失败:', error);
      return null;
    }
  }
}

// 布局状态接口
export interface LayoutState {
  projectId: string;
  entities: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
  }>;
  relationships: Array<{
    id: string;
    sourcePoint?: Point;
    targetPoint?: Point;
    controlPoints?: Point[];
    style?: {
      lineStyle: string;
      lineColor: string;
      lineWidth: number;
    };
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  layoutConfig: LayoutConfig;
  lastModified: string;
}

// 布局版本接口
export interface LayoutVersion {
  id: string;
  version: number;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

// 创建服务实例
export const layoutPersistenceService = new LayoutPersistenceService();