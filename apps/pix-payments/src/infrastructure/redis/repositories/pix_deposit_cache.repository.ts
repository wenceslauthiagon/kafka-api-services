import { RedisKey, RedisService } from '@zro/common';
import {
  PixDeposit,
  PixDepositCacheRepository,
} from '@zro/pix-payments/domain';
import { PixDepositRedisModel } from '@zro/pix-payments/infrastructure';

const PREFIX = 'pix_deposit';

export class PixDepositRedisRepository implements PixDepositCacheRepository {
  constructor(
    private redisService: RedisService,
    private depositTtl = 600000,
    private hashTtl = 86400000,
  ) {}

  static toDomain(deposit: RedisKey<PixDepositRedisModel>): PixDeposit {
    return deposit?.data && new PixDepositRedisModel(deposit.data).toDomain();
  }

  async create(pixDeposit: PixDeposit): Promise<PixDeposit> {
    pixDeposit.createdAt = new Date();
    pixDeposit.updatedAt = new Date();

    const result: RedisKey<PixDepositRedisModel> = {
      key: `${PREFIX}:id:${pixDeposit.id}`,
      data: new PixDepositRedisModel(pixDeposit),
      ttl: this.depositTtl,
    };

    await this.redisService.set<PixDepositRedisModel>(result);

    return pixDeposit;
  }

  async update(pixDeposit: PixDeposit): Promise<PixDeposit> {
    pixDeposit.updatedAt = new Date();

    const result: RedisKey<PixDepositRedisModel> = {
      key: `${PREFIX}:id:${pixDeposit.id}`,
      data: new PixDepositRedisModel(pixDeposit),
      ttl: this.depositTtl,
    };

    await this.redisService.set<PixDepositRedisModel>(result);

    return pixDeposit;
  }

  async getById(id: string): Promise<PixDeposit> {
    return this.redisService
      .get<PixDepositRedisModel>(`${PREFIX}:id:${id}`)
      .then(PixDepositRedisRepository.toDomain);
  }

  async semaphore(
    id: string,
    callback: () => Promise<PixDeposit>,
  ): Promise<PixDeposit> {
    const key = `${PREFIX}:id:${id}`;

    await this.redisService.semaphore(key, callback);

    return this.getById(id);
  }

  async getByHash(hash: string): Promise<PixDeposit> {
    return this.redisService
      .get<PixDepositRedisModel>(`${PREFIX}:hash:${hash}`)
      .then(PixDepositRedisRepository.toDomain);
  }

  async createHash(hash: string, pixDeposit: PixDeposit): Promise<PixDeposit> {
    const result: RedisKey<PixDepositRedisModel> = {
      key: `${PREFIX}:hash:${hash}`,
      data: new PixDepositRedisModel(pixDeposit),
      ttl: this.hashTtl,
    };

    await this.redisService.set<PixDepositRedisModel>(result);

    return pixDeposit;
  }
}
