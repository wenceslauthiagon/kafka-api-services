import { RedisKey, RedisService } from '@zro/common';
import {
  NotifyCreditValidation,
  NotifyCreditValidationCacheRepository,
} from '@zro/api-jdpi/domain';

const PREFIX = 'notify_credit_validation';

export class NotifyCreditValidationRedisRepository
  implements NotifyCreditValidationCacheRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 600000, // 10 min
  ) {}

  static toDomain(key: RedisKey<any>): NotifyCreditValidation {
    return key?.data;
  }

  async getByHash(hash: string): Promise<NotifyCreditValidation> {
    return this.redisService
      .get<any>(`${PREFIX}:hash:${hash}`)
      .then(NotifyCreditValidationRedisRepository.toDomain);
  }

  async createHash(
    hash: string,
    payload: NotifyCreditValidation,
  ): Promise<NotifyCreditValidation> {
    const result: RedisKey<any> = {
      key: `${PREFIX}:hash:${hash}`,
      // TODO: create DTO to RedisModel
      data: payload,
      ttl: this.ttl,
    };

    await this.redisService.set<any>(result);

    return payload;
  }
}
