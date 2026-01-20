import { NotFoundException, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { LowcodePageVersionReadModel } from '@lowcode/page/domain/lowcode-page.read.model';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';
import { GetLowcodePageVersionByIdQuery } from '@lowcode/page/queries/get-lowcode-page-version-by-id.query';

@QueryHandler(GetLowcodePageVersionByIdQuery)
export class GetLowcodePageVersionByIdQueryHandler
  implements IQueryHandler<GetLowcodePageVersionByIdQuery>
{
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository,
  ) {}

  async execute(query: GetLowcodePageVersionByIdQuery): Promise<LowcodePageVersionReadModel> {
    // Check if page exists
    const page = await this.lowcodePageRepository.findById(query.pageId);
    if (!page) {
      throw new NotFoundException(`Page with id '${query.pageId}' not found`);
    }

    // Get the specific version
    const version = await this.lowcodePageRepository.findVersionById(query.versionId);
    if (!version) {
      throw new NotFoundException(`Version with id '${query.versionId}' not found`);
    }

    // Verify the version belongs to the page
    if (version.pageId !== query.pageId) {
      throw new NotFoundException(
        `Version '${query.versionId}' does not belong to page '${query.pageId}'`,
      );
    }

    return {
      id: version.id!,
      pageId: version.pageId,
      version: version.version,
      schema: version.schema,
      changelog: version.changelog || null,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    };
  }
}
