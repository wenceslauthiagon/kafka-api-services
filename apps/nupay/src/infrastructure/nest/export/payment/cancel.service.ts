import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import {
  CancelPaymentRequest,
  CancelPaymentResponse,
} from '@zro/nupay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CANCEL;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelPaymentNuPayServiceKafka {
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
      context: CancelPaymentNuPayServiceKafka.name,
    });
  }

  /**
   * Call NuPay payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(payload: CancelPaymentRequest): Promise<CancelPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send NuPay Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CancelPaymentResponse,
      CancelPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Canceld Payment message.', result);

    return result;
  }
}
