import { RedisKey, RedisService } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamQuotationGateway,
  StreamQuotationGatewayRepository,
} from '@zro/quotations/domain';
import { StreamQuotationGatewayModel } from '../models/stream_quotation_gateway.model';

const PREFIX = 'stream_quotation_gateway';

export class StreamQuotationGatewayRedisRepository
  implements StreamQuotationGatewayRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 10000,
  ) {}

  static toDomain(streamQuotation: RedisKey<StreamQuotationGatewayModel>) {
    return (
      streamQuotation?.data &&
      new StreamQuotationGatewayModel(streamQuotation.data).toDomain()
    );
  }

  async createOrUpdate(quotations: StreamQuotationGateway[]): Promise<void> {
    const keys = quotations.map((quotation) => {
      const key = `${PREFIX}-${quotation.baseCurrency.symbol}|${quotation.quoteCurrency.symbol}-${quotation.gatewayName}`;
      const data = new StreamQuotationGatewayModel(quotation);
      const result: RedisKey<StreamQuotationGatewayModel> = {
        key,
        data,
        ttl: this.ttl,
      };
      return result;
    });

    await this.redisService.set<StreamQuotationGatewayModel>(keys);
  }

  async getByBaseCurrencyAndQuoteCurrencyAndGatewayName(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    gatewayName: string,
  ): Promise<StreamQuotationGateway> {
    return this.redisService
      .get<StreamQuotationGatewayModel>(
        `${PREFIX}-${baseCurrency.symbol}|${quoteCurrency.symbol}-${gatewayName}`,
      )
      .then(StreamQuotationGatewayRedisRepository.toDomain);
  }
}
