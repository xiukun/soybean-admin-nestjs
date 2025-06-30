import { Module } from '@nestjs/common';

import {
  LowcodePageReadRepoPortToken,
  LowcodePageWriteRepoPortToken,
} from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/constants';
import { LowcodePageModule } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-page/lowcode-page.module';

import { LowcodePageReadPostgresRepository } from './repository/lowcode-page.read.pg.repository';
import { LowcodePageWritePostgresRepository } from './repository/lowcode-page.write.pg.repository';

const providers = [
  { provide: LowcodePageReadRepoPortToken, useClass: LowcodePageReadPostgresRepository },
  { provide: LowcodePageWriteRepoPortToken, useClass: LowcodePageWritePostgresRepository },
];

@Module({
  imports: [
    LowcodePageModule.register({
      inject: [...providers],
      imports: [],
    }),
  ],
  exports: [LowcodePageModule],
})
export class LowcodePageInfraModule {}