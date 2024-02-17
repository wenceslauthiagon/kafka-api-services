import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateByPixKeyPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByPixKeyPaymentRequest,
  CreateByPixKeyPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_BY_PIX_KEY;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateByPixKeyPaymentServiceKafka {
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
      context: CreateByPixKeyPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreateByPixKeyPaymentRequest,
  ): Promise<CreateByPixKeyPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateByPixKeyPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create by pix key Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateByPixKeyPaymentResponse,
      CreateByPixKeyPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
