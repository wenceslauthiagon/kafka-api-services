import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ChangeUserPasswordKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  ChangeUserPasswordRequest,
  ChangeUserPasswordResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.CHANGE_PASSWORD;

/**
 * Service to call change user password at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class ChangeUserPasswordServiceKafka {
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
      context: ChangeUserPasswordServiceKafka.name,
    });
  }

  /**
   * Call Users microservice to change user password.
   * @param payload Data.
   */
  async execute(
    payload: ChangeUserPasswordRequest,
  ): Promise<ChangeUserPasswordResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ChangeUserPasswordKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send change user password message.', { data });

    // Call change user password microservice.
    const result = await this.kafkaService.send<
      ChangeUserPasswordResponse,
      ChangeUserPasswordKafkaRequest
    >(SERVICE, data);

    logger.debug('Received change user password message.', { result });

    return result;
  }
}
