import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetAllSpreadKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import { GetAllSpreadRequest, GetAllSpreadResponse } from '@zro/otc/interface';

/**
 * Spread microservice.
 */
@Injectable()
export class GetAllSpreadServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetAllSpreadServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.SPREAD.GET_ALL]);
  }

  /**
   * Call spreads microservice to getAll.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetAllSpreadRequest,
  ): Promise<GetAllSpreadResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetAllSpreadKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: payload,
    };
    logger.debug('Send spread message.');

    // Call getAll Spread microservice.
    const result = await this.kafkaService.send<
      GetAllSpreadResponse,
      GetAllSpreadKafkaRequest
    >(KAFKA_TOPICS.SPREAD.GET_ALL, data);

    logger.debug('Received spread message.', result);

    return result;
  }
}
