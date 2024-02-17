import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateP2PTransferKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateP2PTransferRequest,
  CreateP2PTransferResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.P2P_TRANSFER.CREATE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateP2PTransferServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: CreateP2PTransferServiceKafka.name });
  }

  /**
   * Call operations microservice to create P2P transfer.
   * @param payload Data.
   */
  async execute(
    payload: CreateP2PTransferRequest,
  ): Promise<CreateP2PTransferResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send create P2P transfer payload.', { payload });

    // Request Kafka message.
    const data: CreateP2PTransferKafkaRequest = {
      key: `${payload.walletId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call create P2P transfer microservice.
    const result = await this.kafkaService.send<
      CreateP2PTransferResponse,
      CreateP2PTransferKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create P2P transfer message.', { result });

    return result;
  }
}
