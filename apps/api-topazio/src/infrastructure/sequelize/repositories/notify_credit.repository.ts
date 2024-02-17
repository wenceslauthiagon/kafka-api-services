import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyCreditModel } from '@zro/api-topazio/infrastructure';
import { NotifyCredit, NotifyCreditRepository } from '@zro/api-topazio/domain';

export class NotifyCreditDatabaseRepository
  extends DatabaseRepository
  implements NotifyCreditRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyCredit: NotifyCreditModel): NotifyCredit {
    return notifyCredit?.toDomain() ?? null;
  }

  async create(notifyCredit: NotifyCredit): Promise<NotifyCredit> {
    const createdNotifyCredit =
      await NotifyCreditModel.create<NotifyCreditModel>(notifyCredit, {
        transaction: this.transaction,
      });

    notifyCredit.id = createdNotifyCredit.id;
    notifyCredit.createdAt = createdNotifyCredit.createdAt;

    return notifyCredit;
  }
}
