import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeclineUserForgotPasswordKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { DeclineUserForgotPasswordRequest } from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER_FORGOT_PASSWORD.DECLINE;

/**
 * Service to call decline user forgot password at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class DeclineUserForgotPasswordServiceKafka {
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
      context: DeclineUserForgotPasswordServiceKafka.name,
    });
  }

  /**
   * Call User microservice to create a new user forgot password.
   * @param payload Data.
   */
  async execute(payload: DeclineUserForgotPasswordRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeclineUserForgotPasswordKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send decline user forgot password message.', { data });

    // Call create users microservice.
    const result = await this.kafkaService.send<
      void,
      DeclineUserForgotPasswordKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decline user forgot password message.', { result });

    return result;
  }
}
