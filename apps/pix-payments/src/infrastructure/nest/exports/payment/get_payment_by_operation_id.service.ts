import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPaymentByOperationIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByOperationIdRequest,
  GetPaymentByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_BY_OPERATION_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPaymentByOperationIdServiceKafka {
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
      context: GetPaymentByOperationIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetPaymentByOperationId.
   * @param payload Data.
   */
  async execute(
    payload: GetPaymentByOperationIdRequest,
  ): Promise<GetPaymentByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPaymentByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send payment message.', { data });

    // Call GetPaymentByOperationId Payment microservice.
    const result = await this.kafkaService.send<
      GetPaymentByOperationIdResponse,
      GetPaymentByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
