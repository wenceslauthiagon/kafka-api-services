import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ReceivePixDevolutionReceivedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDevolutionReceivedRequest,
  ReceivePixDevolutionReceivedResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.RECEIVE;

/**
 * PixDevolutionReceived microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ReceivePixDevolutionReceivedServiceKafka {
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
      context: ReceivePixDevolutionReceivedServiceKafka.name,
    });
  }

  /**
   * Call PixDevolutionReceived microservice to create a PixDevolutionReceived.
   * @param payload Data.
   */
  async execute(
    payload: ReceivePixDevolutionReceivedRequest,
  ): Promise<ReceivePixDevolutionReceivedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ReceivePixDevolutionReceivedKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PixDevolutionReceived message.', { data });

    // Call create PixDevolutionReceived microservice.
    const result = await this.kafkaService.send<
      ReceivePixDevolutionReceivedResponse,
      ReceivePixDevolutionReceivedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received PixDevolutionReceived message.', { result });

    return result;
  }
}
