import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletAccountByWalletAndCurrencyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByWalletAndCurrencyRequest,
  GetWalletAccountByWalletAndCurrencyResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_WALLET_AND_CURRENCY;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletAccountByWalletAndCurrencyServiceKafka {
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
      context: GetWalletAccountByWalletAndCurrencyServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletAccountByWalletAndCurrencyRequest,
  ): Promise<GetWalletAccountByWalletAndCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get wallet account by wallet and currency payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetWalletAccountByWalletAndCurrencyKafkaRequest = {
      key: `${payload.walletId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get walletAccount microservice.
    const result = await this.kafkaService.send<
      GetWalletAccountByWalletAndCurrencyResponse,
      GetWalletAccountByWalletAndCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received get wallet account by wallet and currency message.',
      { result },
    );

    return result;
  }
}
