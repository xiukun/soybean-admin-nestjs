import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { GetLowcodePageVersionsQuery } from '@lowcode/page/queries/get-lowcode-page-versions.query';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePageVersionReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@QueryHandler(GetLowcodePageVersionsQuery)
export class GetLowcodePageVersionsQueryHandler implements IQueryHandler<GetLowcodePageVersionsQuery> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(query: GetLowcodePageVersionsQuery): Promise<LowcodePageVersionReadModel[]> {
    // Check if page exists
    const page = await this.lowcodePageRepository.findById(query.pageId);
    if (!page) {
      throw new NotFoundException(`Page with id '${query.pageId}' not found`);
    }

    const versions = await this.lowcodePageRepository.findVersionsByPageId(query.pageId);

    return versions.map(version => ({
      id: version.id!,
      pageId: version.pageId,
      version: version.version,
      schema: version.schema,
      changelog: version.changelog || null,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    }));
  }
}
