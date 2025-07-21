import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { GetTemplatesQuery } from '../get-templates.query';

@Injectable()
@QueryHandler(GetTemplatesQuery)
export class GetTemplatesHandler implements IQueryHandler<GetTemplatesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplatesQuery) {
    const { type, language, framework } = query;

    const where: any = {
      status: 'ACTIVE',
    };

    if (type) {
      where.type = type;
    }

    if (language) {
      where.language = language;
    }

    if (framework) {
      where.framework = framework;
    }

    const templates = await this.prisma.codeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        language: true,
        framework: true,
        description: true,
        variables: true,
        version: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return templates.map(template => ({
      ...template,
      variables: typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables,
    }));
  }
}
