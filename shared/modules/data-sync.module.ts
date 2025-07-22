import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DataSyncService } from '../services/data-sync.service';
import { DataSyncController } from '../controllers/data-sync.controller';
import { ServiceCommunicationModule } from './service-communication.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    ServiceCommunicationModule,
  ],
  controllers: [DataSyncController],
  providers: [DataSyncService],
  exports: [DataSyncService],
})
export class DataSyncModule {}
