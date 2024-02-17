import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetLimitTypesByFilterKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetLimitTypesByFilterRequest,
  GetLimitTypesByFilterResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.LIMIT_TYPE.GET_BY_FILTER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetLimitTypesByFilterServiceKafka {
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
      context: GetLimitTypesByFilterServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get limit types by filter.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: GetLimitTypesByFilterRequest,
  ): Promise<GetLimitTypesByFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get limit types by filter payload.', { payload });

    // Request Kafka message.
    const data: GetLimitTypesByFilterKafkaRequest = {
      key: `${payload.transactionTypeTag}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      GetLimitTypesByFilterResponse,
      GetLimitTypesByFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get limit types by filter message.', { result });

    return result;
  }
}
