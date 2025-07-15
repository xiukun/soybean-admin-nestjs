import { ICommand } from '@nestjs/cqrs';

export class LowcodePageVersionCreateCommand implements ICommand {
  constructor(
    readonly pageId: string,
    readonly version: string,
    readonly schema: any,
    readonly changelog: string | null,
    readonly uid: string,
  ) {}
}
