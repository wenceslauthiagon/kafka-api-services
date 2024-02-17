import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetSpreadsByUserAndCurrenciesKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetSpreadsByUserAndCurrenciesRequest,
  GetSpreadsByUserAndCurrenciesResponse,
} from '@zro/otc/interface';

/**
 * Get spreads by user and currencies.
 */
const SERVICE = KAFKA_TOPICS.SPREAD.GET_BY_USER_AND_CURRENCIES;

@KafkaSubscribeService(SERVICE)
export class GetSpreadsByUserAndCurrenciesServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetSpreadsByUserAndCurrenciesServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetSpreadsByUserAndCurrenciesRequest,
  ): Promise<GetSpreadsByUserAndCurrenciesResponse[]> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetSpreadsByUserAndCurrenciesKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get spreads message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetSpreadsByUserAndCurrenciesResponse[],
      GetSpreadsByUserAndCurrenciesKafkaRequest
    >(SERVICE, data);

    logger.debug('Get spreads result.', { result });

    return result;
  }
}
