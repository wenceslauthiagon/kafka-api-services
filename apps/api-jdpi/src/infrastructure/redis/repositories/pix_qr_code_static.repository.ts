import { RedisKey, RedisService } from '@zro/common';
import { QrCodeStatic } from '@zro/pix-payments/domain';
import { QrCodeStaticCacheRepository } from '@zro/api-jdpi/domain';
import { QrCodeStaticModel } from '@zro/api-jdpi/infrastructure';

const PREFIX = 'qr_code_static';

export class QrCodeStaticRedisRepository
  implements QrCodeStaticCacheRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(key: RedisKey<QrCodeStaticModel>) {
    return key?.data && new QrCodeStaticModel(key.data).toDomain();
  }

  async create(qrCode: QrCodeStatic, ttl?: number): Promise<QrCodeStatic> {
    const result: RedisKey<QrCodeStaticModel> = {
      key: `${PREFIX}:txid:${qrCode.txId}`,
      data: new QrCodeStaticModel(qrCode),
      ttl,
    };

    await this.redisService.set<QrCodeStaticModel>(result);
    return qrCode;
  }

  async getByTxId(txId: string): Promise<QrCodeStatic> {
    return this.redisService
      .get<QrCodeStaticModel>(`${PREFIX}:txid:${txId}`)
      .then(QrCodeStaticRedisRepository.toDomain);
  }
}
