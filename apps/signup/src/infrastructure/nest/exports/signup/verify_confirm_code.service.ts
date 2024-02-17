import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  VerifyConfirmCodeSignupKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/signup/infrastructure';
import {
  VerifyConfirmCodeSignupRequest,
  VerifyConfirmCodeSignupResponse,
} from '@zro/signup/interface';

/**
 * Service to call verify signup confirm code at signup microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.SIGNUP.VERIFY_CONFIRM_CODE])
export class VerifyConfirmCodeServiceKafka {
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
      context: VerifyConfirmCodeServiceKafka.name,
    });
  }

  /**
   * Call signup microservice to verify a new signup confirm code.
   * @param payload Data.
   */
  async execute(
    payload: VerifyConfirmCodeSignupRequest,
  ): Promise<VerifyConfirmCodeSignupResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: VerifyConfirmCodeSignupKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send signup verify code message.', { data });

    // Call signup microservice.
    const result = await this.kafkaService.send<
      VerifyConfirmCodeSignupResponse,
      VerifyConfirmCodeSignupKafkaRequest
    >(KAFKA_TOPICS.SIGNUP.VERIFY_CONFIRM_CODE, data);

    logger.debug('Received signup verify code message.', { result });

    return result;
  }
}
