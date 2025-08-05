/**
 * 实体管理相关的类型定义
 */

// 坐标点
export interface Point {
  x: number;
  y: number;
}

// 实体接口
export interface Entity {
  id: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
  
  // 布局字段
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  
  // 扩展字段
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
}

// 连接点接口
export interface ConnectionPoint {
  id: string;
  entityId: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  offset: number; // 0-1 之间的相对位置
  point: Point; // 绝对坐标
}

// 实体关系接口
export interface EntityRelationship {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  name: string;
  description?: string;
  
  // 字段关联
  sourceFieldName?: string;
  targetFieldName?: string;
  
  // 级联操作
  cascadeAction?: 'RESTRICT' | 'CASCADE' | 'SET_NULL';
  
  // 视觉样式
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineColor: string;
  lineWidth: number;
  
  // 连接点和路径
  sourcePoint?: Point;
  targetPoint?: Point;
  controlPoints?: Point[];
  
  // 标签位置
  labelPosition?: Point;
  
  createdAt: string;
  updatedAt: string;
}

// 布局配置接口
export interface LayoutConfig {
  type: 'force' | 'grid' | 'hierarchy' | 'circular';
  options: {
    // 力导向布局选项
    force?: {
      strength: number;
      distance: number;
      iterations: number;
    };
    // 网格布局选项
    grid?: {
      columns: number;
      rowSpacing: number;
      columnSpacing: number;
    };
    // 层次布局选项
    hierarchy?: {
      direction: 'TB' | 'BT' | 'LR' | 'RL';
      levelSpacing: number;
      nodeSpacing: number;
    };
    // 圆形布局选项
    circular?: {
      radius: number;
      startAngle: number;
    };
  };
}

// 视口信息接口
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  entityId?: string;
  startPosition: Point;
  currentPosition: Point;
  offset: Point;
}

// 选择状态接口
export interface SelectionState {
  selectedEntities: Set<string>;
  selectedRelationships: Set<string>;
  selectionBox?: {
    start: Point;
    end: Point;
  };
}

// 工具栏操作类型
export type ToolbarAction = 
  | 'select'
  | 'pan'
  | 'connect'
  | 'zoom-in'
  | 'zoom-out'
  | 'fit-view'
  | 'auto-layout'
  | 'save-layout';

// 布局算法类型
export type LayoutAlgorithm = 'force' | 'grid' | 'hierarchy' | 'circular';

// 关系类型
export type RelationshipType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';

// 线条样式类型
export type LineStyle = 'solid' | 'dashed' | 'dotted';

// 级联操作类型
export type CascadeAction = 'RESTRICT' | 'CASCADE' | 'SET_NULL';

// 实体状态类型
export type EntityStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

// 连接点位置类型
export type ConnectionPosition = 'top' | 'right' | 'bottom' | 'left';

// 事件类型定义
export interface EntityEvents {
  'entity-select': (entity: Entity | null) => void;
  'entity-create': () => void;
  'entity-update': (entity: Entity) => void;
  'entity-delete': (entityId: string) => void;
  'entity-drag': (entityId: string, position: Point) => void;
}

export interface RelationshipEvents {
  'relationship-select': (relationship: EntityRelationship | null) => void;
  'relationship-create': (relationship: Partial<EntityRelationship>) => void;
  'relationship-update': (relationship: EntityRelationship) => void;
  'relationship-delete': (relationshipId: string) => void;
  'relationship-hover': (relationship: EntityRelationship | null) => void;
}

export interface DesignerEvents extends EntityEvents, RelationshipEvents {
  'viewport-change': (viewport: Viewport) => void;
  'layout-change': (algorithm: LayoutAlgorithm) => void;
  'tool-change': (tool: ToolbarAction) => void;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

// 表单数据类型
export interface EntityFormData {
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  color?: string;
}

export interface RelationshipFormData {
  name: string;
  type: RelationshipType;
  description?: string;
  sourceFieldName: string;
  targetFieldName: string;
  cascadeAction: CascadeAction;
  lineStyle: LineStyle;
  lineColor: string;
  lineWidth: number;
}

// 验证规则类型
export interface ValidationRule {
  required?: boolean;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FormRules {
  [key: string]: ValidationRule[];
}

// 导出导入类型
export interface ExportData {
  entities: Entity[];
  relationships: EntityRelationship[];
  layout: LayoutConfig;
  metadata: {
    version: string;
    exportTime: string;
    projectId: string;
  };
}

export interface ImportResult {
  success: boolean;
  entitiesImported: number;
  relationshipsImported: number;
  errors: string[];
}

// 性能监控类型
export interface PerformanceMetrics {
  renderTime: number;
  entityCount: number;
  relationshipCount: number;
  memoryUsage: number;
  fps: number;
}

// 主题配置类型
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  gridColor: string;
  entityColors: {
    default: string;
    selected: string;
    hover: string;
  };
  relationshipColors: {
    default: string;
    selected: string;
    hover: string;
  };
}