import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CodeGeneratorService } from '@codegen/application/services/code-generator.service';

@Module({
  imports: [CqrsModule],
  providers: [
    CodeGeneratorService,
  ],
  exports: [
    CodeGeneratorService,
  ],
})
export class CodegenModule {}
