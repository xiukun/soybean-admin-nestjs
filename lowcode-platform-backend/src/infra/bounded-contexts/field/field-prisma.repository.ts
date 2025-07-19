import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Field, FieldDataType } from '@field/domain/field.model';
import { FieldRepository } from '@field/domain/field.repository';

@Injectable()
export class FieldPrismaRepository implements FieldRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(field: Field): Promise<Field> {
    const data = {
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      type: field.dataType,
      length: field.length,
      precision: field.precision,
      nullable: !field.required,
      uniqueConstraint: field.unique,
      defaultValue: field.defaultValue,
      comment: field.description,
      sortOrder: field.displayOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
    };

    const saved = await this.prisma.field.create({ data });
    return Field.fromPersistence({
      id: saved.id,
      entityId: saved.entityId,
      name: saved.name,
      code: saved.code,
      dataType: saved.type as FieldDataType,
      description: saved.comment,
      length: saved.length,
      precision: saved.precision,
      required: !saved.nullable,
      unique: saved.uniqueConstraint,
      defaultValue: saved.defaultValue,
      config: {},
      displayOrder: saved.sortOrder,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
      updatedBy: saved.updatedBy,
      updatedAt: saved.updatedAt,
    });
  }

  async findById(id: string): Promise<Field | null> {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!field) return null;

    return Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    });
  }

  async update(field: Field): Promise<Field> {
    const data = {
      name: field.name,
      code: field.code,
      type: field.dataType,
      length: field.length,
      precision: field.precision,
      nullable: !field.required,
      uniqueConstraint: field.unique,
      defaultValue: field.defaultValue,
      comment: field.description,
      sortOrder: field.displayOrder,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    };

    const updated = await this.prisma.field.update({
      where: { id: field.id },
      data,
    });

    return Field.fromPersistence({
      id: updated.id,
      entityId: updated.entityId,
      name: updated.name,
      code: updated.code,
      dataType: updated.type as FieldDataType,
      description: updated.comment,
      length: updated.length,
      precision: updated.precision,
      required: !updated.nullable,
      unique: updated.uniqueConstraint,
      defaultValue: updated.defaultValue,
      config: {},
      displayOrder: updated.sortOrder,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.field.delete({
      where: { id },
    });
  }

  async findByEntityId(entityId: string): Promise<Field[]> {
    const fields = await this.prisma.field.findMany({
      where: { entityId },
      orderBy: { sortOrder: 'asc' },
    });

    return fields.map(field => Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    }));
  }

  async findByCode(entityId: string, code: string): Promise<Field | null> {
    const field = await this.prisma.field.findFirst({
      where: { entityId, code },
    });

    if (!field) return null;

    return Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    });
  }

  async findByDisplayOrder(entityId: string, displayOrder: number): Promise<Field | null> {
    const field = await this.prisma.field.findFirst({
      where: { entityId, sortOrder: displayOrder },
    });

    if (!field) return null;

    return Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    });
  }

  async findPaginated(
    entityId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    const where: any = { entityId };
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.dataType) {
      where.type = filters.dataType;
    }

    const [fields, total] = await Promise.all([
      this.prisma.field.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.field.count({ where }),
    ]);

    const mappedFields = fields.map(field => Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    }));

    return {
      fields: mappedFields,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async existsByCode(entityId: string, code: string, excludeId?: string): Promise<boolean> {
    const where: any = { entityId, code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.field.count({ where });
    return count > 0;
  }

  async existsByDisplayOrder(entityId: string, displayOrder: number, excludeId?: string): Promise<boolean> {
    const where: any = { entityId, sortOrder: displayOrder };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.field.count({ where });
    return count > 0;
  }

  async findMaxDisplayOrder(entityId: string): Promise<number> {
    const result = await this.prisma.field.aggregate({
      where: { entityId },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder || 0;
  }

  async updateDisplayOrders(entityId: string, updates: { id: string; displayOrder: number }[]): Promise<void> {
    const transaction = updates.map(update =>
      this.prisma.field.update({
        where: { id: update.id },
        data: { sortOrder: update.displayOrder },
      })
    );
    await this.prisma.$transaction(transaction);
  }

  async countByEntityId(entityId: string): Promise<number> {
    return await this.prisma.field.count({
      where: { entityId },
    });
  }

  async countByDataType(entityId: string, dataType: string): Promise<number> {
    return await this.prisma.field.count({
      where: { entityId, type: dataType },
    });
  }

  async countRequired(entityId: string): Promise<number> {
    return await this.prisma.field.count({
      where: { entityId, nullable: false },
    });
  }

  async countUnique(entityId: string): Promise<number> {
    return await this.prisma.field.count({
      where: { entityId, uniqueConstraint: true },
    });
  }

  async findByIds(ids: string[]): Promise<Field[]> {
    const fields = await this.prisma.field.findMany({
      where: { id: { in: ids } },
      orderBy: { sortOrder: 'asc' },
    });

    return fields.map(field => Field.fromPersistence({
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.type as FieldDataType,
      description: field.comment,
      length: field.length,
      precision: field.precision,
      required: !field.nullable,
      unique: field.uniqueConstraint,
      defaultValue: field.defaultValue,
      config: {},
      displayOrder: field.sortOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    }));
  }

  async deleteByEntityId(entityId: string): Promise<void> {
    await this.prisma.field.deleteMany({
      where: { entityId },
    });
  }
}
