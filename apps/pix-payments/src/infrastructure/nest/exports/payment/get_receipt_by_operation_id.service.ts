import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetReceiptByOperationIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetReceiptByOperationIdRequest,
  GetReceiptByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_RECEIPT_BY_OPERATION_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetReceiptByOperationIdServiceKafka {
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
      context: GetReceiptByOperationIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetReceiptByOperationId.
   * @param payload Data.
   */
  async execute(
    payload: GetReceiptByOperationIdRequest,
  ): Promise<GetReceiptByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetReceiptByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send payment message.', { data });

    // Call GetReceiptByOperationId Payment microservice.
    const result = await this.kafkaService.send<
      GetReceiptByOperationIdResponse,
      GetReceiptByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment receipt message.', { result });

    return result;
  }
}
