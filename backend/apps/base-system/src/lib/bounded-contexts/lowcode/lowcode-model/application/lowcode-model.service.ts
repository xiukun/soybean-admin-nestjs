import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import { CreateLowcodeModelCommand } from '../commands/create-lowcode-model.command';
import { DeleteLowcodeModelCommand } from '../commands/delete-lowcode-model.command';
import { UpdateLowcodeModelStatusCommand } from '../commands/update-lowcode-model-status.command';
import { UpdateLowcodeModelCommand } from '../commands/update-lowcode-model.command';
import { CreateLowcodeModelEntity, UpdateLowcodeModelEntity, LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { GetLowcodeModelByCodeQuery } from '../queries/get-lowcode-model-by-code.query';
import { GetLowcodeModelByIdQuery } from '../queries/get-lowcode-model-by-id.query';
import { GetLowcodeModelsQuery, GetLowcodeModelsQueryParams, GetLowcodeModelsQueryResult } from '../queries/get-lowcode-models.query';

@Injectable()
export class LowcodeModelService {
  constructor(
    private readonly createLowcodeModelCommand: CreateLowcodeModelCommand,
    private readonly updateLowcodeModelCommand: UpdateLowcodeModelCommand,
    private readonly deleteLowcodeModelCommand: DeleteLowcodeModelCommand,
    private readonly updateLowcodeModelStatusCommand: UpdateLowcodeModelStatusCommand,
    private readonly getLowcodeModelByIdQuery: GetLowcodeModelByIdQuery,
    private readonly getLowcodeModelByCodeQuery: GetLowcodeModelByCodeQuery,
    private readonly getLowcodeModelsQuery: GetLowcodeModelsQuery,
  ) {}

  async create(data: CreateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    return this.createLowcodeModelCommand.execute(data);
  }

  async update(id: string, data: UpdateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    return this.updateLowcodeModelCommand.execute(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteLowcodeModelCommand.execute(id);
  }

  async updateStatus(id: string, status: Status, updatedBy: string): Promise<LowcodeModelEntity> {
    return this.updateLowcodeModelStatusCommand.execute(id, status, updatedBy);
  }

  async findById(id: string): Promise<LowcodeModelEntity | null> {
    return this.getLowcodeModelByIdQuery.execute(id);
  }

  async findByCode(code: string): Promise<LowcodeModelEntity | null> {
    return this.getLowcodeModelByCodeQuery.execute(code);
  }

  async findAll(params?: GetLowcodeModelsQueryParams): Promise<GetLowcodeModelsQueryResult> {
    return this.getLowcodeModelsQuery.execute(params);
  }
}