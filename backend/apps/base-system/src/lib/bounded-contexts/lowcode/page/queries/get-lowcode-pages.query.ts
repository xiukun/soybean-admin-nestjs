import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePagesQuery implements IQuery {
  constructor(
    readonly page: number = 1,
    readonly perPage: number = 10,
    readonly search?: string,
  ) {}
}
