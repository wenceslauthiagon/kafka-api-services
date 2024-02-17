import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CloseUserLimitRequestKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import { CloseUserLimitRequest } from '@zro/compliance/interface';

/**
 * Service to call close user limit request at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER_LIMIT_REQUEST.CLOSE])
export class CloseUserLimitRequestServiceKafka {
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
    this.logger = logger.child({
      context: CloseUserLimitRequestServiceKafka.name,
    });
  }

  /**
   * Call Users microservice to close a new user limit request.
   * @param payload Data.
   */
  async execute(payload: CloseUserLimitRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CloseUserLimitRequestKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close user limit request message.', { data });

    // Call close users limit request microservice.
    const result = await this.kafkaService.send<
      void,
      CloseUserLimitRequestKafkaRequest
    >(KAFKA_TOPICS.USER_LIMIT_REQUEST.CLOSE, data);

    logger.debug('Received close user limit request message.', { result });

    return result;
  }
}
