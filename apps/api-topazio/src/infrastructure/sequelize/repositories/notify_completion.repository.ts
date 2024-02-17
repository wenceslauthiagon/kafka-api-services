import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyCompletionModel } from '@zro/api-topazio/infrastructure';
import {
  NotifyCompletion,
  NotifyCompletionRepository,
} from '@zro/api-topazio/domain';

export class NotifyCompletionDatabaseRepository
  extends DatabaseRepository
  implements NotifyCompletionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyCompletion: NotifyCompletionModel): NotifyCompletion {
    return notifyCompletion?.toDomain() ?? null;
  }

  async create(notifyCompletion: NotifyCompletion): Promise<NotifyCompletion> {
    const createdNotifyCompletion =
      await NotifyCompletionModel.create<NotifyCompletionModel>(
        notifyCompletion,
        { transaction: this.transaction },
      );

    notifyCompletion.id = createdNotifyCompletion.id;
    notifyCompletion.createdAt = createdNotifyCompletion.createdAt;

    return notifyCompletion;
  }
}
