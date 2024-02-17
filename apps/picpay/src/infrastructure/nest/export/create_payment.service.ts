import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreatePaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
} from '@zro/picpay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreatePaymentPicPayServiceKafka {
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
      context: CreatePaymentPicPayServiceKafka.name,
    });
  }

  /**
   * Call PicPay payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(payload: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreatePaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PicPay Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreatePaymentResponse,
      CreatePaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
