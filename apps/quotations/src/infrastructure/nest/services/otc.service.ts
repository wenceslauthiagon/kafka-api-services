import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { Spread, SpreadEntity } from '@zro/otc/domain';
import { OtcService } from '@zro/quotations/application';
import { GetSpreadsByUserAndCurrenciesServiceKafka } from '@zro/otc/infrastructure';
import { GetSpreadsByUserAndCurrenciesRequest } from '@zro/otc/interface';

export class OtcServiceKafka implements OtcService {
  static _services: any[] = [GetSpreadsByUserAndCurrenciesServiceKafka];

  private readonly getSpreadsByUserAndCurrenciesService: GetSpreadsByUserAndCurrenciesServiceKafka;

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

    this.getSpreadsByUserAndCurrenciesService =
      new GetSpreadsByUserAndCurrenciesServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async getSpreadsByUserAndCurrencies(
    user: User,
    currencies: Currency[],
  ): Promise<Spread[]> {
    const payload = new GetSpreadsByUserAndCurrenciesRequest({
      userId: user.uuid,
      currencySymbols: currencies.map((item) => item.symbol),
    });

    const response =
      await this.getSpreadsByUserAndCurrenciesService.execute(payload);

    const result = response.map((item) => {
      const spread = new SpreadEntity(item);
      spread.currency = new CurrencyEntity({
        id: item.currencyId,
        symbol: item.currencySymbol,
      });
      delete spread['currencyId'];
      delete spread['currencySymbol'];

      return spread;
    });

    return result;
  }
}
