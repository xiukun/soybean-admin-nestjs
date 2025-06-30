import { DynamicModule, Module } from '@nestjs/common';

import { LowcodeApiService } from './application/lowcode-api.service';
import { CreateLowcodeApiCommand } from './commands/create-lowcode-api.command';
import { GetLowcodeApiByIdQuery } from './queries/get-lowcode-api-by-id.query';
import { GetLowcodeApisQuery } from './queries/get-lowcode-apis.query';

@Module({})
export class LowcodeApiModule {
  static register(options: {
    inject: any[];
    imports: any[];
  }): DynamicModule {
    return {
      module: LowcodeApiModule,
      imports: options.imports,
      providers: [
        ...options.inject,
        LowcodeApiService,
        CreateLowcodeApiCommand,
        GetLowcodeApiByIdQuery,
        GetLowcodeApisQuery,
      ],
      exports: [LowcodeApiService],
    };
  }
}