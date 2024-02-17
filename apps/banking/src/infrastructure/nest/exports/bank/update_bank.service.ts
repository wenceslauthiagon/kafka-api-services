import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateBankKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import { UpdateBankResponse, UpdateBankRequest } from '@zro/banking/interface';

/**
 * Update bank microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.BANK.UPDATE])
export class UpdateBankServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: UpdateBankServiceKafka.name });
  }

  /**
   * Call update bank microservice.
   * @param payload Update bank data.
   * @returns Updated bank.
   */
  async execute(payload: UpdateBankRequest): Promise<UpdateBankResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateBankKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send update bank message.', { data });

    // Call Banking microservice.
    const result = await this.kafkaService.send<
      UpdateBankResponse,
      UpdateBankKafkaRequest
    >(KAFKA_TOPICS.BANK.UPDATE, data);

    logger.debug('Received message.', { result });

    return result;
  }
}
