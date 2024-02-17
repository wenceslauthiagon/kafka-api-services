import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateActiveWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateActiveWalletRequest,
  CreateActiveWalletResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.CREATE_ACTIVE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateActiveWalletServiceKafka {
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
    this.logger = logger.child({
      context: CreateActiveWalletServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to create active wallet.
   * @param payload Data.
   */
  async execute(
    payload: CreateActiveWalletRequest,
  ): Promise<CreateActiveWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send create active wallet payload.', { payload });

    // Request Kafka message.
    const data: CreateActiveWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call create active wallet microservice.
    const result = await this.kafkaService.send<
      CreateActiveWalletResponse,
      CreateActiveWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Create active wallet message received.', { result });

    return result;
  }
}
