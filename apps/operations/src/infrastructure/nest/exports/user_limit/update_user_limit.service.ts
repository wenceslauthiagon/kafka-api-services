import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateUserLimitKafkaRequest,
} from '@zro/operations/infrastructure';
import {
  UpdateUserLimitRequest,
  UpdateUserLimitResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_LIMIT.UPDATE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserLimitServiceKafka {
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
      context: UpdateUserLimitServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to update user limit.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: UpdateUserLimitRequest,
  ): Promise<UpdateUserLimitResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send update user limit payload.', { payload });

    // Request Kafka message.
    const data: UpdateUserLimitKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      UpdateUserLimitResponse,
      UpdateUserLimitKafkaRequest
    >(SERVICE, data);

    logger.debug('Received update user limit message.', { result });

    return result;
  }
}
