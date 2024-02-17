import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixDevolutionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPixDevolutionRequest,
  GetAllPixDevolutionResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION.GET_ALL;

/**
 * Pix devolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixDevolutionServiceKafka {
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
      context: GetAllPixDevolutionServiceKafka.name,
    });
  }

  /**
   * Call devolutions microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPixDevolutionRequest,
  ): Promise<GetAllPixDevolutionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixDevolutionKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send devolution message.', { data });

    // Call getAll PixDevolution microservice.
    const result = await this.kafkaService.send<
      GetAllPixDevolutionResponse,
      GetAllPixDevolutionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received devolution message.', { result });

    return result;
  }
}
