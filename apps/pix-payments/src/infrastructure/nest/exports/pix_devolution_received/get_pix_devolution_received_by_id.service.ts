import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDevolutionReceivedByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByIdRequest,
  GetPixDevolutionReceivedByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_BY_ID;

/**
 * GetById PixDevolution microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDevolutionReceivedByIdServiceKafka {
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
      context: GetPixDevolutionReceivedByIdServiceKafka.name,
    });
  }

  /**
   * Call PixDevolutionReceiveds microservice to get a PixDevolutionReceived.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDevolutionReceivedByIdRequest,
  ): Promise<GetPixDevolutionReceivedByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDevolutionReceivedByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send devolution message.', { data });

    // Call create PixDevolutionReceived microservice.
    const result = await this.kafkaService.send<
      GetPixDevolutionReceivedByIdResponse,
      GetPixDevolutionReceivedByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received devolution message.', { result });

    return result;
  }
}
