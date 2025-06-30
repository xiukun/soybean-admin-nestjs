import { Module } from '@nestjs/common';

import {
  LowcodeModelReadRepoPortToken,
  LowcodeModelWriteRepoPortToken,
} from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/constants';
import { LowcodeModelModule } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-model/lowcode-model.module';

import { LowcodeModelReadPostgresRepository } from './repository/lowcode-model.read.pg.repository';
import { LowcodeModelWritePostgresRepository } from './repository/lowcode-model.write.pg.repository';

const providers = [
  { provide: LowcodeModelReadRepoPortToken, useClass: LowcodeModelReadPostgresRepository },
  { provide: LowcodeModelWriteRepoPortToken, useClass: LowcodeModelWritePostgresRepository },
];

@Module({
  imports: [
    LowcodeModelModule.register({
      inject: [...providers],
      imports: [],
    }),
  ],
  exports: [LowcodeModelModule],
})
export class LowcodeModelInfraModule {}