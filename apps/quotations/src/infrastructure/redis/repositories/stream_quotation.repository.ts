import { RedisKey, RedisService } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamQuotation,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { StreamQuotationModel } from '../models/stream_quotation.model';

const PREFIX = 'stream_quotation';

export class StreamQuotationRedisRepository
  implements StreamQuotationRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 10000,
  ) {}

  static toDomain(quotation: RedisKey<StreamQuotationModel>) {
    return (
      quotation?.data && new StreamQuotationModel(quotation.data).toDomain()
    );
  }

  async createOrUpdate(quotations: StreamQuotation[]): Promise<void> {
    const keys = quotations.map((quotation) => {
      const key = `${PREFIX}-${quotation.baseCurrency.symbol}|${quotation.quoteCurrency.symbol}-${quotation.gatewayName}`;
      const data = new StreamQuotationModel(quotation);
      const result: RedisKey<StreamQuotationModel> = {
        key,
        data,
        ttl: this.ttl,
      };
      return result;
    });

    await this.redisService.set<StreamQuotationModel>(keys);
  }

  async getByBaseCurrencyAndQuoteCurrencyAndName(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    gatewayName: string,
  ): Promise<StreamQuotation> {
    return this.redisService
      .get<StreamQuotationModel>(
        `${PREFIX}-${baseCurrency.symbol}|${quoteCurrency.symbol}-${gatewayName}`,
      )
      .then(StreamQuotationRedisRepository.toDomain);
  }

  async getByBaseCurrencyAndQuoteCurrency(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): Promise<StreamQuotation[]> {
    return this.redisService
      .search<StreamQuotationModel>(
        `${PREFIX}-${baseCurrency.symbol}|${quoteCurrency.symbol}-*`,
      )
      .then((models) => models.map(StreamQuotationRedisRepository.toDomain));
  }
}
