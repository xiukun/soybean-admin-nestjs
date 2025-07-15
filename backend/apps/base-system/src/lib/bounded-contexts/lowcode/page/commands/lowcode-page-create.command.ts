import { ICommand } from '@nestjs/cqrs';
import { Status } from '@prisma/client';

export class LowcodePageCreateCommand implements ICommand {
  constructor(
    readonly name: string,
    readonly title: string,
    readonly code: string,
    readonly description: string | null,
    readonly schema: any,
    readonly status: Status,
    readonly changelog: string | null,
    readonly uid: string,
  ) {}
}
