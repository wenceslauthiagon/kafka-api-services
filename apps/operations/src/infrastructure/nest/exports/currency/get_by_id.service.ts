import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCurrencyByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetCurrencyByIdRequest,
  GetCurrencyByIdResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CURRENCY.GET_BY_ID;

/**
 * Get currency by id kakfa microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCurrencyByIdServiceKafka {
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
      context: GetCurrencyByIdServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get currency by id.
   * @param payload Data.
   */
  async execute(
    payload: GetCurrencyByIdRequest,
  ): Promise<GetCurrencyByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get currency by id payload.', { payload });

    // Request Kafka message.
    const data: GetCurrencyByIdKafkaRequest = {
      key: `${payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get currency by id microservice.
    const result = await this.kafkaService.send<
      GetCurrencyByIdResponse,
      GetCurrencyByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get currency by id message.', { result });

    return result;
  }
}
