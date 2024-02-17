import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreatePixDevolutionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixDevolutionRequest,
  CreatePixDevolutionResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION.CREATE;

/**
 * PixCreateDevolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreatePixDevolutionServiceKafka {
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
      context: CreatePixDevolutionServiceKafka.name,
    });
  }

  /**
   * Call PixDevolutions microservice to create a PixDevolution.
   * @param payload Data.
   */
  async execute(
    payload: CreatePixDevolutionRequest,
  ): Promise<CreatePixDevolutionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreatePixDevolutionKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PixDevolution message.', { data });

    // Call create PixDevolution microservice.
    const result = await this.kafkaService.send<
      CreatePixDevolutionResponse,
      CreatePixDevolutionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received PixDevolution message.', { result });

    return result;
  }
}
