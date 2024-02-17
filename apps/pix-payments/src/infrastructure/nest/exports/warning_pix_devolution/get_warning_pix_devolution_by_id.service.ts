import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWarningPixDevolutionByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetWarningPixDevolutionByIdRequest,
  GetWarningPixDevolutionByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WARNING_PIX_DEVOLUTION.GET_BY_ID;

/**
 * GetById WarningPixDevolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWarningPixDevolutionByIdServiceKafka {
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
      context: GetWarningPixDevolutionByIdServiceKafka.name,
    });
  }

  /**
   * Call PixDevolutions microservice to get a PixDevolution.
   * @param payload Data.
   */
  async execute(
    payload: GetWarningPixDevolutionByIdRequest,
  ): Promise<GetWarningPixDevolutionByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetWarningPixDevolutionByIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send warning devolution message.', { data });

    // Call create PixDevolution microservice.
    const result = await this.kafkaService.send<
      GetWarningPixDevolutionByIdResponse,
      GetWarningPixDevolutionByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received warningDevolution message.', { result });

    return result;
  }
}
