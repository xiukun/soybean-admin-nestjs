import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateApiCommand } from '../commands/create-api.command';
import { Api } from '../../domain/api.model';
import { ApiRepository } from '../../domain/api.repository';

@CommandHandler(CreateApiCommand)
export class CreateApiHandler implements ICommandHandler<CreateApiCommand> {
  constructor(
    @Inject('ApiRepository')
    private readonly apiRepository: ApiRepository,
  ) {}

  async execute(command: CreateApiCommand): Promise<Api> {
    // 检查API代码是否已存在
    const existingApi = await this.apiRepository.findByCode(
      command.projectId,
      command.code,
    );

    if (existingApi) {
      throw new ConflictException(
        `API with code '${command.code}' already exists in this project`,
      );
    }

    // 检查路径和方法组合是否已存在
    const existingPath = await this.apiRepository.existsByPath(
      command.projectId,
      command.path,
      command.method,
    );

    if (existingPath) {
      throw new ConflictException(
        `API with path '${command.path}' and method '${command.method}' already exists in this project`,
      );
    }

    // 创建API
    const api = Api.create({
      projectId: command.projectId,
      entityId: command.entityId,
      name: command.name,
      code: command.code,
      path: command.path,
      method: command.method,
      description: command.description,
      requestConfig: command.requestConfig,
      responseConfig: command.responseConfig,
      queryConfig: command.queryConfig,
      authConfig: command.authConfig,
      createdBy: command.createdBy || 'system',
    });

    // 保存API
    return await this.apiRepository.save(api);
  }
}
