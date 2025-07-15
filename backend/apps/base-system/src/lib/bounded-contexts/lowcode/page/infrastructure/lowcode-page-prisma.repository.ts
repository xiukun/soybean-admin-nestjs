import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePage, LowcodePageCreateProperties, LowcodePageUpdateProperties } from '@lowcode/page/domain/lowcode-page.model';
import { LowcodePageVersion, LowcodePageVersionCreateProperties } from '@lowcode/page/domain/lowcode-page-version.model';

@Injectable()
export class LowcodePagePrismaRepository implements ILowcodePageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(pageData: LowcodePageCreateProperties): Promise<LowcodePage> {
    const createdPage = await this.prisma.sysLowcodePage.create({
      data: {
        name: pageData.name,
        title: pageData.title,
        code: pageData.code,
        description: pageData.description,
        schema: pageData.schema,
        status: pageData.status,
        createdAt: pageData.createdAt,
        createdBy: pageData.createdBy,
      },
    });

    return LowcodePage.create({
      id: createdPage.id,
      name: createdPage.name,
      title: createdPage.title,
      code: createdPage.code,
      description: createdPage.description,
      schema: createdPage.schema,
      status: createdPage.status,
      createdAt: createdPage.createdAt,
      createdBy: createdPage.createdBy,
      updatedAt: createdPage.updatedAt,
      updatedBy: createdPage.updatedBy,
    });
  }

  async update(pageData: LowcodePageUpdateProperties): Promise<LowcodePage> {
    const updateData: any = {};
    
    if (pageData.name !== undefined) updateData.name = pageData.name;
    if (pageData.title !== undefined) updateData.title = pageData.title;
    if (pageData.description !== undefined) updateData.description = pageData.description;
    if (pageData.schema !== undefined) updateData.schema = pageData.schema;
    if (pageData.status !== undefined) updateData.status = pageData.status;
    if (pageData.updatedAt !== undefined) updateData.updatedAt = pageData.updatedAt;
    if (pageData.updatedBy !== undefined) updateData.updatedBy = pageData.updatedBy;

    const updatedPage = await this.prisma.sysLowcodePage.update({
      where: { id: pageData.id },
      data: updateData,
    });

    return LowcodePage.create({
      id: updatedPage.id,
      name: updatedPage.name,
      title: updatedPage.title,
      code: updatedPage.code,
      description: updatedPage.description,
      schema: updatedPage.schema,
      status: updatedPage.status,
      createdAt: updatedPage.createdAt,
      createdBy: updatedPage.createdBy,
      updatedAt: updatedPage.updatedAt,
      updatedBy: updatedPage.updatedBy,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sysLowcodePage.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<LowcodePage | null> {
    const page = await this.prisma.sysLowcodePage.findUnique({
      where: { id },
    });

    if (!page) return null;

    return LowcodePage.create({
      id: page.id,
      name: page.name,
      title: page.title,
      code: page.code,
      description: page.description,
      schema: page.schema,
      status: page.status,
      createdAt: page.createdAt,
      createdBy: page.createdBy,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
    });
  }

  async findByCode(code: string): Promise<LowcodePage | null> {
    const page = await this.prisma.sysLowcodePage.findUnique({
      where: { code },
    });

    if (!page) return null;

    return LowcodePage.create({
      id: page.id,
      name: page.name,
      title: page.title,
      code: page.code,
      description: page.description,
      schema: page.schema,
      status: page.status,
      createdAt: page.createdAt,
      createdBy: page.createdBy,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
    });
  }

  async findByMenuId(menuId: number): Promise<LowcodePage | null> {
    // First find the menu to get the lowcodePageId
    const menu = await this.prisma.sysMenu.findUnique({
      where: { id: menuId },
      select: { lowcodePageId: true },
    });

    if (!menu || !menu.lowcodePageId) return null;

    // Then find the lowcode page
    const page = await this.prisma.sysLowcodePage.findUnique({
      where: { id: menu.lowcodePageId },
    });

    if (!page) return null;

    return LowcodePage.create({
      id: page.id,
      name: page.name,
      title: page.title,
      code: page.code,
      description: page.description,
      schema: page.schema,
      status: page.status,
      createdAt: page.createdAt,
      createdBy: page.createdBy,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
    });
  }

  async findAll(page: number, perPage: number, search?: string): Promise<{
    items: LowcodePage[];
    total: number;
  }> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.sysLowcodePage.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysLowcodePage.count({ where }),
    ]);

    const lowcodePages = items.map(item =>
      LowcodePage.create({
        id: item.id,
        name: item.name,
        title: item.title,
        code: item.code,
        description: item.description,
        schema: item.schema,
        status: item.status,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy,
      })
    );

    return { items: lowcodePages, total };
  }

  async createVersion(versionData: LowcodePageVersionCreateProperties): Promise<LowcodePageVersion> {
    const createdVersion = await this.prisma.sysLowcodePageVersion.create({
      data: {
        pageId: versionData.pageId,
        version: versionData.version,
        schema: versionData.schema,
        changelog: versionData.changelog,
        createdAt: versionData.createdAt,
        createdBy: versionData.createdBy,
      },
    });

    return LowcodePageVersion.create({
      id: createdVersion.id,
      pageId: createdVersion.pageId,
      version: createdVersion.version,
      schema: createdVersion.schema,
      changelog: createdVersion.changelog,
      createdAt: createdVersion.createdAt,
      createdBy: createdVersion.createdBy,
    });
  }

  async findVersionsByPageId(pageId: string): Promise<LowcodePageVersion[]> {
    const versions = await this.prisma.sysLowcodePageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });

    return versions.map(version =>
      LowcodePageVersion.create({
        id: version.id,
        pageId: version.pageId,
        version: version.version,
        schema: version.schema,
        changelog: version.changelog,
        createdAt: version.createdAt,
        createdBy: version.createdBy,
      })
    );
  }

  async findVersionById(id: string): Promise<LowcodePageVersion | null> {
    const version = await this.prisma.sysLowcodePageVersion.findUnique({
      where: { id },
    });

    if (!version) return null;

    return LowcodePageVersion.create({
      id: version.id,
      pageId: version.pageId,
      version: version.version,
      schema: version.schema,
      changelog: version.changelog,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    });
  }
}
