import { Inject, Injectable } from '@nestjs/common';

import { LowcodeModelReadRepoPortToken } from '../constants';
import { LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';

@Injectable()
export class GetLowcodeModelByCodeQuery {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
  ) {}

  async execute(code: string): Promise<LowcodeModelEntity | null> {
    return this.lowcodeModelReadRepo.findByCode(code);
  }
}