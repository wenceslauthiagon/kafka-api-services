import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetQuotationByIdKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetQuotationByIdRequest,
  GetQuotationByIdResponse,
} from '@zro/quotations/interface';

/**
 * Get quotation by id.
 */
const SERVICE = KAFKA_TOPICS.QUOTATION.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetQuotationByIdServiceKafka {
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
    this.logger = logger.child({ context: GetQuotationByIdServiceKafka.name });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetQuotationByIdRequest,
  ): Promise<GetQuotationByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetQuotationByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation by id message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetQuotationByIdResponse,
      GetQuotationByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation by id response.', { result });

    return result;
  }
}
