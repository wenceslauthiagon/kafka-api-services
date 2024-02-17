import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  CurrencyRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  CurrencyDatabaseRepository,
  KAFKA_TOPICS,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByAccountNumberAndCurrencyController,
  GetWalletAccountByAccountNumberAndCurrencyRequest,
  GetWalletAccountByAccountNumberAndCurrencyResponse,
} from '@zro/operations/interface';

export type GetWalletAccountByAccountNumberAndCurrencyKafkaRequest =
  KafkaMessage<GetWalletAccountByAccountNumberAndCurrencyRequest>;

export type GetWalletAccountByAccountNumberAndCurrencyKafkaResponse =
  KafkaResponse<GetWalletAccountByAccountNumberAndCurrencyResponse>;

@Controller()
@MicroserviceController()
export class GetWalletAccountByAccountNumberAndCurrencyMicroserviceController {
  /**
   * Parse get wallet account by account number and currency message and call
   * get wallet account controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_ACCOUNT_NUMBER_AND_CURRENCY,
  )
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(
      GetWalletAccountByAccountNumberAndCurrencyMicroserviceController,
    )
    logger: Logger,
    @Payload('value')
    message: GetWalletAccountByAccountNumberAndCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletAccountByAccountNumberAndCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletAccountByAccountNumberAndCurrencyRequest(
      message,
    );

    logger.info('Get wallet account by account number and currency.', {
      payload,
    });

    // Create get controller.
    const controller = new GetWalletAccountByAccountNumberAndCurrencyController(
      logger,
      walletAccountRepository,
      currencyRepository,
    );

    // Get wallet account.
    const walletAccount = await controller.execute(payload);

    logger.info('Wallet account found.', { walletAccount });

    return {
      ctx,
      value: walletAccount,
    };
  }
}
