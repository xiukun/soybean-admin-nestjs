import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { GetLowcodePageByIdQuery } from '@lowcode/page/queries/get-lowcode-page-by-id.query';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePageReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@QueryHandler(GetLowcodePageByIdQuery)
export class GetLowcodePageByIdQueryHandler implements IQueryHandler<GetLowcodePageByIdQuery> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(query: GetLowcodePageByIdQuery): Promise<LowcodePageReadModel> {
    const page = await this.lowcodePageRepository.findById(query.id);
    if (!page) {
      throw new NotFoundException(`Page with id '${query.id}' not found`);
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
