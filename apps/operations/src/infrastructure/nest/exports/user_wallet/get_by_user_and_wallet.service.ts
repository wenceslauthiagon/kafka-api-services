import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserWalletByUserAndWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetUserWalletByUserAndWalletRequest,
  GetUserWalletByUserAndWalletResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_WALLET.GET_BY_USER_AND_WALLET;

/**
 * Service to call get by user wallet id at operations microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserWalletByUserAndWalletServiceKafka {
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
      context: GetUserWalletByUserAndWalletServiceKafka.name,
    });
  }

  /**
   * Call get user wallet by user and wallet microservice.
   * @param payload The user's payload.
   * @returns User if found or null otherwise.
   */
  async execute(
    payload: GetUserWalletByUserAndWalletRequest,
  ): Promise<GetUserWalletByUserAndWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Get user wallet by user and wallet payload.', { payload });

    // Create request Kafka message.
    const data: GetUserWalletByUserAndWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get user wallet by id microservice.
    const result = await this.kafkaService.send<
      GetUserWalletByUserAndWalletResponse,
      GetUserWalletByUserAndWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received user wallet message.', {
      result,
    });

    return result;
  }
}
