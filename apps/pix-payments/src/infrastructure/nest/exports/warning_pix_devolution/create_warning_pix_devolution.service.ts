import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateWarningPixDevolutionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateWarningPixDevolutionRequest,
  CreateWarningPixDevolutionResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WARNING_PIX_DEVOLUTION.CREATE;

/**
 * WarningPixDevolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateWarningPixDevolutionServiceKafka {
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
      context: CreateWarningPixDevolutionServiceKafka.name,
    });
  }

  /**
   * Call WarningPixDevolutions microservice to create a warning pix devolution.
   * @param payload Data.
   */
  async execute(
    payload: CreateWarningPixDevolutionRequest,
  ): Promise<CreateWarningPixDevolutionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateWarningPixDevolutionKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send WarningPixDevolution message.', { data });

    // Call getAll WarningPixDevolution microservice.
    const result = await this.kafkaService.send<
      CreateWarningPixDevolutionResponse,
      CreateWarningPixDevolutionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received WarningPixDevolution message.', { result });

    return result;
  }
}
