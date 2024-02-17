import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ClosePixInfractionKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixInfractionRequest,
  ClosePixInfractionResponse,
} from '@zro/pix-payments/interface';

/**
 * Close infraction microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.CLOSE])
export class ClosePixInfractionServiceKafka {
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
      context: ClosePixInfractionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to close infraction.
   * @param payload Data.
   */
  async execute(
    payload: ClosePixInfractionRequest,
  ): Promise<ClosePixInfractionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ClosePixInfractionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      ClosePixInfractionResponse,
      ClosePixInfractionKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.CLOSE, data);

    logger.debug('Received close infraction message.', { result });

    return result;
  }
}
