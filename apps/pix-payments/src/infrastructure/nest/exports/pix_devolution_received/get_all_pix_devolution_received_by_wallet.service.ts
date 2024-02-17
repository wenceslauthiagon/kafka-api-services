import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixDevolutionReceivedByWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPixDevolutionReceivedByWalletRequest,
  GetAllPixDevolutionReceivedByWalletResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_ALL_BY_WALLET;

/**
 * Pix devolution received microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixDevolutionReceivedByWalletServiceKafka {
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
      context: GetAllPixDevolutionReceivedByWalletServiceKafka.name,
    });
  }

  /**
   * Call devolutions received microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPixDevolutionReceivedByWalletRequest,
  ): Promise<GetAllPixDevolutionReceivedByWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixDevolutionReceivedByWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send devolution received message.', { data });

    // Call getAll PixDevolutionReceived microservice.
    const result = await this.kafkaService.send<
      GetAllPixDevolutionReceivedByWalletResponse,
      GetAllPixDevolutionReceivedByWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received devolution received message.', { result });

    return result;
  }
}
