import { DynamicModule, Module } from '@nestjs/common';

import { LowcodeModelService } from './application/lowcode-model.service';
import { CreateLowcodeModelCommand } from './commands/create-lowcode-model.command';
import { DeleteLowcodeModelCommand } from './commands/delete-lowcode-model.command';
import { UpdateLowcodeModelStatusCommand } from './commands/update-lowcode-model-status.command';
import { UpdateLowcodeModelCommand } from './commands/update-lowcode-model.command';
import { GetLowcodeModelByCodeQuery } from './queries/get-lowcode-model-by-code.query';
import { GetLowcodeModelByIdQuery } from './queries/get-lowcode-model-by-id.query';
import { GetLowcodeModelsQuery } from './queries/get-lowcode-models.query';

@Module({})
export class LowcodeModelModule {
  static register(options: {
    inject: any[];
    imports: any[];
  }): DynamicModule {
    return {
      module: LowcodeModelModule,
      imports: options.imports,
      providers: [
        ...options.inject,
        LowcodeModelService,
        CreateLowcodeModelCommand,
        UpdateLowcodeModelCommand,
        DeleteLowcodeModelCommand,
        UpdateLowcodeModelStatusCommand,
        GetLowcodeModelByIdQuery,
        GetLowcodeModelByCodeQuery,
        GetLowcodeModelsQuery,
      ],
      exports: [LowcodeModelService],
    };
  }
}