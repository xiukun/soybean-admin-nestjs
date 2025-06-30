import { Injectable } from '@nestjs/common';

import { LowcodePageEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/ports/lowcode-page.read.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodePageReadPostgresRepository implements LowcodePageReadRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<LowcodePageEntity | null> {
    const page = await this.prisma.sysLowcodePage.findUnique({
      where: { id },
    });

    return page ? this.mapToEntity(page) : null;
  }

  async findByCode(code: string): Promise<LowcodePageEntity | null> {
    const page = await this.prisma.sysLowcodePage.findUnique({
      where: { code },
    });

    return page ? this.mapToEntity(page) : null;
  }

  async findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodePageEntity[];
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
        { title: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysLowcodePage.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysLowcodePage.count({ where }),
    ]);

    return {
      records: data.map(this.mapToEntity),
      total,
      current,
      size,
    };
  }

  private mapToEntity(page: any): LowcodePageEntity {
    return {
      id: page.id,
      name: page.name,
      title: page.title,
      code: page.code,
      description: page.description,
      path: page.path,
      schema: page.schema,
      menuId: page.menuId,
      status: page.status,
      createdAt: page.createdAt,
      createdBy: page.createdBy,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
    };
  }
}