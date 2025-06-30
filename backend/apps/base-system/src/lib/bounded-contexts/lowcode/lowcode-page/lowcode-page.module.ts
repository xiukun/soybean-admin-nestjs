import { DynamicModule, Module } from '@nestjs/common';

import { LowcodePageService } from './application/lowcode-page.service';
import { CreateLowcodePageCommand } from './commands/create-lowcode-page.command';
import { DeleteLowcodePageCommand } from './commands/delete-lowcode-page.command';
import { UpdateLowcodePageStatusCommand } from './commands/update-lowcode-page-status.command';
import { UpdateLowcodePageCommand } from './commands/update-lowcode-page.command';
import { GetLowcodePageByCodeQuery } from './queries/get-lowcode-page-by-code.query';
import { GetLowcodePageByIdQuery } from './queries/get-lowcode-page-by-id.query';
import { GetLowcodePagesQuery } from './queries/get-lowcode-pages.query';

@Module({})
export class LowcodePageModule {
  static register(options: {
    inject: any[];
    imports: any[];
  }): DynamicModule {
    return {
      module: LowcodePageModule,
      imports: options.imports,
      providers: [
        ...options.inject,
        LowcodePageService,
        CreateLowcodePageCommand,
        UpdateLowcodePageCommand,
        DeleteLowcodePageCommand,
        UpdateLowcodePageStatusCommand,
        GetLowcodePageByIdQuery,
        GetLowcodePageByCodeQuery,
        GetLowcodePagesQuery,
      ],
      exports: [LowcodePageService],
    };
  }
}