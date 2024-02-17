import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  OpenPixInfractionKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  OpenPixInfractionRequest,
  OpenPixInfractionResponse,
} from '@zro/pix-payments/interface';

/**
 * Open infraction microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.OPEN])
export class OpenPixInfractionServiceKafka {
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
      context: OpenPixInfractionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to open infraction.
   * @param payload Data.
   */
  async execute(
    payload: OpenPixInfractionRequest,
  ): Promise<OpenPixInfractionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: OpenPixInfractionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send open infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      OpenPixInfractionResponse,
      OpenPixInfractionKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.OPEN, data);

    logger.debug('Received open infraction message.', { result });

    return result;
  }
}
