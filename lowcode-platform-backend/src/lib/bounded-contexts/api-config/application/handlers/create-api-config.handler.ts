import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateApiConfigCommand } from '../commands/create-api-config.command';
import { ApiConfig } from '../../domain/api-config.model';
import { ApiConfigRepository } from '../../domain/api-config.repository';

@CommandHandler(CreateApiConfigCommand)
export class CreateApiConfigHandler implements ICommandHandler<CreateApiConfigCommand> {
  constructor(
    @Inject('ApiConfigRepository')
    private readonly apiConfigRepository: ApiConfigRepository,
  ) {}

  async execute(command: CreateApiConfigCommand): Promise<ApiConfig> {
    // 检查API代码是否已存在
    const existingApiByCode = await this.apiConfigRepository.existsByCode(
      command.projectId,
      command.code,
    );

    if (existingApiByCode) {
      throw new ConflictException(
        `API with code '${command.code}' already exists in this project`,
      );
    }

    // 检查API路径和方法组合是否已存在
    const existingApiByPath = await this.apiConfigRepository.existsByPath(
      command.projectId,
      command.method,
      command.path,
    );

    if (existingApiByPath) {
      throw new ConflictException(
        `API with method '${command.method}' and path '${command.path}' already exists in this project`,
      );
    }

    // 创建API配置
    const apiConfig = ApiConfig.create({
      projectId: command.projectId,
      name: command.name,
      code: command.code,
      method: command.method,
      path: command.path,
      description: command.description,
      entityId: command.entityId,
      parameters: command.parameters,
      responses: command.responses,
      security: command.security,
      config: command.config,
      createdBy: command.createdBy || 'system',
    });

    // 保存API配置
    return await this.apiConfigRepository.save(apiConfig);
  }
}
