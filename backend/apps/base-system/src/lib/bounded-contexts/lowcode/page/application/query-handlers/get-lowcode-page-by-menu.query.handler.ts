import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { GetLowcodePageByMenuQuery } from '@lowcode/page/queries/get-lowcode-page-by-menu.query';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePageReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@QueryHandler(GetLowcodePageByMenuQuery)
export class GetLowcodePageByMenuQueryHandler implements IQueryHandler<GetLowcodePageByMenuQuery> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(query: GetLowcodePageByMenuQuery): Promise<LowcodePageReadModel | null> {
    const page = await this.lowcodePageRepository.findByMenuId(query.menuId);
    
    if (!page) {
      return null; // Return null instead of throwing error, as menu might not have a lowcode page
    }

    return {
      id: page.id!,
      name: page.name,
      title: page.title,
      code: page.code,
      description: page.description || null,
      schema: page.schema,
      status: page.status,
      createdAt: page.createdAt,
      createdBy: page.createdBy,
      updatedAt: page.updatedAt || null,
      updatedBy: page.updatedBy || null,
    };
  }
}
