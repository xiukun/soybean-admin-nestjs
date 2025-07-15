import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePageByIdQuery implements IQuery {
  constructor(readonly id: string) {}
}
