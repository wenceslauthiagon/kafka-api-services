import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDevolutionReceivedByOperationIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByOperationIdRequest,
  GetPixDevolutionReceivedByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_BY_OPERATION_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDevolutionReceivedByOperationIdServiceKafka {
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
      context: GetPixDevolutionReceivedByOperationIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetPixDevolutionReceivedByOperationId.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDevolutionReceivedByOperationIdRequest,
  ): Promise<GetPixDevolutionReceivedByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDevolutionReceivedByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send pixDevolutionReceived message.', { data });

    // Call GetPixDevolutionReceivedByOperationId Payment microservice.
    const result = await this.kafkaService.send<
      GetPixDevolutionReceivedByOperationIdResponse,
      GetPixDevolutionReceivedByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixDevolutionReceived message.', { result });

    return result;
  }
}
