import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateUserForgotPasswordBySmsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  CreateUserForgotPasswordBySmsRequest,
  CreateUserForgotPasswordBySmsResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER_FORGOT_PASSWORD.CREATE_BY_SMS;

/**
 * Service to call create user forgot password at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class CreateUserForgotPasswordBySmsServiceKafka {
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
      context: CreateUserForgotPasswordBySmsServiceKafka.name,
    });
  }

  /**
   * Call User microservice to create a new user forgot password.
   * @param payload Data.
   */
  async execute(
    payload: CreateUserForgotPasswordBySmsRequest,
  ): Promise<CreateUserForgotPasswordBySmsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateUserForgotPasswordBySmsKafkaRequest = {
      key: `${payload.phoneNumber}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create user forgot password message.', { data });

    // Call create users microservice.
    const result = await this.kafkaService.send<
      CreateUserForgotPasswordBySmsResponse,
      CreateUserForgotPasswordBySmsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create user forgot password message.', { result });

    return result;
  }
}
