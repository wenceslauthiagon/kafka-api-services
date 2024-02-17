import { RedisKey, RedisService } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyCacheRepository,
} from '@zro/pix-keys/domain';
import { DecodedPixKeyRedisModel } from '@zro/pix-keys/infrastructure';

const PREFIX = 'pix_decoded_key';

export class DecodedPixKeyRedisRepository
  implements DecodedPixKeyCacheRepository
{
  constructor(
    private redisService: RedisService,
    private ttl = 10000,
  ) {}

  static toDomain(key: RedisKey<DecodedPixKeyRedisModel>): DecodedPixKey {
    return key?.data && new DecodedPixKeyRedisModel(key.data).toDomain();
  }

  async getByHash(hash: string): Promise<DecodedPixKey> {
    return this.redisService
      .get<DecodedPixKeyRedisModel>(`${PREFIX}:hash:${hash}`)
      .then(DecodedPixKeyRedisRepository.toDomain);
  }

  async createHash(
    hash: string,
    pixDeposit: DecodedPixKey,
  ): Promise<DecodedPixKey> {
    const result: RedisKey<DecodedPixKeyRedisModel> = {
      key: `${PREFIX}:hash:${hash}`,
      data: new DecodedPixKeyRedisModel(pixDeposit),
      ttl: this.ttl,
    };

    await this.redisService.set<DecodedPixKeyRedisModel>(result);

    return pixDeposit;
  }
}
