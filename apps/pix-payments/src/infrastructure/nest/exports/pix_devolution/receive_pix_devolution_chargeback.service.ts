import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ReceivePixDevolutionChargebackKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDevolutionChargebackRequest,
  ReceivePixDevolutionChargebackResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION.RECEIVE_CHARGEBACK;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ReceivePixDevolutionChargebackServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: ReceivePixDevolutionChargebackServiceKafka.name,
    });
  }

  /**
   * Call Payment microservice to create a PixDevolutionChargeback.
   * @param payload Data.
   */
  async execute(
    payload: ReceivePixDevolutionChargebackRequest,
  ): Promise<ReceivePixDevolutionChargebackResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ReceivePixDevolutionChargebackKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PixDevolution chargeback message.', { data });

    // Call create Payment microservice.
    const result = await this.kafkaService.send<
      ReceivePixDevolutionChargebackResponse,
      ReceivePixDevolutionChargebackKafkaRequest
    >(SERVICE, data);

    logger.debug('Received PixDevolution chargeback message.', { result });

    return result;
  }
}
