import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  DeleteSpreadKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import { DeleteSpreadRequest } from '@zro/otc/interface';

/**
 * Spread microservice.
 */
@Injectable()
export class DeleteSpreadServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: DeleteSpreadServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.SPREAD.DELETE]);
  }

  /**
   * Call spreads microservice to delete.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: DeleteSpreadRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: DeleteSpreadKafkaRequest = {
      key: `${payload.currencySymbol}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send spread message.', { data });

    // Call delete Spread microservice.
    await this.kafkaService.send<void, DeleteSpreadKafkaRequest>(
      KAFKA_TOPICS.SPREAD.DELETE,
      data,
    );

    logger.debug('Received spread message.');
  }
}
