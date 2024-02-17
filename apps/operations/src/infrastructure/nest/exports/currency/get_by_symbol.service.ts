import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCurrencyBySymbolKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetCurrencyBySymbolRequest,
  GetCurrencyBySymbolResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CURRENCY.GET_BY_SYMBOL;

/**
 * Get currency by symbol kakfa microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCurrencyBySymbolServiceKafka {
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
      context: GetCurrencyBySymbolServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get currency by symbol.
   * @param payload Data.
   */
  async execute(
    payload: GetCurrencyBySymbolRequest,
  ): Promise<GetCurrencyBySymbolResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get currency by symbol payload.', { payload });

    // Request Kafka message.
    const data: GetCurrencyBySymbolKafkaRequest = {
      key: `${payload.symbol}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get currency by symbol microservice.
    const result = await this.kafkaService.send<
      GetCurrencyBySymbolResponse,
      GetCurrencyBySymbolKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get currency by symbol message.', { result });

    return result;
  }
}
