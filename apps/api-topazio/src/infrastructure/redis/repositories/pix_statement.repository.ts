import { RedisKey, RedisService } from '@zro/common';
import { PixStatement, PixStatementRepository } from '@zro/api-topazio/domain';
import { PixStatementModel } from '@zro/api-topazio/infrastructure';
import { formatToYearMonthDay } from '@zro/common/utils/format_to_year_month_day.util';

const PREFIX = 'pix_statements';

// TTL default 30 dias - 2592000000 ms
export class PixStatementRedisRepository implements PixStatementRepository {
  constructor(
    private redisService: RedisService,
    private ttl = 2592000000,
  ) {}

  static toDomain(pixStatement: RedisKey<PixStatementModel>) {
    return (
      pixStatement?.data && new PixStatementModel(pixStatement.data).toDomain()
    );
  }

  private async createOrUpdate(pixStatement: PixStatement): Promise<void> {
    const result: RedisKey<PixStatementModel> = {
      key: `${PREFIX}:DATE:${pixStatement.createdDate}:PAGE:${pixStatement.page}`,
      data: new PixStatementModel(pixStatement),
      ttl: pixStatement.ttl || this.ttl,
    };

    await this.redisService.set<PixStatementModel>(result);
  }

  async create(pixStatement: PixStatement): Promise<PixStatement> {
    await this.createOrUpdate(pixStatement);
    return pixStatement;
  }

  async update(pixStatement: PixStatement): Promise<PixStatement> {
    await this.createOrUpdate(pixStatement);
    return pixStatement;
  }

  async getAllByDate(date: Date): Promise<PixStatement[]> {
    const dateFormat = formatToYearMonthDay(date);

    return this.redisService
      .search<PixStatementModel>(`${PREFIX}:DATE:${dateFormat}:*`)
      .then((models) => models.map(PixStatementRedisRepository.toDomain));
  }

  async getAll(): Promise<PixStatement[]> {
    return this.redisService
      .search<PixStatementModel>(`${PREFIX}:*`)
      .then((models) => models.map(PixStatementRedisRepository.toDomain));
  }
}
