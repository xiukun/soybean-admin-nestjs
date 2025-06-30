import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import { CreateLowcodePageCommand } from '../commands/create-lowcode-page.command';
import { DeleteLowcodePageCommand } from '../commands/delete-lowcode-page.command';
import { UpdateLowcodePageStatusCommand } from '../commands/update-lowcode-page-status.command';
import { UpdateLowcodePageCommand } from '../commands/update-lowcode-page.command';
import { CreateLowcodePageEntity, UpdateLowcodePageEntity, LowcodePageEntity } from '../domain/lowcode-page.entity';
import { GetLowcodePageByCodeQuery } from '../queries/get-lowcode-page-by-code.query';
import { GetLowcodePageByIdQuery } from '../queries/get-lowcode-page-by-id.query';
import { GetLowcodePagesQuery, GetLowcodePagesQueryParams, GetLowcodePagesQueryResult } from '../queries/get-lowcode-pages.query';

@Injectable()
export class LowcodePageService {
  constructor(
    private readonly createLowcodePageCommand: CreateLowcodePageCommand,
    private readonly updateLowcodePageCommand: UpdateLowcodePageCommand,
    private readonly deleteLowcodePageCommand: DeleteLowcodePageCommand,
    private readonly updateLowcodePageStatusCommand: UpdateLowcodePageStatusCommand,
    private readonly getLowcodePageByIdQuery: GetLowcodePageByIdQuery,
    private readonly getLowcodePageByCodeQuery: GetLowcodePageByCodeQuery,
    private readonly getLowcodePagesQuery: GetLowcodePagesQuery,
  ) {}

  async create(data: CreateLowcodePageEntity): Promise<LowcodePageEntity> {
    return this.createLowcodePageCommand.execute(data);
  }

  async update(id: string, data: UpdateLowcodePageEntity): Promise<LowcodePageEntity> {
    return this.updateLowcodePageCommand.execute(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteLowcodePageCommand.execute(id);
  }

  async updateStatus(id: string, status: Status, updatedBy: string): Promise<LowcodePageEntity> {
    return this.updateLowcodePageStatusCommand.execute(id, status, updatedBy);
  }

  async findById(id: string): Promise<LowcodePageEntity | null> {
    return this.getLowcodePageByIdQuery.execute(id);
  }

  async findByCode(code: string): Promise<LowcodePageEntity | null> {
    return this.getLowcodePageByCodeQuery.execute(code);
  }

  async findAll(params?: GetLowcodePagesQueryParams): Promise<GetLowcodePagesQueryResult> {
    return this.getLowcodePagesQuery.execute(params);
  }
}