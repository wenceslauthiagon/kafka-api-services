import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateUserLimitByAdminKafkaRequest,
} from '@zro/operations/infrastructure';
import {
  UpdateUserLimitByAdminRequest,
  UpdateUserLimitByAdminResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_LIMIT.UPDATE_BY_ADMIN;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserLimitByAdminServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateUserLimitByAdminServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to update user limit by admin.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: UpdateUserLimitByAdminRequest,
  ): Promise<UpdateUserLimitByAdminResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send update user limit by admin payload.', { payload });

    // Request Kafka message.
    const data: UpdateUserLimitByAdminKafkaRequest = {
      key: `${payload.userLimitId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      UpdateUserLimitByAdminResponse,
      UpdateUserLimitByAdminKafkaRequest
    >(SERVICE, data);

    logger.debug('Received update user limit by admin message.', { result });

    return result;
  }
}
