import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  PreCheckoutKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import { PreCheckoutRequest, PreCheckoutResponse } from '@zro/nupay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.PRE_CHECKOUT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class PreCheckoutNuPayServiceKafka {
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
      context: PreCheckoutNuPayServiceKafka.name,
    });
  }

  /**
   * Call NuPay payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(payload: PreCheckoutRequest): Promise<PreCheckoutResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: PreCheckoutKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send NuPay Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      PreCheckoutResponse,
      PreCheckoutKafkaRequest
    >(SERVICE, data);

    logger.debug('PreCheckoutd Payment message.', result);

    return result;
  }
}
