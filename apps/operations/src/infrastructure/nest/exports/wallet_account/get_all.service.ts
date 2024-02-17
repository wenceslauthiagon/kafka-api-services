import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllWalletAccountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllWalletAccountRequest,
  GetAllWalletAccountResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_ACCOUNT.GET_ALL;

/**
 * Get all walletAccounts kafka microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllWalletAccountServiceKafka {
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
      context: GetAllWalletAccountServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get all walletAccounts.
   * @param payload Data.
   */
  async execute(
    payload: GetAllWalletAccountRequest,
  ): Promise<GetAllWalletAccountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get all walletAccounts payload.', { payload });

    // Request Kafka message.
    const data: GetAllWalletAccountKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get all walletAccount microservice.
    const result = await this.kafkaService.send<
      GetAllWalletAccountResponse,
      GetAllWalletAccountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get all walletAccounts.', { result });

    return result;
  }
}
