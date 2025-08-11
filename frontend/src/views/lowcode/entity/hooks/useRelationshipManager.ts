import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchAddRelationship,
  fetchDeleteRelationship,
  fetchGetAllRelationships,
  fetchUpdateRelationship
} from '@/service/api/lowcode-relationship';
import type { EntityRelationship } from '../types';

/** 关系管理Hook 提供关系数据的CRUD操作和状态管理 */
export function useRelationshipManager(projectId?: string) {
  const message = useMessage();

  // 响应式数据
  const relationships = ref<EntityRelationship[]>([]);
  const selectedRelationship = ref<EntityRelationship | null>(null);
  const loading = ref(false);
  const creating = ref(false);
  const updating = ref(false);
  const deleting = ref(false);

  // 计算属性
  const relationshipCount = computed(() => relationships.value.length);

  const relationshipsByType = computed(() => {
    const typeMap = new Map<string, EntityRelationship[]>();
    relationships.value.forEach(rel => {
      if (!typeMap.has(rel.type)) {
        typeMap.set(rel.type, []);
      }
      typeMap.get(rel.type)!.push(rel);
    });
    return typeMap;
  });

  const relationshipStats = computed(() => {
    const stats = {
      total: relationships.value.length,
      oneToOne: 0,
      oneToMany: 0,
      manyToMany: 0
    };

    relationships.value.forEach(rel => {
      switch (rel.type) {
        case 'ONE_TO_ONE':
          stats.oneToOne++;
          break;
        case 'ONE_TO_MANY':
          stats.oneToMany++;
          break;
        case 'MANY_TO_MANY':
          stats.manyToMany++;
          break;
      }
    });

    return stats;
  });

  // 方法

  /** 加载关系数据 */
  async function loadRelationships() {
    if (!projectId) {
      console.warn('项目ID未提供，无法加载关系数据');
      return;
    }

    try {
      loading.value = true;

      // 尝试从API加载关系数据
      try {
        const result = await fetchGetAllRelationships(projectId);
        relationships.value = result.data || [];
      } catch (apiError) {
        console.warn('API加载关系数据失败，使用测试数据:', apiError);

        // 如果API失败，使用测试数据
        relationships.value = [
          {
            id: 'rel-1',
            projectId,
            sourceEntityId: 'demo-entity-user',
            targetEntityId: 'demo-entity-role',
            type: 'MANY_TO_MANY',
            name: '用户角色关系',
            description: '用户与角色的多对多关系',
            sourceFieldName: 'user_id',
            targetFieldName: 'role_id',
            lineColor: '#1976d2',
            lineWidth: 2,
            lineStyle: 'solid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('加载关系数据失败:', error);
      message.error('加载关系数据失败');
    } finally {
      loading.value = false;
    }
  }

  /** 创建关系 */
  async function createRelationship(relationshipData: Partial<EntityRelationship>) {
    try {
      creating.value = true;
      const result = await fetchAddRelationship(relationshipData as any);

      if (result.data) {
        relationships.value.push(result.data);
        message.success('关系创建成功');
        return result.data;
      }
    } catch (error) {
      console.error('创建关系失败:', error);
      message.error('创建关系失败');
      throw error;
    } finally {
      creating.value = false;
    }
  }

  /** 更新关系 */
  async function updateRelationship(id: string, updates: Partial<EntityRelationship>) {
    try {
      updating.value = true;
      const result = await fetchUpdateRelationship(id, updates as any);

      if (result.data) {
        const index = relationships.value.findIndex(rel => rel.id === id);
        if (index !== -1) {
          relationships.value[index] = { ...relationships.value[index], ...updates };
        }

        // 更新选中的关系
        if (selectedRelationship.value?.id === id) {
          selectedRelationship.value = { ...selectedRelationship.value, ...updates };
        }

        message.success('关系更新成功');
        return result.data;
      }
    } catch (error) {
      console.error('更新关系失败:', error);
      message.error('更新关系失败');
      throw error;
    } finally {
      updating.value = false;
    }
  }

  /** 删除关系 */
  async function deleteRelationship(id: string) {
    try {
      deleting.value = true;
      await fetchDeleteRelationship(id);

      // 从列表中移除
      const index = relationships.value.findIndex(rel => rel.id === id);
      if (index !== -1) {
        relationships.value.splice(index, 1);
      }

      // 清除选中状态
      if (selectedRelationship.value?.id === id) {
        selectedRelationship.value = null;
      }

      message.success('关系删除成功');
    } catch (error) {
      console.error('删除关系失败:', error);
      message.error('删除关系失败');
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  /** 选择关系 */
  function selectRelationship(relationship: EntityRelationship | null) {
    selectedRelationship.value = relationship;
  }

  /** 根据实体ID获取相关关系 */
  function getRelationshipsByEntity(entityId: string) {
    return relationships.value.filter(rel => rel.sourceEntityId === entityId || rel.targetEntityId === entityId);
  }

  /** 检查两个实体间是否存在关系 */
  function hasRelationship(sourceEntityId: string, targetEntityId: string) {
    return relationships.value.some(
      rel =>
        (rel.sourceEntityId === sourceEntityId && rel.targetEntityId === targetEntityId) ||
        (rel.sourceEntityId === targetEntityId && rel.targetEntityId === sourceEntityId)
    );
  }

  /** 获取两个实体间的关系 */
  function getRelationshipBetween(sourceEntityId: string, targetEntityId: string) {
    return relationships.value.find(
      rel =>
        (rel.sourceEntityId === sourceEntityId && rel.targetEntityId === targetEntityId) ||
        (rel.sourceEntityId === targetEntityId && rel.targetEntityId === sourceEntityId)
    );
  }

  /** 刷新关系数据 */
  async function refreshRelationships() {
    await loadRelationships();
  }

  return {
    // 响应式数据
    relationships,
    selectedRelationship,
    loading,
    creating,
    updating,
    deleting,

    // 计算属性
    relationshipCount,
    relationshipsByType,
    relationshipStats,

    // 方法
    loadRelationships,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    selectRelationship,
    getRelationshipsByEntity,
    hasRelationship,
    getRelationshipBetween,
    refreshRelationships
  };
}
