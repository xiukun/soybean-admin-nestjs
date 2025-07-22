import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceCommunicationService } from '../services/service-communication.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ServiceCommunicationService],
  exports: [ServiceCommunicationService],
})
export class ServiceCommunicationModule {}
