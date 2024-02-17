import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  KAFKA_TOPICS,
  SendForgetPasswordKafkaRequest,
} from '@zro/admin/infrastructure';
import {
  SendForgetPasswordRequest,
  SendForgetPasswordResponse,
} from '@zro/admin/interface';

/**
 * Admin microservice
 */
@Injectable()
export class SendForgetPasswordServiceKafka {
  /**
   * Default constructor.
   * @param kafkaService Service to access Kafka.
   * @param logger Global logger.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: SendForgetPasswordServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.ADMIN.FORGET_PASSWORD_EMAIL]);
  }

  /**
   * Get admin by email microservice.
   * @param requestId Unique shared request ID.
   * @param payload Get admin by email data.
   * @returns Admin if found or null otherwise.
   */
  async execute(
    requestId: string,
    payload: SendForgetPasswordRequest,
  ): Promise<SendForgetPasswordResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    const data: SendForgetPasswordKafkaRequest = {
      key: `${payload.email}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send forget password email.', { data });

    const result = await this.kafkaService.send<
      SendForgetPasswordResponse,
      SendForgetPasswordKafkaRequest
    >(KAFKA_TOPICS.ADMIN.FORGET_PASSWORD_EMAIL, data);

    logger.debug('Received admin forget password email.');

    return result;
  }
}
