import { Inject, Injectable } from '@nestjs/common';

import { LowcodeModelReadRepoPortToken } from '../constants';
import { LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';

export interface GetLowcodeModelsQueryParams {
  current?: number;
  size?: number;
  search?: string;
  status?: string;
  withRelations?: boolean;
}

export interface GetLowcodeModelsQueryResult {
  records: LowcodeModelEntity[];
  total: number;
  current: number;
  size: number;
}

@Injectable()
export class GetLowcodeModelsQuery {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
  ) {}

  async execute(params?: GetLowcodeModelsQueryParams): Promise<GetLowcodeModelsQueryResult> {
    if (params?.withRelations) {
      return this.lowcodeModelReadRepo.findAllWithRelations(params);
    }
    return this.lowcodeModelReadRepo.findAll(params);
  }
}