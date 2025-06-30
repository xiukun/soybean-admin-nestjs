import { Inject, Injectable } from '@nestjs/common';

import { LowcodePageReadRepoPortToken } from '../constants';
import { LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';

export interface GetLowcodePagesQueryParams {
  current?: number;
  size?: number;
  search?: string;
  status?: string;
}

export interface GetLowcodePagesQueryResult {
  records: LowcodePageEntity[];
  total: number;
  current: number;
  size: number;
}

@Injectable()
export class GetLowcodePagesQuery {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
  ) {}

  async execute(params?: GetLowcodePagesQueryParams): Promise<GetLowcodePagesQueryResult> {
    return this.lowcodePageReadRepo.findAll(params);
  }
}