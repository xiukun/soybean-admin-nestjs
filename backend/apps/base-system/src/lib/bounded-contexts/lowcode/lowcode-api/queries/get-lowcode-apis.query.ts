import { Inject, Injectable } from '@nestjs/common';

import { LowcodeApiReadRepoPortToken } from '../constants';
import { LowcodeApiEntity } from '../domain/lowcode-api.entity';
import { LowcodeApiReadRepoPort } from '../ports/lowcode-api.read.repo.port';

export interface GetLowcodeApisQueryParams {
  current?: number;
  size?: number;
  search?: string;
  status?: string;
  method?: string;
}

export interface GetLowcodeApisQueryResult {
  records: LowcodeApiEntity[];
  total: number;
  current: number;
  size: number;
}

@Injectable()
export class GetLowcodeApisQuery {
  constructor(
    @Inject(LowcodeApiReadRepoPortToken)
    private readonly lowcodeApiReadRepo: LowcodeApiReadRepoPort,
  ) {}

  async execute(params?: GetLowcodeApisQueryParams): Promise<GetLowcodeApisQueryResult> {
    return this.lowcodeApiReadRepo.findAll(params);
  }
}