import { RedisKey, RedisService } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  OperationStreamQuotation,
  OperationStreamQuotationRepository,
} from '@zro/operations/domain';
import { OperationStreamQuotationModel } from '@zro/operations/infrastructure';

const PREFIX = 'operation_stream_quotation';

export class OperationStreamQuotationRedisRepository
  implements OperationStreamQuotationRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 10000,
  ) {}

  static toDomain(operationStream: RedisKey<OperationStreamQuotationModel>) {
    return (
      operationStream?.data &&
      new OperationStreamQuotationModel(operationStream.data).toDomain()
    );
  }

  async createOrUpdate(
    operationStreamQuotations: OperationStreamQuotation[],
  ): Promise<void> {
    const keys = operationStreamQuotations.map((quotation) => {
      const key = `${PREFIX}-${quotation.baseCurrency.symbol}|${quotation.quoteCurrency.symbol}-${quotation.provider}`;
      const data = new OperationStreamQuotationModel(quotation);
      const result: RedisKey<OperationStreamQuotationModel> = {
        key,
        data,
        ttl: this.ttl,
      };
      return result;
    });

    await this.redisService.set<OperationStreamQuotationModel>(keys);
  }

  async getByBaseCurrencyAndQuoteCurrency(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): Promise<OperationStreamQuotation[]> {
    return this.redisService
      .search<OperationStreamQuotationModel>(
        `${PREFIX}-${baseCurrency.symbol}|${quoteCurrency.symbol}-*`,
      )
      .then((models) =>
        models.map(OperationStreamQuotationRedisRepository.toDomain),
      );
  }
}
