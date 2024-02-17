import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteUserWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import { DeleteUserWalletRequest } from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_WALLET.DELETE_BY_WALLET;

/**
 * Service to call delete user wallet at operations microservice.
 *
 */
@KafkaSubscribeService(SERVICE)
export class DeleteUserWalletServiceKafka {
  /**
   *  constructor.
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
      context: DeleteUserWalletServiceKafka.name,
    });
  }

  /**
   * Call delete user wallet microservice.
   * @param payload The user's payload.
   * @returns UserWallet if found or null otherwise.
   */
  async execute(payload: DeleteUserWalletRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Create user wallet payload.', { payload });

    // Create request Kafka message.
    const data: DeleteUserWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call delete user wallet microservice.
    const result = await this.kafkaService.send<
      void,
      DeleteUserWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received deleted user wallet message.', { result });

    return result;
  }
}
