import { NotFoundException, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { LowcodePageReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';
import { GetLowcodePageByCodeQuery } from '@lowcode/page/queries/get-lowcode-page-by-code.query';

@QueryHandler(GetLowcodePageByCodeQuery)
export class GetLowcodePageByCodeQueryHandler implements IQueryHandler<GetLowcodePageByCodeQuery> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(query: GetLowcodePageByCodeQuery): Promise<LowcodePageReadModel> {
    const page = await this.lowcodePageRepository.findByCode(query.code);
    if (!page) {
      throw new NotFoundException(`Page with code '${query.code}' not found`);
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
