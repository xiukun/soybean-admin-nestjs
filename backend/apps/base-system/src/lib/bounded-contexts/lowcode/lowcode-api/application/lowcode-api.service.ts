import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import { CreateLowcodeApiCommand } from '../commands/create-lowcode-api.command';
import { CreateLowcodeApiEntity, LowcodeApiEntity } from '../domain/lowcode-api.entity';
import { GetLowcodeApiByIdQuery } from '../queries/get-lowcode-api-by-id.query';
import { GetLowcodeApisQuery, GetLowcodeApisQueryParams, GetLowcodeApisQueryResult } from '../queries/get-lowcode-apis.query';

@Injectable()
export class LowcodeApiService {
  constructor(
    private readonly createLowcodeApiCommand: CreateLowcodeApiCommand,
    private readonly getLowcodeApiByIdQuery: GetLowcodeApiByIdQuery,
    private readonly getLowcodeApisQuery: GetLowcodeApisQuery,
  ) {}

  async create(data: CreateLowcodeApiEntity): Promise<LowcodeApiEntity> {
    return this.createLowcodeApiCommand.execute(data);
  }

  async findById(id: string): Promise<LowcodeApiEntity | null> {
    return this.getLowcodeApiByIdQuery.execute(id);
  }

  async findAll(params?: GetLowcodeApisQueryParams): Promise<GetLowcodeApisQueryResult> {
    return this.getLowcodeApisQuery.execute(params);
  }
}