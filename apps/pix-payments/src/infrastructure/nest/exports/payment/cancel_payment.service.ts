import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelPaymentByOperationIdKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPaymentByOperationIdRequest,
  CancelPaymentByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CANCEL_BY_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelPaymentServiceKafka {
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
    this.logger = logger.child({ context: CancelPaymentServiceKafka.name });
  }

  /**
   * Call payments microservice to cancel pix payment.
   * @param payload Data.
   * @returns Payment.
   */
  async execute(
    payload: CancelPaymentByOperationIdRequest,
  ): Promise<CancelPaymentByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPaymentByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel pix payment message.', { data });

    // Call PixPayments microservice.
    const result = await this.kafkaService.send<
      CancelPaymentByOperationIdResponse,
      CancelPaymentByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
