import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelPixRefundKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixRefundRequest,
  CancelPixRefundResponse,
} from '@zro/pix-payments/interface';

/**
 * Cancel refund microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_REFUND.CANCEL])
export class CancelPixRefundServiceKafka {
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
      context: CancelPixRefundServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to cancel refund.
   * @param payload Data.
   */
  async execute(
    payload: CancelPixRefundRequest,
  ): Promise<CancelPixRefundResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPixRefundKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel refund message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      CancelPixRefundResponse,
      CancelPixRefundKafkaRequest
    >(KAFKA_TOPICS.PIX_REFUND.CANCEL, data);

    logger.debug('Received cancel refund message.', { result });

    return result;
  }
}
