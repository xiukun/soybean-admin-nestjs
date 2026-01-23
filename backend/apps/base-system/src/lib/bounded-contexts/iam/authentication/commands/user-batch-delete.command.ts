import { ICommand } from '@nestjs/cqrs';

export class UserBatchDeleteCommand implements ICommand {
  constructor(readonly ids: string[]) {}
}
