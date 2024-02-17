import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateByAccountAndDecodedPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountAndDecodedPaymentRequest,
  CreateByAccountAndDecodedPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_BY_ACCOUNT_AND_DECODED;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateByAccountAndDecodedPaymentServiceKafka {
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
      context: CreateByAccountAndDecodedPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment and create decoded.
   * @param payload Data.
   */
  async execute(
    payload: CreateByAccountAndDecodedPaymentRequest,
  ): Promise<CreateByAccountAndDecodedPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateByAccountAndDecodedPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send payment and decoded message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateByAccountAndDecodedPaymentResponse,
      CreateByAccountAndDecodedPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created payment and decoded message.', result);

    return result;
  }
}
