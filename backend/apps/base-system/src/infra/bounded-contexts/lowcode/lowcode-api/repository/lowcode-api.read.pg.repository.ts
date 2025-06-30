import { Injectable } from '@nestjs/common';

import { LowcodeApiEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/domain/lowcode-api.entity';
import { LowcodeApiReadRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/ports/lowcode-api.read.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodeApiReadPostgresRepository implements LowcodeApiReadRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<LowcodeApiEntity | null> {
    const api = await this.prisma.sysLowcodeApi.findUnique({
      where: { id },
    });

    return api ? this.mapToEntity(api) : null;
  }

  async findByPathAndMethod(path: string, method: string): Promise<LowcodeApiEntity | null> {
    const api = await this.prisma.sysLowcodeApi.findUnique({
      where: {
        path_method: {
          path,
          method,
        },
      },
    });

    return api ? this.mapToEntity(api) : null;
  }

  async findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
    method?: string;
  }): Promise<{
    records: LowcodeApiEntity[];
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
        { path: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.method) {
      where.method = params.method;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysLowcodeApi.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysLowcodeApi.count({ where }),
    ]);

    return {
      records: data.map(this.mapToEntity),
      total,
      current,
      size,
    };
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