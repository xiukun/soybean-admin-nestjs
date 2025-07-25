import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { EntityDefinition, FieldDefinition, RelationshipDefinition } from './layered-code-generator.service';

/**
 * 实体设计器画布数据
 */
export interface EntityDesignerCanvas {
  /** 画布ID */
  id: string;
  /** 画布名称 */
  name: string;
  /** 画布描述 */
  description?: string;
  /** 画布数据 */
  canvasData: {
    /** 实体节点 */
    entities: EntityNode[];
    /** 关系连线 */
    relationships: RelationshipEdge[];
    /** 画布配置 */
    config: CanvasConfig;
  };
  /** 项目ID */
  projectId: string;
  /** 创建者 */
  createdBy: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 版本号 */
  version: number;
}

/**
 * 实体节点
 */
export interface EntityNode {
  /** 节点ID */
  id: string;
  /** 实体代码 */
  code: string;
  /** 实体名称 */
  name: string;
  /** 实体描述 */
  description?: string;
  /** 字段列表 */
  fields: FieldDefinition[];
  /** 节点位置 */
  position: {
    x: number;
    y: number;
  };
  /** 节点大小 */
  size: {
    width: number;
    height: number;
  };
  /** 节点样式 */
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
  /** 是否折叠 */
  collapsed?: boolean;
  /** 自定义属性 */
  metadata?: Record<string, any>;
}

/**
 * 关系连线
 */
export interface RelationshipEdge {
  /** 连线ID */
  id: string;
  /** 源实体ID */
  sourceEntityId: string;
  /** 目标实体ID */
  targetEntityId: string;
  /** 源字段名 */
  sourceField: string;
  /** 目标字段名 */
  targetField: string;
  /** 关系类型 */
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  /** 关系名称 */
  name?: string;
  /** 是否级联删除 */
  cascade?: boolean;
  /** 连线样式 */
  style?: {
    strokeColor?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  /** 连线路径点 */
  waypoints?: Array<{ x: number; y: number }>;
  /** 自定义属性 */
  metadata?: Record<string, any>;
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  /** 画布大小 */
  size: {
    width: number;
    height: number;
  };
  /** 缩放级别 */
  zoom: number;
  /** 视口位置 */
  viewport: {
    x: number;
    y: number;
  };
  /** 网格配置 */
  grid: {
    enabled: boolean;
    size: number;
    color: string;
  };
  /** 主题配置 */
  theme: {
    name: string;
    colors: Record<string, string>;
  };
  /** 自动布局配置 */
  autoLayout: {
    enabled: boolean;
    algorithm: 'dagre' | 'force' | 'circular';
    direction: 'TB' | 'BT' | 'LR' | 'RL';
  };
}

/**
 * 实体验证结果
 */
export interface EntityValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误列表 */
  errors: EntityValidationError[];
  /** 警告列表 */
  warnings: EntityValidationWarning[];
}

/**
 * 实体验证错误
 */
export interface EntityValidationError {
  /** 错误类型 */
  type: 'entity' | 'field' | 'relationship';
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关实体ID */
  entityId?: string;
  /** 相关字段名 */
  fieldName?: string;
  /** 相关关系ID */
  relationshipId?: string;
}

/**
 * 实体验证警告
 */
export interface EntityValidationWarning {
  /** 警告类型 */
  type: 'naming' | 'performance' | 'best-practice';
  /** 警告代码 */
  code: string;
  /** 警告消息 */
  message: string;
  /** 相关实体ID */
  entityId?: string;
  /** 相关字段名 */
  fieldName?: string;
  /** 建议 */
  suggestion?: string;
}

/**
 * 实体设计器服务
 */
