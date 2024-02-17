import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPaymentByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByIdRequest,
  GetPaymentByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_BY_ID;

/**
 * GetById Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPaymentByIdServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetPaymentByIdServiceKafka.name });
  }

  /**
   * Call Payments microservice to get a Payment.
   * @param payload Data.
   */
  async execute(
    payload: GetPaymentByIdRequest,
  ): Promise<GetPaymentByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPaymentByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send payment message.', { data });

    // Call create Payment microservice.
    const result = await this.kafkaService.send<
      GetPaymentByIdResponse,
      GetPaymentByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
