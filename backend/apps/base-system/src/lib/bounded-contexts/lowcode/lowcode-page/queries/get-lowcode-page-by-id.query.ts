import { Inject, Injectable } from '@nestjs/common';

import { LowcodePageReadRepoPortToken } from '../constants';
import { LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';

@Injectable()
export class GetLowcodePageByIdQuery {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
  ) {}

  async execute(id: string): Promise<LowcodePageEntity | null> {
    return this.lowcodePageReadRepo.findById(id);
  }
}