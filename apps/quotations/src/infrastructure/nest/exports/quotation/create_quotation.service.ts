import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CreateQuotationKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  CreateQuotationRequest,
  CreateQuotationResponse,
} from '@zro/quotations/interface';

/**
 * Create quotation.
 */
const SERVICE = KAFKA_TOPICS.QUOTATION.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateQuotationServiceKafka {
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
    this.logger = logger.child({ context: CreateQuotationServiceKafka.name });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateQuotationRequest,
  ): Promise<CreateQuotationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateQuotationKafkaRequest = {
      key: payload.baseCurrencySymbol,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create quotation message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      CreateQuotationResponse,
      CreateQuotationKafkaRequest
    >(SERVICE, data);

    logger.debug('Create quotation response.', { result });

    return result;
  }
}
