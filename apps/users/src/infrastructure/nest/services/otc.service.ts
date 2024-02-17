import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, OperationEntity, Wallet } from '@zro/operations/domain';
import { Cashback, CashbackEntity, ConversionEntity } from '@zro/otc/domain';
import { OtcService } from '@zro/users/application';
import { CreateCashbackServiceKafka } from '@zro/otc/infrastructure';
import { CreateCashbackRequest } from '@zro/otc/interface';

export class OtcServiceKafka implements OtcService {
  static _services: any[] = [CreateCashbackServiceKafka];

  private readonly createCashbackService: CreateCashbackServiceKafka;

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
    this.logger = logger.child({ context: OtcServiceKafka.name });

    this.createCashbackService = new CreateCashbackServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async createCashback(
    id: string,
    user: User,
    wallet: Wallet,
    baseCurrency: Currency,
    amountCurrency: Currency,
    amount: number,
    description: string,
  ): Promise<Cashback> {
    const payload = new CreateCashbackRequest({
      id,
      amount,
      description,
      userId: user.uuid,
      walletId: wallet.uuid,
      baseCurrencySymbol: baseCurrency.symbol,
      amountCurrencySymbol: amountCurrency.symbol,
    });

    const response = await this.createCashbackService.execute(payload);

    const cashback = new CashbackEntity({
      id: response.id,
      createdAt: response.createdAt,
    });
    cashback.conversion = new ConversionEntity({ id: response.conversionId });
    cashback.conversion.operation = new OperationEntity({
      id: response.conversionOperationId,
    });

    return cashback;
  }
}
