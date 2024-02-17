import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  SendCodePixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import { SendCodePixKeyRequest } from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.SEND_CODE;

/**
 * Pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class SendCodePixKeyServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: SendCodePixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to send a pix key code.
   * @param payload Data.
   */
  async execute(payload: SendCodePixKeyRequest) {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: SendCodePixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send pix key message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      void,
      SendCodePixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Verification code sent.', { result });

    return result;
  }
}
