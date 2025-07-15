import { ICommand } from '@nestjs/cqrs';

export class LowcodePageDeleteCommand implements ICommand {
  constructor(readonly id: string) {}
}
