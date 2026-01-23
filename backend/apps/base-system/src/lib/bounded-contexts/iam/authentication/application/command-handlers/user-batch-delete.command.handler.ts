import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { UserBatchDeleteCommand } from '../../commands/user-batch-delete.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import { User } from '../../domain/user';
import { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { UserWriteRepoPort } from '../../ports/user.write.repo-port';

@CommandHandler(UserBatchDeleteCommand)
export class UserBatchDeleteHandler
  implements ICommandHandler<UserBatchDeleteCommand, void>
{
  constructor(private readonly publisher: EventPublisher) {}
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;
  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  async execute(command: UserBatchDeleteCommand) {
    if (!command.ids || command.ids.length === 0) {
      throw new BadRequestException('User IDs array cannot be empty.');
    }

    // 验证所有用户是否存在
    for (const id of command.ids) {
      const existingUser = await this.userReadRepoPort.findUserById(id);
      if (!existingUser) {
        throw new BadRequestException(
          `A user with the specified ID (${id}) does not exist.`,
        );
      }
    }

    // 批量删除用户
    for (const id of command.ids) {
      const existingUser = await this.userReadRepoPort.findUserById(id);
      if (existingUser) {
        const user = new User(existingUser);
        await this.userWriteRepository.deleteById(user.id);
        await user.deleted();
        this.publisher.mergeObjectContext(user);
        user.commit();
      }
    }
  }
}
