import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyDebitModel } from '@zro/api-topazio/infrastructure';
import { NotifyDebit, NotifyDebitRepository } from '@zro/api-topazio/domain';

export class NotifyDebitDatabaseRepository
  extends DatabaseRepository
  implements NotifyDebitRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyDebit: NotifyDebitModel): NotifyDebit {
    return notifyDebit?.toDomain() ?? null;
  }

  async create(notifyDebit: NotifyDebit): Promise<NotifyDebit> {
    const createdNotifyDebit = await NotifyDebitModel.create<NotifyDebitModel>(
      notifyDebit,
      { transaction: this.transaction },
    );

    notifyDebit.id = createdNotifyDebit.id;
    notifyDebit.createdAt = createdNotifyDebit.createdAt;

    return notifyDebit;
  }
}
