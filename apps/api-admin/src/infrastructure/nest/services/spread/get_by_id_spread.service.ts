import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetSpreadByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GetSpreadByIdRequest,
  GetSpreadByIdResponse,
} from '@zro/otc/interface';

/**
 * Spread microservice.
 */
@Injectable()
export class GetSpreadByIdServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetSpreadByIdServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.SPREAD.GET_BY_ID]);
  }

  /**
   * Call spreads microservice to getById.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetSpreadByIdRequest,
  ): Promise<GetSpreadByIdResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetSpreadByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send spread message.', { data });

    // Call getById Spread microservice.
    const result = await this.kafkaService.send<
      GetSpreadByIdResponse,
      GetSpreadByIdKafkaRequest
    >(KAFKA_TOPICS.SPREAD.GET_BY_ID, data);

    logger.debug('Received spread message.', result);

    return result;
  }
}
