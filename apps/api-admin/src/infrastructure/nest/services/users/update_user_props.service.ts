import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  UpdateUserPropsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  UpdateUserPropsResponse,
  UpdateUserPropsRequest,
} from '@zro/users/interface';

/**
 * Update user props microservice.
 */
@Injectable()
export class UpdateUserPropsServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: UpdateUserPropsServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.USER.UPDATE_USER_PROPS]);
  }

  /**
   * Call update user props microservice.
   * @param requestId Unique shared request ID.
   * @param payload Update user props data.
   * @returns Updated user uuid, prop key and prop value.
   */
  async execute(
    requestId: string,
    payload: UpdateUserPropsRequest,
  ): Promise<UpdateUserPropsResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: UpdateUserPropsKafkaRequest = {
      key: `${payload.uuid}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send update user props message.', { data });

    // Call update user props microservice.
    const result = await this.kafkaService.send<
      UpdateUserPropsResponse,
      UpdateUserPropsKafkaRequest
    >(KAFKA_TOPICS.USER.UPDATE_USER_PROPS, data);

    logger.debug('Received onboarding created message.', { result });

    return result;
  }
}
