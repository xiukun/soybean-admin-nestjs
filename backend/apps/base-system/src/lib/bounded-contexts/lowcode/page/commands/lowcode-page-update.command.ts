import { ICommand } from '@nestjs/cqrs';
import { Status } from '@prisma/client';

export class LowcodePageUpdateCommand implements ICommand {
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly title?: string,
    readonly description?: string | null,
    readonly schema?: any,
    readonly status?: Status,
    readonly changelog?: string | null,
    readonly uid?: string,
  ) {}
}
