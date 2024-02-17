import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  Currency,
  Wallet,
  WalletAccount,
  WalletAccountEntity,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import { OperationService } from '@zro/utils/application';
import {
  GetWalletAccountByUserAndCurrencyServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByUserAndCurrencyRequest,
  GetWalletAccountByWalletAndCurrencyRequest,
} from '@zro/operations/interface';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetWalletAccountByUserAndCurrencyServiceKafka,
    GetWalletAccountByWalletAndCurrencyServiceKafka,
  ];

  private readonly getWalletAccountByUserAndCurrencyService: GetWalletAccountByUserAndCurrencyServiceKafka;
  private readonly getWalletAccountByWalletAndCurrencyService: GetWalletAccountByWalletAndCurrencyServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: OperationServiceKafka.name });

    this.getWalletAccountByUserAndCurrencyService =
      new GetWalletAccountByUserAndCurrencyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getWalletAccountByWalletAndCurrencyService =
      new GetWalletAccountByWalletAndCurrencyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get wallet account by user and currency.
   * @param user User.
   * @param currency Currency.
   * @returns Wallet account or null otherwise .
   */
  async getWalletAccountByUserAndCurrency(
    user: User,
    currency: Currency,
  ): Promise<WalletAccount> {
    const request = new GetWalletAccountByUserAndCurrencyRequest({
      userId: user.uuid,
      currencyTag: currency.tag,
    });

    const result =
      await this.getWalletAccountByUserAndCurrencyService.execute(request);

    const response = result && new WalletAccountEntity(result);

    return response;
  }

  /**
   * Get wallet account in microservice.
   * @param user Data for construct param.
   * @param currency Data for construct param.
   * @returns Wallet Account.
   */
  async getWalletAccountByWalletAndCurrency(
    wallet: Wallet,
    currency: Currency,
  ): Promise<WalletAccount> {
    const request: GetWalletAccountByWalletAndCurrencyRequest = {
      walletId: wallet.uuid,
      currencyTag: currency.tag,
    };
    const result =
      await this.getWalletAccountByWalletAndCurrencyService.execute(request);
    const response = result && new WalletAccountEntity(result);
    return response;
  }
}
