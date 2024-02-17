import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletAccountByUserAndCurrencyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByUserAndCurrencyRequest,
  GetWalletAccountByUserAndCurrencyResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_USER_AND_CURRENCY;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletAccountByUserAndCurrencyServiceKafka {
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
      context: GetWalletAccountByUserAndCurrencyServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletAccountByUserAndCurrencyRequest,
  ): Promise<GetWalletAccountByUserAndCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get wallet account by user and currency payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetWalletAccountByUserAndCurrencyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get walletAccount microservice.
    const result = await this.kafkaService.send<
      GetWalletAccountByUserAndCurrencyResponse,
      GetWalletAccountByUserAndCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet account by user and currency message.', {
      result,
    });

    return result;
  }
}
