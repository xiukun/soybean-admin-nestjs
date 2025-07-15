import { IQuery } from '@nestjs/cqrs';

export class GetLowcodePageByMenuQuery implements IQuery {
  constructor(readonly menuId: number) {}
}
