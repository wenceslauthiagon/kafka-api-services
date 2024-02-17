import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetAdminByEmailKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/admin/infrastructure';
import {
  GetAdminByEmailResponse,
  GetAdminByEmailRequest,
} from '@zro/admin/interface';

/**
 * Admin microservice
 */
@Injectable()
export class GetAdminByEmailServiceKafka {
  /**
   * Default constructor.
   * @param kafkaService Service to access Kafka.
   * @param logger Global logger.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetAdminByEmailServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.ADMIN.GET_BY_EMAIL]);
  }

  /**
   * Get admin by email microservice.
   * @param requestId Unique shared request ID.
   * @param payload Get admin by email data.
   * @returns Admin if found or null otherwise.
   */
  async execute(
    requestId: string,
    payload: GetAdminByEmailRequest,
  ): Promise<GetAdminByEmailResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    const data: GetAdminByEmailKafkaRequest = {
      key: `${payload.email}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Get admin by email message.', { data });

    const result = await this.kafkaService.send<
      GetAdminByEmailResponse,
      GetAdminByEmailKafkaRequest
    >(KAFKA_TOPICS.ADMIN.GET_BY_EMAIL, data);

    logger.debug('Received admin message.', { result });

    return result;
  }
}
