import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../lib/shared/prisma/prisma.service';
import { EntityRepository } from '../../../lib/bounded-contexts/entity/domain/entity.repository';
import { Entity, EntityStatus } from '../../../lib/bounded-contexts/entity/domain/entity.model';
import { Field, FieldType } from '../../../lib/bounded-contexts/entity/domain/field.model';
import { Relation, RelationType, CascadeType } from '../../../lib/bounded-contexts/entity/domain/relation.model';

@Injectable()
export class EntityPrismaRepository implements EntityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: Entity): Promise<Entity> {
    const data = {
      projectId: entity.projectId,
      name: entity.name,
      code: entity.code,
      tableName: entity.tableName,
      description: entity.description,
      category: entity.category,
      diagramPosition: entity.diagramPosition,
      config: entity.config,
      version: entity.version,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };

    const saved = await this.prisma.entity.create({ data });
    return Entity.fromPersistence({
      ...saved,
      status: saved.status as EntityStatus,
    });
  }

  async findById(id: string): Promise<Entity | null> {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
    });

    if (!entity) return null;

    return Entity.fromPersistence({
      ...entity,
      status: entity.status as EntityStatus,
    });
  }

  async findByCode(projectId: string, code: string): Promise<Entity | null> {
    const entity = await this.prisma.entity.findFirst({
      where: { projectId, code },
    });

    if (!entity) return null;

    return Entity.fromPersistence({
      ...entity,
      status: entity.status as EntityStatus,
    });
  }

  async findByProjectId(projectId: string): Promise<Entity[]> {
    const entities = await this.prisma.entity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return entities.map(entity => Entity.fromPersistence({
      ...entity,
      status: entity.status as EntityStatus,
    }));
  }

  async update(entity: Entity): Promise<Entity> {
    const data = {
      name: entity.name,
      code: entity.code,
      tableName: entity.tableName,
      description: entity.description,
      category: entity.category,
      diagramPosition: entity.diagramPosition,
      config: entity.config,
      version: entity.version,
      status: entity.status,
      updatedBy: entity.updatedBy,
      updatedAt: entity.updatedAt,
    };

    const updated = await this.prisma.entity.update({
      where: { id: entity.id },
      data,
    });

    return Entity.fromPersistence({
      ...updated,
      status: updated.status as EntityStatus,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.entity.delete({
      where: { id },
    });
  }

  async saveField(field: Field): Promise<Field> {
    const data = {
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      type: field.type,
      length: field.length,
      precision: field.precision,
      scale: field.scale,
      nullable: field.nullable,
      uniqueConstraint: field.uniqueConstraint,
      indexed: field.indexed,
      primaryKey: field.primaryKey,
      defaultValue: field.defaultValue,
      validationRules: field.validationRules,
      referenceConfig: field.referenceConfig,
      enumOptions: field.enumOptions,
      comment: field.comment,
      sortOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
    };

    const saved = await this.prisma.field.create({ data });
    return Field.fromPersistence({
      ...saved,
      type: saved.type as FieldType,
    });
  }

  async findFieldById(id: string): Promise<Field | null> {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!field) return null;

    return Field.fromPersistence({
      ...field,
      type: field.type as FieldType,
    });
  }

  async findFieldsByEntityId(entityId: string): Promise<Field[]> {
    const fields = await this.prisma.field.findMany({
      where: { entityId },
      orderBy: { sortOrder: 'asc' },
    });

    return fields.map(field => Field.fromPersistence({
      ...field,
      type: field.type as FieldType,
    }));
  }

  async updateField(field: Field): Promise<Field> {
    const data = {
      name: field.name,
      code: field.code,
      type: field.type,
      length: field.length,
      precision: field.precision,
      scale: field.scale,
      nullable: field.nullable,
      uniqueConstraint: field.uniqueConstraint,
      indexed: field.indexed,
      primaryKey: field.primaryKey,
      defaultValue: field.defaultValue,
      validationRules: field.validationRules,
      referenceConfig: field.referenceConfig,
      enumOptions: field.enumOptions,
      comment: field.comment,
      sortOrder: field.sortOrder,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    };

    const updated = await this.prisma.field.update({
      where: { id: field.id },
      data,
    });

    return Field.fromPersistence({
      ...updated,
      type: updated.type as FieldType,
    });
  }

  async deleteField(id: string): Promise<void> {
    await this.prisma.field.delete({
      where: { id },
    });
  }

  async saveRelation(relation: Relation): Promise<Relation> {
    const data = {
      projectId: relation.projectId,
      name: relation.name,
      type: relation.type,
      sourceEntityId: relation.sourceEntityId,
      sourceFieldId: relation.sourceFieldId,
      targetEntityId: relation.targetEntityId,
      targetFieldId: relation.targetFieldId,
      joinTableConfig: relation.joinTableConfig,
      onDelete: relation.onDelete,
      onUpdate: relation.onUpdate,
      indexed: relation.indexed,
      indexName: relation.indexName,
      createdBy: relation.createdBy,
      createdAt: relation.createdAt,
    };

    const saved = await this.prisma.relation.create({ data });
    return Relation.fromPersistence({
      ...saved,
      type: saved.type as RelationType,
      onDelete: saved.onDelete as CascadeType,
      onUpdate: saved.onUpdate as CascadeType,
    });
  }

  async findRelationById(id: string): Promise<Relation | null> {
    const relation = await this.prisma.relation.findUnique({
      where: { id },
    });

    if (!relation) return null;

    return Relation.fromPersistence({
      ...relation,
      type: relation.type as RelationType,
      onDelete: relation.onDelete as CascadeType,
      onUpdate: relation.onUpdate as CascadeType,
    });
  }

  async findRelationsByProjectId(projectId: string): Promise<Relation[]> {
    const relations = await this.prisma.relation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return relations.map(relation => Relation.fromPersistence({
      ...relation,
      type: relation.type as RelationType,
      onDelete: relation.onDelete as CascadeType,
      onUpdate: relation.onUpdate as CascadeType,
    }));
  }

  async findRelationsByEntityId(entityId: string): Promise<Relation[]> {
    const relations = await this.prisma.relation.findMany({
      where: {
        OR: [
          { sourceEntityId: entityId },
          { targetEntityId: entityId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return relations.map(relation => Relation.fromPersistence({
      ...relation,
      type: relation.type as RelationType,
      onDelete: relation.onDelete as CascadeType,
      onUpdate: relation.onUpdate as CascadeType,
    }));
  }

  async updateRelation(relation: Relation): Promise<Relation> {
    const data = {
      name: relation.name,
      type: relation.type,
      sourceEntityId: relation.sourceEntityId,
      sourceFieldId: relation.sourceFieldId,
      targetEntityId: relation.targetEntityId,
      targetFieldId: relation.targetFieldId,
      joinTableConfig: relation.joinTableConfig,
      onDelete: relation.onDelete,
      onUpdate: relation.onUpdate,
      indexed: relation.indexed,
      indexName: relation.indexName,
    };

    const updated = await this.prisma.relation.update({
      where: { id: relation.id },
      data,
    });

    return Relation.fromPersistence({
      ...updated,
      type: updated.type as RelationType,
      onDelete: updated.onDelete as CascadeType,
      onUpdate: updated.onUpdate as CascadeType,
    });
  }

  async deleteRelation(id: string): Promise<void> {
    await this.prisma.relation.delete({
      where: { id },
    });
  }

  async findEntityWithFields(id: string): Promise<{ entity: Entity; fields: Field[] } | null> {
    const result = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!result) return null;

    const entity = Entity.fromPersistence({
      ...result,
      status: result.status as EntityStatus,
    });

    const fields = result.fields.map(field => Field.fromPersistence({
      ...field,
      type: field.type as FieldType,
    }));

    return { entity, fields };
  }

  async findEntityWithRelations(id: string): Promise<{ entity: Entity; relations: Relation[] } | null> {
    const result = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        sourceRelations: true,
        targetRelations: true,
      },
    });

    if (!result) return null;

    const entity = Entity.fromPersistence({
      ...result,
      status: result.status as EntityStatus,
    });

    const relations = [
      ...result.sourceRelations,
      ...result.targetRelations,
    ].map(relation => Relation.fromPersistence({
      ...relation,
      type: relation.type as RelationType,
      onDelete: relation.onDelete as CascadeType,
      onUpdate: relation.onUpdate as CascadeType,
    }));

    return { entity, relations };
  }

  async findProjectEntitiesWithFields(projectId: string): Promise<Array<{ entity: Entity; fields: Field[] }>> {
    const results = await this.prisma.entity.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(result => ({
      entity: Entity.fromPersistence({
        ...result,
        status: result.status as EntityStatus,
      }),
      fields: result.fields.map(field => Field.fromPersistence({
        ...field,
        type: field.type as FieldType,
      })),
    }));
  }

  async existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean> {
    const entity = await this.prisma.entity.findFirst({
      where: {
        projectId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!entity;
  }

  async existsByTableName(projectId: string, tableName: string, excludeId?: string): Promise<boolean> {
    const entity = await this.prisma.entity.findFirst({
      where: {
        projectId,
        tableName,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!entity;
  }

  async fieldExistsByCode(entityId: string, code: string, excludeId?: string): Promise<boolean> {
    const field = await this.prisma.field.findFirst({
      where: {
        entityId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!field;
  }

  async findEntitiesPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    entities: Entity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = {
      projectId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as any } },
          { code: { contains: filters.search, mode: 'insensitive' as any } },
          { description: { contains: filters.search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [entities, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      entities: entities.map(entity => Entity.fromPersistence({
        ...entity,
        status: entity.status as EntityStatus,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async countTotal(projectId: string): Promise<number> {
    return await this.prisma.entity.count({
      where: { projectId },
    });
  }

  async countByStatus(projectId: string, status: string): Promise<number> {
    return await this.prisma.entity.count({
      where: {
        projectId,
        status
      },
    });
  }
}
