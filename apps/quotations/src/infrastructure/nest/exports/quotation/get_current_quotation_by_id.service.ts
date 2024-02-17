import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetCurrentQuotationByIdKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetCurrentQuotationByIdRequest,
  GetCurrentQuotationByIdResponse,
} from '@zro/quotations/interface';

/**
 * Get current quotation by id.
 */
const SERVICE = KAFKA_TOPICS.QUOTATION.GET_CURRENT_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetCurrentQuotationByIdServiceKafka {
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
      context: GetCurrentQuotationByIdServiceKafka.name,
    });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetCurrentQuotationByIdRequest,
  ): Promise<GetCurrentQuotationByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCurrentQuotationByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get current quotation by id message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetCurrentQuotationByIdResponse,
      GetCurrentQuotationByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get current quotation by id response.', { result });

    return result;
  }
}
