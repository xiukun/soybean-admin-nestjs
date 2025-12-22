import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePageVersionByIdQuery implements IQuery {
  constructor(
    readonly pageId: string,
    readonly versionId: string,
  ) {}
}
