import { Injectable } from '@nestjs/common';

import { LowcodeModelEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/ports/lowcode-model.read.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodeModelReadPostgresRepository implements LowcodeModelReadRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<LowcodeModelEntity | null> {
    const model = await this.prisma.sysLowcodeModel.findUnique({
      where: { id },
      include: {
        properties: true,
        references: true,
      },
    });

    return model ? this.mapToEntity(model) : null;
  }

  async findByCode(code: string): Promise<LowcodeModelEntity | null> {
    const model = await this.prisma.sysLowcodeModel.findUnique({
      where: { code },
      include: {
        properties: true,
        references: true,
      },
    });

    return model ? this.mapToEntity(model) : null;
  }

  async findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodeModelEntity[];
    total: number;
    current: number;
    size: number;
  }> {
    const current = params?.current || 1;
    const size = params?.size || 10;
    const skip = (current - 1) * size;

    const where: any = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { tableName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysLowcodeModel.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysLowcodeModel.count({ where }),
    ]);

    return {
      records: data.map(this.mapToEntity),
      total,
      current,
      size,
    };
  }

  async findAllWithRelations(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodeModelEntity[];
    total: number;
    current: number;
    size: number;
  }> {
    const current = params?.current || 1;
    const size = params?.size || 10;
    const skip = (current - 1) * size;

    const where: any = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { tableName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysLowcodeModel.findMany({
        where,
        skip,
        take: size,
        include: {
          properties: true,
          references: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysLowcodeModel.count({ where }),
    ]);

    return {
      records: data.map(this.mapToEntity),
      total,
      current,
      size,
    };
  }

  private mapToEntity(model: any): LowcodeModelEntity {
    return {
      id: model.id,
      name: model.name,
      code: model.code,
      description: model.description,
      tableName: model.tableName,
      status: model.status,
      createdAt: model.createdAt,
      createdBy: model.createdBy,
      updatedAt: model.updatedAt,
      updatedBy: model.updatedBy,
      properties: model.properties?.map((prop: any) => ({
        id: prop.id,
        modelId: prop.modelId,
        name: prop.name,
        code: prop.code,
        description: prop.description,
        type: prop.type,
        length: prop.length,
        precision: prop.precision,
        scale: prop.scale,
        nullable: prop.nullable,
        defaultValue: prop.defaultValue,
        isPrimaryKey: prop.isPrimaryKey,
        isUnique: prop.isUnique,
        isIndex: prop.isIndex,
        createdAt: prop.createdAt,
        createdBy: prop.createdBy,
        updatedAt: prop.updatedAt,
        updatedBy: prop.updatedBy,
      })),
      references: model.references?.map((ref: any) => ({
        id: ref.id,
        modelId: ref.modelId,
        name: ref.name,
        sourceModel: ref.sourceModel,
        sourceProperty: ref.sourceProperty,
        targetModel: ref.targetModel,
        targetProperty: ref.targetProperty,
        relationType: ref.relationType,
        onDelete: ref.onDelete,
        onUpdate: ref.onUpdate,
        createdAt: ref.createdAt,
        createdBy: ref.createdBy,
        updatedAt: ref.updatedAt,
        updatedBy: ref.updatedBy,
      })),
    };
  }
}