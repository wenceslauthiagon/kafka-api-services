import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  SendConfirmCodeSignupKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/signup/infrastructure';
import { SendConfirmCodeSignupRequest } from '@zro/signup/interface';

/**
 * Service to call verify signup confirm code at signup microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.SIGNUP.SEND_CONFIRM_CODE])
export class SendConfirmCodeServiceKafka {
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
      context: SendConfirmCodeServiceKafka.name,
    });
  }

  /**
   * Call signup microservice to send signup confirm code.
   * @param payload Data.
   */
  async execute(payload: SendConfirmCodeSignupRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: SendConfirmCodeSignupKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send signup verify code message.', { data });

    // Call signup microservice.
    await this.kafkaService.send<void, SendConfirmCodeSignupKafkaRequest>(
      KAFKA_TOPICS.SIGNUP.SEND_CONFIRM_CODE,
      data,
    );

    logger.debug('Received signup verify code message.');
  }
}
