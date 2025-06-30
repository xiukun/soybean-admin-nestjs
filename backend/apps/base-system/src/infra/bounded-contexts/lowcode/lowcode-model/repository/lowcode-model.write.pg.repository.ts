import { Injectable } from '@nestjs/common';

import { CreateLowcodeModelEntity, LowcodeModelEntity, UpdateLowcodeModelEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/domain/lowcode-model.entity';
import { LowcodeModelWriteRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/ports/lowcode-model.write.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodeModelWritePostgresRepository implements LowcodeModelWriteRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建模型
      const model = await tx.sysLowcodeModel.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          tableName: data.tableName,
          status: data.status,
          createdBy: data.createdBy,
        },
      });

      // 创建属性
      if (data.properties && data.properties.length > 0) {
        await tx.sysLowcodeModelProperty.createMany({
          data: data.properties.map(prop => ({
            modelId: model.id,
            name: prop.name,
            code: prop.code,
            description: prop.description,
            type: prop.type,
            length: prop.length,
            precision: prop.precision,
            scale: prop.scale,
            nullable: prop.nullable ?? true,
            defaultValue: prop.defaultValue,
            isPrimaryKey: prop.isPrimaryKey ?? false,
            isUnique: prop.isUnique ?? false,
            isIndex: prop.isIndex ?? false,
            createdBy: prop.createdBy,
          })),
        });
      }

      // 创建关联
      if (data.references && data.references.length > 0) {
        await tx.sysLowcodeModelReference.createMany({
          data: data.references.map(ref => ({
            modelId: model.id,
            name: ref.name,
            sourceModel: ref.sourceModel,
            sourceProperty: ref.sourceProperty,
            targetModel: ref.targetModel,
            targetProperty: ref.targetProperty,
            relationType: ref.relationType,
            onDelete: ref.onDelete,
            onUpdate: ref.onUpdate,
            createdBy: ref.createdBy,
          })),
        });
      }

      // 返回完整的模型数据
      return tx.sysLowcodeModel.findUnique({
        where: { id: model.id },
        include: {
          properties: true,
          references: true,
        },
      });
    });

    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    const model = await this.prisma.sysLowcodeModel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.tableName && { tableName: data.tableName }),
        ...(data.status && { status: data.status }),
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
      include: {
        properties: true,
        references: true,
      },
    });

    return this.mapToEntity(model);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sysLowcodeModel.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodeModelEntity> {
    const model = await this.prisma.sysLowcodeModel.update({
      where: { id },
      data: {
        status: status as any,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        properties: true,
        references: true,
      },
    });

    return this.mapToEntity(model);
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