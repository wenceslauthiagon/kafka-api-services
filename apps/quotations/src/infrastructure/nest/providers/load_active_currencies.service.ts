import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  InjectLogger,
  KafkaService,
  RedisKey,
  RedisService,
} from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  CurrencyState,
} from '@zro/operations/domain';
import { CACHE } from '@zro/quotations/infrastructure';
import { GetAllCurrencyServiceKafka } from '@zro/operations/infrastructure';
import {
  GetAllCurrencyRequest,
  GetAllCurrencyRequestSort,
} from '@zro/operations/interface';

export class LoadActiveCurrenciesService
  implements OnModuleInit, OnModuleDestroy
{
  private bootTimeout: NodeJS.Timeout;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: LoadActiveCurrenciesService.name });
  }

  async onModuleInit() {
    this.bootTimeout = setTimeout(async () => {
      await this.loadActiveCurrencies();
    }, 0);
  }

  onModuleDestroy() {
    this.bootTimeout && clearTimeout(this.bootTimeout);
  }

  async getActiveCurrencies(): Promise<Currency[]> {
    const currencies = await this.redisService
      .get<Currency[]>(CACHE.CURRENCIES)
      .then((key) => key?.data?.map((item) => new CurrencyEntity(item)));

    return currencies ?? [];
  }

  async loadActiveCurrencies(): Promise<void> {
    let currencies: Currency[] = null;
    try {
      this.bootTimeout = null;
      this.logger.debug('Load active currencies.');

      currencies = await this.loadCurrencies();
      await this.setActiveCurrencies(currencies);
    } catch (error) {
      this.logger.error('No active currencies found.', error);
    } finally {
      if (!currencies?.length) {
        this.bootTimeout = setTimeout(async () => {
          await this.loadActiveCurrencies();
        }, 10000);
      }
    }
  }

  async setActiveCurrencies(currencies: Currency[]): Promise<void> {
    this.logger.debug('Set active currencies.', { currencies });

    const data: RedisKey<Currency[]> = {
      key: CACHE.CURRENCIES,
      data: currencies,
    };

    await this.redisService.set<Currency[]>(data);
  }

  private async loadCurrencies(): Promise<Currency[]> {
    const kafkaService = this.kafkaService;
    const logger = this.logger;

    const currencies: Currency[] = [];

    const getAllCurrenciesIterable = {
      [Symbol.asyncIterator]() {
        return {
          i: 1,
          total: 0,
          async next() {
            // Build get all currencies microservice.
            const getAllCurrencyService = new GetAllCurrencyServiceKafka(
              uuidV4(),
              logger,
              kafkaService,
            );

            // Get only active currencies
            const getAllCurrencyServiceRequest = new GetAllCurrencyRequest({
              state: CurrencyState.ACTIVE,
              sort: GetAllCurrencyRequestSort.ID,
              page: this.i++,
              pageSize: 100,
            });

            // Get an page of currencies.
            const pageCurrencies = await getAllCurrencyService.execute(
              getAllCurrencyServiceRequest,
            );

            // Remember how many currencies were loaded.
            this.total += pageCurrencies.pageTotal;

            return {
              value: pageCurrencies,
              done: pageCurrencies.data?.length === 0 ?? true,
            };
          },
        };
      },
    };

    // Iterate over all gotten pages.
    for await (const pageCurrencies of getAllCurrenciesIterable) {
      currencies.push(
        ...pageCurrencies.data.map((item) => new CurrencyEntity(item)),
      );
    }

    return currencies;
  }
}
