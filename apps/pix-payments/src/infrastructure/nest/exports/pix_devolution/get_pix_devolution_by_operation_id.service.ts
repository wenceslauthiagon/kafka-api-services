import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDevolutionByOperationIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByOperationIdRequest,
  GetPixDevolutionByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION.GET_BY_OPERATION_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDevolutionByOperationIdServiceKafka {
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
      context: GetPixDevolutionByOperationIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetPixDevolutionByOperationId.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDevolutionByOperationIdRequest,
  ): Promise<GetPixDevolutionByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDevolutionByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send pixDevolution message.', { data });

    // Call GetPixDevolutionByOperationId Payment microservice.
    const result = await this.kafkaService.send<
      GetPixDevolutionByOperationIdResponse,
      GetPixDevolutionByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixDevolution message.', { result });

    return result;
  }
}
