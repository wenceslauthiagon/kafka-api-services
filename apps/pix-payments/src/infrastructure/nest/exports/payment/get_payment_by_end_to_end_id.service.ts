import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPaymentByEndToEndIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByEndToEndIdRequest,
  GetPaymentByEndToEndIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_BY_END_TO_END_ID;

/**
 * GetByEndToEndId Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPaymentByEndToEndIdServiceKafka {
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
    this.logger = logger.child({
      context: GetPaymentByEndToEndIdServiceKafka.name,
    });
  }

  /**
   * Call Payments microservice to get a Payment.
   * @param payload Data.
   */
  async execute(
    payload: GetPaymentByEndToEndIdRequest,
  ): Promise<GetPaymentByEndToEndIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPaymentByEndToEndIdKafkaRequest = {
      key: payload.endToEndId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send payment message.', { data });

    // Call create Payment microservice.
    const result = await this.kafkaService.send<
      GetPaymentByEndToEndIdResponse,
      GetPaymentByEndToEndIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
