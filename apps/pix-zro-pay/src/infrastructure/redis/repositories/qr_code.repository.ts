import { RedisKey, RedisService } from '@zro/common';
import { QrCode, QrCodeRepository } from '@zro/pix-zro-pay/domain';
import { QrCodeModel } from '@zro/pix-zro-pay/infrastructure';

const PREFIX = 'qr_code';

// TTL default 1 dia - 86400000 ms
export class QrCodeRedisRepository implements QrCodeRepository {
  constructor(
    private redisService: RedisService,
    private ttl = 86400000,
  ) {}

  static toDomain(qrCode: RedisKey<QrCodeModel>) {
    return qrCode?.data && new QrCodeModel(qrCode.data).toDomain();
  }

  private async createOrUpdate(qrCode: QrCode, ttl: number): Promise<void> {
    const result: RedisKey<QrCodeModel> = {
      key: `${PREFIX}:TXID:${qrCode.txId}`,
      data: new QrCodeModel(qrCode),
      ttl: ttl || this.ttl,
    };

    await this.redisService.set<QrCodeModel>(result);
  }

  async create(qrCode: QrCode, ttl = null): Promise<QrCode> {
    await this.createOrUpdate(qrCode, ttl);
    return qrCode;
  }

  async update(qrCode: QrCode, ttl = null): Promise<QrCode> {
    await this.createOrUpdate(qrCode, ttl);
    return qrCode;
  }

  async getAll(): Promise<QrCode[]> {
    return this.redisService
      .search<QrCodeModel>(`${PREFIX}:*`)
      .then((models) => models.map(QrCodeRedisRepository.toDomain));
  }

  async getByTxId(txId: string): Promise<QrCode> {
    return this.redisService
      .get<QrCodeModel>(`${PREFIX}:TXID:${txId}`)
      .then(QrCodeRedisRepository.toDomain);
  }
}
