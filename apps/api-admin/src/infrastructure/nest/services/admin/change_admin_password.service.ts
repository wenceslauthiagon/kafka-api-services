import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ChangeAdminPasswordKafkaRequest,
} from '@zro/admin/infrastructure';
import { ChangeAdminPasswordRequest } from '@zro/admin/interface';

/**
 * Admin microservice
 */
@Injectable()
export class ChangeAdminPasswordServiceKafka {
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
      context: ChangeAdminPasswordServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.ADMIN.CHANGE_ADMIN_PASSWORD]);
  }

  /**
   * Get admin by email microservice.
   * @param requestId Unique shared request ID.
   * @param payload Get admin by email data.
   * @returns Admin if found or null otherwise.
   */
  async execute(
    requestId: string,
    payload: ChangeAdminPasswordRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    const data: ChangeAdminPasswordKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send request for change admin password.', {
      verificationCode: data.value.verificationCode,
    });

    await this.kafkaService.send<ChangeAdminPasswordKafkaRequest>(
      KAFKA_TOPICS.ADMIN.CHANGE_ADMIN_PASSWORD,
      data,
    );

    logger.debug('Received admin password response.');
  }
}
