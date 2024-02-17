import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  CreateSpreadKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import { CreateSpreadRequest, CreateSpreadResponse } from '@zro/otc/interface';

/**
 * Spread microservice.
 */
@Injectable()
export class CreateSpreadServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: CreateSpreadServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.SPREAD.CREATE]);
  }

  /**
   * Call spreads microservice to create.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: CreateSpreadRequest,
  ): Promise<CreateSpreadResponse[]> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: CreateSpreadKafkaRequest = {
      key: `${payload.currencySymbol}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send spread message.', { data });

    // Call create Spread microservice.
    const result = await this.kafkaService.send<
      CreateSpreadResponse[],
      CreateSpreadKafkaRequest
    >(KAFKA_TOPICS.SPREAD.CREATE, data);

    logger.debug('Received spread message.', result);

    return result;
  }
}
