import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { 
  GetTemplatesQuery, 
  GetTemplateByIdQuery, 
  GetTemplateByCodeQuery,
  GetTemplateVersionsQuery 
} from '../queries/get-templates.query';

@Injectable()
@QueryHandler(GetTemplatesQuery)
export class GetTemplatesHandler implements IQueryHandler<GetTemplatesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplatesQuery) {
    const { filters, pagination } = query;
    const { page = 1, limit = 10, orderBy = 'createdAt', orderDir = 'desc' } = pagination || {};

    const where: any = {
      status: 'ACTIVE',
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.framework) {
      where.framework = filters.framework;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [options, total] = await Promise.all([
      (this.prisma as any).codeTemplate.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          language: true,
          framework: true,
          description: true,
          variables: true,
          tags: true,
          version: true,
          isPublic: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
        },
        orderBy: { [orderBy]: orderDir },
        skip,
        take: limit,
      }),
      (this.prisma as any).codeTemplate.count({ where }),
    ]);

    return {
      options: options.map((template: any) => ({
        ...template,
        variables: typeof template.variables === 'string' 
          ? JSON.parse(template.variables) 
          : template.variables,
        tags: typeof template.tags === 'string'
          ? JSON.parse(template.tags)
          : template.tags,
      })),
      total,
      page: Number(page),
      perPage: Number(limit),
    };
  }
}

@Injectable()
@QueryHandler(GetTemplateByIdQuery)
export class GetTemplateByIdHandler implements IQueryHandler<GetTemplateByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplateByIdQuery) {
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { id: query.id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // 最近5个版本
        },
      },
    });

    if (!template) {
      return null;
    }

    return {
      ...template,
      variables: typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables,
      tags: typeof template.tags === 'string'
        ? JSON.parse(template.tags)
        : template.tags,
    };
  }
}

@Injectable()
@QueryHandler(GetTemplateByCodeQuery)
export class GetTemplateByCodeHandler implements IQueryHandler<GetTemplateByCodeQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplateByCodeQuery) {
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { code: query.code },
    });

    if (!template) {
      return null;
    }

    return {
      ...template,
      variables: typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables,
      tags: typeof template.tags === 'string'
        ? JSON.parse(template.tags)
        : template.tags,
    };
  }
}

@Injectable()
@QueryHandler(GetTemplateVersionsQuery)
export class GetTemplateVersionsHandler implements IQueryHandler<GetTemplateVersionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplateVersionsQuery) {
    const { templateId, pagination } = query;
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [options, total] = await Promise.all([
      (this.prisma as any).templateVersion.findMany({
        where: { templateId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).templateVersion.count({ where: { templateId } }),
    ]);

    return {
      options: options.map((version: any) => ({
        ...version,
        variables: typeof version.variables === 'string' 
          ? JSON.parse(version.variables) 
          : version.variables,
      })),
      total,
      page: Number(page),
      perPage: Number(limit),
    };
  }
}