@Injectable()
export class EntityDesignerService {
  private readonly logger = new Logger(EntityDesignerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 创建实体设计器画布
   */
  async createCanvas(
    name: string,
    description: string,
    projectId: string,
    createdBy: string,
  ): Promise<EntityDesignerCanvas> {
    try {
      const canvas: EntityDesignerCanvas = {
        id: this.generateCanvasId(),
        name,
        description,
        canvasData: {
          entities: [],
          relationships: [],
          config: this.getDefaultCanvasConfig(),
        },
        projectId,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      // 保存到数据库
      await this.saveCanvasToDatabase(canvas);

      this.logger.log(`创建实体设计器画布: ${canvas.id}`);
      return canvas;
    } catch (error) {
      this.logger.error('创建画布失败:', error);
      throw new BadRequestException('创建画布失败');
    }
  }

  /**
   * 获取画布
   */
  async getCanvas(canvasId: string): Promise<EntityDesignerCanvas | null> {
    try {
      return await this.loadCanvasFromDatabase(canvasId);
    } catch (error) {
      this.logger.error('获取画布失败:', error);
      return null;
    }
  }

  /**
   * 更新画布
   */
  async updateCanvas(
    canvasId: string,
    canvasData: EntityDesignerCanvas['canvasData'],
    updatedBy: string,
  ): Promise<EntityDesignerCanvas> {
    try {
      const canvas = await this.loadCanvasFromDatabase(canvasId);
      if (!canvas) {
        throw new BadRequestException('画布不存在');
      }

      canvas.canvasData = canvasData;
      canvas.updatedAt = new Date();
      canvas.version += 1;

      await this.saveCanvasToDatabase(canvas);

      this.logger.log(`更新实体设计器画布: ${canvasId}`);
      return canvas;
    } catch (error) {
      this.logger.error('更新画布失败:', error);
      throw new BadRequestException('更新画布失败');
    }
  }

  /**
   * 删除画布
   */
  async deleteCanvas(canvasId: string): Promise<boolean> {
    try {
      await this.deleteCanvasFromDatabase(canvasId);
      this.logger.log(`删除实体设计器画布: ${canvasId}`);
      return true;
    } catch (error) {
      this.logger.error('删除画布失败:', error);
      return false;
    }
  }

  /**
   * 验证实体设计
   */
  async validateEntityDesign(canvas: EntityDesignerCanvas): Promise<EntityValidationResult> {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    // 验证实体
    for (const entity of canvas.canvasData.entities) {
      // 验证实体名称
      if (!entity.name || entity.name.trim() === '') {
        errors.push({
          type: 'entity',
          code: 'EMPTY_ENTITY_NAME',
          message: '实体名称不能为空',
          entityId: entity.id,
        });
      }

      // 验证实体代码
      if (!entity.code || entity.code.trim() === '') {
        errors.push({
          type: 'entity',
          code: 'EMPTY_ENTITY_CODE',
          message: '实体代码不能为空',
          entityId: entity.id,
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(entity.code)) {
        errors.push({
          type: 'entity',
          code: 'INVALID_ENTITY_CODE',
          message: '实体代码格式不正确，只能包含字母、数字和下划线，且必须以字母开头',
          entityId: entity.id,
        });
      }

      // 验证字段
      if (entity.fields.length === 0) {
        warnings.push({
          type: 'best-practice',
          code: 'NO_FIELDS',
          message: '实体没有定义任何字段',
          entityId: entity.id,
          suggestion: '建议至少定义一个字段',
        });
      }

      for (const field of entity.fields) {
        // 验证字段名称
        if (!field.name || field.name.trim() === '') {
          errors.push({
            type: 'field',
            code: 'EMPTY_FIELD_NAME',
            message: '字段名称不能为空',
            entityId: entity.id,
            fieldName: field.name,
          });
        } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
          errors.push({
            type: 'field',
            code: 'INVALID_FIELD_NAME',
            message: '字段名称格式不正确',
            entityId: entity.id,
            fieldName: field.name,
          });
        }

        // 验证字段类型
        if (!field.type || field.type.trim() === '') {
          errors.push({
            type: 'field',
            code: 'EMPTY_FIELD_TYPE',
            message: '字段类型不能为空',
            entityId: entity.id,
            fieldName: field.name,
          });
        }
      }

      // 检查重复字段名
      const fieldNames = entity.fields.map(f => f.name);
      const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicateFields.length > 0) {
        errors.push({
          type: 'field',
          code: 'DUPLICATE_FIELD_NAMES',
          message: `存在重复的字段名: ${duplicateFields.join(', ')}`,
          entityId: entity.id,
        });
      }
    }

    // 检查重复实体代码
    const entityCodes = canvas.canvasData.entities.map(e => e.code);
    const duplicateCodes = entityCodes.filter((code, index) => entityCodes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      errors.push({
        type: 'entity',
        code: 'DUPLICATE_ENTITY_CODES',
        message: `存在重复的实体代码: ${duplicateCodes.join(', ')}`,
      });
    }

    // 验证关系
    for (const relationship of canvas.canvasData.relationships) {
      const sourceEntity = canvas.canvasData.entities.find(e => e.id === relationship.sourceEntityId);
      const targetEntity = canvas.canvasData.entities.find(e => e.id === relationship.targetEntityId);

      if (!sourceEntity) {
        errors.push({
          type: 'relationship',
          code: 'INVALID_SOURCE_ENTITY',
          message: '关系的源实体不存在',
          relationshipId: relationship.id,
        });
      }

      if (!targetEntity) {
        errors.push({
          type: 'relationship',
          code: 'INVALID_TARGET_ENTITY',
          message: '关系的目标实体不存在',
          relationshipId: relationship.id,
        });
      }

      // 验证字段存在性
      if (sourceEntity && !sourceEntity.fields.find(f => f.name === relationship.sourceField)) {
        errors.push({
          type: 'relationship',
          code: 'INVALID_SOURCE_FIELD',
          message: `源实体中不存在字段: ${relationship.sourceField}`,
          relationshipId: relationship.id,
        });
      }

      if (targetEntity && !targetEntity.fields.find(f => f.name === relationship.targetField)) {
        errors.push({
          type: 'relationship',
          code: 'INVALID_TARGET_FIELD',
          message: `目标实体中不存在字段: ${relationship.targetField}`,
          relationshipId: relationship.id,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 将画布数据转换为实体定义
   */
  convertCanvasToEntityDefinitions(canvas: EntityDesignerCanvas): EntityDefinition[] {
    return canvas.canvasData.entities.map(entity => ({
      code: entity.code,
      name: entity.name,
      description: entity.description,
      fields: entity.fields,
      relationships: this.getEntityRelationships(entity.id, canvas.canvasData.relationships),
      config: entity.metadata,
    }));
  }

  /**
   * 获取实体的关系定义
   */
  private getEntityRelationships(entityId: string, relationships: RelationshipEdge[]): RelationshipDefinition[] {
    return relationships
      .filter(rel => rel.sourceEntityId === entityId)
      .map(rel => ({
        type: rel.type,
        targetEntity: rel.targetEntityId,
        field: rel.sourceField,
        foreignKey: rel.targetField,
        cascade: rel.cascade,
      }));
  }

  /**
   * 生成画布ID
   */
  private generateCanvasId(): string {
    return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取默认画布配置
   */
  private getDefaultCanvasConfig(): CanvasConfig {
    return {
      size: { width: 2000, height: 1500 },
      zoom: 1,
      viewport: { x: 0, y: 0 },
      grid: {
        enabled: true,
        size: 20,
        color: '#f0f0f0',
      },
      theme: {
        name: 'default',
        colors: {
          primary: '#1890ff',
          secondary: '#52c41a',
          background: '#ffffff',
          border: '#d9d9d9',
          text: '#262626',
        },
      },
      autoLayout: {
        enabled: false,
        algorithm: 'dagre',
        direction: 'TB',
      },
    };
  }

  /**
   * 保存画布到数据库
   */
  private async saveCanvasToDatabase(canvas: EntityDesignerCanvas): Promise<void> {
    // 这里应该实现具体的数据库保存逻辑
    // 由于没有具体的数据库表结构，这里只是示例
    this.logger.debug(`保存画布到数据库: ${canvas.id}`);
  }

  /**
   * 从数据库加载画布
   */
  private async loadCanvasFromDatabase(canvasId: string): Promise<EntityDesignerCanvas | null> {
    // 这里应该实现具体的数据库加载逻辑
    this.logger.debug(`从数据库加载画布: ${canvasId}`);
    return null;
  }

  /**
   * 从数据库删除画布
   */
  private async deleteCanvasFromDatabase(canvasId: string): Promise<void> {
    // 这里应该实现具体的数据库删除逻辑
    this.logger.debug(`从数据库删除画布: ${canvasId}`);
  }
}
