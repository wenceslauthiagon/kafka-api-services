import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { CreateUserRequest, CreateUserResponse } from '@zro/users/interface';

/**
 * Service to call create user at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER.CREATE])
export class CreateUserServiceKafka {
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
      context: CreateUserServiceKafka.name,
    });
  }

  /**
   * Call Users microservice to create a new user.
   * @param payload Data.
   */
  async execute(payload: CreateUserRequest): Promise<CreateUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateUserKafkaRequest = {
      key: `${payload.phoneNumber}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create user message.', { data });

    // Call create users microservice.
    const result = await this.kafkaService.send<
      CreateUserResponse,
      CreateUserKafkaRequest
    >(KAFKA_TOPICS.USER.CREATE, data);

    logger.debug('Received create user message.', { result });

    return result;
  }
}
