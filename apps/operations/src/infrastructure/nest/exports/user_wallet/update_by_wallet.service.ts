import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateUserWalletByWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  UpdateUserWalletByWalletRequest,
  UpdateUserWalletByWalletResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_WALLET.UPDATE_BY_WALLET;

/**
 * Service to call update by user wallet id at operations microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserWalletByWalletServiceKafka {
  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateUserWalletByWalletServiceKafka.name,
    });
  }

  /**
   * Call update user wallet by wallet microservice.
   * @param payload The user's payload.
   * @returns User if found or null otherwise.
   */
  async execute(
    payload: UpdateUserWalletByWalletRequest,
  ): Promise<UpdateUserWalletByWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Update user wallet by wallet payload.', { payload });

    // Create request Kafka message.
    const data: UpdateUserWalletByWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call update user wallet by id microservice.
    const result = await this.kafkaService.send<
      UpdateUserWalletByWalletResponse,
      UpdateUserWalletByWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received user wallet message.', { result });

    return result;
  }
}
