import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelPixInfractionKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixInfractionRequest,
  CancelPixInfractionResponse,
} from '@zro/pix-payments/interface';

/**
 * Cancel infraction microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.CANCEL])
export class CancelPixInfractionServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CancelPixInfractionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to cancel infraction.
   * @param payload Data.
   */
  async execute(
    payload: CancelPixInfractionRequest,
  ): Promise<CancelPixInfractionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPixInfractionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      CancelPixInfractionResponse,
      CancelPixInfractionKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.CANCEL, data);

    logger.debug('Received cancel infraction message.', { result });

    return result;
  }
}
