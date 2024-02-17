import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { Retry, RetryRepository } from '@zro/utils/domain';
import { RetryModel } from '@zro/utils/infrastructure';

export class RetryDatabaseRepository
  extends DatabaseRepository
  implements RetryRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }
  static toDomain(retryModel: RetryModel): Retry {
    return retryModel?.toDomain() ?? null;
  }

  async create(retry: Retry): Promise<Retry> {
    return RetryModel.create(retry, {
      transaction: this.transaction,
    }).then(RetryDatabaseRepository.toDomain);
  }

  async delete(retry: Retry): Promise<void> {
    await RetryModel.destroy({
      where: { id: retry.id },
      transaction: this.transaction,
    });
  }

  async getAll(limit = 100, offset = 0): Promise<Retry[]> {
    return RetryModel.findAll<RetryModel>({
      limit,
      offset,
      transaction: this.transaction,
    }).then((res) => res.map(RetryDatabaseRepository.toDomain));
  }

  async getById(id: string): Promise<Retry> {
    return RetryModel.findOne<RetryModel>({
      where: { id },
      transaction: this.transaction,
    }).then(RetryDatabaseRepository.toDomain);
  }
}
