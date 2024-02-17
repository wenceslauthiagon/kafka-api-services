import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse,
} from '@zro/quotations/interface';
import {
  KAFKA_TOPICS,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaRequest,
} from '@zro/quotations/infrastructure';

/**
 * Get trends.
 */
const SERVICE =
  KAFKA_TOPICS.QUOTATION_TREND
    .GET_TRENDS_BY_WINDOW_AND_RESOLUTION_AND_BASE_CURRENCIES;

@KafkaSubscribeService(SERVICE)
export class GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka {
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
      context: GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka.name,
    });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
  ): Promise<GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get trends message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse,
      GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaRequest
    >(SERVICE, data);

    logger.debug('Get trends response.', { result });

    return result;
  }
}
