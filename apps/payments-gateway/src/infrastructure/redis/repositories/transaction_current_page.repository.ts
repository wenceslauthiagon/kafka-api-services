import { RedisKey, RedisService } from '@zro/common';
import {
  TransactionCurrentPage,
  TransactionCurrentPageRepository,
} from '@zro/payments-gateway/domain';
import { TransactionCurrentPageModel } from '@zro/payments-gateway/infrastructure';

const PREFIX = 'transaction_current_pages';

export class TransactionCurrentPageRedisRepository
  implements TransactionCurrentPageRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(page: RedisKey<TransactionCurrentPageModel>) {
    return page?.data && new TransactionCurrentPageModel(page.data).toDomain();
  }

  async createOrUpdate(
    transactionCurrentPage: TransactionCurrentPage,
  ): Promise<void> {
    const result: RedisKey<TransactionCurrentPageModel> = {
      key: `${PREFIX}`,
      data: new TransactionCurrentPageModel(transactionCurrentPage),
    };

    await this.redisService.set<TransactionCurrentPageModel>(result);
  }

  async getCurrentPage(): Promise<TransactionCurrentPage> {
    const result = await this.redisService
      .get<TransactionCurrentPageModel>(`${PREFIX}`)
      .then(TransactionCurrentPageRedisRepository.toDomain);

    return result;
  }
}
