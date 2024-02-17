import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse,
} from '@zro/quotations/interface';

/**
 * Get quotation.
 */
const SERVICE =
  KAFKA_TOPICS.STREAM_QUOTATION.GET_BY_BASE_AND_QUOTE_AND_GATEWAY_NAME;

@KafkaSubscribeService(SERVICE)
export class GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka {
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
      context: GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka.name,
    });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
  ): Promise<GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaRequest = {
      key: payload.baseCurrencySymbol,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse,
      GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation response.', { result });

    return result;
  }
}
