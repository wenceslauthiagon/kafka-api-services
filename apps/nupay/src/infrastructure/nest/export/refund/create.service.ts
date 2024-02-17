import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateRefundKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import {
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/nupay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.REFUND.CREATE;

/**
 * Refund microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateRefundNuPayServiceKafka {
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
      context: CreateRefundNuPayServiceKafka.name,
    });
  }

  /**
   * Call NuPay payment microservice to create or schedule a payment.
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

    logger.debug('Send NuPay Refund message.', { data });

    // Call create Refund message.
    const result = await this.kafkaService.send<
      CreateRefundResponse,
      CreateRefundKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Refund message.', result);

    return result;
  }
}
