<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ConnectionPoint, Entity, EntityRelationship, Point } from '../types';

/** 关系连线组件 负责绘制实体间的关系连线，支持多种线条样式和交互 */

interface Props {
  /** 关系数组 */
  relationships: EntityRelationship[];
  /** 实体数组 */
  entities: Entity[];
  /** 视口信息 */
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  /** 选中的关系 */
  selectedRelationship?: EntityRelationship | null;
  /** 是否显示标签 */
  showLabels?: boolean;
  /** 是否显示类型标签 */
  showTypeLabels?: boolean;
  /** 是否显示连接点 */
  showConnectionPoints?: boolean;
  /** 是否为编辑模式 */
  editMode?: boolean;
  /** 临时连线 */
  tempLine?: {
    path: string;
    sourcePoint: Point;
    targetPoint: Point;
  } | null;
}

interface Emits {
  (e: 'relationship-select', relationship: EntityRelationship | null): void;
  (e: 'relationship-hover', relationship: EntityRelationship | null): void;
  (e: 'connection-point-select', point: ConnectionPoint): void;
  (e: 'control-point-drag', relationship: EntityRelationship, pointIndex: number, newPosition: Point): void;
  (e: 'control-point-add', relationship: EntityRelationship, position: Point): void;
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: true,
  showTypeLabels: false,
  showConnectionPoints: false,
  editMode: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const hoveredRelationship = ref<EntityRelationship | null>(null);
const dragState = ref<{
  isDragging: boolean;
  relationship: EntityRelationship | null;
  pointIndex: number;
  startPosition: Point;
} | null>(null);

// 计算属性
const viewBox = computed(() => {
  if (props.entities.length === 0) {
    return '0 0 1000 800';
  }

  // 计算所有实体的边界
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  props.entities.forEach(entity => {
    const x = entity.x ?? 0;
    const y = entity.y ?? 0;
    const width = entity.width ?? 200;
    const height = entity.height ?? 120;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // 添加边距
  const padding = 100;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  return `${minX} ${minY} ${width} ${height}`;
});

const visibleRelationships = computed(() => {
  // 简单实现：返回所有关系，后续可以添加视口裁剪优化
  return props.relationships;
});

const connectionPoints = computed(() => {
  if (!props.showConnectionPoints) return [];

  const points: ConnectionPoint[] = [];
  props.entities.forEach(entity => {
    points.push(...calculateConnectionPoints(entity));
  });
  return points;
});

// 方法

/**
 * 计算实体的连接点
 *
 * @param entity - 实体对象
 * @returns 连接点数组
 */
function calculateConnectionPoints(entity: Entity): ConnectionPoint[] {
  // 确保实体有有效的位置和尺寸信息
  const x = entity.x ?? 0;
  const y = entity.y ?? 0;
  const width = entity.width ?? 200;
  const height = entity.height ?? 120;

  const points: ConnectionPoint[] = [];

  // 每边显示3个连接点，提供更多连接选择
  const pointsPerSide = 3;

  for (let i = 0; i < pointsPerSide; i++) {
    const offset = (i + 1) / (pointsPerSide + 1); // 均匀分布

    // 顶边连接点 - 确保精确对齐到边界
    points.push({
      id: `${entity.id}-top-${i}`,
      entityId: entity.id,
      position: 'top',
      offset,
      point: { x: Math.round(x + width * offset), y }
    });

    // 右边连接点 - 确保精确对齐到边界
    points.push({
      id: `${entity.id}-right-${i}`,
      entityId: entity.id,
      position: 'right',
      offset,
      point: { x: x + width, y: Math.round(y + height * offset) }
    });

    // 底边连接点 - 确保精确对齐到边界
    points.push({
      id: `${entity.id}-bottom-${i}`,
      entityId: entity.id,
      position: 'bottom',
      offset,
      point: { x: Math.round(x + width * offset), y: y + height }
    });

    // 左边连接点 - 确保精确对齐到边界
    points.push({
      id: `${entity.id}-left-${i}`,
      entityId: entity.id,
      position: 'left',
      offset,
      point: { x, y: Math.round(y + height * offset) }
    });
  }

  return points;
}

/**
 * 计算连线路径
 *
 * @param relationship - 关系对象
 * @returns SVG 路径字符串
 */
function getLinePath(relationship: EntityRelationship): string {
  const sourceEntity = props.entities.find(e => e.id === relationship.sourceEntityId);
  const targetEntity = props.entities.find(e => e.id === relationship.targetEntityId);

  if (!sourceEntity || !targetEntity) {
    return '';
  }

  // 计算最优连接点
  const { source: sourcePoint, target: targetPoint } = findOptimalConnectionPoints(
    sourceEntity,
    targetEntity,
    relationship
  );

  const controlPoints = relationship.controlPoints || [];

  if (controlPoints.length === 0) {
    // 智能路径：避免直线穿过其他实体
    const path = calculateSmartPath(sourcePoint, targetPoint, sourceEntity, targetEntity);
    return path;
  }

  // 贝塞尔曲线连接
  let path = `M ${sourcePoint.x} ${sourcePoint.y}`;

  if (controlPoints.length === 1) {
    // 二次贝塞尔曲线
    const cp = controlPoints[0];
    path += ` Q ${cp.x} ${cp.y} ${targetPoint.x} ${targetPoint.y}`;
  } else {
    // 多段连接
    controlPoints.forEach((cp: Point, index: number) => {
      if (index === controlPoints.length - 1) {
        path += ` Q ${cp.x} ${cp.y} ${targetPoint.x} ${targetPoint.y}`;
      } else {
        path += ` L ${cp.x} ${cp.y}`;
      }
    });
  }

  return path;
}

/**
 * 找到两个实体间的最优连接点
 *
 * @param sourceEntity - 源实体
 * @param targetEntity - 目标实体
 * @param currentRelationship - 当前关系（用于避免重叠）
 * @returns 最优连接点对
 */
function findOptimalConnectionPoints(
  sourceEntity: Entity,
  targetEntity: Entity,
  currentRelationship?: EntityRelationship
): { source: Point; target: Point } {
  // 确保实体有有效的位置和尺寸信息
  const sourceX = sourceEntity.x ?? 0;
  const sourceY = sourceEntity.y ?? 0;
  const sourceWidth = sourceEntity.width ?? 200;
  const sourceHeight = sourceEntity.height ?? 120;

  const targetX = targetEntity.x ?? 0;
  const targetY = targetEntity.y ?? 0;
  const targetWidth = targetEntity.width ?? 200;
  const targetHeight = targetEntity.height ?? 120;

  const sourceCenter = {
    x: sourceX + sourceWidth / 2,
    y: sourceY + sourceHeight / 2
  };

  const targetCenter = {
    x: targetX + targetWidth / 2,
    y: targetY + targetHeight / 2
  };

  // 计算连接方向
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // 查找同一对实体间的所有关系，包括当前关系
  const sameEntityRelationships = props.relationships.filter(
    rel =>
      (rel.sourceEntityId === sourceEntity.id && rel.targetEntityId === targetEntity.id) ||
      (rel.sourceEntityId === targetEntity.id && rel.targetEntityId === sourceEntity.id)
  );

  // 按关系ID排序，确保连接点分配的一致性
  sameEntityRelationships.sort((a, b) => a.id.localeCompare(b.id));

  // 计算当前关系在同组关系中的索引
  const relationshipIndex = currentRelationship
    ? sameEntityRelationships.findIndex(rel => rel.id === currentRelationship.id)
    : 0;
  const totalRelationships = sameEntityRelationships.length;

  // 优化多条关系线的分布策略
  let sourcePoint: Point = { x: sourceX + sourceWidth / 2, y: sourceY + sourceHeight / 2 };
  let targetPoint: Point = { x: targetX + targetWidth / 2, y: targetY + targetHeight / 2 };

  // 根据实体相对位置确定主要连接方向
  const isHorizontal = Math.abs(dx) > Math.abs(dy);

  if (isHorizontal) {
    // 水平连接 - 优先使用左右两边
    const isRightConnection = dx > 0;

    if (totalRelationships === 1) {
      // 单条关系线，使用中心点
      sourcePoint = {
        x: isRightConnection ? sourceX + sourceWidth : sourceX,
        y: sourceY + sourceHeight * 0.5
      };
      targetPoint = {
        x: isRightConnection ? targetX : targetX + targetWidth,
        y: targetY + targetHeight * 0.5
      };
    } else {
      // 多条关系线，分散到不同边
      const sideIndex = relationshipIndex % 4; // 循环使用四个边

      switch (sideIndex) {
        case 0: // 主要连接方向
          sourcePoint = {
            x: isRightConnection ? sourceX + sourceWidth : sourceX,
            y: sourceY + sourceHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          targetPoint = {
            x: isRightConnection ? targetX : targetX + targetWidth,
            y: targetY + targetHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          break;
        case 1: // 顶部
          sourcePoint = {
            x: sourceX + sourceWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: sourceY
          };
          targetPoint = {
            x: targetX + targetWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: targetY + targetHeight
          };
          break;
        case 2: // 次要连接方向
          sourcePoint = {
            x: isRightConnection ? sourceX : sourceX + sourceWidth,
            y: sourceY + sourceHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          targetPoint = {
            x: isRightConnection ? targetX + targetWidth : targetX,
            y: targetY + targetHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          break;
        case 3: // 底部
          sourcePoint = {
            x: sourceX + sourceWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: sourceY + sourceHeight
          };
          targetPoint = {
            x: targetX + targetWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: targetY
          };
          break;
      }
    }
  } else {
    // 垂直连接 - 优先使用上下两边
    const isBottomConnection = dy > 0;

    if (totalRelationships === 1) {
      // 单条关系线，使用中心点
      sourcePoint = {
        x: sourceX + sourceWidth * 0.5,
        y: isBottomConnection ? sourceY + sourceHeight : sourceY
      };
      targetPoint = {
        x: targetX + targetWidth * 0.5,
        y: isBottomConnection ? targetY : targetY + targetHeight
      };
    } else {
      // 多条关系线，分散到不同边
      const sideIndex = relationshipIndex % 4; // 循环使用四个边

      switch (sideIndex) {
        case 0: // 主要连接方向
          sourcePoint = {
            x: sourceX + sourceWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: isBottomConnection ? sourceY + sourceHeight : sourceY
          };
          targetPoint = {
            x: targetX + targetWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: isBottomConnection ? targetY : targetY + targetHeight
          };
          break;
        case 1: // 右边
          sourcePoint = {
            x: sourceX + sourceWidth,
            y: sourceY + sourceHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          targetPoint = {
            x: targetX,
            y: targetY + targetHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          break;
        case 2: // 次要连接方向
          sourcePoint = {
            x: sourceX + sourceWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: isBottomConnection ? sourceY : sourceY + sourceHeight
          };
          targetPoint = {
            x: targetX + targetWidth * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1))),
            y: isBottomConnection ? targetY + targetHeight : targetY
          };
          break;
        case 3: // 左边
          sourcePoint = {
            x: sourceX,
            y: sourceY + sourceHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          targetPoint = {
            x: targetX + targetWidth,
            y: targetY + targetHeight * (0.3 + 0.4 * (relationshipIndex / Math.max(1, totalRelationships - 1)))
          };
          break;
      }
    }
  }

  // 连接点计算已在上面的逻辑中完成

  return { source: sourcePoint, target: targetPoint };
}

/**
 * 获取线条样式
 *
 * @param style - 线条样式类型
 * @returns stroke-dasharray 值
 */
function getStrokeDashArray(style: string): string {
  switch (style) {
    case 'dashed':
      return '10,5';
    case 'dotted':
      return '2,3';
    default:
      return 'none';
  }
}

/**
 * 获取箭头标记
 *
 * @param type - 关系类型
 * @returns 标记 ID
 */
function getMarkerEnd(type: string): string {
  switch (type) {
    case 'ONE_TO_ONE':
      return 'url(#arrow-one-to-one)';
    case 'ONE_TO_MANY':
      return 'url(#arrow-one-to-many)';
    case 'MANY_TO_MANY':
      return 'url(#arrow-many-to-many)';
    default:
      return 'url(#arrow-default)';
  }
}

/**
 * 获取标签位置
 *
 * @param relationship - 关系对象
 * @returns 标签位置
 */
function getLabelPosition(relationship: EntityRelationship): Point {
  if (relationship.labelPosition) {
    return relationship.labelPosition;
  }

  const sourceEntity = props.entities.find(e => e.id === relationship.sourceEntityId);
  const targetEntity = props.entities.find(e => e.id === relationship.targetEntityId);

  if (!sourceEntity || !targetEntity) {
    return { x: 0, y: 0 };
  }

  const { source: sourcePoint, target: targetPoint } = findOptimalConnectionPoints(
    sourceEntity,
    targetEntity,
    relationship
  );
  const midPoint = {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2
  };

  const offset = getRelationshipLabelOffset(relationship);

  return {
    x: midPoint.x + offset.x,
    y: midPoint.y + offset.y
  };
}

/**
 * 获取类型标签位置
 *
 * @param relationship - 关系对象
 * @returns 类型标签位置
 */
function getTypePosition(relationship: EntityRelationship): Point {
  const sourceEntity = props.entities.find(e => e.id === relationship.sourceEntityId);
  const targetEntity = props.entities.find(e => e.id === relationship.targetEntityId);

  if (!sourceEntity || !targetEntity) {
    return { x: 0, y: 0 };
  }

  const { source: sourcePoint, target: targetPoint } = findOptimalConnectionPoints(
    sourceEntity,
    targetEntity,
    relationship
  );
  const midPoint = {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2
  };

  const offset = getRelationshipLabelOffset(relationship);

  return {
    x: midPoint.x + offset.x,
    y: midPoint.y + offset.y + 25 // 在关系名称标签下方
  };
}

/**
 * 计算智能路径，避免直线穿过其他实体
 *
 * @param sourcePoint - 起点
 * @param targetPoint - 终点
 * @param sourceEntity - 源实体
 * @param targetEntity - 目标实体
 * @returns SVG 路径字符串
 */
function calculateSmartPath(
  sourcePoint: Point,
  targetPoint: Point,
  sourceEntity: Entity,
  targetEntity: Entity
): string {
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;

  // 如果距离较短，使用直线
  if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
    return `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`;
  }

  // 使用L型路径，避免重叠
  const midX = sourcePoint.x + dx * 0.5;
  const midY = sourcePoint.y + dy * 0.5;

  // 根据实体相对位置选择路径类型
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平优先的L型路径
    return `M ${sourcePoint.x} ${sourcePoint.y} L ${midX} ${sourcePoint.y} L ${midX} ${targetPoint.y} L ${targetPoint.x} ${targetPoint.y}`;
  }
  // 垂直优先的L型路径
  return `M ${sourcePoint.x} ${sourcePoint.y} L ${sourcePoint.x} ${midY} L ${targetPoint.x} ${midY} L ${targetPoint.x} ${targetPoint.y}`;
}

/**
 * 计算关系标签偏移，避免重叠
 *
 * @param relationship - 关系对象
 * @returns 偏移量
 */
function getRelationshipLabelOffset(relationship: EntityRelationship): Point {
  // 根据关系ID生成一个稳定的偏移量，避免标签重叠
  const hash = relationship.id.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const offsetX = (hash % 40) - 20; // -20 到 20 的偏移
  const offsetY = ((hash >> 8) % 30) - 15; // -15 到 15 的偏移

  return { x: offsetX, y: offsetY };
}

/**
 * 获取中点位置
 *
 * @param relationship - 关系对象
 * @returns 中点位置
 */
function getMidPoint(relationship: EntityRelationship): Point {
  const sourceEntity = props.entities.find(e => e.id === relationship.sourceEntityId);
  const targetEntity = props.entities.find(e => e.id === relationship.targetEntityId);

  if (!sourceEntity || !targetEntity) {
    return { x: 0, y: 0 };
  }

  const { source: sourcePoint, target: targetPoint } = findOptimalConnectionPoints(
    sourceEntity,
    targetEntity,
    relationship
  );

  return {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2
  };
}

/**
 * 获取控制点
 *
 * @param relationship - 关系对象
 * @returns 控制点数组
 */
function getControlPoints(relationship: EntityRelationship): Point[] {
  return relationship.controlPoints || [];
}

/**
 * 获取类型标签文本
 *
 * @param type - 关系类型
 * @returns 类型标签
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'ONE_TO_ONE':
      return '1:1';
    case 'ONE_TO_MANY':
      return '1:N';
    case 'MANY_TO_MANY':
      return 'N:N';
    default:
      return '';
  }
}

// 事件处理

/**
 * 选择关系
 *
 * @param relationship - 关系对象
 * @param event - 鼠标事件
 */
function selectRelationship(relationship: EntityRelationship, event: MouseEvent) {
  event.stopPropagation();
  emit('relationship-select', relationship);
}

/**
 * 处理连线悬停
 *
 * @param relationship - 关系对象
 * @param isHover - 是否悬停
 */
function handleLineHover(relationship: EntityRelationship, isHover: boolean) {
  hoveredRelationship.value = isHover ? relationship : null;
  emit('relationship-hover', isHover ? relationship : null);
}

/**
 * 处理画布点击
 *
 * @param event - 鼠标事件
 */
function handleCanvasClick(event: MouseEvent) {
  // 点击空白区域取消选择
  if (event.target === event.currentTarget) {
    emit('relationship-select', null);
  }
}

/**
 * 高亮连接点
 *
 * @param point - 连接点
 */
function highlightConnectionPoint(point: ConnectionPoint) {
  // 可以添加视觉反馈
}

/**
 * 取消高亮连接点
 *
 * @param point - 连接点
 */
function unhighlightConnectionPoint(point: ConnectionPoint) {
  // 取消视觉反馈
}

/**
 * 选择连接点
 *
 * @param point - 连接点
 * @param event - 鼠标事件
 */
function selectConnectionPoint(point: ConnectionPoint, event: MouseEvent) {
  event.stopPropagation();
  emit('connection-point-select', point);
}

/**
 * 开始拖拽控制点
 *
 * @param relationship - 关系对象
 * @param pointIndex - 控制点索引
 * @param event - 鼠标事件
 */
function startDragControlPoint(relationship: EntityRelationship, pointIndex: number, event: MouseEvent) {
  event.stopPropagation();

  dragState.value = {
    isDragging: true,
    relationship,
    pointIndex,
    startPosition: { x: event.clientX, y: event.clientY }
  };

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleControlPointDrag);
  document.addEventListener('mouseup', stopDragControlPoint);
}

/**
 * 处理控制点拖拽
 *
 * @param event - 鼠标事件
 */
function handleControlPointDrag(event: MouseEvent) {
  if (!dragState.value?.isDragging || !dragState.value.relationship) return;

  const { relationship, pointIndex, startPosition } = dragState.value;
  const deltaX = event.clientX - startPosition.x;
  const deltaY = event.clientY - startPosition.y;

  const controlPoints = relationship.controlPoints || [];
  const currentPoint = controlPoints[pointIndex];

  if (currentPoint) {
    const newPosition = {
      x: currentPoint.x + deltaX / props.viewport.scale,
      y: currentPoint.y + deltaY / props.viewport.scale
    };

    emit('control-point-drag', relationship, pointIndex, newPosition);

    // 更新起始位置
    dragState.value.startPosition = { x: event.clientX, y: event.clientY };
  }
}

/** 停止拖拽控制点 */
function stopDragControlPoint() {
  dragState.value = null;

  // 移除全局鼠标事件监听
  document.removeEventListener('mousemove', handleControlPointDrag);
  document.removeEventListener('mouseup', stopDragControlPoint);
}

/**
 * 添加控制点
 *
 * @param relationship - 关系对象
 * @param event - 鼠标事件
 */
function addControlPoint(relationship: EntityRelationship, event: MouseEvent) {
  event.stopPropagation();

  const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
  const position = {
    x: (event.clientX - rect.left) / props.viewport.scale + props.viewport.x,
    y: (event.clientY - rect.top) / props.viewport.scale + props.viewport.y
  };

  emit('control-point-add', relationship, position);
}
</script>

<template>
  <svg class="relationship-layer" :viewBox="viewBox" @click="handleCanvasClick">
    <defs>
      <!-- 箭头标记定义 -->
      <marker
        id="arrow-one-to-one"
        markerWidth="12"
        markerHeight="12"
        refX="10"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,12 L10,6 z" fill="#1976d2" stroke="white" stroke-width="0.5" />
      </marker>

      <marker
        id="arrow-one-to-many"
        markerWidth="16"
        markerHeight="12"
        refX="14"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,12 L10,6 z" fill="#1976d2" stroke="white" stroke-width="0.5" />
        <circle cx="3" cy="6" r="1.5" fill="#1976d2" stroke="white" stroke-width="0.5" />
        <circle cx="6" cy="6" r="1.5" fill="#1976d2" stroke="white" stroke-width="0.5" />
      </marker>

      <marker
        id="arrow-many-to-many"
        markerWidth="18"
        markerHeight="12"
        refX="16"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,12 L10,6 z" fill="#1976d2" stroke="white" stroke-width="0.5" />
        <circle cx="2" cy="6" r="1.5" fill="#1976d2" stroke="white" stroke-width="0.5" />
        <circle cx="5" cy="6" r="1.5" fill="#1976d2" stroke="white" stroke-width="0.5" />
        <circle cx="8" cy="6" r="1.5" fill="#1976d2" stroke="white" stroke-width="0.5" />
      </marker>

      <marker
        id="arrow-default"
        markerWidth="12"
        markerHeight="12"
        refX="10"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,12 L10,6 z" fill="#666" stroke="white" stroke-width="0.5" />
      </marker>
    </defs>

    <!-- 关系连线 -->
    <g v-for="relationship in visibleRelationships" :key="relationship.id" class="relationship-group">
      <!-- 连线路径 -->
      <path
        :d="getLinePath(relationship)"
        :stroke="relationship.lineColor || '#1976d2'"
        :stroke-width="relationship.lineWidth || 1.5"
        :stroke-dasharray="getStrokeDashArray(relationship.lineStyle)"
        :marker-end="getMarkerEnd(relationship.type)"
        fill="none"
        class="relationship-line"
        :class="{ selected: selectedRelationship?.id === relationship.id }"
        stroke-linecap="round"
        stroke-linejoin="round"
        @click="selectRelationship(relationship, $event)"
        @mouseenter="handleLineHover(relationship, true)"
        @mouseleave="handleLineHover(relationship, false)"
      />

      <!-- 关系标签背景 -->
      <rect
        v-if="relationship.name && showLabels"
        :x="getLabelPosition(relationship).x - relationship.name.length * 4"
        :y="getLabelPosition(relationship).y - 10"
        :width="relationship.name.length * 8"
        height="20"
        rx="4"
        ry="4"
        fill="white"
        stroke="#e0e0e0"
        stroke-width="1"
        opacity="0.9"
      />

      <!-- 关系标签 -->
      <text
        v-if="relationship.name && showLabels"
        :x="getLabelPosition(relationship).x"
        :y="getLabelPosition(relationship).y"
        class="relationship-label"
        text-anchor="middle"
        dominant-baseline="middle"
        @click="selectRelationship(relationship, $event)"
      >
        {{ relationship.name }}
      </text>

      <!-- 关系类型标识背景 -->
      <rect
        v-if="showTypeLabels"
        :x="getTypePosition(relationship).x - 15"
        :y="getTypePosition(relationship).y - 8"
        width="30"
        height="16"
        rx="8"
        ry="8"
        fill="#f5f5f5"
        stroke="#d0d0d0"
        stroke-width="1"
        opacity="0.9"
      />

      <!-- 关系类型标识 -->
      <text
        v-if="showTypeLabels"
        :x="getTypePosition(relationship).x"
        :y="getTypePosition(relationship).y"
        class="relationship-type"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12"
        fill="#666"
        font-weight="500"
      >
        {{ getTypeLabel(relationship.type) }}
      </text>

      <!-- 控制点（编辑模式下显示） -->
      <circle
        v-for="(point, index) in getControlPoints(relationship)"
        v-show="selectedRelationship?.id === relationship.id && editMode"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="4"
        class="control-point"
        @mousedown="startDragControlPoint(relationship, index, $event)"
      />

      <!-- 中点控制器（用于添加控制点） -->
      <circle
        v-if="selectedRelationship?.id === relationship.id && editMode"
        :cx="getMidPoint(relationship).x"
        :cy="getMidPoint(relationship).y"
        r="3"
        class="mid-point-controller"
        @click="addControlPoint(relationship, $event)"
      />
    </g>

    <!-- 临时连线（创建关系时） -->
    <path
      v-if="tempLine"
      :d="tempLine.path"
      stroke="#1976d2"
      stroke-width="2"
      stroke-dasharray="5,5"
      fill="none"
      class="temp-line"
      opacity="0.7"
    />

    <!-- 连接点提示 -->
    <g v-if="showConnectionPoints">
      <circle
        v-for="point in connectionPoints"
        :key="point.id"
        :cx="point.point.x"
        :cy="point.point.y"
        r="3"
        class="connection-point"
        :class="`connection-point-${point.position}`"
        @mouseenter="highlightConnectionPoint(point)"
        @mouseleave="unhighlightConnectionPoint(point)"
        @click="selectConnectionPoint(point, $event)"
      />
    </g>
  </svg>
</template>

<style scoped>
.relationship-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
  transform: none !important;
}

.relationship-group {
  pointer-events: all;
}

.relationship-line {
  cursor: pointer;
  transition: all 0.2s ease;
}

.relationship-line:hover {
  stroke-width: 4 !important;
  filter: drop-shadow(0 0 4px rgba(25, 118, 210, 0.6));
}

.relationship-line.selected {
  stroke-width: 4 !important;
  filter: drop-shadow(0 0 6px rgba(25, 118, 210, 0.8));
  stroke: #1976d2 !important;
}

.relationship-label {
  font-size: 14px;
  font-weight: 600;
  fill: #1a202c;
  cursor: pointer;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.relationship-label:hover {
  fill: #1976d2;
}

.relationship-type {
  font-size: 10px;
  fill: #666;
  user-select: none;
}

.control-point {
  fill: #1976d2;
  stroke: white;
  stroke-width: 2;
  cursor: move;
  transition: r 0.2s ease;
}

.control-point:hover {
  r: 6;
}

.mid-point-controller {
  fill: #4caf50;
  stroke: white;
  stroke-width: 2;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.mid-point-controller:hover {
  opacity: 1;
}

.temp-line {
  pointer-events: none;
}

.connection-point {
  fill: #1976d2;
  stroke: white;
  stroke-width: 1;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.connection-point:hover {
  opacity: 1;
  stroke-width: 2;
  filter: drop-shadow(0 0 3px rgba(25, 118, 210, 0.6));
  transform: scale(1.2);
}

.connection-point-top {
  fill: #e53e3e;
}

.connection-point-right {
  fill: #3182ce;
}

.connection-point-bottom {
  fill: #38a169;
}

.connection-point-left {
  fill: #dd6b20;
}
</style>
