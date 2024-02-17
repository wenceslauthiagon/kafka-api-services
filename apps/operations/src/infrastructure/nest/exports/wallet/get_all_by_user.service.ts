import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllWalletByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllWalletByUserRequest,
  GetAllWalletByUserResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.GET_ALL_BY_USER;

/**
 * Get all wallet kafka microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllWalletByUserServiceKafka {
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
      context: GetAllWalletByUserServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get all wallets.
   * @param payload Data.
   */
  async execute(
    payload: GetAllWalletByUserRequest,
  ): Promise<GetAllWalletByUserResponse[]> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get all wallets payload.', { payload });

    // Request Kafka message.
    const data: GetAllWalletByUserKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get all wallets microservice.
    const result = await this.kafkaService.send<
      GetAllWalletByUserResponse[],
      GetAllWalletByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get all wallets.', { result });

    return result;
  }
}
