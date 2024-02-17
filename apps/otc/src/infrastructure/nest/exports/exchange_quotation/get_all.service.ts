import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllExchangeQuotationRequest,
  GetAllExchangeQuotationResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetAllExchangeQuotationKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Get all ExchangeQuotation.
 */
const SERVICE = KAFKA_TOPICS.EXCHANGE_QUOTATION.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllExchangeQuotationServiceKafka {
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
      context: GetAllExchangeQuotationServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetAllExchangeQuotationRequest,
  ): Promise<GetAllExchangeQuotationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllExchangeQuotationKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get all exchange quotation request message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllExchangeQuotationResponse,
      GetAllExchangeQuotationKafkaRequest
    >(SERVICE, data);

    logger.debug('Get all exchange quotation response message.', result);

    return result;
  }
}
