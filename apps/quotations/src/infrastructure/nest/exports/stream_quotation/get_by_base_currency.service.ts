import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetStreamQuotationByBaseCurrencyKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetStreamQuotationByBaseCurrencyRequest,
  GetStreamQuotationByBaseCurrencyResponse,
} from '@zro/quotations/interface';

/**
 * Get quotation.
 */
const SERVICE = KAFKA_TOPICS.STREAM_QUOTATION.GET_BY_BASE_CURRENCY;

@KafkaSubscribeService(SERVICE)
export class GetStreamQuotationByBaseCurrencyServiceKafka {
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
      context: GetStreamQuotationByBaseCurrencyServiceKafka.name,
    });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetStreamQuotationByBaseCurrencyRequest,
  ): Promise<GetStreamQuotationByBaseCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetStreamQuotationByBaseCurrencyKafkaRequest = {
      key: payload.baseCurrencySymbol,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetStreamQuotationByBaseCurrencyResponse,
      GetStreamQuotationByBaseCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation response.', { result });

    return result;
  }
}
