import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateUserLimitRequestKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CreateUserLimitRequest,
  CreateUserLimitRequestResponse,
} from '@zro/compliance/interface';

/**
 * Service to call create user limit request at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER_LIMIT_REQUEST.CREATE])
export class CreateUserLimitRequestServiceKafka {
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
      context: CreateUserLimitRequestServiceKafka.name,
    });
  }

  /**
   * Call Users microservice to create a new user limit request.
   * @param payload Data.
   */
  async execute(
    payload: CreateUserLimitRequest,
  ): Promise<CreateUserLimitRequestResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateUserLimitRequestKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create user limit request message.', { data });

    // Call create users limit request microservice.
    const result = await this.kafkaService.send<
      CreateUserLimitRequestResponse,
      CreateUserLimitRequestKafkaRequest
    >(KAFKA_TOPICS.USER_LIMIT_REQUEST.CREATE, data);

    logger.debug('Received create user limit request message.', { result });

    return result;
  }
}
