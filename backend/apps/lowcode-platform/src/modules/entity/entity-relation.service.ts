import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';
import {
  CreateEntityRelationDto,
  UpdateEntityRelationDto,
  QueryEntityRelationDto,
  EntityRelationGraphDto,
  ValidateRelationDto,
  RelationType,
  RelationAction,
} from './dto/entity-relation.dto';

@Injectable()
export class EntityRelationService {
  private readonly logger = new Logger(EntityRelationService.name);
  private relations: any[] = []; // 模拟数据存储

  async create(createDto: CreateEntityRelationDto, user: AuthenticatedUser) {
    this.logger.log(`Creating entity relation: ${createDto.name} by user: ${user.username}`);

    // 验证关系
    await this.validateRelation({
      sourceEntityId: createDto.sourceEntityId,
      targetEntityId: createDto.targetEntityId,
      type: createDto.type,
      foreignKey: createDto.foreignKey,
    });

    const relation = {
      id: Date.now().toString(),
      ...createDto,
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.relations.push(relation);

    return {
      status: 200,
      msg: 'Entity relation created successfully',
      data: relation,
    };
  }

  async findAll(query: QueryEntityRelationDto, user: AuthenticatedUser) {
    this.logger.log(`Fetching entity relations with query: ${JSON.stringify(query)}`);

    let filteredRelations = [...this.relations];

    // 应用过滤条件
    if (query.projectId) {
      filteredRelations = filteredRelations.filter(r => r.projectId === query.projectId);
    }

    if (query.sourceEntityId) {
      filteredRelations = filteredRelations.filter(r => r.sourceEntityId === query.sourceEntityId);
    }

    if (query.targetEntityId) {
      filteredRelations = filteredRelations.filter(r => r.targetEntityId === query.targetEntityId);
    }

    if (query.type) {
      filteredRelations = filteredRelations.filter(r => r.type === query.type);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredRelations = filteredRelations.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        (r.description && r.description.toLowerCase().includes(searchLower))
      );
    }

    // 分页
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = filteredRelations.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRelations = filteredRelations.slice(startIndex, endIndex);

    return {
      status: 200,
      msg: 'Entity relations fetched successfully',
      data: {
        options: paginatedRelations,
        page,
        perPage: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    this.logger.log(`Fetching entity relation: ${id}`);

    const relation = this.relations.find(r => r.id === id);
    if (!relation) {
      throw BusinessException.notFound('Entity relation', id);
    }

    return {
      status: 200,
      msg: 'Entity relation fetched successfully',
      data: relation,
    };
  }

  async update(id: string, updateDto: UpdateEntityRelationDto, user: AuthenticatedUser) {
    this.logger.log(`Updating entity relation: ${id} by user: ${user.username}`);

    const relationIndex = this.relations.findIndex(r => r.id === id);
    if (relationIndex === -1) {
      throw BusinessException.notFound('Entity relation', id);
    }

    // 如果更新了关系类型或实体，需要重新验证
    if (updateDto.type || updateDto.sourceEntityId || updateDto.targetEntityId) {
      const relation = this.relations[relationIndex];
      await this.validateRelation({
        sourceEntityId: updateDto.sourceEntityId || relation.sourceEntityId,
        targetEntityId: updateDto.targetEntityId || relation.targetEntityId,
        type: updateDto.type || relation.type,
        foreignKey: updateDto.foreignKey || relation.foreignKey,
      });
    }

    this.relations[relationIndex] = {
      ...this.relations[relationIndex],
      ...updateDto,
      updatedAt: new Date(),
    };

    return {
      status: 200,
      msg: 'Entity relation updated successfully',
      data: this.relations[relationIndex],
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.logger.log(`Removing entity relation: ${id} by user: ${user.username}`);

    const relationIndex = this.relations.findIndex(r => r.id === id);
    if (relationIndex === -1) {
      throw BusinessException.notFound('Entity relation', id);
    }

    const removedRelation = this.relations.splice(relationIndex, 1)[0];

    return {
      status: 200,
      msg: 'Entity relation removed successfully',
      data: removedRelation,
    };
  }

  async getRelationGraph(query: EntityRelationGraphDto, user: AuthenticatedUser) {
    this.logger.log(`Generating relation graph for project: ${query.projectId}`);

    const projectRelations = this.relations.filter(r => r.projectId === query.projectId);
    
    // 如果指定了实体ID过滤
    let filteredRelations = projectRelations;
    if (query.entityIds && query.entityIds.length > 0) {
      filteredRelations = projectRelations.filter(r =>
        query.entityIds.includes(r.sourceEntityId) || query.entityIds.includes(r.targetEntityId)
      );
    }

    // 构建图数据结构
    const nodes = new Map();
    const edges = [];

    // 收集所有实体节点
    filteredRelations.forEach(relation => {
      if (!nodes.has(relation.sourceEntityId)) {
        nodes.set(relation.sourceEntityId, {
          id: relation.sourceEntityId,
          type: 'entity',
          // 这里应该从实体服务获取实体详情
          label: `Entity ${relation.sourceEntityId}`,
        });
      }

      if (!nodes.has(relation.targetEntityId)) {
        nodes.set(relation.targetEntityId, {
          id: relation.targetEntityId,
          type: 'entity',
          label: `Entity ${relation.targetEntityId}`,
        });
      }

      // 添加关系边
      edges.push({
        id: relation.id,
        source: relation.sourceEntityId,
        target: relation.targetEntityId,
        type: relation.type,
        label: relation.name,
        data: relation,
      });
    });

    const graphData = {
      nodes: Array.from(nodes.values()),
      edges,
      layout: query.layout || 'hierarchical',
      includeFields: query.includeFields || false,
    };

    return {
      status: 200,
      msg: 'Relation graph generated successfully',
      data: graphData,
    };
  }

  async validateRelation(validateDto: ValidateRelationDto) {
    this.logger.log(`Validating relation: ${JSON.stringify(validateDto)}`);

    // 检查是否存在循环依赖
    if (validateDto.sourceEntityId === validateDto.targetEntityId) {
      throw BusinessException.badRequest('Cannot create relation to the same entity');
    }

    // 检查是否已存在相同的关系
    const existingRelation = this.relations.find(r =>
      r.sourceEntityId === validateDto.sourceEntityId &&
      r.targetEntityId === validateDto.targetEntityId &&
      r.type === validateDto.type
    );

    if (existingRelation) {
      throw BusinessException.badRequest('Relation already exists between these entities');
    }

    // 检查多对多关系的特殊规则
    if (validateDto.type === RelationType.MANY_TO_MANY) {
      // 多对多关系需要中间表
      if (!validateDto.foreignKey) {
        throw BusinessException.badRequest('Many-to-many relation requires join table configuration');
      }
    }

    return {
      status: 200,
      msg: 'Relation validation passed',
      data: { valid: true },
    };
  }

  async getRelationsByEntity(entityId: string, user: AuthenticatedUser) {
    this.logger.log(`Fetching relations for entity: ${entityId}`);

    const entityRelations = this.relations.filter(r =>
      r.sourceEntityId === entityId || r.targetEntityId === entityId
    );

    const incomingRelations = entityRelations.filter(r => r.targetEntityId === entityId);
    const outgoingRelations = entityRelations.filter(r => r.sourceEntityId === entityId);

    return {
      status: 200,
      msg: 'Entity relations fetched successfully',
      data: {
        incoming: incomingRelations,
        outgoing: outgoingRelations,
        total: entityRelations.length,
      },
    };
  }

  async generateRelationCode(relationId: string, framework: string, user: AuthenticatedUser) {
    this.logger.log(`Generating code for relation: ${relationId} with framework: ${framework}`);

    const relation = this.relations.find(r => r.id === relationId);
    if (!relation) {
      throw BusinessException.notFound('Entity relation', relationId);
    }

    // 根据框架生成不同的代码
    let code = '';
    switch (framework.toLowerCase()) {
      case 'nestjs':
        code = this.generateNestJSRelationCode(relation);
        break;
      case 'spring-boot':
        code = this.generateSpringBootRelationCode(relation);
        break;
      default:
        throw BusinessException.badRequest(`Unsupported framework: ${framework}`);
    }

    return {
      status: 200,
      msg: 'Relation code generated successfully',
      data: {
        code,
        framework,
        relation,
      },
    };
  }

  private generateNestJSRelationCode(relation: any): string {
    const { type, sourceField, targetField, foreignKey } = relation;

    switch (type) {
      case RelationType.ONE_TO_ONE:
        return `@OneToOne(() => TargetEntity)
@JoinColumn({ name: '${foreignKey || 'target_id'}' })
${sourceField || 'target'}: TargetEntity;`;

      case RelationType.ONE_TO_MANY:
        return `@OneToMany(() => TargetEntity, target => target.${targetField || 'source'})
${sourceField || 'targets'}: TargetEntity[];`;

      case RelationType.MANY_TO_ONE:
        return `@ManyToOne(() => TargetEntity)
@JoinColumn({ name: '${foreignKey || 'target_id'}' })
${sourceField || 'target'}: TargetEntity;`;

      case RelationType.MANY_TO_MANY:
        return `@ManyToMany(() => TargetEntity)
@JoinTable()
${sourceField || 'targets'}: TargetEntity[];`;

      default:
        return '// Unsupported relation type';
    }
  }

  private generateSpringBootRelationCode(relation: any): string {
    const { type, sourceField, targetField, foreignKey } = relation;

    switch (type) {
      case RelationType.ONE_TO_ONE:
        return `@OneToOne
@JoinColumn(name = "${foreignKey || 'target_id'}")
private TargetEntity ${sourceField || 'target'};`;

      case RelationType.ONE_TO_MANY:
        return `@OneToMany(mappedBy = "${targetField || 'source'}")
private List<TargetEntity> ${sourceField || 'targets'};`;

      case RelationType.MANY_TO_ONE:
        return `@ManyToOne
@JoinColumn(name = "${foreignKey || 'target_id'}")
private TargetEntity ${sourceField || 'target'};`;

      case RelationType.MANY_TO_MANY:
        return `@ManyToMany
@JoinTable
private List<TargetEntity> ${sourceField || 'targets'};`;

      default:
        return '// Unsupported relation type';
    }
  }
}
