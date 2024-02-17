import {
  NotImplementedException,
  RedisKey,
  RedisService,
  TPaginationResponse,
} from '@zro/common';
import { StreamPair, StreamPairRepository } from '@zro/quotations/domain';
import { CACHE, StreamPairModel } from '@zro/quotations/infrastructure';

export class StreamPairRedisRepository implements StreamPairRepository {
  constructor(private redisService: RedisService) {}

  static toDomain(keys: RedisKey<StreamPairModel[]>) {
    const pairs = keys?.data?.map((key) => new StreamPairModel(key).toDomain());

    return pairs ?? [];
  }

  create(): Promise<StreamPair> {
    throw new NotImplementedException();
  }
  update(): Promise<StreamPair> {
    throw new NotImplementedException();
  }
  getById(): Promise<StreamPair> {
    throw new NotImplementedException();
  }
  getAllByFilterAndPagination(): Promise<TPaginationResponse<StreamPair>> {
    throw new NotImplementedException();
  }
  getAllByBaseAndQuoteCurrencyAndActiveIsTrue(): Promise<StreamPair[]> {
    throw new NotImplementedException();
  }

  async getByGatewayNameAndActiveIsTrue(
    gatewayName: string,
  ): Promise<StreamPair[]> {
    return this.redisService
      .get<StreamPairModel[]>(CACHE.STREAM_PAIRS)
      .then(StreamPairRedisRepository.toDomain)
      .then((data) =>
        data.filter(
          (item) => item.active === true && item.gatewayName === gatewayName,
        ),
      );
  }

  async getAllActiveIsTrue(): Promise<StreamPair[]> {
    return this.redisService
      .get<StreamPairModel[]>(CACHE.STREAM_PAIRS)
      .then(StreamPairRedisRepository.toDomain)
      .then((data) => data.filter((item) => item.active === true));
  }
}
