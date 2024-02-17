import { RedisKey, RedisService } from '@zro/common';
import {
  Transaction,
  TransactionRepository,
} from '@zro/payments-gateway/domain';
import { TransactionModel } from '@zro/payments-gateway/infrastructure';
import { formatToYearMonthDay } from '@zro/common/utils/format_to_year_month_day.util';

const PREFIX = 'transactions';

// TTL default 30 dias - 2592000000 ms
export class TransactionRedisRepository implements TransactionRepository {
  constructor(
    private redisService: RedisService,
    private ttl = 2592000000,
  ) {}

  static toDomain(transaction: RedisKey<TransactionModel>) {
    return (
      transaction?.data && new TransactionModel(transaction.data).toDomain()
    );
  }

  private async createOrUpdate(transaction: Transaction): Promise<void> {
    const result: RedisKey<TransactionModel> = {
      key: `${PREFIX}:DATE:${transaction.createdDate}:PAGE:${transaction.page}`,
      data: new TransactionModel(transaction),
      ttl: transaction.ttl || this.ttl,
    };

    await this.redisService.set<TransactionModel>(result);
  }

  async create(transaction: Transaction): Promise<Transaction> {
    await this.createOrUpdate(transaction);
    return transaction;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    await this.createOrUpdate(transaction);
    return transaction;
  }

  async getAllByDate(date: Date): Promise<Transaction[]> {
    const dateFormat = formatToYearMonthDay(date);

    return this.redisService
      .search<TransactionModel>(`${PREFIX}:DATE:${dateFormat}:*`)
      .then((models) => models.map(TransactionRedisRepository.toDomain));
  }

  async getAll(): Promise<Transaction[]> {
    return this.redisService
      .search<TransactionModel>(`${PREFIX}:*`)
      .then((models) => models.map(TransactionRedisRepository.toDomain));
  }
}
