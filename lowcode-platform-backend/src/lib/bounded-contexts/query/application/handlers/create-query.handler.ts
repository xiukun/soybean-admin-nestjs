import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MultiTableQuery, QueryStatus } from '../../domain/multi-table-query.model';
import { QueryRepository } from '../../infrastructure/query.repository';
import {
  CreateQueryCommand,
  UpdateQueryCommand,
  DeleteQueryCommand,
  ExecuteQueryCommand,
  ActivateQueryCommand,
  DeactivateQueryCommand,
} from '../commands/create-query.command';

@CommandHandler(CreateQueryCommand)
export class CreateQueryHandler implements ICommandHandler<CreateQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: CreateQueryCommand): Promise<MultiTableQuery> {
    // 检查项目中是否已存在同名查询
    const existingQuery = await this.queryRepository.findByProjectAndName(
      command.projectId,
      command.name,
    );
    if (existingQuery) {
      throw new ConflictException(
        `Query with name '${command.name}' already exists in this project`,
      );
    }

    const query = MultiTableQuery.create({
      projectId: command.projectId,
      name: command.name,
      description: command.description,
      baseEntityId: command.baseEntityId,
      baseEntityAlias: command.baseEntityAlias,
      joins: command.joins,
      fields: command.fields,
      filters: command.filters,
      sorting: command.sorting,
      groupBy: command.groupBy,
      having: command.having,
      limit: command.limit,
      offset: command.offset,
      createdBy: command.createdBy,
    });

    return this.queryRepository.save(query);
  }
}

@CommandHandler(UpdateQueryCommand)
export class UpdateQueryHandler implements ICommandHandler<UpdateQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: UpdateQueryCommand): Promise<MultiTableQuery> {
    const query = await this.queryRepository.findById(command.id);
    if (!query) {
      throw new NotFoundException(`Query with id '${command.id}' not found`);
    }

    query.update({
      name: command.name,
      description: command.description,
      baseEntityId: command.baseEntityId,
      baseEntityAlias: command.baseEntityAlias,
      joins: command.joins,
      fields: command.fields,
      filters: command.filters,
      sorting: command.sorting,
      groupBy: command.groupBy,
      having: command.having,
      limit: command.limit,
      offset: command.offset,
      updatedBy: command.updatedBy,
    });

    return this.queryRepository.save(query);
  }
}

@CommandHandler(DeleteQueryCommand)
export class DeleteQueryHandler implements ICommandHandler<DeleteQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: DeleteQueryCommand): Promise<void> {
    const query = await this.queryRepository.findById(command.id);
    if (!query) {
      throw new NotFoundException(`Query with id '${command.id}' not found`);
    }

    await this.queryRepository.delete(command.id);
  }
}

@CommandHandler(ExecuteQueryCommand)
export class ExecuteQueryHandler implements ICommandHandler<ExecuteQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: ExecuteQueryCommand): Promise<any> {
    const query = await this.queryRepository.findById(command.id);
    if (!query) {
      throw new NotFoundException(`Query with id '${command.id}' not found`);
    }

    if (query.status !== QueryStatus.ACTIVE) {
      throw new ConflictException('Query must be active to execute');
    }

    return this.queryRepository.execute(command.id, command.parameters);
  }
}

@CommandHandler(ActivateQueryCommand)
export class ActivateQueryHandler implements ICommandHandler<ActivateQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: ActivateQueryCommand): Promise<MultiTableQuery> {
    const query = await this.queryRepository.findById(command.id);
    if (!query) {
      throw new NotFoundException(`Query with id '${command.id}' not found`);
    }

    query.activate();
    return this.queryRepository.save(query);
  }
}

@CommandHandler(DeactivateQueryCommand)
export class DeactivateQueryHandler implements ICommandHandler<DeactivateQueryCommand> {
  constructor(
    @Inject('QueryRepository')
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(command: DeactivateQueryCommand): Promise<MultiTableQuery> {
    const query = await this.queryRepository.findById(command.id);
    if (!query) {
      throw new NotFoundException(`Query with id '${command.id}' not found`);
    }

    query.deactivate();
    return this.queryRepository.save(query);
  }
}
