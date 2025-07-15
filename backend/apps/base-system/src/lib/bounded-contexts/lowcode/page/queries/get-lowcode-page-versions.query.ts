import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePageVersionsQuery implements IQuery {
  constructor(readonly pageId: string) {}
}
