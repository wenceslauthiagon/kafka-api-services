import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllUserWalletByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllUserWalletByUserRequest,
  GetAllUserWalletByUserResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_WALLET.GET_ALL_BY_USER;

/**
 * Service to call get all by user wallet at operations microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllUserWalletByUserServiceKafka {
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
      context: GetAllUserWalletByUserServiceKafka.name,
    });
  }

  /**
   * Call get all user wallet microservice.
   * @param payload The user's payload.
   * @returns User if found or null otherwise.
   */
  async execute(
    payload: GetAllUserWalletByUserRequest,
  ): Promise<GetAllUserWalletByUserResponse[]> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Get all user wallet payload.', { payload });

    // Create request Kafka message.
    const data: GetAllUserWalletByUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get all user wallet microservice.
    const result = await this.kafkaService.send<
      GetAllUserWalletByUserResponse[],
      GetAllUserWalletByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received user wallet message.', { result });

    return result;
  }
}
