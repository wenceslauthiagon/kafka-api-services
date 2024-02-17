import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreatePreCheckoutKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';
import {
  CreatePreCheckoutRequest,
  CreatePreCheckoutResponse,
} from '@zro/picpay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.PRE_CHECKOUT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreatePreCheckoutPicPayServiceKafka {
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
      context: CreatePreCheckoutPicPayServiceKafka.name,
    });
  }

  /**
   * Call PicPay precheckout microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreatePreCheckoutRequest,
  ): Promise<CreatePreCheckoutResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreatePreCheckoutKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PicPay pre-checkout message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreatePreCheckoutResponse,
      CreatePreCheckoutKafkaRequest
    >(SERVICE, data);

    logger.debug('Created PicPay pre-checkout message.', result);

    return result;
  }
}
