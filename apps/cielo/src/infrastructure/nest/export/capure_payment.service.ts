import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CapturePaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import { Logger } from 'winston';
import {
  CapturePaymentRequest,
  CapturePaymentResponse,
} from '@zro/cielo/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CAPTURE;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CapturePaymentCieloServiceKafka {
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
      context: CapturePaymentCieloServiceKafka.name,
    });
  }

  /**
   * Call cielo get payment microservice to recover a payment.
   * @param payload Data.
   */
  async execute(
    payload: CapturePaymentRequest,
  ): Promise<CapturePaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CapturePaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CapturePaymentResponse,
      CapturePaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created get payment message.', result);

    return result;
  }
}
