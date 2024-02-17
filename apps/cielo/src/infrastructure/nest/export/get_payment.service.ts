import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import { Logger } from 'winston';
import { GetPaymentRequest, GetPaymentResponse } from '@zro/cielo/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPaymentCieloServiceKafka {
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
      context: GetPaymentCieloServiceKafka.name,
    });
  }

  /**
   * Call cielo get payment microservice to recover a payment.
   * @param payload Data.
   */
  async execute(payload: GetPaymentRequest): Promise<GetPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      GetPaymentResponse,
      GetPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created get payment message.', result);

    return result;
  }
}
