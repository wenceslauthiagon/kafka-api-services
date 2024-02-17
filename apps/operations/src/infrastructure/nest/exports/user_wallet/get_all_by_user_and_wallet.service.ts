import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllUserWalletByUserAndWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllUserWalletByUserAndWalletRequest,
  GetAllUserWalletByUserAndWalletResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_WALLET.GET_ALL_BY_USER_AND_WALLET;

/**
 * Service to call get all by user and wallet at operations microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllUserWalletByUserAndWalletServiceKafka {
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
      context: GetAllUserWalletByUserAndWalletServiceKafka.name,
    });
  }

  /**
   * Call get user wallet permissions by user and wallet microservice.
   * @param payload The user's payload.
   * @returns User wallet permissions if found or null otherwise.
   */
  async execute(
    request: GetAllUserWalletByUserAndWalletRequest,
  ): Promise<GetAllUserWalletByUserAndWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Create request Kafka message.
    const data: GetAllUserWalletByUserAndWalletKafkaRequest = {
      key: `${request.userId}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    logger.debug('Get all user wallets by user and wallet message.', { data });

    // Call get user wallet by id microservice.
    const result = await this.kafkaService.send<
      GetAllUserWalletByUserAndWalletResponse,
      GetAllUserWalletByUserAndWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get all user wallets message.', {
      result,
    });

    return result;
  }
}
