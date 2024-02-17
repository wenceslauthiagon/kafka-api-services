import { RedisKey, RedisService } from '@zro/common';
import {
  WarningPixSkipList,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import { WarningPixSkipListRedisModel } from '@zro/pix-payments/infrastructure';

const PREFIX = 'warning_pix_skip_list';

export class WarningPixSkipListRedisRepository
  implements WarningPixSkipListRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 600000,
  ) {}

  static toDomain(
    warning: RedisKey<WarningPixSkipListRedisModel>,
  ): WarningPixSkipList {
    return (
      warning?.data && new WarningPixSkipListRedisModel(warning.data).toDomain()
    );
  }

  async create(
    warningPixSkipList: WarningPixSkipList,
  ): Promise<WarningPixSkipList> {
    warningPixSkipList.createdAt = new Date();
    warningPixSkipList.updatedAt = new Date();

    const result: RedisKey<WarningPixSkipListRedisModel> = {
      key: `${PREFIX}:clientAccountNumber:${warningPixSkipList.clientAccountNumber}`,
      data: new WarningPixSkipListRedisModel(warningPixSkipList),
      ttl: this.ttl,
    };

    await this.redisService.set<WarningPixSkipListRedisModel>(result);

    return warningPixSkipList;
  }

  async update(
    warningPixSkipList: WarningPixSkipList,
  ): Promise<WarningPixSkipList> {
    warningPixSkipList.updatedAt = new Date();

    const result: RedisKey<WarningPixSkipListRedisModel> = {
      key: `${PREFIX}:clientAccountNumber:${warningPixSkipList.clientAccountNumber}`,
      data: new WarningPixSkipListRedisModel(warningPixSkipList),
      ttl: this.ttl,
    };

    await this.redisService.set<WarningPixSkipListRedisModel>(result);

    return warningPixSkipList;
  }

  async getByClientAccountNumber(
    clientAccountNumber: string,
  ): Promise<WarningPixSkipList> {
    return this.redisService
      .get<WarningPixSkipListRedisModel>(
        `${PREFIX}:clientAccountNumber:${clientAccountNumber}`,
      )
      .then(WarningPixSkipListRedisRepository.toDomain);
  }
}
