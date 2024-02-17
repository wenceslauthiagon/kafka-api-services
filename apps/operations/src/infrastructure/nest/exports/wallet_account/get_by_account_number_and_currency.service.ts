import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletAccountByAccountNumberAndCurrencyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByAccountNumberAndCurrencyRequest,
  GetWalletAccountByAccountNumberAndCurrencyResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_ACCOUNT_NUMBER_AND_CURRENCY;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletAccountByAccountNumberAndCurrencyServiceKafka {
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
      context: GetWalletAccountByAccountNumberAndCurrencyServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletAccountByAccountNumberAndCurrencyRequest,
  ): Promise<GetWalletAccountByAccountNumberAndCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug(
      'Send get wallet account by account number and currency payload.',
      { payload },
    );

    // Request Kafka message.
    // FIXME: Adicionar agencia a essa busca.
    const data: GetWalletAccountByAccountNumberAndCurrencyKafkaRequest = {
      key: `${payload.accountNumber}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get walletAccount microservice.
    const result = await this.kafkaService.send<
      GetWalletAccountByAccountNumberAndCurrencyResponse,
      GetWalletAccountByAccountNumberAndCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received get wallet account by account number and currency message.',
      { result },
    );

    return result;
  }
}
