import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDevolutionByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByIdRequest,
  GetPixDevolutionByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION.GET_BY_ID;

/**
 * GetById PixDevolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDevolutionByIdServiceKafka {
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
      context: GetPixDevolutionByIdServiceKafka.name,
    });
  }

  /**
   * Call PixDevolutions microservice to get a PixDevolution.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDevolutionByIdRequest,
  ): Promise<GetPixDevolutionByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDevolutionByIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send devolution message.', { data });

    // Call create PixDevolution microservice.
    const result = await this.kafkaService.send<
      GetPixDevolutionByIdResponse,
      GetPixDevolutionByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received devolution message.', { result });

    return result;
  }
}
