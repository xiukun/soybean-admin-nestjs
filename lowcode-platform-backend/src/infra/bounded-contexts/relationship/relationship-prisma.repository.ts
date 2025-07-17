import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../lib/shared/prisma/prisma.service';
import { RelationshipRepository } from '../../../lib/bounded-contexts/relationship/domain/relationship.repository';
import { Relationship, RelationshipType, RelationshipStatus } from '../../../lib/bounded-contexts/relationship/domain/relationship.model';

@Injectable()
export class RelationshipPrismaRepository implements RelationshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(relationship: Relationship): Promise<Relationship> {
    const data = {
      id: relationship.id,
      projectId: relationship.projectId,
      name: relationship.name,
      code: relationship.code,
      description: relationship.description,
      type: relationship.type,
      sourceEntityId: relationship.sourceEntityId,
      targetEntityId: relationship.targetEntityId,
      sourceFieldId: relationship.sourceFieldId,
      targetFieldId: relationship.targetFieldId,
      foreignKeyName: relationship.foreignKeyName,
      onDelete: relationship.onDelete,
      onUpdate: relationship.onUpdate,
      config: relationship.config,
      status: relationship.status,
      createdBy: relationship.createdBy,
      createdAt: relationship.createdAt,
    };

    const saved = await this.prisma.relation.create({ data });
    return Relationship.fromPersistence({
      ...saved,
      type: saved.type as RelationshipType,
      status: saved.status as RelationshipStatus,
    });
  }

  async findById(id: string): Promise<Relationship | null> {
    const relationship = await this.prisma.relation.findUnique({
      where: { id },
    });

    if (!relationship) return null;

    return Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    });
  }

  async update(relationship: Relationship): Promise<Relationship> {
    const data = {
      name: relationship.name,
      description: relationship.description,
      sourceFieldId: relationship.sourceFieldId,
      targetFieldId: relationship.targetFieldId,
      foreignKeyName: relationship.foreignKeyName,
      onDelete: relationship.onDelete,
      onUpdate: relationship.onUpdate,
      config: relationship.config,
      status: relationship.status,
      updatedBy: relationship.updatedBy,
      updatedAt: relationship.updatedAt,
    };

    const updated = await this.prisma.relation.update({
      where: { id: relationship.id },
      data,
    });

    return Relationship.fromPersistence({
      ...updated,
      type: updated.type as RelationshipType,
      status: updated.status as RelationshipStatus,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.relation.delete({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<Relationship[]> {
    const relationships = await this.prisma.relation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map(relationship => Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    }));
  }

  async findByCode(projectId: string, code: string): Promise<Relationship | null> {
    const relationship = await this.prisma.relation.findFirst({
      where: { projectId, code },
    });

    if (!relationship) return null;

    return Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    });
  }

  async findBySourceEntityId(sourceEntityId: string): Promise<Relationship[]> {
    const relationships = await this.prisma.relation.findMany({
      where: { sourceEntityId },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map(relationship => Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    }));
  }

  async findByTargetEntityId(targetEntityId: string): Promise<Relationship[]> {
    const relationships = await this.prisma.relation.findMany({
      where: { targetEntityId },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map(relationship => Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    }));
  }

  async findByEntityId(entityId: string): Promise<Relationship[]> {
    const relationships = await this.prisma.relation.findMany({
      where: {
        OR: [
          { sourceEntityId: entityId },
          { targetEntityId: entityId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map(relationship => Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    }));
  }

  async findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    relationships: Relationship[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = {
      projectId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sourceEntityId && { sourceEntityId: filters.sourceEntityId }),
      ...(filters?.targetEntityId && { targetEntityId: filters.targetEntityId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as any } },
          { code: { contains: filters.search, mode: 'insensitive' as any } },
          { description: { contains: filters.search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [relationships, total] = await Promise.all([
      this.prisma.relation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.relation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      relationships: relationships.map(relationship => Relationship.fromPersistence({
        ...relationship,
        type: relationship.type as RelationshipType,
        status: relationship.status as RelationshipStatus,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean> {
    const relationship = await this.prisma.relation.findFirst({
      where: {
        projectId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!relationship;
  }

  async existsBetweenEntities(
    sourceEntityId: string,
    targetEntityId: string,
    excludeId?: string
  ): Promise<boolean> {
    const relationship = await this.prisma.relation.findFirst({
      where: {
        OR: [
          { sourceEntityId, targetEntityId },
          { sourceEntityId: targetEntityId, targetEntityId: sourceEntityId },
        ],
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!relationship;
  }

  async countByProjectId(projectId: string): Promise<number> {
    return await this.prisma.relation.count({
      where: { projectId },
    });
  }

  async countByType(projectId: string, type: string): Promise<number> {
    return await this.prisma.relation.count({
      where: { projectId, type },
    });
  }

  async countByStatus(projectId: string, status: string): Promise<number> {
    return await this.prisma.relation.count({
      where: { projectId, status },
    });
  }

  async findByIds(ids: string[]): Promise<Relationship[]> {
    const relationships = await this.prisma.relation.findMany({
      where: { id: { in: ids } },
    });

    return relationships.map(relationship => Relationship.fromPersistence({
      ...relationship,
      type: relationship.type as RelationshipType,
      status: relationship.status as RelationshipStatus,
    }));
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await this.prisma.relation.deleteMany({
      where: { projectId },
    });
  }

  async deleteByEntityId(entityId: string): Promise<void> {
    await this.prisma.relation.deleteMany({
      where: {
        OR: [
          { sourceEntityId: entityId },
          { targetEntityId: entityId },
        ],
      },
    });
  }

  async findRelationshipGraph(projectId: string): Promise<{
    entities: { id: string; name: string; code: string }[];
    relationships: Relationship[];
  }> {
    const [entities, relationships] = await Promise.all([
      this.prisma.entity.findMany({
        where: { projectId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.relation.findMany({
        where: { projectId },
      }),
    ]);

    return {
      entities,
      relationships: relationships.map(relationship => Relationship.fromPersistence({
        ...relationship,
        type: relationship.type as RelationshipType,
        status: relationship.status as RelationshipStatus,
      })),
    };
  }
}
