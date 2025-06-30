import { Inject, Injectable } from '@nestjs/common';

import { LowcodePageReadRepoPortToken } from '../constants';
import { LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';

@Injectable()
export class GetLowcodePageByCodeQuery {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
  ) {}

  async execute(code: string): Promise<LowcodePageEntity | null> {
    return this.lowcodePageReadRepo.findByCode(code);
  }
}