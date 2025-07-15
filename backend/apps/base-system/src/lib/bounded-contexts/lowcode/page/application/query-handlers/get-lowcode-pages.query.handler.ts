import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetLowcodePagesQuery } from '@lowcode/page/queries/get-lowcode-pages.query';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePageReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@QueryHandler(GetLowcodePagesQuery)
export class GetLowcodePagesQueryHandler implements IQueryHandler<GetLowcodePagesQuery> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(query: GetLowcodePagesQuery): Promise<{
    items: LowcodePageReadModel[];
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const { items, total } = await this.lowcodePageRepository.findAll(
      query.page,
      query.perPage,
      query.search,
    );

    const totalPages = Math.ceil(total / query.perPage);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    const readModels: LowcodePageReadModel[] = items.map(item => ({
      id: item.id!,
      name: item.name,
      title: item.title,
      code: item.code,
      description: item.description || null,
      schema: item.schema,
      status: item.status,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
      updatedAt: item.updatedAt || null,
      updatedBy: item.updatedBy || null,
    }));

    return {
      items: readModels,
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
