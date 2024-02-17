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
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByWalletAndCurrencyController,
  GetWalletAccountByWalletAndCurrencyRequest,
  GetWalletAccountByWalletAndCurrencyResponse,
} from '@zro/operations/interface';

export type GetWalletAccountByWalletAndCurrencyKafkaRequest =
  KafkaMessage<GetWalletAccountByWalletAndCurrencyRequest>;

export type GetWalletAccountByWalletAndCurrencyKafkaResponse =
  KafkaResponse<GetWalletAccountByWalletAndCurrencyResponse>;

@Controller()
@MicroserviceController()
export class GetWalletAccountByWalletAndCurrencyMicroserviceController {
  /**
   * Parse get wallet account by wallet and currency message and call
   * get wallet account controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_WALLET_AND_CURRENCY)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetWalletAccountByWalletAndCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWalletAccountByWalletAndCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletAccountByWalletAndCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletAccountByWalletAndCurrencyRequest(message);

    logger.info('Get wallet account by wallet and currency.', { payload });

    // Create get controller.
    const controller = new GetWalletAccountByWalletAndCurrencyController(
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
