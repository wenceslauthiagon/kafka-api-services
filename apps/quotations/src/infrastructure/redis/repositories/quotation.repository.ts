import { RedisKey, RedisService } from '@zro/common';
import { Quotation, QuotationRepository } from '@zro/quotations/domain';
import { QuotationModel } from '../models/quotation.model';

const PREFIX = 'quotation';

export class QuotationRedisRepository implements QuotationRepository {
  constructor(
    private redisService: RedisService,
    private ttl = 10000,
  ) {}

  static toDomain(quotation: RedisKey<QuotationModel>) {
    return quotation?.data && new QuotationModel(quotation.data).toDomain();
  }

  private async createOrUpdate(quotation: Quotation): Promise<void> {
    const result: RedisKey<QuotationModel> = {
      key: `${PREFIX}-${quotation.id}`,
      data: new QuotationModel(quotation),
      ttl: this.ttl,
    };

    await this.redisService.set<QuotationModel>(result);
  }

  async create(quotation: Quotation): Promise<Quotation> {
    await this.createOrUpdate(quotation);
    return quotation;
  }

  async update(quotation: Quotation): Promise<Quotation> {
    await this.createOrUpdate(quotation);
    return quotation;
  }

  async getById(id: string): Promise<Quotation> {
    return this.redisService
      .get<QuotationModel>(`${PREFIX}-${id}`)
      .then(QuotationRedisRepository.toDomain);
  }
}
