import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetConversionReceiptByUserAndOperationKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetConversionReceiptByUserAndOperationRequest,
  GetConversionReceiptByUserAndOperationResponse,
} from '@zro/otc/interface';

/**
 * Get quotation by conversion id and user.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.GET_RECEIPT_BY_USER_AND_OPERATION;

@KafkaSubscribeService(SERVICE)
export class GetConversionReceiptByUserAndOperationServiceKafka {
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
      context: GetConversionReceiptByUserAndOperationServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetConversionReceiptByUserAndOperationRequest,
  ): Promise<GetConversionReceiptByUserAndOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetConversionReceiptByUserAndOperationKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get conversion receipt by user and operation message.', {
      data,
    });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetConversionReceiptByUserAndOperationResponse,
      GetConversionReceiptByUserAndOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Get conversion receipt by user and operation result.', {
      result,
    });

    return result;
  }
}
