import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletAccountByWalletAndUuidKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByWalletAndUuidRequest,
  GetWalletAccountByWalletAndUuidResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_WALLET_AND_UUID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletAccountByWalletAndUuidServiceKafka {
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
      context: GetWalletAccountByWalletAndUuidServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get wallet accounts by wallet and uuid.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletAccountByWalletAndUuidRequest,
  ): Promise<GetWalletAccountByWalletAndUuidResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get wallet account by wallet and uuid payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetWalletAccountByWalletAndUuidKafkaRequest = {
      key: `${payload.uuid}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get walletAccount microservice.
    const result = await this.kafkaService.send<
      GetWalletAccountByWalletAndUuidResponse,
      GetWalletAccountByWalletAndUuidKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet account by wallet and uuid message.', {
      result,
    });

    return result;
  }
}
