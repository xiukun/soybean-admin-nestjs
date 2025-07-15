import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePageByCodeQuery implements IQuery {
  constructor(readonly code: string) {}
}
