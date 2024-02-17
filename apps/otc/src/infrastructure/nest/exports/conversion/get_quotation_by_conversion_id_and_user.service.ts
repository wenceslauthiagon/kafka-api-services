import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetQuotationByConversionIdAndUserKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetQuotationByConversionIdAndUserRequest,
  GetQuotationByConversionIdAndUserResponse,
} from '@zro/otc/interface';

/**
 * Get quotation by conversion id and user.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.GET_QUOTATION_BY_CONVERSION_ID_AND_USER;

@KafkaSubscribeService(SERVICE)
export class GetQuotationByConversionIdAndUserServiceKafka {
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
      context: GetQuotationByConversionIdAndUserServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetQuotationByConversionIdAndUserRequest,
  ): Promise<GetQuotationByConversionIdAndUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetQuotationByConversionIdAndUserKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation by conversion id and user message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetQuotationByConversionIdAndUserResponse,
      GetQuotationByConversionIdAndUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation by conversion id and user result.', { result });

    return result;
  }
}
