import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetQuotationKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetQuotationRequest,
  GetQuotationResponse,
} from '@zro/quotations/interface';

/**
 * Get quotation.
 */
const SERVICE = KAFKA_TOPICS.QUOTATION.GET_CURRENT;

@KafkaSubscribeService(SERVICE)
export class GetQuotationServiceKafka {
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
    this.logger = logger.child({ context: GetQuotationServiceKafka.name });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(payload: GetQuotationRequest): Promise<GetQuotationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetQuotationKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetQuotationResponse,
      GetQuotationKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation response.', { result });

    return result;
  }
}
