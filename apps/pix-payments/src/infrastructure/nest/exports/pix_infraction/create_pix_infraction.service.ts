import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CreatePixInfractionKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixInfractionRequest,
  CreatePixInfractionResponse,
} from '@zro/pix-payments/interface';

/**
 * Create infraction microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.CREATE])
export class CreatePixInfractionServiceKafka {
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
      context: CreatePixInfractionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to create infraction.
   * @param payload Data.
   */
  async execute(
    payload: CreatePixInfractionRequest,
  ): Promise<CreatePixInfractionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreatePixInfractionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      CreatePixInfractionResponse,
      CreatePixInfractionKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.CREATE, data);

    logger.debug('Received create infraction message.', { result });

    return result;
  }
}
