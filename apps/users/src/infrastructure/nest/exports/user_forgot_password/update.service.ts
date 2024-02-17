import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateUserForgotPasswordKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  UpdateUserForgotPasswordRequest,
  UpdateUserForgotPasswordResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER_FORGOT_PASSWORD.UPDATE;

/**
 * Service to call update user forgot password at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserForgotPasswordServiceKafka {
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
      context: UpdateUserForgotPasswordServiceKafka.name,
    });
  }

  /**
   * Call User microservice to update a user forgot password.
   * @param payload Data.
   */
  async execute(
    payload: UpdateUserForgotPasswordRequest,
  ): Promise<UpdateUserForgotPasswordResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateUserForgotPasswordKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send update user forgot password message.', { data });

    // Call create users microservice.
    const result = await this.kafkaService.send<
      UpdateUserForgotPasswordResponse,
      UpdateUserForgotPasswordKafkaRequest
    >(SERVICE, data);

    logger.debug('Received update user forgot password message.', { result });

    return result;
  }
}
