import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MonitoringService } from '../services/monitoring.service';
import { MonitoringController } from '../controllers/monitoring.controller';
import { HealthController } from '../controllers/health.controller';
import { ServiceCommunicationModule } from './service-communication.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    ServiceCommunicationModule,
  ],
  controllers: [MonitoringController, HealthController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
