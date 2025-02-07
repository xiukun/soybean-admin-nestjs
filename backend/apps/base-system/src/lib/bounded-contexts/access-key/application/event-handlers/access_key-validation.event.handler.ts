import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { API_KEY_VALIDATION } from '@lib/constants/event-emitter-token.constant';
import { ApiKeyValidationEvent } from '@lib/infra/guard/api-key/events/api-key-validation.event';

@Injectable()
export class ApiKeyValidationEventHandler {
  private readonly logger = new Logger(ApiKeyValidationEventHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(API_KEY_VALIDATION)
  async handle(payload: ApiKeyValidationEvent) {
    //TODO
    this.logger.log(
      `Handling API key validation event, payload: ${JSON.stringify(payload)}`,
    );
  }
}
