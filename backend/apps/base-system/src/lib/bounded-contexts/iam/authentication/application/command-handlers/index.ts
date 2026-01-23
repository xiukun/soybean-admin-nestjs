import { UserBatchDeleteHandler } from './user-batch-delete.command.handler';
import { UserCreateHandler } from './user-create.command.handler';
import { UserDeleteHandler } from './user-delete.command.handler';
import { UserUpdateHandler } from './user-update.command.handler';

export const PubSubCommandHandlers = [
  UserCreateHandler,
  UserUpdateHandler,
  UserDeleteHandler,
  UserBatchDeleteHandler,
];
