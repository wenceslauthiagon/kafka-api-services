import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ClosePixRefundKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixRefundRequest,
  ClosePixRefundResponse,
} from '@zro/pix-payments/interface';

/**
 * Close refund microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_REFUND.CLOSE])
export class ClosePixRefundServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: ClosePixRefundServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to close refund.
   * @param payload Data.
   */
  async execute(
    payload: ClosePixRefundRequest,
  ): Promise<ClosePixRefundResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ClosePixRefundKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close refund message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      ClosePixRefundResponse,
      ClosePixRefundKafkaRequest
    >(KAFKA_TOPICS.PIX_REFUND.CLOSE, data);

    logger.debug('Received close refund message.', { result });

    return result;
  }
}
