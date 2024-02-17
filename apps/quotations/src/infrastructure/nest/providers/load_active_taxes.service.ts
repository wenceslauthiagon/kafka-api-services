import { Logger } from 'winston';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectLogger, RedisKey, RedisService } from '@zro/common';
import { Tax, TaxEntity } from '@zro/quotations/domain';
import { CACHE, TaxDatabaseRepository } from '@zro/quotations/infrastructure';
import {
  GetAllTaxController,
  GetAllTaxRequest,
  GetAllTaxRequestSort,
} from '@zro/quotations/interface';

export class LoadActiveTaxService implements OnModuleInit, OnModuleDestroy {
  private bootTimeout: NodeJS.Timeout;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: LoadActiveTaxService.name });
  }

  async onModuleInit() {
    this.bootTimeout = setTimeout(async () => {
      await this.loadActiveTaxes();
    }, 0);
  }

  onModuleDestroy() {
    this.bootTimeout && clearTimeout(this.bootTimeout);
  }

  async getActiveTaxes(): Promise<Tax[]> {
    const taxes = await this.redisService
      .get<Tax[]>(CACHE.TAXES)
      .then((key) => key?.data?.map((item) => new TaxEntity(item)));

    return taxes ?? [];
  }

  async loadActiveTaxes(): Promise<void> {
    let taxes: Tax[] = [];
    try {
      this.bootTimeout = null;
      this.logger.debug('Load active Taxes.');

      taxes = await this.loadTaxes();
      await this.setActiveTaxes(taxes);
    } catch (error) {
      this.logger.error('No active Taxes found.', { stack: error.stack });
    } finally {
      if (!taxes.length) {
        this.bootTimeout = setTimeout(async () => {
          await this.loadActiveTaxes();
        }, 10000);
      }
    }
  }

  async setActiveTaxes(taxes: Tax[]): Promise<void> {
    this.logger.debug('Set active Taxes.', { taxes });

    const data: RedisKey<Tax[]> = { key: CACHE.TAXES, data: taxes };

    await this.redisService.set<Tax[]>(data);
  }

  private async loadTaxes(): Promise<Tax[]> {
    const logger = this.logger;
    const TaxRepository = new TaxDatabaseRepository();

    const taxes: Tax[] = [];

    const getAllTaxesIterable = {
      [Symbol.asyncIterator]() {
        return {
          i: 1,
          total: 0,
          async next() {
            // Build get all Taxes microservice.
            const getAllTaxeService = new GetAllTaxController(
              logger,
              TaxRepository,
            );

            // Get only active Taxes
            const getAllTaxeServiceRequest = new GetAllTaxRequest({
              sort: GetAllTaxRequestSort.ID,
              page: this.i++,
              pageSize: 100,
            });

            // Get an page of Taxes.
            const pageTaxes = await getAllTaxeService.execute(
              getAllTaxeServiceRequest,
            );

            // Remember how many Taxes were loaded.
            this.total += pageTaxes.pageTotal;

            return {
              value: pageTaxes,
              done: !pageTaxes.data?.length,
            };
          },
        };
      },
    };

    // Iterate over all gotten pages.
    for await (const pageTaxes of getAllTaxesIterable) {
      pageTaxes.data.forEach((item) =>
        taxes.push(
          new TaxEntity({
            id: item.id,
            name: item.name,
            value: item.value,
            format: item.format,
            createdAt: item.createdAt,
          }),
        ),
      );
    }

    return taxes;
  }
}
