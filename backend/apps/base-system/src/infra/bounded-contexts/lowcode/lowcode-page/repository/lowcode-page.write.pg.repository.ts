import { Injectable } from '@nestjs/common';

import { CreateLowcodePageEntity, LowcodePageEntity, UpdateLowcodePageEntity } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/domain/lowcode-page.entity';
import { LowcodePageWriteRepoPort } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/ports/lowcode-page.write.repo.port';

import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LowcodePageWritePostgresRepository implements LowcodePageWriteRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLowcodePageEntity): Promise<LowcodePageEntity> {
    const page = await this.prisma.sysLowcodePage.create({
      data: {
        name: data.name,
        title: data.title,
        code: data.code,
        description: data.description,
        path: data.path,
        schema: data.schema,
        menuId: data.menuId,
        status: data.status,
        createdBy: data.createdBy,
      },
    });

    return this.mapToEntity(page);
  }

  async update(id: string, data: UpdateLowcodePageEntity): Promise<LowcodePageEntity> {
    const page = await this.prisma.sysLowcodePage.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.title && { title: data.title }),
        ...(data.code && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.path && { path: data.path }),
        ...(data.schema && { schema: data.schema }),
        ...(data.menuId !== undefined && { menuId: data.menuId }),
        ...(data.status && { status: data.status }),
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(page);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sysLowcodePage.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodePageEntity> {
    const page = await this.prisma.sysLowcodePage.update({
      where: { id },
      data: {
        status: status as any,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(page);
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