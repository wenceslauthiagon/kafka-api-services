import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateRefundKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';
import {
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.REFUND;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateRefundPicPayServiceKafka {
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
      context: CreateRefundPicPayServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(payload: CreateRefundRequest): Promise<CreateRefundResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateRefundKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PicPay refund message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateRefundResponse,
      CreateRefundKafkaRequest
    >(SERVICE, data);

    logger.debug('Created refund message.', result);

    return result;
  }
}
