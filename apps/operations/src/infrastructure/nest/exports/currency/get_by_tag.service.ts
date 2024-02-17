import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCurrencyByTagKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetCurrencyByTagRequest,
  GetCurrencyByTagResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CURRENCY.GET_BY_TAG;

/**
 * Get currency by tag kafka microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCurrencyByTagServiceKafka {
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
      context: GetCurrencyByTagServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get currency by tag.
   * @param payload Data.
   */
  async execute(
    payload: GetCurrencyByTagRequest,
  ): Promise<GetCurrencyByTagResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get currency by tag payload.', { payload });

    // Request Kafka message.
    const data: GetCurrencyByTagKafkaRequest = {
      key: `${payload.tag}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get by tag microservice.
    const result = await this.kafkaService.send<
      GetCurrencyByTagResponse,
      GetCurrencyByTagKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get currency by tag message.', { result });

    return result;
  }
}
