import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserLimitByIdAndUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetUserLimitByIdAndUserRequest,
  GetUserLimitByIdAndUserResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_LIMIT.GET_BY_ID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserLimitByIdAndUserServiceKafka {
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
      context: GetUserLimitByIdAndUserServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get user limit by id and user.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: GetUserLimitByIdAndUserRequest,
  ): Promise<GetUserLimitByIdAndUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get user limit by id and user payload.', { payload });

    // Request Kafka message.
    const data: GetUserLimitByIdAndUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      GetUserLimitByIdAndUserResponse,
      GetUserLimitByIdAndUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get user limit by id and user message.', { result });

    return result;
  }
}
