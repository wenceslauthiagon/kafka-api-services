import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateByAccountPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountPaymentRequest,
  CreateByAccountPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_BY_ACCOUNT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateByAccountPaymentServiceKafka {
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
      context: CreateByAccountPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreateByAccountPaymentRequest,
  ): Promise<CreateByAccountPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateByAccountPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateByAccountPaymentResponse,
      CreateByAccountPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
