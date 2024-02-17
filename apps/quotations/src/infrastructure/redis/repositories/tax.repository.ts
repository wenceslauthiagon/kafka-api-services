import {
  NotImplementedException,
  RedisKey,
  RedisService,
  TPaginationResponse,
} from '@zro/common';
import { Tax, TaxRepository } from '@zro/quotations/domain';
import { CACHE, TaxModel } from '@zro/quotations/infrastructure';

export class TaxRedisRepository implements TaxRepository {
  constructor(private redisService: RedisService) {}

  static toDomain(keys: RedisKey<TaxModel[]>) {
    const pairs = keys?.data?.map((key) => new TaxModel(key).toDomain());

    return pairs ?? [];
  }

  create(): Promise<Tax> {
    throw new NotImplementedException();
  }
  getById(): Promise<Tax> {
    throw new NotImplementedException();
  }
  getAllByFilterAndPagination(): Promise<TPaginationResponse<Tax>> {
    throw new NotImplementedException();
  }

  async getByName(name: string): Promise<Tax> {
    return this.redisService
      .get<TaxModel[]>(CACHE.TAXES)
      .then(TaxRedisRepository.toDomain)
      .then((data) => data.find((item) => item.name === name));
  }
}
