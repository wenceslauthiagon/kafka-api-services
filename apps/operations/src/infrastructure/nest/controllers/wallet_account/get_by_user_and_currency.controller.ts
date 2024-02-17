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
  GetWalletAccountByUserAndCurrencyController,
  GetWalletAccountByUserAndCurrencyRequest,
  GetWalletAccountByUserAndCurrencyResponse,
} from '@zro/operations/interface';

export type GetWalletAccountByUserAndCurrencyKafkaRequest =
  KafkaMessage<GetWalletAccountByUserAndCurrencyRequest>;

export type GetWalletAccountByUserAndCurrencyKafkaResponse =
  KafkaResponse<GetWalletAccountByUserAndCurrencyResponse>;

@Controller()
@MicroserviceController()
export class GetWalletAccountByUserAndCurrencyMicroserviceController {
  /**
   * Parse get wallet account by user and currency message and call
   * get wallet account controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_USER_AND_CURRENCY)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetWalletAccountByUserAndCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWalletAccountByUserAndCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletAccountByUserAndCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletAccountByUserAndCurrencyRequest(message);

    logger.info('Get wallet account by user and currency.', { payload });

    // Create get controller.
    const controller = new GetWalletAccountByUserAndCurrencyController(
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
