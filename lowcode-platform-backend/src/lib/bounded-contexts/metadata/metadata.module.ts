import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { MetadataAggregatorService } from './application/services/metadata-aggregator.service';

@Module({
  imports: [PrismaModule],
  providers: [MetadataAggregatorService],
  exports: [MetadataAggregatorService],
})
export class MetadataModule {}
