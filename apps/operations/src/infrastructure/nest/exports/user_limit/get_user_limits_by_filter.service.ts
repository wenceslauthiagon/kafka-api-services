import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserLimitsByFilterKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetUserLimitsByFilterRequest,
  GetUserLimitsByFilterResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_LIMIT.GET_BY_FILTER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserLimitsByFilterServiceKafka {
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
      context: GetUserLimitsByFilterServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get user limits by filter.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: GetUserLimitsByFilterRequest,
  ): Promise<GetUserLimitsByFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get user limits by filter payload.', { payload });

    // Request Kafka message.
    const data: GetUserLimitsByFilterKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      GetUserLimitsByFilterResponse,
      GetUserLimitsByFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get user limits by filter message.', { result });

    return result;
  }
}
