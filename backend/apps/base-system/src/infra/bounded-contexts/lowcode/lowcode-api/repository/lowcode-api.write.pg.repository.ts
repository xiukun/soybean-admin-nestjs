import { Injectable } from '@nestjs/common';

import { CreateLowcodeApiEntity, LowcodeApiEntity, UpdateLowcodeApiEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/domain/lowcode-api.entity';
import { LowcodeApiWriteRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/ports/lowcode-api.write.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodeApiWritePostgresRepository implements LowcodeApiWriteRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLowcodeApiEntity): Promise<LowcodeApiEntity> {
    const api = await this.prisma.sysLowcodeApi.create({
      data: {
        name: data.name,
        path: data.path,
        method: data.method,
        description: data.description,
        modelId: data.modelId,
        requestSchema: data.requestSchema,
        responseSchema: data.responseSchema,
        status: data.status,
        createdBy: data.createdBy,
      },
    });

    return this.mapToEntity(api);
  }

  async update(id: string, data: UpdateLowcodeApiEntity): Promise<LowcodeApiEntity> {
    const api = await this.prisma.sysLowcodeApi.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.path && { path: data.path }),
        ...(data.method && { method: data.method }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.modelId !== undefined && { modelId: data.modelId }),
        ...(data.requestSchema !== undefined && { requestSchema: data.requestSchema }),
        ...(data.responseSchema !== undefined && { responseSchema: data.responseSchema }),
        ...(data.status && { status: data.status }),
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(api);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sysLowcodeApi.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodeApiEntity> {
    const api = await this.prisma.sysLowcodeApi.update({
      where: { id },
      data: {
        status: status as any,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(api);
  }

  private mapToEntity(api: any): LowcodeApiEntity {
    return {
      id: api.id,
      name: api.name,
      path: api.path,
      method: api.method,
      description: api.description,
      modelId: api.modelId,
      requestSchema: api.requestSchema,
      responseSchema: api.responseSchema,
      status: api.status,
      createdAt: api.createdAt,
      createdBy: api.createdBy,
      updatedAt: api.updatedAt,
      updatedBy: api.updatedBy,
    };
  }
}